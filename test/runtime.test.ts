import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ensureRuntime,
  findRuntime,
  stopRuntime,
  requestRuntime,
} from '../packages/runtime/src/runtime';
import { migrateData } from '../packages/runtime/src/migrate';

test('并发插件连接共用后台，状态不泄露连接密钥，停止后能够重启', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-runtime-'));
  t.onTestFinished(async () => {
    await stopRuntime(dir);
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const connections = await Promise.all(Array.from({ length: 3 }, () => ensureRuntime(dir)));
  assert.equal(new Set(connections.map((c) => c.pid)).size, 1);
  assert.equal(new Set(connections.map((c) => c.origin)).size, 1);
  const connection = connections[0];
  const state = await requestRuntime(connection, 'state');
  assert.equal(JSON.stringify(state).includes(connection.token), false);
  assert.equal((state as { config: { enabled: boolean } }).config.enabled, false);
  await stopRuntime(dir);
  assert.equal(await findRuntime(dir), null);
  const restarted = await ensureRuntime(dir);
  assert.notEqual(restarted.pid, connection.pid);
});

test('旧数据迁移保留源文件，忽略进程连接和锁，拒绝覆盖已有数据', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-migrate-'));
  try {
    const source = path.join(dir, 'old'),
      target = path.join(dir, 'new');
    fs.mkdirSync(source);
    fs.writeFileSync(path.join(source, 'diaries.json'), '[{"id":"keep"}]');
    fs.writeFileSync(path.join(source, 'connection.json'), '{"token":"private"}');
    fs.writeFileSync(path.join(source, 'daemon.lock'), '{}');
    migrateData(source, target);
    assert.equal(fs.readFileSync(path.join(target, 'diaries.json'), 'utf8'), '[{"id":"keep"}]');
    assert.ok(fs.existsSync(path.join(source, 'diaries.json')));
    assert.equal(fs.existsSync(path.join(target, 'connection.json')), false);
    assert.equal(fs.existsSync(path.join(target, 'daemon.lock')), false);
    assert.throws(() => migrateData(source, target), /已有数据/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
