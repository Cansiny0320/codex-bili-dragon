import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Store } from '../packages/runtime/src/store.js';
import { DragonService } from '../packages/runtime/src/service.js';
import { Listeners } from '../packages/runtime/src/listeners.js';
test('私信持久入队后确认；同一 receipt 不重复排队', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-listener-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  const calls: string[][] = [];
  let service: DragonService;
  const run = async (args: string[]) => {
    calls.push(args);
    if (args.includes('--ack')) {
      assert.equal(service.queue.list().length, 1);
      assert.equal(service.store.read('inbox').length, 1);
      return { code: 0, out: 'ack', err: '' };
    }
    return {
      code: 0,
      out: JSON.stringify({
        hit: true,
        mid: '1',
        key: '42',
        receipt: 'receipt-1',
        text: '你好',
      }),
      err: '',
    };
  };
  service = new DragonService(new Store(dir), run);
  service.saveConfig({ ...service.config(), owner: { mid: '1', name: '' } });
  const listeners = new Listeners(service);
  await listeners.dm();
  await listeners.dm();
  assert.equal(service.queue.list().length, 1);
  assert.ok(calls.some((x) => x.includes('--ack')));
});
test('评论初次读取只建立基线；后续消息去重；读取失败不推进游标', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-comment-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  let output = { ok: true, items: [{ id: 1, mid: '1', text: 'old' }] };
  const service = new DragonService(new Store(dir), async () => ({
    code: 0,
    out: JSON.stringify(output),
    err: '',
  }));
  const listeners = new Listeners(service);
  await listeners.comments();
  assert.equal(service.queue.list().length, 0);
  output = { ok: false, items: [{ id: 2, mid: '2', text: 'new' }] };
  await assert.rejects(listeners.comments());
  output.ok = true;
  await listeners.comments();
  await listeners.comments();
  assert.equal(service.queue.list().length, 1);
});

test('评论读取期间暂停后不排入迟到消息，不推进游标', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-comment-pause-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  let resolve!: (result: { code: number; out: string; err: string }) => void;
  const service = new DragonService(
    new Store(dir),
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  service.store.write('comment-cursor', { ids: [] });
  const listeners = new Listeners(service);
  const pending = listeners.comments();
  listeners.suspended = true;
  resolve({
    code: 0,
    out: JSON.stringify({ ok: true, items: [{ id: 8, mid: '1', text: '迟到消息' }] }),
    err: '',
  });
  await assert.rejects(pending, /暂停/);
  assert.equal(service.queue.list().length, 0);
  assert.deepEqual(service.store.read('comment-cursor'), { ids: [] });
});
