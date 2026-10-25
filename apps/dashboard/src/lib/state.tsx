import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { AdminState } from '@bili-dragon/runtime/api';
import { createClient } from './client';
import { createDashboardStore, type DashboardStore, type DashboardState } from './dashboard-store';
import { createSettingsStore } from './settings-store';

const Context = createContext<DashboardStore | null>(null);
export function DashboardProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createDashboardStore);
  useEffect(() => {
    const app = window.dragonApp;
    const receive = (event: Event) =>
      store.getState().receive((event as CustomEvent<AdminState>).detail);
    if (app) {
      store.getState().connect(app.client, app.initialState);
      window.addEventListener('dragon-state', receive);
    } else {
      const fragment = window.location.hash.slice(1);
      if (fragment && /^[\w-]{40,}$/.test(fragment)) {
        sessionStorage.setItem('dragon-session', fragment);
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      const token = sessionStorage.getItem('dragon-session');
      if (token) store.getState().connect(createClient(token));
      else store.setState({ loading: false, error: '请用后台启动时显示的完整链接打开管理页。' });
    }
    const poll = () => {
      if (!store.getState().busy) void store.getState().refresh();
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('dragon-state', receive);
      store.getState().disconnect();
    };
  }, [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
function useDashboardStore() {
  const store = useContext(Context);
  if (!store) throw Error('缺少管理页上下文');
  return store;
}
export function useDashboard<T>(selector: (state: DashboardState) => T) {
  return useStore(useDashboardStore(), useShallow(selector));
}
export function useSettings() {
  const dashboard = useDashboardStore();
  const remoteConfig = useDashboard((s) => s.state?.config);
  const busy = useDashboard((s) => s.busy);
  const [store] = useState(() => createSettingsStore(dashboard));
  const { config, baseline, setConfig, save, reset } = useStore(store);
  useEffect(() => {
    if (remoteConfig) store.getState().receive(remoteConfig);
  }, [remoteConfig, store]);
  return {
    config,
    setConfig,
    dirty: !!config && JSON.stringify(config) !== baseline,
    busy,
    save,
    reset,
  };
}
export function formatTime(value?: string) {
  return value
    ? new Date(value).toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
}
export function videosFrom(state: AdminState) {
  return Object.entries(state.evidence)
    .map(([bvid, e]) => ({
      ...e,
      bvid,
      title: e.title || state.diaries.find((d) => d.bvid === bvid)?.title || bvid,
    }))
    .sort((a, b) => b.at.localeCompare(a.at));
}
export type Video = ReturnType<typeof videosFrom>[number];
