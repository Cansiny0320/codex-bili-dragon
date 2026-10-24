import type { RpcConnection } from '../packages/runtime/src/codex.js';
import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { EventEmitter } from 'node:events';
import { CodexSession } from '../packages/runtime/src/codex.js';
import { Store } from '../packages/runtime/src/store.js';
import { DragonService } from '../packages/runtime/src/service.js';
class Fake extends EventEmitter {
  calls: { method: string; params: Record<string, unknown> }[] = [];
  writes: unknown[] = [];
  closed = false;
  constructor() {
    super();
    this.calls = [];
    this.writes = [];
    this.closed = false;
  }
  async request(method: string, params: Record<string, unknown>) {
    this.calls.push({ method, params });
    if (method === 'account/read') return { account: { type: 'chatgpt' } };
    if (method === 'config/read')
      return {
        config: { mcp_servers: { unrelated: { command: 'anything' } } },
      };
    if (method === 'thread/start') return { thread: { id: 'thread-1' } };
    if (method === 'thread/resume')
      return { thread: { id: params.threadId, status: { type: 'idle' } } };
    if (method === 'turn/start') {
      this.emit('message', {
        id: 80,
        method: 'item/tool/call',
        params: { threadId: 'thread-1', tool: 'dragon_status', arguments: {} },
      });
      this.emit('message', {
        method: 'turn/completed',
        params: { turn: { id: 'turn-1', status: 'completed' } },
      });
      return { turn: { id: 'turn-1' } };
    }
    return {};
  }
  write(m: unknown) {
    this.writes.push(m);
  }
  close() {
    this.closed = true;
  }
}
test('连接尚未建立时暂停，不会在暂停后继续创建回合', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-cancel-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  const service = new DragonService(new Store(dir)),
    rpc = new Fake();
  let connected!: (rpc: RpcConnection) => void;
  const session = new CodexSession(
    service,
    () =>
      new Promise<RpcConnection>((resolve) => {
        connected = resolve;
      }),
  );
  service.saveConfig({ ...service.config(), codexPath: 'fake-codex' });
  const run = session.run({ id: 'cancel', type: 'browse', payload: {} });
  await session.stop();
  connected(rpc);
  await assert.rejects(run, /暂停|停止/);
  assert.ok(!rpc.calls.some((x) => x.method === 'turn/start'));
  assert.equal(rpc.closed, true);
});
test('动态工具注册、禁用宿主 MCP；提前到达的完成事件不丢失；复用专属会话', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-codex-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  const service = new DragonService(new Store(dir)),
    rpc = new Fake(),
    session = new CodexSession(service, async () => rpc);
  service.saveConfig({ ...service.config(), codexPath: 'fake-codex' });
  const result = await session.run({
    id: 'job-1',
    type: 'browse',
    payload: {},
  });
  assert.equal(result.status, 'completed');
  const start = rpc.calls.find((x) => x.method === 'thread/start')!.params as {
    config: Record<string, unknown>;
    dynamicTools: { type: string; name: string }[];
  };
  assert.equal(start.config['mcp_servers.unrelated.enabled'], false);
  assert.equal(start.config['features.shell_tool'], false);
  assert.ok(start.dynamicTools.every((x) => x.type === 'function'));
  assert.ok(!start.dynamicTools.some((x) => /approve/.test(x.name)));
  assert.equal((rpc.writes[0] as { result: { success: boolean } }).result.success, true);
  await session.stop();
  const rpc2 = new Fake(),
    session2 = new CodexSession(service, async () => rpc2);
  await session2.run({
    id: 'job-2',
    type: 'message',
    payload: { eventId: 'c1' },
  });
  assert.ok(rpc2.calls.some((x) => x.method === 'thread/resume'));
  await session2.stop();
});
