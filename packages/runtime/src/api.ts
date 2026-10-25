import { os, ORPCError } from '@orpc/server';
import { z } from 'zod';
import crypto from 'node:crypto';
import type { DragonService } from './service.js';
import type { Daemon } from './daemon.js';
import { configSchema } from './config.js';
import { errorMessage } from './types.js';
import { redact } from './upstream.js';
import { credentialsSchema } from './login.js';

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
    config: (input: unknown) => service.configure(input, () => daemon.pause()),
    credentials: (input: unknown) => service.login.manual(input, () => daemon.pause()),
    checkLogin: () => service.checkAccount(() => daemon.pause()),
    loginStart: () => service.login.start(),
    loginPoll: async (handle: string) => {
      const result = await service.login.poll(handle, () => daemon.pause());
      if (result.status === 'success' && result.account)
        await service.recordAccount(result.account, () => daemon.pause());
      return result;
    },
    loginCancel: (handle: string) => service.login.cancel(handle),
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
  const loginHandle = z.object({ handle: z.string().uuid() }).strict();
  return {
    state: base.handler(() => actions.state()),
    config: base.input(configSchema).handler(({ input }) => actions.config(input)),
    credentials: base.input(credentialsSchema).handler(({ input }) => actions.credentials(input)),
    checkLogin: base.handler(() => actions.checkLogin()),
    loginStart: base.handler(() => actions.loginStart()),
    loginPoll: base.input(loginHandle).handler(({ input }) => actions.loginPoll(input.handle)),
    loginCancel: base.input(loginHandle).handler(({ input }) => actions.loginCancel(input.handle)),
    run: base.handler(() => actions.run()),
    pause: base.handler(() => actions.pause()),
    approve: base.input(id).handler(({ input }) => actions.approve(input.id)),
    reject: base.input(id).handler(({ input }) => actions.reject(input.id)),
    dismiss: base.input(id).handler(({ input }) => actions.dismiss(input.id)),
  };
}
export type ApiRouter = ReturnType<typeof createApi>;
