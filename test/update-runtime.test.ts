import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import type { AddressInfo } from 'node:net';
import { zipSync } from 'fflate';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { Store } from '../packages/runtime/src/store';
import { defaults } from '../packages/runtime/src/config';
import { root, version } from '../packages/runtime/src/paths';
import { hash } from '../packages/runtime/src/update-package';
import { findRuntime, requestRuntime, stopRuntime } from '../packages/runtime/src/runtime';
import { readTransition, updateState } from '../packages/runtime/src/update-state';

async function until(check: () => boolean | Promise<boolean>, message: string) {
  const deadline = Date.now() + 15000;
  while (!(await check())) {
    if (Date.now() >= deadline) throw Error(message);
    await delay(50);
  }
}
function files(directory: string): string[] {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? files(path.join(directory, entry.name))
        : [path.join(directory, entry.name)],
    );
}
function fixture(directory: string, next: string, releaseOrigin: string, fail: boolean) {
  for (const relative of [
    'dist/runtime',
    'dist/mcp-app',
    'assets',
    'vendor/upstream',
    '.codex-plugin',
    'plugin.json',
    'package.json',
  ])
    fs.cpSync(path.join(root, relative), path.join(directory, relative), {
      recursive: true,
      filter: (file) => !file.endsWith('.map'),
    });
  for (const relative of [
    'plugin.json',
    '.codex-plugin/plugin.json',
    'package.json',
    'dist/runtime/update.json',
  ]) {
    const file = path.join(directory, relative),
      content = JSON.parse(fs.readFileSync(file, 'utf8'));
    content.version = next;
    fs.writeFileSync(file, JSON.stringify(content));
  }
  const worker = path.join(directory, 'dist/runtime/worker.js');
  fs.renameSync(worker, path.join(directory, 'dist/runtime/worker-implementation.js'));
  fs.writeFileSync(
    worker,
    fail
      ? 'process.exit(19);'
      : `
import fs from 'node:fs';
import path from 'node:path';
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, options) => {
  const url = String(input);
  if (url.startsWith('https://api.github.com/') || url.startsWith('https://github.com/'))
    return originalFetch(${JSON.stringify(releaseOrigin)} + new URL(url).pathname, options);
  if (url.startsWith('https://')) throw Error('Fixture blocks all external network');
  return originalFetch(input, options);
};
fs.appendFileSync(path.join(process.env.BILI_DRAGON_DATA, 'executed-versions.txt'), ${JSON.stringify(next + '\n')});
await import('./worker-implementation.js');
`,
  );
  fs.appendFileSync(
    path.join(directory, 'dist/mcp-app/index.html'),
    '\n<!-- fixture UI ' + next + ' -->',
  );
  const entries = Object.fromEntries(
    files(directory).map((file) => [
      path.relative(directory, file).replaceAll('\\', '/'),
      fs.readFileSync(file),
    ]),
  );
  entries['bundle.json'] = Buffer.from(
    JSON.stringify({
      version: next,
      files: Object.fromEntries(
        Object.entries(entries).map(([name, bytes]) => [name, hash(bytes)]),
      ),
    }),
  );
  fs.writeFileSync(path.join(directory, 'bundle.json'), entries['bundle.json']);
  return zipSync(entries, { level: 1 });
}

