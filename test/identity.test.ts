import { test, type TestContext } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Store } from '../packages/runtime/src/store.js';
import { DragonService } from '../packages/runtime/src/service.js';
import { createActions } from '../packages/runtime/src/api.js';

function setup(t: TestContext, owner = '') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-identity-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  let uid = '100',
    pauses = 0;
  const outgoing: string[][] = [];
  const service = new DragonService(
    new Store(dir),
    async (args) => {
      outgoing.push(args);
      return { code: 0, out: 'ok', err: '' };
    },
    {
      fetch: (async () =>
        Response.json({
          code: 0,
          data: {
            isLogin: true,
            mid: uid,
            uname: '登录账号',
            face: 'https://i0.hdslb.com/avatar.png',
          },
        })) as typeof fetch,
    },
  );
  service.saveConfig({ ...service.config(), owner: { mid: owner, name: '原主人' } });
  service.setCredentials({
    sessdata: 'fixture-account',
    bili_jct: 'a'.repeat(32),
    buvid3: 'fixture-device',
  });
  const actions = createActions(service, {
    pause: async () => {
      pauses++;
      service.saveConfig({ ...service.config(), enabled: false });
    },
    tick: async () => {},
    error: () => {},
  });
  return {
    service,
    actions,
    outgoing,
    uid: (value: string) => {
      uid = value;
    },
    get pauses() {
      return pauses;
    },
  };
}
test('旧配置按已验证身份迁移；单号自动同步主人，独立主人保留双号', async (t) => {
  for (const owner of ['', '100', '200']) {
    const f = setup(t, owner);
    await f.actions.checkLogin();
    assert.equal(f.service.config().accountMode, owner === '200' ? 'dual' : 'single');
    assert.equal(f.service.config().owner.mid, owner || '100');
    assert.equal(f.service.status().account?.uid, '100');
    if (owner !== '200') assert.equal(f.service.config().owner.name, '登录账号');
    assert.ok(!JSON.stringify(f.service.status()).includes('fixture-account'));
  }
});
test('切换模式或主人先暂停，旧任务与草稿失效；单号不接受伪造主人', async (t) => {
  const f = setup(t);
  await f.actions.checkLogin();
  f.service.queue.add('old', 'browse', { manual: true });
  f.service.ingest({ id: 'event', channel: 'comments', mid: '300', text: 'hi' });
  await f.service.reply('event', 'hello');
  await f.actions.config({
    ...f.service.config(),
    enabled: true,
    accountMode: 'dual',
    owner: { mid: '200', name: '主人' },
  });
  assert.equal(f.service.config().enabled, false);
  assert.equal(f.service.queue.list()[0].state, 'dismissed');
  f.service.queue.finish(f.service.queue.list()[0].id, 'done', { late: true });
  assert.equal(f.service.queue.list()[0].state, 'dismissed');
  assert.equal(f.service.store.read('drafts')[0].state, 'rejected');
  await assert.rejects(f.service.reply('event', '迟到的回复'), /旧账号/);
  assert.ok(f.pauses > 0);
  await f.actions.config({
    ...f.service.config(),
    accountMode: 'single',
    owner: { mid: '999', name: '伪造' },
  });
  assert.deepEqual(f.service.config().owner, { mid: '100', name: '登录账号' });
  await assert.rejects(
    f.actions.config({
      ...f.service.config(),
      accountMode: 'dual',
      owner: { mid: '100', name: '' },
    }),
    /不同|自身|自己/,
  );
});
test('单号不能私信自己或主动分享；双号仅能私信指定主人', async (t) => {
  const f = setup(t);
  await f.actions.checkLogin();
  await assert.rejects(
    f.service.sendReply({ id: 'self', channel: 'dm', mid: '100', text: '' }, 'hi'),
    /单号|自己|自身/,
  );
  f.service.saveConfig({
    ...f.service.config(),
    share: { ...f.service.config().share, enabled: true },
  });
  await assert.rejects(
    f.service.share({
      bvid: 'BV1234567890',
      aid: '1',
      text: 'hi',
      score: 20,
      reason: '这是一段充分详细的测试推荐理由',
    }),
    /单号/,
  );
  assert.equal(f.outgoing.length, 0);
  await f.actions.config({
    ...f.service.config(),
    accountMode: 'dual',
    owner: { mid: '200', name: '主人' },
  });
  await assert.rejects(
    f.service.sendReply({ id: 'other', channel: 'dm', mid: '300', text: '' }, 'hi'),
    /主人/,
  );
  await f.service.sendReply({ id: 'owner', channel: 'dm', mid: '200', text: '' }, 'hi');
  assert.equal(f.outgoing.length, 1);
});
test('替换登录账号清除旧身份和待发内容，单号主人随后同步', async (t) => {
  const f = setup(t);
  await f.actions.checkLogin();
  f.service.queue.add('old', 'browse', { manual: true });
  await f.actions.credentials({
    sessdata: 'second-fixture',
    bili_jct: 'b'.repeat(32),
    buvid3: 'fixture-device',
  });
  assert.equal(f.service.status().account, null);
  assert.equal(f.service.queue.list()[0].state, 'dismissed');
  f.uid('400');
  await f.actions.checkLogin();
  assert.equal(f.service.config().owner.mid, '400');
  assert.equal(f.service.config().accountMode, 'single');
});
