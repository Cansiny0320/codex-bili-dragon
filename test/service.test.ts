import type { ToolRunner } from '../packages/runtime/src/types.js';
import { test, type TestContext } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Store } from '../packages/runtime/src/store.js';
import { DragonService } from '../packages/runtime/src/service.js';
function setup(t: TestContext, run?: ToolRunner) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  return new DragonService(new Store(dir), run);
}
test('成功读取才缓存素材，旧记录保留且失败不会覆盖已读正文', async (t) => {
  let fail = false;
  const s = setup(t, async () => ({
    code: fail ? 1 : 0,
    out: fail
      ? 'failed'
      : JSON.stringify({
          title: '真实标题',
          cover: 'https://i0.hdslb.com/bfs/test.jpg',
          author: '作者',
          duration: 42,
        }),
    err: '',
  }));
  s.store.write('evidence', {
    BV1234567890: { actions: ['subtitles'], at: '2026-10-24T00:00:00Z' },
  });
  await s.read({ action: 'comments', bvid: 'BV1234567890' });
  const saved = s.store.read('evidence', {})['BV1234567890'];
  assert.deepEqual(saved.actions, ['subtitles', 'comments']);
  assert.equal(saved.title, '真实标题');
  assert.equal(saved.cover, 'https://i0.hdslb.com/bfs/test.jpg');
  assert.ok(saved.materials?.comments.includes('真实标题'));
  fail = true;
  assert.equal((await s.read({ action: 'comments', bvid: 'BV1234567890' })).isError, true);
  const after = s.store.read('evidence', {})['BV1234567890'];
  assert.deepEqual(after.materials, saved.materials);
  assert.deepEqual(after.actions, saved.actions);
  assert.equal(after.at, saved.at);
  assert.equal(after.attempts?.comments.state, 'failed');
});
test('真实文本素材会补取结构化元数据，旧记录补全不改变探索时间', async (t) => {
  const calls: string[][] = [];
  const s = setup(t, async (args) => {
    calls.push(args);
    return {
      code: 0,
      out: args.includes('--metadata-only')
        ? JSON.stringify({
            bvid: args[1],
            title: '手机上网刷视频的工作原理',
            author: '科普创世纪',
            cover: 'http://i0.hdslb.com/bfs/archive/test.jpg',
            duration: 245,
          })
        : '标题: 手机上网刷视频的工作原理\nUP: 科普创世纪\n[00:00] 你现在刷到的这条短视频',
      err: '',
    };
  });
  await s.read({ action: 'subtitles', bvid: 'BV1p84y1m7U4' });
  const saved = s.store.read('evidence', {})['BV1p84y1m7U4'];
  assert.equal(saved.title, '手机上网刷视频的工作原理');
  assert.equal(saved.cover, 'https://i0.hdslb.com/bfs/archive/test.jpg');
  assert.deepEqual(saved.actions, ['subtitles']);
  assert.match(saved.materials!.subtitles!, /00:00/);
  await s.read({ action: 'subtitles', bvid: 'BV1p84y1m7U4' });
  assert.equal(calls.filter((args) => args.includes('--metadata-only')).length, 1);
  s.store.write('evidence', {
    BV1p84y1m7U4: { actions: ['subtitles'], at: '2026-10-24T00:00:00Z' },
  });
  await s.refreshVideoMetadata();
  const repaired = s.store.read('evidence', {})['BV1p84y1m7U4'];
  assert.equal(repaired.title, saved.title);
  assert.equal(repaired.at, '2026-10-24T00:00:00Z');
  assert.deepEqual(repaired.actions, ['subtitles']);
});
test('元数据失败不丢失已读素材，封面仅接受 B 站图片域名', async (t) => {
  const s = setup(t, async (args) => ({
    code: args.includes('--metadata-only') ? 3 : 0,
    out: args.includes('--metadata-only')
      ? ''
      : JSON.stringify({ title: '标题', cover: 'https://example.com/tracker.png' }),
    err: '',
  }));
  const result = await s.read({ action: 'comments', bvid: 'BV1234567890' });
  assert.notEqual(result.isError, true);
  const saved = s.store.read('evidence', {})['BV1234567890'];
  assert.equal(saved.title, '标题');
  assert.equal(saved.cover, undefined);
  assert.deepEqual(saved.actions, ['comments']);
});
test('分享目标必须匹配实际读取的视频，不能把 BV 和 aid 拼成另一条评论', async (t) => {
  const calls: string[][] = [];
  const s = setup(t, async (args) => {
    calls.push(args);
    return {
      code: 0,
      out: JSON.stringify({ ok: true, bvid: 'BV1234567890', aid: 99 }),
      err: '',
    };
  });
  s.saveConfig({
    ...s.config(),
    share: { ...s.config().share, enabled: true, via: 'comment' },
    permissions: { comments: true, dm: false, live: false },
  });
  s.store.write('evidence', { BV1234567890: { actions: ['subtitles'] } });
  await assert.rejects(
    s.share({
      bvid: 'BV1234567890',
      aid: '10',
      text: '推荐',
      score: 18,
      reason: '内容很有意思值得分享',
    }),
    /不匹配/,
  );
  assert.ok(calls.every((x) => x[0] !== 'comment'));
});
test('陌生人只能进入草稿；审核仍检查开关；重复审核不重复发送', async (t) => {
  let calls = 0;
  const s = setup(t, async () => {
    calls++;
    return { code: 0, out: 'ok', err: '' };
  });
  s.saveConfig({ ...s.config(), owner: { mid: '1', name: '主人' } });
  s.ingest({
    id: 'c1',
    channel: 'comments',
    mid: '2',
    oid: '10',
    root: '11',
    rpid: '12',
    business: 1,
    text: 'hello',
  });
  const draft = await s.reply('c1', '你好');
  assert.ok('id' in draft);
  assert.equal(draft.state, 'draft');
  assert.equal(calls, 0);
  await assert.rejects(s.approve(draft.id), /未启用/);
  assert.equal(calls, 0);
  s.saveConfig({
    ...s.config(),
    permissions: { comments: true, dm: false, live: false },
  });
  await s.approve(draft.id);
  await assert.rejects(s.approve(draft.id));
  assert.equal(calls, 1);
});
test('发送超时保留未确认账本；相同事件换内容也不能重发', async (t) => {
  let calls = 0;
  const s = setup(t, async () => {
    calls++;
    throw Error('timeout');
  });
  s.saveConfig({
    ...s.config(),
    owner: { mid: '1', name: '' },
    permissions: { comments: true, dm: false, live: false },
  });
  s.ingest({
    id: 'c1',
    channel: 'comments',
    mid: '1',
    oid: '10',
    root: '11',
    rpid: '12',
    business: 1,
    text: 'hello',
  });
  await assert.rejects(s.reply('c1', '你好'));
  await assert.rejects(s.reply('c1', '再试一次'), /核查|重复/);
  assert.equal(calls, 1);
  assert.equal(s.store.read('operations')[0].state, 'needs-review');
});
test('凭据不进入状态，未读视频不能分享，工具不允许传任意命令', async (t) => {
  const s = setup(t, async () => ({ code: 0, out: 'ok', err: '' }));
  s.setCredentials({
    sessdata: 'test-secret',
    bili_jct: 'a'.repeat(32),
    buvid3: 'test-buvid',
  });
  assert.ok(!JSON.stringify(s.status()).includes('test-secret'));
  await assert.rejects(
    s.share({
      bvid: 'BV1234567890',
      aid: '10',
      text: '推荐',
      score: 18,
      reason: '这是一段足够长的原因',
    }),
  );
  await assert.rejects(s.read({ action: 'shell', query: 'anything' }));
});

