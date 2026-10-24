import httpNative from "node:http";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Store } from "../src/store.mjs";
import { DragonService } from "../src/service.mjs";
import { createHttp } from "../src/http.mjs";
test("本地页面可读取；API 要求令牌，写请求校验 Origin；凭据不会回传", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dragon-http-"));
  const service = new DragonService(new Store(dir));
  const http = await createHttp(
    service,
    { pause: async () => {}, tick: async () => {} },
    { port: 0 },
  );
  t.after(async () => {
    await http.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const base = http.origin,
    headers = {
      authorization: "Bearer " + http.token,
      "content-type": "application/json",
    };
  assert.equal((await fetch(base)).status, 200);
  assert.equal((await fetch(base + "/api/state")).status, 401);
  assert.equal(
    (
      await fetch(base + "/api/config", {
        method: "POST",
        headers: { ...headers, origin: "https://attacker.example" },
        body: "{}",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(base + "/api/credentials", {
        method: "POST",
        headers: { ...headers, origin: base },
        body: JSON.stringify({
          sessdata: "test-private-cookie",
          bili_jct: "a".repeat(32),
          buvid3: "test-private-buvid",
        }),
      })
    ).status,
    200,
  );
  const r = await fetch(base + "/api/state", { headers });
  const body = await r.text();
  assert.ok(!body.includes("test-private-cookie"));
  assert.equal(JSON.parse(body).hasCredentials, true);
  const hostStatus = await new Promise((resolve) =>
    httpNative.get(
      base + "/api/state",
      { headers: { ...headers, host: "attacker.example" } },
      (res) => {
        res.resume();
        resolve(res.statusCode);
      },
    ),
  );
  assert.equal(hostStatus, 403);
});
