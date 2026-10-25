import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { Store } from '../packages/runtime/src/store.js';
import { defaults } from '../packages/runtime/src/config.js';
import { syncUpstream, runUpstream, redact } from '../packages/runtime/src/upstream.js';
test('真实上游 CLI 读取独立配置，直播命令可解析，不触及 DSH 目录', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-vendor-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  const store = new Store(dir);
  store.write('config', { ...defaults, quota: { shareDaily: 1 } });
  syncUpstream(store, { ...defaults, quota: { shareDaily: 1 } });
  const quota = await runUpstream(store, ['quota', 'status']);
  assert.equal(quota.code, 0, quota.err);
  assert.match(quota.out, /0\/1/);
  const live = await runUpstream(store, ['await']);
  assert.notEqual(live.code, 0);
  assert.doesNotMatch(live.err, /未知命令/);
  assert.match(live.err, /room/);
});
test('上游写操作必须同时满足指定端点和实时通道开关；错误输出隐藏凭据', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-policy-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, '.bili-ai'));
  fs.writeFileSync(
    path.join(dir, '.bili-ai/credentials.json'),
    JSON.stringify({ sessdata: 'secret%2Fcookie', bili_jct: 'a'.repeat(32) }),
  );
  assert.ok(
    !redact('secret%2Fcookie ' + encodeURIComponent('secret%2Fcookie'), dir).includes('secret'),
  );
  const policy = new URL('../dist/runtime/policy.js', import.meta.url).href;
  const code = `import {assertVendorWrite} from ${JSON.stringify(policy)};assertVendorWrite('https://api.bilibili.com/x/v2/reply/add',{method:'POST'});`;
  fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(defaults));
  const env = {
    ...process.env,
    BILI_DRAGON_DATA: dir,
    BILI_DRAGON_WRITE_CHANNEL: 'comments',
  };
  assert.throws(() =>
    execFileSync(process.execPath, ['--input-type=module', '-e', code], {
      env,
      stdio: 'pipe',
    }),
  );
  fs.writeFileSync(
    path.join(dir, 'config.json'),
    JSON.stringify({ ...defaults, permissions: { comments: true } }),
  );
  execFileSync(process.execPath, ['--input-type=module', '-e', code], {
    env,
    stdio: 'pipe',
  });
  assert.throws(() =>
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        code.replace('api.bilibili.com/x/v2/reply/add', 'api.bilibili.com/x/v2/reply/del'),
      ],
      { env, stdio: 'pipe' },
    ),
  );
});

test('收藏复用已验证的登录账号，真实 vendor 预检执行日限额与 30 天去重', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-fav-vendor-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  const store = new Store(dir);
  store.write('config', defaults);
  store.write('account', { uid: '123', name: '小白龙' });
  syncUpstream(store, defaults);
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(dir, 'upstream-config.json'), 'utf8')).self.mid,
    '123',
  );
  const list = await runUpstream(store, ['fav', '--list', '--json']);
  assert.equal(list.code, 0, list.err);
  assert.deepEqual(JSON.parse(list.out).items, []);
  const records = [0, 1, 2].map((i) => ({
    bv: 'BV123456789' + i,
    at: new Date().toISOString(),
    kind: '想学',
  }));
  fs.writeFileSync(path.join(dir, '.bili-ai/favorites.json'), JSON.stringify({ items: records }));
  const quota = await runUpstream(store, [
    'fav',
    '--check',
    'BV1234567893',
    '--reason',
    '以后照着做键盘改造',
  ]);
  assert.notEqual(quota.code, 0);
  assert.match(quota.out, /上限 3/);
  fs.writeFileSync(
    path.join(dir, '.bili-ai/favorites.json'),
    JSON.stringify({ items: records.slice(0, 1) }),
  );
  const duplicate = await runUpstream(store, [
    'fav',
    '--check',
    'BV1234567890',
    '--reason',
    '以后照着做键盘改造',
  ]);
  assert.notEqual(duplicate.code, 0);
  assert.match(duplicate.out, /30 天内不重复/);
});

test('收藏写权限仅开放收藏端点，关闭开关和其他操作始终拒绝', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-fav-policy-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  const policy = new URL('../dist/runtime/policy.js', import.meta.url).href;
  const code = `import {assertVendorWrite} from ${JSON.stringify(policy)};assertVendorWrite('https://api.bilibili.com/x/v3/fav/resource/deal',{method:'POST'});`;
  const env = { ...process.env, BILI_DRAGON_DATA: dir, BILI_DRAGON_WRITE_CHANNEL: 'favorites' };
  const invoke = (source: string) =>
    execFileSync(process.execPath, ['--input-type=module', '-e', source], { env, stdio: 'pipe' });
  fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(defaults));
  assert.throws(() => invoke(code));
  fs.writeFileSync(
    path.join(dir, 'config.json'),
    JSON.stringify({ ...defaults, permissions: { ...defaults.permissions, favorites: true } }),
  );
  invoke(code);
  assert.throws(() => invoke(code.replace('x/v3/fav/resource/deal', 'x/v2/reply/add')));
  assert.throws(() => invoke(code.replace("method:'POST'", "method:'DELETE'")));
});
