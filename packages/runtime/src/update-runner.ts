import fs from 'node:fs';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { dataRoot } from './paths.js';
import { atomic, Store } from './store.js';
import { findRuntime, requestRuntime, type RuntimeConnection } from './runtime.js';
import { readTransition, transitionPath, updateState, type Transition } from './update-state.js';
import { compatible, readManifest, verifyPackage } from './update-package.js';
import { errorMessage, errorCode } from './types.js';

function alive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return errorCode(error) !== 'ESRCH';
  }
}
async function waitExit(pid: number, timeout = 30000) {
  const until = Date.now() + timeout;
  while (alive(pid)) {
    if (Date.now() >= until) throw Error('原后台尚未退出，未启动其他实例');
    await delay(100);
  }
}
function launch(directory: string, dir: string, token: string) {
  const log = fs.openSync(path.join(dir, 'server.log'), 'a', 0o600);
  const child = spawn(process.execPath, [path.join(directory, 'dist/runtime/worker.js')], {
    cwd: directory,
    env: { ...process.env, BILI_DRAGON_DATA: dir, BILI_DRAGON_UPDATE_TOKEN: token },
    windowsHide: true,
    detached: true,
    stdio: ['ignore', log, log],
  });
  fs.closeSync(log);
  return child;
}
async function ready(child: ChildProcess, dir: string, timeout: number) {
  let failure: Error | undefined;
  child.once('error', (error) => {
    failure = error;
  });
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if (failure) throw failure;
    if (child.exitCode !== null) throw Error('新后台启动退出');
    const connection = await findRuntime(dir);
    if (connection && connection.pid === child.pid) {
      const health = await requestRuntime<{ held: boolean }>(
        connection,
        'runtime',
        undefined,
        2000,
      );
      if (!health.held) throw Error('新后台未进入更新保护状态');
      await requestRuntime(connection, 'state', undefined, 5000);
      return connection;
    }
    await delay(100);
  }
  throw Error('新后台启动检查超时');
}
async function control(
  connection: RuntimeConnection,
  action: 'activate' | 'shutdown',
  token: string,
) {
  const response = await fetch(connection.origin + '/api/update-' + action, {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + connection.token,
      origin: connection.origin,
      'content-type': 'application/json',
      'x-update-token': token,
    },
    body: '{}',
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw Error('后台更新握手失败');
}
async function stopHeld(child: ChildProcess, dir: string, token: string) {
  if (!child.pid || !alive(child.pid)) return;
  const connection = await findRuntime(dir);
  if (connection?.pid === child.pid) {
    const health = await requestRuntime<{ held: boolean }>(connection, 'runtime', undefined, 2000);
    if (!health.held) throw Error('后台已恢复运行，不能自动终止或回退');
    await control(connection, 'shutdown', token);
  } else child.kill(); // Only this runner's unready, gated child can be terminated.
  await waitExit(child.pid);
}
export async function runTransition(dir: string, timeout = 15000) {
  const transition = readTransition(dir);
  if (!transition) throw Error('没有待切换的更新');
  atomic(transitionPath(dir), { ...transition, runnerPid: process.pid });
  const store = new Store(dir);
  const state = (value: Partial<ReturnType<typeof updateState>>) =>
    store.write('update-state', { ...updateState(dir), ...value });
  const pointer = path.join(dir, 'updates/active.json');
  const previousPointer = fs.existsSync(pointer) ? fs.readFileSync(pointer, 'utf8') : null;
  let child: ChildProcess | undefined;
  let committed = false;
  try {
    await waitExit(transition.oldPid);
    validateTransition(dir, transition);
    child = launch(transition.newRoot, dir, transition.token);
    const connection = await ready(child, dir, timeout);
    atomic(pointer, { root: transition.newRoot, version: transition.version });
    await control(connection, 'activate', transition.token);
    state({ status: 'updated', message: undefined, failedVersion: undefined });
    fs.rmSync(transitionPath(dir));
    committed = true;
    child.unref();
  } catch (error) {
    if (committed) throw error;
    if (child) await stopHeld(child, dir, transition.token);
    if (previousPointer === null) fs.rmSync(pointer, { force: true });
    else atomic(pointer, previousPointer);
    state({
      status: 'error',
      failedVersion: transition.version,
      message: '更新失败，已保留原版本：' + errorMessage(error),
    });
    // Never restore data: the old program reads the latest configuration and operation ledger.
    if (alive(transition.oldPid)) {
      fs.rmSync(transitionPath(dir), { force: true });
      throw error;
    }
    const rollback = launch(transition.oldRoot, dir, transition.token);
    try {
      const connection = await ready(rollback, dir, timeout);
      await control(connection, 'activate', transition.token);
      fs.rmSync(transitionPath(dir));
      rollback.unref();
    } catch (rollbackError) {
      await stopHeld(rollback, dir, transition.token);
      state({
        status: 'error',
        message:
          '更新及原版本启动失败，请核查后台日志后重新加载插件：' + errorMessage(rollbackError),
      });
      throw rollbackError;
    }
  }
}
function validateTransition(dir: string, transition: Transition) {
  const relative = path.relative(path.join(dir, 'updates/versions'), transition.newRoot);
  if (!/^\d+\.\d+\.\d+-[a-f0-9]{64}$/.test(relative) || !path.isAbsolute(transition.oldRoot))
    throw Error('更新目标路径无效');
  const manifest = verifyPackage(transition.newRoot, transition.version);
  if (!compatible(readManifest(transition.oldRoot), manifest)) throw Error('更新合同不兼容');
}
if (process.argv[1] && /(?:^|[\\/])update-runner\.js$/.test(process.argv[1])) {
  void runTransition(dataRoot).catch((error) => {
    console.error(errorMessage(error));
    process.exitCode = 1;
  });
}
