import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Store } from "../src/store.mjs";
import { defaults } from "../src/config.mjs";
import { syncUpstream, runUpstream, redact } from "../src/upstream.mjs";
test("真实上游 CLI 读取独立配置，直播命令可解析，不触及 DSH 目录", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dragon-vendor-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const store = new Store(dir);
  store.write("config", { ...defaults, quota: { shareDaily: 1 } });
  syncUpstream(store, { ...defaults, quota: { shareDaily: 1 } });
  const quota = await runUpstream(store, ["quota", "status"]);
  assert.equal(quota.code, 0);
  assert.match(quota.out, /0\/1/);
  const live = await runUpstream(store, ["await"]);
  assert.notEqual(live.code, 0);
  assert.doesNotMatch(live.err, /未知命令/);
  assert.match(live.err, /room/);
});
test("上游写操作必须同时满足指定端点和实时通道开关；错误输出隐藏凭据", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dragon-policy-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, ".bili-ai"));
  fs.writeFileSync(
    path.join(dir, ".bili-ai/credentials.json"),
    JSON.stringify({ sessdata: "secret%2Fcookie", bili_jct: "a".repeat(32) }),
  );
  assert.ok(
    !redact(
      "secret%2Fcookie " + encodeURIComponent("secret%2Fcookie"),
      dir,
    ).includes("secret"),
  );
  const policy = new URL("../src/policy.mjs", import.meta.url).href;
  const code = `import {assertVendorWrite} from ${JSON.stringify(policy)};assertVendorWrite('https://api.bilibili.com/x/v2/reply/add',{method:'POST'});`;
  fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify(defaults));
  const env = {
    ...process.env,
    BILI_DRAGON_DATA: dir,
    BILI_DRAGON_WRITE_CHANNEL: "comments",
  };
  assert.throws(() =>
    execFileSync(process.execPath, ["--input-type=module", "-e", code], {
      env,
      stdio: "pipe",
    }),
  );
  fs.writeFileSync(
    path.join(dir, "config.json"),
    JSON.stringify({ ...defaults, permissions: { comments: true } }),
  );
  execFileSync(process.execPath, ["--input-type=module", "-e", code], {
    env,
    stdio: "pipe",
  });
  assert.throws(() =>
    execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        code.replace(
          "api.bilibili.com/x/v2/reply/add",
          "api.bilibili.com/x/v2/reply/del",
        ),
      ],
      { env, stdio: "pipe" },
    ),
  );
});
