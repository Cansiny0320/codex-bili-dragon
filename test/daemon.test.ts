import type { SessionRunner } from '../packages/runtime/src/daemon.js';
import { test, type TestContext } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Store } from '../packages/runtime/src/store.js';
import { DragonService } from '../packages/runtime/src/service.js';
import { Daemon } from '../packages/runtime/src/daemon.js';
function setup(t: TestContext, session: SessionRunner) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-daemon-'));
  const service = new DragonService(new Store(dir)),
    daemon = new Daemon(service, session).start();
  t.onTestFinished(async () => {
    await daemon.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return { service, daemon };
}
test('后台只允许单实例；并发 tick 串行执行任务', async (t) => {
  let release!: (value: unknown) => void;
  const session = {
    run: () =>
      new Promise((r) => {
        release = r;
      }),
    stop: async () => {},
  };
  const { service, daemon } = setup(t, session);
  assert.throws(() => new Daemon(service, session).start(), /另一个/);
  service.queue.add('one', 'browse', { manual: true });
  service.queue.add('two', 'browse', { manual: true });
  const first = daemon.tick();
  await daemon.tick();
  assert.equal(service.queue.list().filter((j) => j.state === 'running').length, 1);
  release({ ok: true });
  await first;
  assert.equal(service.queue.list()[0].state, 'done');
  assert.equal(service.queue.list()[1].state, 'pending');
});
test('失败回合不会自动重试；保留待核查状态', async (t) => {
  let calls = 0;
  const session = {
    run: async () => {
      calls++;
      throw Error('model quota exhausted');
    },
    stop: async () => {},
  };
  const { service, daemon } = setup(t, session);
  service.queue.add('one', 'browse', { manual: true });
  await daemon.tick();
  await daemon.tick();
  assert.equal(calls, 1);
  assert.equal(service.queue.list()[0].state, 'needs-review');
});
