import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Store } from "../src/store.mjs";
import { DragonService } from "../src/service.mjs";
import { Daemon } from "../src/daemon.mjs";
function setup(t, session) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dragon-daemon-"));
  const service = new DragonService(new Store(dir)),
    daemon = new Daemon(service, session).start();
  t.after(async () => {
    await daemon.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return { service, daemon };
}
test("后台只允许单实例；并发 tick 串行执行任务", async (t) => {
  let release;
  const session = {
    run: () =>
      new Promise((r) => {
        release = r;
      }),
    stop: async () => {},
  };
  const { service, daemon } = setup(t, session);
  assert.throws(() => new Daemon(service, session).start(), /另一个/);
  service.queue.add("one", "browse", { manual: true });
  service.queue.add("two", "browse", { manual: true });
  const first = daemon.tick();
  await daemon.tick();
  assert.equal(
    service.queue.list().filter((j) => j.state === "running").length,
    1,
  );
  release({ ok: true });
  await first;
  assert.equal(service.queue.list()[0].state, "done");
  assert.equal(service.queue.list()[1].state, "pending");
});
test("失败回合不会自动重试；保留待核查状态", async (t) => {
  let calls = 0;
  const session = {
    run: async () => {
      calls++;
      throw Error("model quota exhausted");
    },
    stop: async () => {},
  };
  const { service, daemon } = setup(t, session);
  service.queue.add("one", "browse", { manual: true });
  await daemon.tick();
  await daemon.tick();
  assert.equal(calls, 1);
  assert.equal(service.queue.list()[0].state, "needs-review");
});
