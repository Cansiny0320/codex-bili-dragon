import test from "node:test";
import assert from "node:assert/strict";
import { plan, inWindow, complete } from "../src/schedule.mjs";
import { validateConfig } from "../src/config.mjs";
const config = validateConfig({
  night: {
    windows: [{ start: "23:00", end: "01:00", wakes: 1 }],
    skipChance: 0,
  },
});
test("overnight schedule survives restart and cannot run twice after midnight", () => {
  const now = Date.parse("2026-10-24T23:15:00+08:00");
  const p = plan(config, {}, now, () => 0.5);
  assert.equal(p.windowKey, "2026-10-24|23:00–01:00");
  assert.ok(p.atMs >= now && p.atMs < Date.parse("2026-10-25T01:00:00+08:00"));
  assert.deepEqual(
    plan(config, p, now + 1000, () => {
      throw Error("reroll");
    }),
    p,
  );
  const done = complete(p, p.atMs);
  assert.equal(done.used[p.windowKey], 1);
  assert.notEqual(
    plan(config, done, Date.parse("2026-10-25T00:30:00+08:00")).windowKey,
    p.windowKey,
  );
  assert.equal(
    inWindow(config, Date.parse("2026-10-25T01:00:00+08:00")),
    false,
  );
});
test("timezone is independent of host; expired windows and zero wakes do not backfill", () => {
  const c = validateConfig({
    timezone: "America/New_York",
    night: { windows: [{ start: "09:00", end: "10:00", wakes: 1 }] },
  });
  assert.equal(inWindow(c, Date.parse("2026-10-24T13:30:00Z")), true);
  assert.equal(inWindow(c, Date.parse("2026-10-24T09:30:00Z")), false);
  assert.equal(
    plan(
      {
        ...config,
        night: {
          ...config.night,
          windows: [{ start: "00:00", end: "01:00", wakes: 0 }],
        },
      },
      {},
      Date.now(),
    ).action,
    "done",
  );
});
test("修改窗口不会清空当天次数；总机会数仍不超过三次", () => {
  const c = validateConfig({
    night: {
      windows: [{ start: "08:00", end: "23:00", wakes: 3 }],
      skipChance: 0,
    },
  });
  const now = Date.parse("2026-10-25T10:00:00+08:00");
  const used = { "2026-10-25|07:00–09:00": 3 };
  assert.equal(plan(c, { used }, now, () => 0).action, "done");
  const p = plan(c, { used: { "2026-10-25|07:00–09:00": 2 } }, now, () => 0);
  const next = complete(p, now);
  assert.equal(plan(c, next, now + 11 * 60000, () => 0).action, "done");
});