for (const scenario of ['success', 'worker-failure', 'runner-failure'])
  test(
    scenario === 'runner-failure'
      ? '切换进程启动失败时原后台保持运行，不关闭活动或重发请求'
      : scenario === 'worker-failure'
        ? '真实更新启动失败回退旧程序，配置和未知发送台账保留'
        : '真实更新切换进程后两个原 MCP 客户端继续调用，新管理页读取新资源',
    async (t) => {
      const fail = scenario !== 'success';
      const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-switch-'));
      const dir = path.join(workspace, 'data'),
        oldRoot = path.join(workspace, 'old');
      fs.mkdirSync(dir);
      const store = new Store(dir);
      store.write('config', {
        ...defaults,
        enabled: true,
        updates: { enabled: true },
        owner: { mid: '10001', name: '主人' },
        permissions: { ...defaults.permissions, comments: true },
        night: { ...defaults.night, windows: [{ start: '20:00', end: '24:00', wakes: 0 }] },
        persona: { ...defaults.persona, name: '保留设置' },
      });
      const operation = {
        key: 'reply:existing',
        channel: 'comments' as const,
        state: 'needs-review' as const,
        at: new Date().toISOString(),
      };
      store.write('operations', [operation]);
      store.write('inbox', [
        {
          id: 'existing',
          channel: 'comments',
          mid: '10001',
          text: '已发送但断线',
          oid: '1',
          rpid: '2',
          business: 1,
        },
      ]);
      const parts = version.split('.').map(Number);
      const next = `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
      let release!: () => void;
      const allowRelease = new Promise<void>((resolve) => {
        release = resolve;
      });
      let zip: Uint8Array;
      const server = http.createServer(async (request, response) => {
        if (request.url?.endsWith('/latest')) {
          await allowRelease;
          response.setHeader('content-type', 'application/json');
          response.end(
            JSON.stringify({
              tag_name: 'v' + next,
              draft: false,
              prerelease: false,
              assets: [
                { name: `codex-bili-dragon-${next}-plugin.zip` },
                { name: `codex-bili-dragon-${next}-plugin.zip.sha256` },
              ],
            }),
          );
        } else if (request.url?.endsWith('.sha256'))
          response.end(hash(zip) + `  codex-bili-dragon-${next}-plugin.zip\n`);
        else response.end(zip);
      });
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const origin = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
      fixture(oldRoot, version, origin, false);
      if (scenario === 'runner-failure')
        fs.writeFileSync(path.join(oldRoot, 'dist/runtime/update-runner.js'), 'process.exit(19);');
      zip = fixture(path.join(workspace, 'candidate'), next, origin, scenario === 'worker-failure');
      const log = fs.openSync(path.join(workspace, 'initial.log'), 'a');
      const child = spawn(process.execPath, [path.join(oldRoot, 'dist/runtime/worker.js')], {
        cwd: oldRoot,
        env: { ...process.env, BILI_DRAGON_DATA: dir },
        windowsHide: true,
        stdio: ['ignore', log, log],
      });
      fs.closeSync(log);
      const clients: Client[] = [];
      t.onTestFinished(async () => {
        release();
        for (const client of clients) await client.close();
        await stopRuntime(dir);
        if (child.exitCode === null) child.kill();
        await new Promise<void>((resolve) => server.close(() => resolve()));
        fs.rmSync(workspace, { recursive: true, force: true });
      });
      await until(
        async () => !!(await findRuntime(dir)),
        '初始后台未启动：' + fs.readFileSync(path.join(workspace, 'initial.log'), 'utf8'),
      );
      const original = (await findRuntime(dir))!;
      for (let i = 0; i < 2; i++) {
        const client = new Client({ name: 'update-client-' + i, version: '1' });
        clients.push(client);
        await client.connect(
          new StdioClientTransport({
            command: process.execPath,
            args: [path.join(oldRoot, 'dist/runtime/mcp.js')],
            env: { ...process.env, BILI_DRAGON_DATA: dir },
            stderr: 'pipe',
          }),
        );
        assert.notEqual(
          (await client.callTool({ name: 'dragon_status', arguments: {} })).isError,
          true,
        );
      }
      const config = store.read('config');
      release();
      await until(async () => {
        const current = await findRuntime(dir);
        if (scenario === 'runner-failure')
          return (
            current?.pid === original.pid &&
            !readTransition(dir) &&
            updateState(dir).status === 'error'
          );
        return (
          !!current &&
          current.pid !== original.pid &&
          !readTransition(dir) &&
          (!fail ? current.version === next : updateState(dir).failedVersion === next)
        );
      }, '后台没有完成切换或回退');
      await delay(200);
      const current = (await findRuntime(dir))!;
      assert.equal(current.version, fail ? version : next);
      assert.deepEqual(store.read('config'), config);
      assert.deepEqual(store.read('operations'), [operation]);
      assert.equal(store.read('config').enabled, true);
      const executed = fs
        .readFileSync(path.join(dir, 'executed-versions.txt'), 'utf8')
        .trim()
        .split('\n');
      assert.deepEqual(
        executed,
        scenario === 'runner-failure' ? [version] : [version, fail ? version : next],
      );
      for (const [i, client] of clients.entries()) {
        const saved = CallToolResultSchema.parse(
          await client.callTool({
            name: 'dragon_diary',
            arguments: {
              id: 'after-update-' + i,
              title: '切换后实际调用',
              publicText: '公开日记',
              privateText: '内部日记',
              evidence: 'fixture',
            },
          }),
        );
        assert.notEqual(saved.isError, true, JSON.stringify(saved));
        const repeated = CallToolResultSchema.parse(
          await client.callTool({
            name: 'dragon_reply',
            arguments: { eventId: 'existing', text: '不能重发' },
          }),
        );
        assert.equal(repeated.isError, true);
        assert.match(JSON.stringify(repeated), /重复发送/);
      }
      assert.equal(store.read('diaries').length, 2);
      assert.deepEqual(store.read('operations'), [operation]);
      const resource = await clients[0].readResource({ uri: 'ui://bili-dragon/dashboard' });
      assert.ok(
        'text' in resource.contents[0] &&
          resource.contents[0].text.includes('fixture UI ' + (fail ? version : next)),
      );
      if (!fail) {
        await stopRuntime(dir);
        const restarted = await clients[0].callTool({
          name: 'dragon_control',
          arguments: { action: 'start' },
        });
        assert.notEqual(restarted.isError, true);
        assert.equal((await findRuntime(dir))?.version, next);
        assert.equal(
          (
            await requestRuntime<{ config: { enabled: boolean } }>(
              (await findRuntime(dir))!,
              'state',
            )
          ).config.enabled,
          false,
        );
      }
    },
    60000,
  );
