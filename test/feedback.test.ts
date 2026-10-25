import { test, type TestContext } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DragonService } from '../packages/runtime/src/service.js';
import { Store } from '../packages/runtime/src/store.js';
import type { ToolRunner } from '../packages/runtime/src/types.js';

function setup(t: TestContext, run: ToolRunner) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-feedback-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  const s = new DragonService(new Store(dir), run);
  s.saveConfig({
    ...s.config(),
    owner: { mid: '1', name: '同名' },
    listen: { ...s.config().listen, comment: true },
  });
  return s;
}

test('反馈只认主人 UID，重复通知不刷新互动时间，正文备注保留来源', async (t) => {
  let calls = 0;
  const at = new Date(Date.now() - 3600000).toISOString();
  const seconds = Math.floor(Date.parse(at) / 1000);
  const s = setup(t, async (args) => {
    calls++;
    return {
      code: 0,
      err: '',
      out: JSON.stringify(
        args[0] === 'likes'
          ? {
              items: [
                {
                  id: 7,
                  users: [{ mid: '1' }],
                  like_time: seconds,
                  item: { uri: 'https://www.bilibili.com/video/BV1234567890', title: '改造过程' },
                },
                {
                  id: 8,
                  users: [{ mid: '2', nickname: '同名' }],
                  like_time: seconds + 2,
                  item: {},
                },
              ],
            }
          : {
              ok: true,
              items: [
                { id: 'a', kind: 'reply', mid: '1', text: '想看制作过程', time: at },
                { id: 'b', kind: 'reply', mid: '2', who: '同名', text: '喜欢广告', time: at },
              ],
            },
      ),
    };
  });
  const first = await s.refreshFeedback();
  assert.equal(first.observations.length, 2);
  assert.ok(first.observations.every((event) => event.mid === '1'));
  assert.equal(first.last, at);
  assert.ok(
    first.observations.some((event) => event.kind === 'like' && event.bvid === 'BV1234567890'),
  );
  await s.refreshFeedback();
  assert.equal(calls, 2);
  assert.equal(s.status().feedback.observations.length, 2);
  assert.equal(s.status().feedback.last, at);
  s.diary({
    id: 'reaction',
    title: '记一下',
    publicText: '下次找点过程详细的。',
    privateText: '这类还想看。',
    evidence: '主人回复',
    learning: {
      confirmed: [{ text: '想看制作过程', sourceIds: ['comment:reply:a'] }],
      tentative: [],
      interests: [],
      nextTopics: [],
    },
  });
  assert.throws(
    () =>
      s.diary({
        id: 'like-is-not-explicit',
        title: '测试',
        publicText: '测试',
        privateText: '测试',
        evidence: '收到的赞',
        learning: {
          confirmed: [{ text: '喜欢改造', sourceIds: ['like:7:1'] }],
          tentative: [],
          interests: [],
          nextTopics: [],
        },
      }),
    /文字|来源/,
  );
});

test('部分采集失败为未知，保留旧反馈；关闭监听不发网络请求', async (t) => {
  let calls = 0;
  const s = setup(t, async (args) => {
    calls++;
    return args[0] === 'likes'
      ? { code: 3, out: '', err: 'limited' }
      : { code: 0, out: JSON.stringify({ ok: false, items: [], errors: ['读取失败'] }), err: '' };
  });
  s.ingest({
    id: 'old-message',
    mid: '1',
    channel: 'dm',
    text: '你好',
    time: Math.floor((Date.now() - 7200000) / 1000),
  });
  const old = s.status().feedback.last;
  const result = await s.refreshFeedback();
  assert.equal(result.sources.comments?.state, 'unknown');
  assert.equal(result.sources.likes?.state, 'unknown');
  assert.equal(result.last, old);
  assert.ok(result.last && Date.parse(result.last) < Date.now() - 3600000);
  s.saveConfig({ ...s.config(), share: { ...s.config().share, enabled: true } });
  await assert.rejects(
    s.share(
      {
        bvid: 'BV1234567890',
        aid: '99',
        text: '你看看这个',
        score: 18,
        reason: '这条内容有具体的过程',
      },
      'unknown-feedback',
    ),
    /反馈.*未知/,
  );
  s.saveConfig({ ...s.config(), listen: { ...s.config().listen, comment: false } });
  const disabled = await s.refreshFeedback();
  assert.equal(disabled.sources.comments?.state, 'disabled');
  assert.equal(calls, 2);
});

test('采集途中更换主人时丢弃迟到结果，不污染新关系', async (t) => {
  let resolve!: (value: { code: number; out: string; err: string }) => void;
  const s = setup(
    t,
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const pending = s.refreshFeedback();
  s.saveConfig({ ...s.config(), owner: { mid: '2', name: '' } });
  resolve({ code: 0, out: JSON.stringify({ ok: true, items: [] }), err: '' });
  await assert.rejects(pending, /身份|关系/);
  assert.equal(s.status().feedback.observations.length, 0);
});
