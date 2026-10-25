import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { z } from 'zod';
import { root, version } from './paths.js';
import { compatible, newer, readManifest, stageUpdate } from './update-package.js';
import { atomic, Store } from './store.js';
import { readTransition, transitionPath, updateState, type UpdateState } from './update-state.js';
import type { Daemon } from './daemon.js';
import { errorMessage } from './types.js';

const repository = 'Cansiny0320/codex-bili-dragon';
const interval = 6 * 60 * 60 * 1000;
async function download(url: string, limit: number, fetcher: typeof fetch) {
  const response = await fetcher(url, {
    headers: { 'user-agent': 'codex-bili-dragon-updater', accept: 'application/octet-stream' },
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok || !response.body) throw Error('下载更新失败：HTTP ' + response.status);
  if (Number(response.headers.get('content-length') ?? 0) > limit)
    throw Error('更新下载超出大小限制');
  const reader = response.body.getReader(),
    chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > limit) throw Error('更新下载超出大小限制');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks);
}
export async function latestUpdate(
  dir: string,
  current: string,
  fetcher: typeof fetch = fetch,
  downloading: (version: string) => void = () => {},
) {
  const response = await fetcher(
    'https://api.github.com/repos/' + repository + '/releases/latest',
    {
      headers: { accept: 'application/vnd.github+json', 'user-agent': 'codex-bili-dragon-updater' },
      signal: AbortSignal.timeout(30000),
    },
  );
  if (!response.ok) throw Error('检查更新失败：HTTP ' + response.status);
  const release = z
    .object({
      tag_name: z.string(),
      draft: z.boolean(),
      prerelease: z.boolean(),
      assets: z.array(z.object({ name: z.string() })),
    })
    .parse(await response.json());
  const next = release.tag_name.replace(/^v/, '');
  if (release.draft || release.prerelease || !newer(next, current)) return null;
  const name = 'codex-bili-dragon-' + next + '-plugin.zip';
  if (
    ![name, name + '.sha256'].every((asset) => release.assets.some((item) => item.name === asset))
  )
    throw Error('稳定版本缺少更新包或校验文件');
  downloading(next);
  const base =
    'https://github.com/' + repository + '/releases/download/' + release.tag_name + '/' + name;
  const checksum = (await download(base + '.sha256', 1024, fetcher)).toString('utf8').trim();
  const match = /^([a-f0-9]{64})\s+\*?([^\r\n]+)$/.exec(checksum);
  if (!match || match[2] !== name) throw Error('更新校验文件无效');
  const archive = await download(base, 64 * 1024 * 1024, fetcher);
  return { root: stageUpdate(dir, archive, match[1], next), version: next };
}
export interface UpdateHost {
  busy: () => boolean;
  gate: (closed: boolean) => void;
  stop: () => Promise<void>;
}
export class Updater {
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private stopped = false;
  private nextCheck = 0;
  constructor(
    private daemon: Daemon,
    private host: UpdateHost,
    private fetcher: typeof fetch = fetch,
  ) {}
  start() {
    this.timer = setInterval(() => void this.tick(), 30000);
    void this.tick();
    return this;
  }
  stop() {
    this.stopped = true;
    clearInterval(this.timer);
  }
  private state(value: Partial<UpdateState>) {
    const dir = this.daemon.service.store.dir;
    new Store(dir).write('update-state', { ...updateState(dir), ...value });
  }
  async tick(now = Date.now()) {
    if (this.running || this.stopped) return;
    if (!this.daemon.service.config().updates.enabled) {
      this.nextCheck = 0;
      return;
    }
    if (now < this.nextCheck) return;
    this.running = true;
    this.nextCheck = now + interval;
    const dir = this.daemon.service.store.dir;
    try {
      if (!readManifest(root)) {
        this.state({
          status: 'reload-required',
          message: '当前版本缺少兼容清单，请更新并重新加载插件。',
        });
        return;
      }
      this.state({
        status: 'checking',
        checkedAt: new Date(now).toISOString(),
        message: undefined,
      });
      const candidate = await latestUpdate(dir, version, this.fetcher, (availableVersion) =>
        this.state({ status: 'downloading', availableVersion }),
      );
      if (this.stopped || !this.daemon.service.config().updates.enabled) {
        this.state({ status: 'idle' });
        return;
      }
      if (!candidate) {
        this.state({ status: 'idle', availableVersion: undefined });
        return;
      }
      if (!compatible(readManifest(root), readManifest(candidate.root))) {
        this.state({
          status: 'reload-required',
          message: '新版本需要重新加载插件，请在 Codex 插件市场更新后重新加载。',
        });
        return;
      }
      if (updateState(dir).failedVersion === candidate.version) {
        this.state({
          status: 'error',
          message: '此版本启动失败，已保留原版本。请等待后续版本或手动更新。',
        });
        return;
      }
      await this.apply(candidate);
    } catch (error) {
      this.state({ status: 'error', message: errorMessage(error) });
    } finally {
      this.running = false;
    }
  }
  async apply(candidate: { root: string; version: string }, waitMs = 120000) {
    const dir = this.daemon.service.store.dir;
    this.daemon.draining = true;
    this.state({
      status: 'waiting',
      availableVersion: candidate.version,
      message: '等待当前任务完成后更新。',
    });
    let handedOff = false;
    try {
      const deadline = Date.now() + waitMs;
      while (!this.daemon.idleForUpdate || this.host.busy()) {
        if (this.stopped || !this.daemon.service.config().updates.enabled) {
          this.state({ status: 'idle', message: undefined });
          return;
        }
        if (Date.now() >= deadline) {
          this.state({ status: 'waiting', message: '当前任务仍在进行，更新已延期。' });
          return;
        }
        await delay(100);
      }
      if (this.stopped || !this.daemon.service.config().updates.enabled) {
        this.state({ status: 'idle', message: undefined });
        return;
      }
      this.host.gate(true);
      if (fs.existsSync(transitionPath(dir))) throw Error('上次更新切换尚未完成，请核查后台日志');
      atomic(transitionPath(dir), {
        oldRoot: root,
        newRoot: candidate.root,
        version: candidate.version,
        oldPid: process.pid,
        token: randomBytes(32).toString('base64url'),
        startedAt: Date.now(),
      });
      const log = fs.openSync(path.join(dir, 'server.log'), 'a', 0o600);
      const child = spawn(process.execPath, [path.join(root, 'dist/runtime/update-runner.js')], {
        cwd: root,
        env: { ...process.env, BILI_DRAGON_DATA: dir },
        detached: true,
        windowsHide: true,
        stdio: ['ignore', log, log],
      });
      fs.closeSync(log);
      try {
        await new Promise<void>((resolve, reject) => {
          child.once('spawn', resolve);
          child.once('error', reject);
        });
        const readyBy = Date.now() + 10000;
        while (readTransition(dir)?.runnerPid !== child.pid) {
          if (child.exitCode !== null || Date.now() >= readyBy)
            throw Error('更新切换进程未就绪，继续使用当前后台');
          await delay(100);
        }
      } catch (error) {
        fs.rmSync(transitionPath(dir), { force: true });
        throw error;
      }
      child.unref();
      handedOff = true;
      this.state({ status: 'switching', message: '正在切换后台，请稍候重新打开管理页。' });
      await this.host.stop();
    } finally {
      if (!handedOff) {
        this.daemon.draining = false;
        this.host.gate(false);
      }
    }
  }
}
