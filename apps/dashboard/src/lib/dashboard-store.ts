import { createStore } from 'zustand/vanilla';
import type { AdminState } from '@bili-dragon/runtime/api';
import type { createClient } from './client';

export type DashboardClient = ReturnType<typeof createClient>;
export interface DashboardState {
  state: AdminState | null;
  client: DashboardClient | null;
  loading: boolean;
  busy: boolean;
  error: string;
  notice: string;
  connect: (client: DashboardClient, initialState?: AdminState) => void;
  disconnect: () => void;
  receive: (state: AdminState) => void;
  refresh: () => Promise<void>;
  perform: (
    action: (client: DashboardClient) => Promise<unknown>,
    success?: string,
  ) => Promise<boolean>;
  clearError: () => void;
}

export function createDashboardStore() {
  let generation = 0;
  let request = 0;
  let noticeTimer: ReturnType<typeof setTimeout> | undefined;
  const clearNoticeTimer = () => {
    if (noticeTimer) clearTimeout(noticeTimer);
    noticeTimer = undefined;
  };
  return createStore<DashboardState>()((set, get) => ({
    state: null,
    client: null,
    loading: true,
    busy: false,
    error: '',
    notice: '',
    connect(client, initialState) {
      generation++;
      request++;
      clearNoticeTimer();
      set({
        client,
        state: initialState ?? null,
        loading: !initialState,
        busy: false,
        error: '',
        notice: '',
      });
    },
    disconnect() {
      generation++;
      request++;
      clearNoticeTimer();
      set({ client: null, state: null, busy: false, notice: '' });
    },
    receive(state) {
      request++;
      set({ state, loading: false });
    },
    async refresh() {
      const client = get().client;
      if (!client) return;
      const currentGeneration = generation,
        currentRequest = ++request;
      const current = () => generation === currentGeneration && request === currentRequest;
      try {
        const state = await client.state();
        if (current()) set({ state });
      } catch (error) {
        if (current()) set({ error: error instanceof Error ? error.message : '无法连接本机后台' });
      } finally {
        if (current()) set({ loading: false });
      }
    },
    async perform(action, success = '') {
      const { client, busy } = get();
      if (!client || busy) return false;
      const currentGeneration = generation;
      request++;
      clearNoticeTimer();
      set({ busy: true, error: '', notice: '' });
      try {
        await action(client);
        if (generation !== currentGeneration) return false;
        await get().refresh();
        if (generation !== currentGeneration) return false;
        set({ notice: success });
        if (success) noticeTimer = setTimeout(() => set({ notice: '' }), 3500);
        return true;
      } catch (error) {
        if (generation === currentGeneration)
          set({ error: error instanceof Error ? error.message : '操作失败' });
        return false;
      } finally {
        if (generation === currentGeneration) set({ busy: false });
      }
    },
    clearError: () => set({ error: '' }),
  }));
}
export type DashboardStore = ReturnType<typeof createDashboardStore>;
