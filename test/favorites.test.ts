import { test, type TestContext } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DragonService } from '../packages/runtime/src/service.js';
import { Store } from '../packages/runtime/src/store.js';
import type { ToolRunner } from '../packages/runtime/src/types.js';

function setup(t: TestContext, run: ToolRunner) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-favorite-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  const s = new DragonService(new Store(dir), run);
  s.store.write('account', { uid: '9', name: '小白龙' });
  for (let i = 0; i < 5; i++)
    s.store.update('evidence', {}, (items) => {
      items['BV123456789' + i] = { actions: ['subtitles'], at: new Date().toISOString() };
    });
  return s;
}
const input = { bvid: 'BV1234567890', reason: '以后照着做键盘改造', kind: '想学' };

test('收藏默认关闭；开启后仅使用收藏通道，先预览再执行且重复拒绝', async (t) => {
  const calls: { args: string[]; channel: string | undefined }[] = [];
  const s = setup(t, async (args, options) => {
    calls.push({ args, channel: options?.channel });
    return { code: 0, out: 'ok', err: '' };
  });
  await assert.rejects(s.favorite(input), /未启用|关闭/);
  assert.equal(calls.length, 0);
  s.saveConfig({ ...s.config(), permissions: { ...s.config().permissions, favorites: true } });
  await s.favorite(input);
  assert.ok(calls.some((c) => c.args.includes('--dry')));
  assert.equal(calls.filter((c) => c.args.includes('--go')).length, 1);
  assert.equal(calls.find((c) => c.args.includes('--go'))?.channel, 'favorites');
  await assert.rejects(s.favorite(input), /30|重复/);
  assert.equal(calls.filter((c) => c.args.includes('--go')).length, 1);
});

test('收藏后端限制每日三条、同类比较、未读内容与未知结果重试', async (t) => {
  let fail = false;
  const s = setup(t, async (args) => {
    if (fail && args.includes('--go')) throw Error('timeout');
    return { code: 0, out: 'ok', err: '' };
  });
  s.saveConfig({ ...s.config(), permissions: { ...s.config().permissions, favorites: true } });
  await assert.rejects(s.favorite({ ...input, bvid: 'BV0000000000' }), /读取|素材/);
  await s.favorite(input);
  await s.favorite({ ...input, bvid: 'BV1234567891' });
  await assert.rejects(s.favorite({ ...input, bvid: 'BV1234567892' }), /同类|比较/);
  fail = true;
  await assert.rejects(
    s.favorite({ ...input, bvid: 'BV1234567892', comparison: '比 BV1234567890 多讲了接线的步骤' }),
    /timeout/,
  );
  fail = false;
  await assert.rejects(
    s.favorite({ ...input, bvid: 'BV1234567892', comparison: '换个理由再试一次' }),
    /核查|未知|重复/,
  );
  await assert.rejects(s.favorite({ ...input, bvid: 'BV1234567893', kind: '想再看' }), /3|三/);
});

test('每轮分享次数由可信任务限制，并发和失败均不能换视频绕过', async (t) => {
  let sends = 0;
  const s = setup(t, async (args) => {
    if (args[0] === 'video')
      return { code: 0, out: JSON.stringify({ bvid: args[1], aid: 99 }), err: '' };
    sends++;
    throw Error('timeout');
  });
  s.saveConfig({
    ...s.config(),
    share: { ...s.config().share, enabled: true },
    permissions: { ...s.config().permissions, comments: true },
  });
  const share = {
    bvid: input.bvid,
    aid: '99',
    text: '你看看这个',
    score: 18,
    reason: '改造过程讲得具体清楚',
  };
  const results = await Promise.allSettled([
    s.share(share, 'job-1'),
    s.share({ ...share, bvid: 'BV1234567891' }, 'job-1'),
  ]);
  assert.ok(results.every((r) => r.status === 'rejected'));
  assert.equal(sends, 1);
  await assert.rejects(s.share({ ...share, bvid: 'BV1234567892' }, 'job-1'), /本轮|一次/);
  assert.equal(sends, 1);
  await assert.rejects(s.share({ ...share, bvid: 'BV1234567892' }, 'job-2'), /timeout/);
  assert.equal(sends, 2);
});

test('并发收藏也只能预占当天三次额度', async (t) => {
  let writes = 0;
  const s = setup(t, async (args) => {
    if (args.includes('--go')) writes++;
    return { code: 0, out: 'ok', err: '' };
  });
  s.saveConfig({ ...s.config(), permissions: { ...s.config().permissions, favorites: true } });
  const kinds = ['想学', '想再看', '和我有关', '以后要提'];
  const results = await Promise.allSettled(
    kinds.map((kind, i) => s.favorite({ ...input, bvid: 'BV123456789' + i, kind })),
  );
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 3);
  assert.equal(writes, 3);
});
