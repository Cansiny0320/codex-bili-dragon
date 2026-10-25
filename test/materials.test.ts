import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Store } from '../packages/runtime/src/store.js';
import { materialView, frameImages } from '../packages/runtime/src/materials.js';

test('历史字幕仅展示实际读到的时间行，评论转换为列表，不泄漏命令日志', () => {
  const store = new Store(fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-material-')));
  try {
    store.write('evidence', {
      BV1234567890: {
        actions: ['subtitles', 'comments'],
        at: new Date().toISOString(),
        materials: {
          subtitles:
            '标题: 测试\n字幕行数: 367\nJSON : C:\\private\\subs.json（原始）\nauth_key=有\n--- 前 160 行 ---\n[00:05] 第一行\n[01:23] 第二行',
          comments: JSON.stringify({
            ok: true,
            total: 99,
            items: [{ rpid: '123', mid: '456', user: '观众', text: '好看', like: 3, time: '今天' }],
          }),
        },
      },
    });
    const subtitles = materialView(store, 'BV1234567890', 'subtitles');
    assert.equal(subtitles.state, 'ready');
    assert.equal(subtitles.subtitles?.length, 2);
    assert.equal(subtitles.total, 367);
    assert.ok(!JSON.stringify(subtitles).includes('private'));
    const comments = materialView(store, 'BV1234567890', 'comments');
    assert.equal(comments.comments?.[0].text, '好看');
    assert.equal(comments.comments?.[0].author, '观众');
    assert.equal(materialView(store, 'BV1234567890', 'frames').state, 'unread');
  } finally {
    fs.rmSync(store.dir, { recursive: true, force: true });
  }
});

test('画面只读取缓存目录内的真实图片；区分失败、缓存缺失与没有字幕', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-frames-'));
  const store = new Store(dir);
  try {
    fs.mkdirSync(path.join(dir, 'runtime/shots'), { recursive: true });
    const image = path.join(dir, 'runtime/shots/frame.png');
    fs.writeFileSync(
      image,
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6PjUAAAAASUVORK5CYII=',
        'base64',
      ),
    );
    const outside = path.join(dir, 'account.png');
    fs.copyFileSync(image, outside);
    assert.equal(frameImages(dir, `SHEET: ${image}`).length, 1);
    assert.equal(frameImages(dir, `SHEET: ${outside}`).length, 0);
    store.write('evidence', {
      BV1234567890: {
        actions: ['frames', 'subtitles'],
        at: new Date().toISOString(),
        materials: { frames: `SHEET: ${image}`, subtitles: '没有可用字幕轨道——需要抽帧' },
      },
    });
    assert.equal(materialView(store, 'BV1234567890', 'frames').images?.length, 1);
    assert.equal(materialView(store, 'BV1234567890', 'subtitles').state, 'empty');
    fs.unlinkSync(image);
    assert.equal(materialView(store, 'BV1234567890', 'frames').state, 'missing');
    store.update('evidence', {}, (items) => {
      items.BV1234567890.attempts = { frames: { at: 'now', state: 'failed', error: '下载失败' } };
    });
    assert.equal(materialView(store, 'BV1234567890', 'frames').state, 'failed');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
