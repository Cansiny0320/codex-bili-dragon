import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AdminState } from '@bili-dragon/runtime/api';
import type { Config } from '@bili-dragon/runtime/config';
import { createClient } from './client';

type Client = ReturnType<typeof createClient>;
interface DashboardContext {
  state: AdminState | null;
  client: Client | null;
  loading: boolean;
  busy: boolean;
  error: string;
  notice: string;
  refresh: () => Promise<void>;
  perform: (action: (client: Client) => Promise<unknown>, success?: string) => Promise<boolean>;
  clearError: () => void;
}
const Context = createContext<DashboardContext | null>(null);
export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (window.dragonApp) {
      setClient(() => window.dragonApp!.client);
      if (window.dragonApp.initialState) {
        setState(window.dragonApp.initialState);
        setLoading(false);
      }
      const receive = (event: Event) => {
        setState((event as CustomEvent<AdminState>).detail);
        setLoading(false);
      };
      window.addEventListener('dragon-state', receive);
      return () => {
        window.removeEventListener('dragon-state', receive);
        if (timer.current) clearTimeout(timer.current);
      };
    }
    const fragment = window.location.hash.slice(1);
    if (fragment && /^[\w-]{40,}$/.test(fragment)) {
      sessionStorage.setItem('dragon-session', fragment);
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    const token = sessionStorage.getItem('dragon-session');
    // oRPC clients are callable proxies; wrap them so React stores the client.
    if (token) setClient(() => createClient(token));
    else {
      setLoading(false);
      setError('请用后台启动时显示的完整链接打开管理页。');
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  async function refresh() {
    if (!client) return;
    try {
      setState(await client.state());
    } catch (e) {
      setError(e instanceof Error ? e.message : '无法连接本机后台');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!client) return;
    let active = true;
    const poll = async () => {
      try {
        const next = await client.state();
        if (active) setState(next);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : '无法连接后台');
      } finally {
        if (active) setLoading(false);
      }
    };
    void poll();
    const interval = setInterval(() => void poll(), 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [client]);
  async function perform(action: (client: Client) => Promise<unknown>, success = '') {
    if (!client || busy) return false;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action(client);
      await refresh();
      setNotice(success);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setNotice(''), 3500);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <Context.Provider
      value={{
        state,
        client,
        loading,
        busy,
        error,
        notice,
        refresh,
        perform,
        clearError: () => setError(''),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useDashboard() {
  const context = useContext(Context);
  if (!context) throw Error('缺少管理页上下文');
  return context;
}
export function useSettings() {
  const { state, perform, busy } = useDashboard();
  const [config, setConfig] = useState<Config | null>(null);
  const [baseline, setBaseline] = useState('');
  useEffect(() => {
    if (
      state &&
      (!config || JSON.stringify(config) === baseline) &&
      JSON.stringify(state.config) !== baseline
    ) {
      setConfig(structuredClone(state.config));
      setBaseline(JSON.stringify(state.config));
    }
  }, [state, config, baseline]);
  const dirty = !!config && JSON.stringify(config) !== baseline;
  async function save() {
    if (config && (await perform((c) => c.config(config), '已保存')))
      setBaseline(JSON.stringify(config));
  }
  function reset() {
    if (state) {
      setConfig(structuredClone(state.config));
      setBaseline(JSON.stringify(state.config));
    }
  }
  return { config, setConfig, dirty, busy, save, reset };
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
