import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Store } from "../src/store.mjs";
import { validateConfig, defaults } from "../src/config.mjs";
test("corrupt state fails closed and atomic updates retain data", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bili-dragon-test-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const s = new Store(dir);
  s.update("counter", { n: 0 }, (d) => {
    d.n++;
  });
  assert.equal(s.read("counter").n, 1);
  fs.writeFileSync(path.join(dir, "counter.json"), "{broken");
  assert.throws(() => s.read("counter", {}), /损坏/);
  assert.throws(() => s.read("../escape"), /路径/);
});
test("defaults prohibit external writes; malformed timezone and unknown config rejected", () => {
  const c = validateConfig({});
  assert.equal(c.enabled, false);
  assert.ok(Object.values(c.permissions).every((v) => v === false));
  assert.throws(() => validateConfig({ timezone: "made/up" }));
  assert.throws(() =>
    validateConfig({
      night: { windows: [{ start: "25:01", end: "24:00", wakes: 1 }] },
    }),
  );
  assert.throws(() => validateConfig({ permissions: { shell: true } }));
  assert.equal(defaults.persona.name, "小白龙");
});