test('分享使用视频元数据核验，不依赖评论区可读，且仍阻止 BV 与 aid 错配', async (t) => {
  const calls: string[][] = [];
  const s = setup(t, async (args) => {
    calls.push(args);
    if (args[0] === 'video' && args.includes('--metadata-only'))
      return { code: 0, out: JSON.stringify({ bvid: 'BV1234567890', aid: 99 }), err: '' };
    if (args[0] === 'comment') return { code: 0, out: '已发送', err: '' };
    return { code: 3, out: '', err: '评论不可读' };
  });
  s.saveConfig({
    ...s.config(),
    share: { ...s.config().share, enabled: true, via: 'comment' },
    permissions: { comments: true, dm: false, live: false },
  });
  s.store.write('evidence', { BV1234567890: { actions: ['subtitles'] } });
  const input = {
    bvid: 'BV1234567890',
    aid: '10',
    text: '推荐',
    score: 18,
    reason: '内容很有意思值得分享',
  };
  await assert.rejects(s.share(input), /不匹配/);
  assert.ok(calls.every((args) => args[0] !== 'comment'));
  await s.share({ ...input, aid: '99' });
  assert.equal(calls.filter((args) => args[0] === 'comment').length, 1);
  assert.ok(calls.every((args) => args[0] !== 'comments'));
});
