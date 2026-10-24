import { os, ORPCError } from '@orpc/server';
import { z } from 'zod';
import crypto from 'node:crypto';
import type { DragonService } from './service.js';
import type { Daemon } from './daemon.js';
import { configSchema } from './config.js';
import { errorMessage } from './types.js';
import { redact } from './upstream.js';

export type DaemonControl = Pick<Daemon, 'pause' | 'tick' | 'error'>;
export function createActions(service: DragonService, daemon: DaemonControl) {
  return {
    state: () => ({
      ...service.status(),
      config: service.config(),
      evidence: service.store.read('evidence', {}),
      listeners: service.store.read('listener-status', {}),
      schedule: service.store.read('schedule', {}),
    }),
    config: async (input: unknown) => {
      const old = service.config();
      const next = service.saveConfig(input);
      if (old.enabled && !next.enabled) await daemon.pause();
      return next;
    },
    credentials: (input: unknown) => service.setCredentials(input),
    checkLogin: () => service.read({ action: 'session' }),
    run: () => {
      if (service.queue.list().some((j) => ['pending', 'running'].includes(j.state)))
        throw Error('已有待处理任务，请先完成或暂停后核查');
      const job = service.queue.add('manual:' + crypto.randomUUID(), 'browse', { manual: true });
      void daemon.tick().catch((error) => daemon.error(error));
      return job;
    },
    pause: async () => {
      await daemon.pause();
      return { paused: true };
    },
    approve: (id: string) => service.approve(id),
    reject: (id: string) => service.reject(id),
    dismiss: (id: string) => {
      const job = service.queue.list().find((j) => j.id === id);
      if (!job || !['needs-review', 'pending'].includes(job.state))
        throw Error('仅能关闭待核查或待处理任务');
      return service.queue.dismiss(id);
    },
  };
}
export type AdminState = ReturnType<ReturnType<typeof createActions>['state']>;
export function createApi(service: DragonService, daemon: DaemonControl) {
  const actions = createActions(service, daemon);
  const base = os.use(async ({ next }) => {
    try {
      return await next();
    } catch (error) {
      throw new ORPCError('BAD_REQUEST', {
        message: redact(errorMessage(error), service.store.dir),
      });
    }
  });
  const id = z.object({ id: z.string().min(1) }).strict();
  return {
    state: base.handler(() => actions.state()),
    config: base.input(configSchema).handler(({ input }) => actions.config(input)),
    credentials: base
      .input(z.object({ sessdata: z.string(), bili_jct: z.string(), buvid3: z.string() }).strict())
      .handler(({ input }) => actions.credentials(input)),
    checkLogin: base.handler(() => actions.checkLogin()),
    run: base.handler(() => actions.run()),
    pause: base.handler(() => actions.pause()),
    approve: base.input(id).handler(({ input }) => actions.approve(input.id)),
    reject: base.input(id).handler(({ input }) => actions.reject(input.id)),
    dismiss: base.input(id).handler(({ input }) => actions.dismiss(input.id)),
  };
}
export type ApiRouter = ReturnType<typeof createApi>;
