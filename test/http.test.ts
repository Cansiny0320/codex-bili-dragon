import httpNative from 'node:http';
import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Store } from '../packages/runtime/src/store.js';
import { DragonService } from '../packages/runtime/src/service.js';
import { createHttp } from '../packages/runtime/src/http.js';
test('本地页面可读取；API 要求令牌，写请求校验 Origin；凭据不会回传', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-http-'));
  const service = new DragonService(new Store(dir));
  const http = await createHttp(
    service,
    { pause: async () => {}, tick: async () => {}, error: () => {} },
    { port: 0 },
  );
  t.onTestFinished(async () => {
    await http.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const base = http.origin,
    headers = {
      authorization: 'Bearer ' + http.token,
      'content-type': 'application/json',
    };
  assert.equal((await fetch(base)).status, 200);
  assert.equal((await fetch(base + '/api/state')).status, 401);
  assert.equal((await fetch(base + '/rpc/state', { method: 'POST' })).status, 401);
  const rpcHeaders = { ...headers, origin: base };
  const rpc = await fetch(base + '/rpc/state', {
    method: 'POST',
    headers: rpcHeaders,
    body: JSON.stringify({ json: null }),
  });
  assert.equal(rpc.status, 200);
  const rpcState = await rpc.json();
  assert.equal(rpcState.json.config.enabled, false);
  assert.equal(
    (
      await fetch(base + '/rpc/pause', {
        method: 'POST',
        headers: { ...headers, origin: 'https://attacker.example' },
        body: '{}',
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(base + '/rpc/credentials', {
        method: 'POST',
        headers: rpcHeaders,
        body: JSON.stringify({ json: { sessdata: 'invalid' } }),
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await fetch(base + '/rpc/credentials', {
        method: 'POST',
        headers: rpcHeaders,
        body: JSON.stringify({ json: { sessdata: 'x'.repeat(129 * 1024) } }),
      })
    ).status,
    413,
  );
  assert.equal(
    (
      await fetch(base + '/api/config', {
        method: 'POST',
        headers: { ...headers, origin: 'https://attacker.example' },
        body: '{}',
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(base + '/api/credentials', {
        method: 'POST',
        headers: { ...headers, origin: base },
        body: JSON.stringify({
          sessdata: 'test-private-cookie',
          bili_jct: 'a'.repeat(32),
          buvid3: 'test-private-buvid',
        }),
      })
    ).status,
    200,
  );
  const r = await fetch(base + '/api/state', { headers });
  const body = await r.text();
  assert.ok(!body.includes('test-private-cookie'));
  assert.equal(JSON.parse(body).hasCredentials, true);
  const hostStatus = await new Promise((resolve) =>
    httpNative.get(
      base + '/api/state',
      { headers: { ...headers, host: 'attacker.example' } },
      (res) => {
        res.resume();
        resolve(res.statusCode);
      },
    ),
  );
  assert.equal(hostStatus, 403);
});
