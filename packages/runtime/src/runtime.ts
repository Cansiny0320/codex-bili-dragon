import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { z } from 'zod';
import { root, dataRoot, version } from './paths.js';
import { errorCode } from './types.js';
import { activeRoot, readTransition } from './update-state.js';
import { compatible, newer, readManifest, verifyPackage } from './update-package.js';

const connectionSchema = z.object({
  origin: z.string().regex(/^http:\/\/127\.0\.0\.1:\d+$/),
  token: z.string().regex(/^[\w-]{40,}$/),
  pid: z.number().int().positive(),
  version: z.string(),
  root: z.string(),
});
export type RuntimeConnection = z.infer<typeof connectionSchema>;
export const connectionPath = (dir: string) => path.join(dir, 'connection.json');

export async function requestRuntime<T = unknown>(
  connection: RuntimeConnection,
  action: string,
  input?: unknown,
  timeout = 180000,
): Promise<T> {
  if (!/^[a-z-]+$/.test(action)) throw Error('无效后台操作');
  const read = action === 'state' || action === 'runtime';
  const response = await fetch(connection.origin + '/api/' + action, {
    method: read ? 'GET' : 'POST',
    headers: {
      authorization: 'Bearer ' + connection.token,
      origin: connection.origin,
      'content-type': 'application/json',
    },
    body: read ? undefined : JSON.stringify(input ?? {}),
    signal: AbortSignal.timeout(timeout),
  });
  const result: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof result === 'object' && result !== null && 'error' in result
        ? String(result.error)
        : '后台请求失败';
    throw Error(message);
  }
  return result as T;
}

export async function findRuntime(dir = dataRoot): Promise<RuntimeConnection | null> {
  let saved: RuntimeConnection;
  try {
    saved = connectionSchema.parse(JSON.parse(fs.readFileSync(connectionPath(dir), 'utf8')));
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return null;
    throw Error('后台连接记录损坏，请先核查 connection.json');
  }
  try {
    const status = await requestRuntime<{ pid: number; protocol: number }>(
      saved,
      'runtime',
      undefined,
      1000,
    );
    return status.pid === saved.pid && status.protocol === 1 ? saved : null;
  } catch {
    return null;
  }
}

export async function ensureRuntime(dir = dataRoot): Promise<RuntimeConnection> {
  for (let attempt = 0; readTransition(dir); attempt++) {
    const transition = readTransition(dir)!;
    if (attempt >= 600 || Date.now() - transition.startedAt > 180000)
      throw Error('后台更新尚未完成，请核查 server.log；未重复提交请求');
    await delay(100);
  }
  const current = await findRuntime(dir);
  if (current) {
    if (current.version !== version && !compatible(readManifest(root), readManifest(current.root)))
      throw Error('后台版本已变化，请先停止后台，再重新启动。数据会保留。');
    return current;
  }
  const selected = activeRoot(dir, root);
  const selectedManifest = readManifest(selected);
  const directory =
    selected !== root &&
    selectedManifest &&
    newer(selectedManifest.version, version) &&
    compatible(readManifest(root), selectedManifest)
      ? selected
      : root;
  if (directory !== root) verifyPackage(directory, selectedManifest!.version);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const log = fs.openSync(path.join(dir, 'server.log'), 'a', 0o600);
  const child = spawn(process.execPath, [path.join(directory, 'dist/runtime/worker.js')], {
    cwd: directory,
    env: { ...process.env, BILI_DRAGON_DATA: dir, BILI_DRAGON_UPDATE_TOKEN: '' },
    detached: true,
    windowsHide: true,
    stdio: ['ignore', log, log],
  });
  fs.closeSync(log);
  let failure: Error | undefined;
  child.once('error', (error) => {
    failure = error;
  });
  child.unref();
  for (let attempt = 0; attempt < 100; attempt++) {
    const ready = await findRuntime(dir);
    if (ready) return ready;
    if (failure) throw failure;
    await delay(100);
  }
  throw Error('后台未能启动，请检查数据目录中的 server.log');
}

export async function stopRuntime(dir = dataRoot) {
  const current = await findRuntime(dir);
  if (!current) return { stopped: true };
  await requestRuntime(current, 'stop');
  for (let attempt = 0; attempt < 100; attempt++) {
    if (!fs.existsSync(connectionPath(dir))) return { stopped: true };
    await delay(100);
  }
  throw Error('后台仍在停止，请稍后检查状态');
}
