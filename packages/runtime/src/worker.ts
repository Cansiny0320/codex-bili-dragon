import fs from 'node:fs';
import { Store, atomic } from './store.js';
import { DragonService } from './service.js';
import { Daemon } from './daemon.js';
import { createHttp } from './http.js';
import { root, dataRoot, version } from './paths.js';
import { connectionPath } from './runtime.js';
import { errorMessage } from './types.js';

async function main() {
  const service = new DragonService(new Store(dataRoot));
  const daemon = new Daemon(service).start();
  let closing = false;
  let web: Awaited<ReturnType<typeof createHttp>>;
  const stop = async () => {
    if (closing) return;
    closing = true;
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
    });
    atomic(connectionPath(dataRoot), {
      origin: web.origin,
      token: web.token,
      pid: process.pid,
      version,
      root,
    });
    void service.refreshVideoMetadata();
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
