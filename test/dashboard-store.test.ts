import { test, vi } from 'vite-plus/test';
import assert from 'node:assert/strict';
import type { AdminState } from '../packages/runtime/src/api.js';
import { defaults } from '../packages/runtime/src/config.js';
import {
  createDashboardStore,
  type DashboardClient,
} from '../apps/dashboard/src/lib/dashboard-store.js';
import { createSettingsStore } from '../apps/dashboard/src/lib/settings-store.js';

function snapshot(name: string): AdminState {
  return {
    config: { ...structuredClone(defaults), persona: { ...defaults.persona, name } },
  } as AdminState;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function client(state: () => Promise<AdminState>): DashboardClient {
  return { state } as DashboardClient;
}

test('管理页实例独立，旧轮询和卸载后响应不会覆盖新状态', async () => {
  const first = createDashboardStore(),
    second = createDashboardStore();
  const old = deferred<AdminState>();
  let reads = 0;
  first
    .getState()
    .connect(client(() => (++reads === 1 ? old.promise : Promise.resolve(snapshot('最新')))));
  const pending = first.getState().refresh();
  await first.getState().refresh();
  old.resolve(snapshot('过期'));
  await pending;
  assert.equal(first.getState().state?.config.persona.name, '最新');
  assert.equal(second.getState().state, null);
  const closing = deferred<AdminState>();
  first.getState().connect(client(() => closing.promise));
  const closingRefresh = first.getState().refresh();
  first.getState().disconnect();
  closing.resolve(snapshot('已经卸载'));
  await closingRefresh;
  assert.equal(first.getState().state, null);
  assert.equal(first.getState().client, null);
});

test('同一时刻只执行一次操作，MCP 推送使旧请求失效', async () => {
  const store = createDashboardStore();
  const old = deferred<AdminState>();
  store.getState().connect(client(() => old.promise));
  const pending = store.getState().refresh();
  store.getState().receive(snapshot('推送'));
  old.resolve(snapshot('过期请求'));
  await pending;
  assert.equal(store.getState().state?.config.persona.name, '推送');
  store.getState().connect(client(async () => snapshot('已保存')));
  const action = deferred<void>();
  let calls = 0;
  const saving = store.getState().perform(async () => {
    calls++;
    await action.promise;
  });
  assert.equal(
    await store.getState().perform(async () => {
      calls++;
    }),
    false,
  );
  assert.equal(calls, 1);
  action.resolve();
  assert.equal(await saving, true);
  assert.equal(store.getState().busy, false);
  store.getState().disconnect();
});

test('错误可恢复，卸载清除通知计时器', async () => {
  vi.useFakeTimers();
  try {
    const store = createDashboardStore();
    store.getState().connect(client(async () => snapshot('正常')));
    assert.equal(
      await store.getState().perform(async () => {
        throw Error('保存失败');
      }),
      false,
    );
    assert.equal(store.getState().error, '保存失败');
    assert.equal(store.getState().busy, false);
    assert.equal(await store.getState().perform(async () => {}, '已保存'), true);
    assert.equal(store.getState().error, '');
    assert.equal(store.getState().notice, '已保存');
    store.getState().disconnect();
    assert.equal(vi.getTimerCount(), 0);
  } finally {
    vi.useRealTimers();
  }
});

test('轮询不覆盖草稿，取消读取最新后台配置，保存失败保留输入', async () => {
  const dashboard = createDashboardStore();
  dashboard.getState().connect(
    client(async () => snapshot('后台')),
    snapshot('原始'),
  );
  const settings = createSettingsStore(dashboard);
  settings.getState().receive(snapshot('原始').config);
  settings.getState().setConfig(snapshot('正在输入').config);
  dashboard.getState().receive(snapshot('后台'));
  settings.getState().receive(snapshot('后台').config);
  assert.equal(settings.getState().config?.persona.name, '正在输入');
  settings.getState().reset();
  assert.equal(settings.getState().config?.persona.name, '后台');
  settings.getState().setConfig(snapshot('输入保留').config);
  await settings.getState().save();
  assert.equal(settings.getState().config?.persona.name, '输入保留');
  assert.notEqual(JSON.stringify(settings.getState().config), settings.getState().baseline);
  assert.ok(dashboard.getState().error);
  dashboard.getState().disconnect();
});

test('保存期间的新输入不会被已提交的草稿覆盖', async () => {
  const dashboard = createDashboardStore();
  const response = deferred<void>();
  const mock = {
    state: async () => snapshot('第一稿'),
    config: async () => response.promise,
  } as unknown as DashboardClient;
  dashboard.getState().connect(mock, snapshot('原始'));
  const settings = createSettingsStore(dashboard);
  settings.getState().receive(snapshot('原始').config);
  settings.getState().setConfig(snapshot('第一稿').config);
  const saving = settings.getState().save();
  settings.getState().setConfig(snapshot('继续编辑').config);
  response.resolve();
  await saving;
  assert.equal(settings.getState().config?.persona.name, '继续编辑');
  assert.equal(JSON.parse(settings.getState().baseline).persona.name, '第一稿');
  dashboard.getState().disconnect();
});
