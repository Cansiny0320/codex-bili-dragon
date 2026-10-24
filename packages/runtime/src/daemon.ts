import path from 'node:path';
import { exclusive } from './store.js';
import { CodexSession } from './codex.js';
import { Listeners } from './listeners.js';
import { plan, complete, inWindow } from './schedule.js';
import type { DragonService } from './service.js';
import { errorMessage, type Job } from './types.js';
export interface SessionRunner {
  run(job: Job): Promise<unknown>;
  stop(): Promise<void>;
}
export class Daemon {
  service: DragonService;
  session: SessionRunner;
  listeners: Listeners;
  busy = false;
  stopped = true;
  release: (() => void) | null = null;
  timer?: ReturnType<typeof setInterval>;
  constructor(service: DragonService, session: SessionRunner = new CodexSession(service)) {
    this.service = service;
    this.session = session;
    this.listeners = new Listeners(service);
    this.busy = false;
    this.stopped = true;
  }
  start() {
    this.release = exclusive(path.join(this.service.store.dir, 'daemon.lock'));
    this.service.recover();
    this.stopped = false;
    this.service.store.write('runtime', {
      state: 'idle',
      startedAt: new Date().toISOString(),
    });
    this.timer = setInterval(() => void this.tick().catch((e) => this.error(e)), 5000);
    return this;
  }
  error(e: unknown) {
    this.service.store.update('runtime', {}, (s) =>
      Object.assign(s, {
        error: errorMessage(e),
        lastErrorAt: new Date().toISOString(),
      }),
    );
  }
  async tick(now = Date.now()) {
    if (this.stopped) return;
    const c = this.service.config();
    if (c.enabled) {
      this.listeners.suspended = false;
      const state = plan(c, this.service.store.read('schedule', {}), now);
      this.service.store.write('schedule', state);
      if (
        state.action !== 'done' &&
        !state.fired &&
        state.atMs !== undefined &&
        state.atMs <= now &&
        state.windowKey
      ) {
        if (state.action === 'browse')
          this.service.queue.add(
            'schedule:' + state.windowKey + ':' + (state.used[state.windowKey] ?? 0),
            'browse',
            {},
          );
        this.service.store.write('schedule', complete(state, now));
      }
      if (c.listen.allDay || inWindow(c, now)) this.listeners.tick(now);
    }
    if (this.busy) return;
    const pending = this.service.queue.list().find((x) => x.state === 'pending');
    if (!pending || (!c.enabled && !pending.payload?.manual)) return;
    this.busy = true;
    const job = this.service.queue.claim();
    if (!job) {
      this.busy = false;
      return;
    }
    try {
      this.service.store.update('runtime', {}, (s) =>
        Object.assign(s, { state: 'running', jobId: job.id, error: null }),
      );
      const result = await this.session.run(job);
      this.service.queue.finish(job.id, 'done', result);
    } catch (e) {
      this.service.queue.finish(job.id, 'needs-review', errorMessage(e));
      this.error(e);
      await this.session.stop();
    } finally {
      this.busy = false;
      this.service.store.update('runtime', {}, (s) =>
        Object.assign(s, {
          state: this.stopped ? 'stopped' : 'idle',
          jobId: null,
        }),
      );
    }
  }
  async pause() {
    this.service.saveConfig({ ...this.service.config(), enabled: false });
    this.listeners.suspended = true;
    this.service.cancelTools();
    await this.session.stop();
  }
  async stop() {
    this.stopped = true;
    clearInterval(this.timer);
    this.listeners.stop();
    this.service.cancelTools();
    await this.session.stop();
    this.service.store.update('runtime', {}, (s) => Object.assign(s, { state: 'stopped' }));
    this.release?.();
    this.release = null;
  }
}
