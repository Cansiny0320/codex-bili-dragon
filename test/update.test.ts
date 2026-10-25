import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { zipSync, strToU8 } from 'fflate';
import {
  compatible,
  newer,
  stageUpdate,
  type UpdateManifest,
} from '../packages/runtime/src/update-package';
import { Daemon } from '../packages/runtime/src/daemon';
import { DragonService } from '../packages/runtime/src/service';
import { Store } from '../packages/runtime/src/store';
import { latestUpdate, Updater } from '../packages/runtime/src/update';
import { createHttp } from '../packages/runtime/src/http';
import { requestRuntime } from '../packages/runtime/src/runtime';
import { updateState } from '../packages/runtime/src/update-state';
import { version } from '../packages/runtime/src/paths';

const digest = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex');
const manifest: UpdateManifest = {
  schema: 1,
  version: '0.9.1',
  bridge: 'a'.repeat(64),
  contract: 'b'.repeat(64),
  data: 1,
  protocol: 1,
};
function archive(extra: Record<string, string> = {}) {
  const contents = {
    'plugin.json': JSON.stringify({ name: 'codex-bili-dragon', version: manifest.version }),
    '.codex-plugin/plugin.json': JSON.stringify({
      name: 'codex-bili-dragon',
      version: manifest.version,
    }),
    'package.json': JSON.stringify({
      name: 'codex-bili-dragon',
      version: manifest.version,
      type: 'module',
    }),
    'dist/runtime/update.json': JSON.stringify(manifest),
    'dist/runtime/worker.js': 'export {};',
    'dist/runtime/update-runner.js': 'export {};',
    'dist/mcp-app/index.html': '<html>new</html>',
    ...extra,
  };
  const files = Object.fromEntries(
    Object.entries(contents).map(([name, body]) => [name, digest(body)]),
  );
  return zipSync(
    Object.fromEntries(
      Object.entries({
        ...contents,
        'bundle.json': JSON.stringify({ version: manifest.version, files }),
      }).map(([name, body]) => [name, strToU8(body)]),
    ),
  );
}
test('更新仅接受更高稳定版本和完全一致的桥接、工具及数据合同', () => {
  assert.equal(newer('0.10.0', '0.9.9'), true);
  assert.equal(newer('0.9.0-beta.1', '0.8.0'), false);
  assert.equal(newer('0.9.0', '0.9.0'), false);
  assert.equal(compatible(manifest, { ...manifest, version: '0.9.2' }), true);
  for (const changed of [{ bridge: 'c'.repeat(64) }, { contract: 'c'.repeat(64) }, { data: 2 }])
    assert.equal(compatible(manifest, { ...manifest, ...changed }), false);
  assert.equal(compatible(null, manifest), false);
  assert.equal(compatible(manifest, { ...manifest, protocol: 2 }), false);
  assert.equal(compatible(manifest, { ...manifest, schema: 2 }), false);
});

test('默认开启更新且每六小时检查，显式关闭后不联网', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-update-interval-'));
  const service = new DragonService(new Store(dir));
  assert.equal(service.config().updates.enabled, true);
  service.saveConfig({ ...service.config(), updates: { enabled: false } });
  const daemon = new Daemon(service, { run: async () => {}, stop: async () => {} });
  let requests = 0;
  const updater = new Updater(
    daemon,
    { busy: () => false, gate: () => {}, stop: async () => {} },
    async () => {
      requests++;
      return Response.json({
        tag_name: 'v' + version,
        draft: false,
        prerelease: false,
        assets: [],
      });
    },
  );
  t.onTestFinished(() => {
    updater.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  });
  await updater.tick(1000);
  assert.equal(requests, 0);
  service.saveConfig({ ...service.config(), updates: { enabled: true } });
  await updater.tick(1000);
  await updater.tick(1001);
  assert.equal(requests, 1);
  await updater.tick(1000 + 6 * 60 * 60 * 1000);
  assert.equal(requests, 2);
  service.saveConfig({ ...service.config(), updates: { enabled: false } });
  await updater.tick(1002 + 6 * 60 * 60 * 1000);
  assert.equal(requests, 2);
  service.saveConfig({ ...service.config(), updates: { enabled: true } });
  await updater.tick(1003 + 6 * 60 * 60 * 1000);
  assert.equal(requests, 3);
});
test('归档验证完整性、版本和路径；已有不可变版本不能被覆盖', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-update-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  const zip = archive();
  const staged = stageUpdate(dir, zip, digest(zip), manifest.version);
  assert.equal(fs.readFileSync(path.join(staged, 'dist/runtime/worker.js'), 'utf8'), 'export {};');
  assert.equal(stageUpdate(dir, zip, digest(zip), manifest.version), staged);
  assert.throws(() => stageUpdate(dir, zip, '0'.repeat(64), manifest.version), /校验/);
  assert.throws(() => stageUpdate(dir, zip, digest(zip), '0.9.2'), /版本/);
  for (const name of [
    '../escape',
    'C:/escape',
    'dist/CON.txt',
    'dist/file:stream',
    'dist/../escape',
  ]) {
    const bad = archive({ [name]: 'bad' });
    assert.throws(() => stageUpdate(dir, bad, digest(bad), manifest.version), /路径/);
  }
  fs.writeFileSync(path.join(staged, 'dist/runtime/worker.js'), 'modified');
  assert.throws(() => stageUpdate(dir, zip, digest(zip), manifest.version), /校验/);
});
test('排空等待当前任务完成，不领取后续任务、不改活动开关、不取消发送', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-drain-'));
  let finish!: () => void;
  let stopped = 0;
  const service = new DragonService(new Store(dir));
  service.saveConfig({
    ...service.config(),
    enabled: true,
    listen: { ...service.config().listen, dm: false },
    night: { ...service.config().night, windows: [{ start: '20:00', end: '24:00', wakes: 0 }] },
  });
  const daemon = new Daemon(service, {
    run: () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    stop: async () => {
      stopped++;
    },
  }).start();
  t.onTestFinished(async () => {
    await daemon.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  });
  service.queue.add('first', 'browse', { manual: true });
  service.queue.add('next', 'browse', { manual: true });
  const running = daemon.tick();
  daemon.draining = true;
  assert.equal(daemon.idleForUpdate, false);
  await daemon.tick();
  assert.equal(stopped, 0);
  finish();
  await running;
  await daemon.tick();
  assert.equal(daemon.idleForUpdate, true);
  assert.equal(service.config().enabled, true);
  assert.deepEqual(
    service.queue.list().map((job) => job.state),
    ['done', 'pending'],
  );
});

