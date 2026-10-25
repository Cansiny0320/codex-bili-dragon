import fs from 'node:fs';
import { Store, atomic } from './store.js';
import { DragonService } from './service.js';
import { Daemon } from './daemon.js';
import { createHttp } from './http.js';
import { root, dataRoot, version } from './paths.js';
import { connectionPath } from './runtime.js';
import { errorMessage } from './types.js';
import { Updater } from './update.js';
import { readTransition } from './update-state.js';

async function main() {
  const service = new DragonService(new Store(dataRoot));
  service.updatesSupported = true;
  const transition = readTransition(dataRoot);
  const heldToken = process.env.BILI_DRAGON_UPDATE_TOKEN;
  if (transition && heldToken !== transition.token) throw Error('后台正在更新，暂不启动其他实例');
  const daemon = new Daemon(service);
  let held = !!heldToken;
  let armed = false;
  daemon.draining = held;
  daemon.start();
  let updater: Updater | undefined;
  let activationTimer: ReturnType<typeof setInterval> | undefined;
  let refreshing = false;
  let closing = false;
  let web: Awaited<ReturnType<typeof createHttp>>;
  const stop = async () => {
    if (closing) return;
    closing = true;
    updater?.stop();
    clearInterval(activationTimer);
    try {
      await daemon.stop();
      await web.close();
    } finally {
      fs.rmSync(connectionPath(dataRoot), { force: true });
    }
  };
  try {
    web = await createHttp(service, daemon, {
      port: 0,
      stop: () => {
        setImmediate(() => void stop());
      },
      updateControl: heldToken
        ? {
            token: heldToken,
            held: () => held,
            activate: () => {
              armed = true;
            },
            shutdown: () => {
              setImmediate(() => void stop());
            },
          }
        : undefined,
    });
    atomic(connectionPath(dataRoot), {
      origin: web.origin,
      token: web.token,
      pid: process.pid,
      version,
      root,
    });
    const resume = () => {
      held = false;
      daemon.draining = false;
      web.gate(false);
      updater = new Updater(daemon, {
        busy: () => web.busy() || refreshing,
        gate: web.gate,
        stop,
      }).start();
      refreshing = true;
      void service
        .refreshVideoMetadata()
        .catch((error) => daemon.error(error))
        .finally(() => {
          refreshing = false;
        });
    };
    if (held) {
      activationTimer = setInterval(() => {
        if (armed && !readTransition(dataRoot)) {
          clearInterval(activationTimer);
          resume();
        }
      }, 100);
    } else resume();
  } catch (error) {
    await daemon.stop();
    throw error;
  }
  process.on('SIGINT', () => void stop());
  process.on('SIGTERM', () => void stop());
}
main().catch((error) => {
  console.error(errorMessage(error));
  process.exitCode = 1;
});