test('只下载官方稳定版；网络失败、预发布和缺少校验文件不会切换', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-release-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  const zip = archive(),
    name = 'codex-bili-dragon-' + manifest.version + '-plugin.zip';
  const release = {
    tag_name: 'v' + manifest.version,
    draft: false,
    prerelease: false,
    assets: [{ name }, { name: name + '.sha256' }],
  };
  const calls: string[] = [];
  const fetcher: typeof fetch = async (input) => {
    const url = input instanceof Request ? input.url : String(input);
    calls.push(url);
    return url.endsWith('/latest')
      ? Response.json(release)
      : url.endsWith('.sha256')
        ? new Response(digest(zip) + '  ' + name)
        : new Response(Buffer.from(zip));
  };
  const candidate = await latestUpdate(dir, '0.9.0', fetcher);
  assert.equal(candidate?.version, '0.9.1');
  assert.ok(
    calls.every(
      (url) =>
        url.startsWith('https://api.github.com/repos/Cansiny0320/codex-bili-dragon/') ||
        url.startsWith('https://github.com/Cansiny0320/codex-bili-dragon/releases/download/'),
    ),
  );
  calls.length = 0;
  release.prerelease = true;
  assert.equal(await latestUpdate(dir, '0.9.0', fetcher), null);
  assert.equal(calls.length, 1);
  release.prerelease = false;
  release.assets = [];
  await assert.rejects(latestUpdate(dir, '0.9.0', fetcher), /缺少/);
  await assert.rejects(
    latestUpdate(dir, '0.9.0', async () => {
      throw Error('offline');
    }),
    /offline/,
  );
});

test('关闭自动更新和任务超时都撤销排空；不会改写其他设置', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-update-cancel-'));
  const service = new DragonService(new Store(dir));
  const daemon = new Daemon(service, { run: async () => {}, stop: async () => {} }).start();
  let gated = false,
    stopped = false;
  const updater = new Updater(daemon, {
    busy: () => true,
    gate: (value) => {
      gated = value;
    },
    stop: async () => {
      stopped = true;
    },
  });
  t.onTestFinished(async () => {
    updater.stop();
    await daemon.stop();
    fs.rmSync(dir, { recursive: true, force: true });
  });
  service.saveConfig({ ...service.config(), updates: { enabled: true } });
  await updater.apply({ root: 'unused', version: '0.9.1' }, 0);
  assert.equal(daemon.draining, false);
  assert.equal(updateState(dir).status, 'waiting');
  const waiting = updater.apply({ root: 'unused', version: '0.9.1' });
  service.saveConfig({
    ...service.config(),
    updates: { enabled: false },
    persona: { ...service.config().persona, name: '最新设置' },
  });
  await waiting;
  assert.equal(daemon.draining, false);
  assert.equal(gated, false);
  assert.equal(stopped, false);
  assert.equal(service.config().persona.name, '最新设置');
  assert.equal(updateState(dir).status, 'idle');
});

test('切换门控拒绝新写入；客户端断线后仍等待已发请求完成，不重发', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-update-http-'));
  let complete!: () => void,
    calls = 0;
  const service = new DragonService(new Store(dir), async () => {
    calls++;
    await new Promise<void>((resolve) => {
      complete = resolve;
    });
    return { code: 0, out: 'fixture', err: '' };
  });
  service.saveConfig({
    ...service.config(),
    owner: { mid: '10001', name: '主人' },
    permissions: { ...service.config().permissions, comments: true },
  });
  service.ingest({
    id: 'once',
    channel: 'comments',
    mid: '10001',
    text: '测试',
    oid: '1',
    rpid: '2',
    business: 1,
  });
  const web = await createHttp(
    service,
    { pause: async () => {}, tick: async () => {}, error: () => {} },
    { port: 0 },
  );
  t.onTestFinished(async () => {
    await web.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const connection = {
    origin: web.origin,
    token: web.token,
    pid: process.pid,
    version: 'test',
    root: dir,
  };
  const request = requestRuntime(
    connection,
    'tool',
    { name: 'dragon_reply', arguments: { eventId: 'once', text: 'fixture' } },
    200,
  );
  const outcome = assert.rejects(request);
  await new Promise<void>((resolve) => {
    const timer = setInterval(() => {
      if (calls) {
        clearInterval(timer);
        resolve();
      }
    }, 10);
  });
  await outcome;
  assert.equal(web.busy(), true);
  web.gate(true);
  await assert.rejects(requestRuntime(connection, 'config', {}), /正在切换/);
  assert.equal(calls, 1);
  assert.equal(service.store.read('operations')[0].state, 'sending');
  complete();
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(web.busy(), false);
  assert.equal(calls, 1);
  assert.equal(service.store.read('operations').length, 1);
  assert.equal(service.store.read('operations')[0].state, 'confirmed');
});
