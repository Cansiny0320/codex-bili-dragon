import { createStore } from 'zustand/vanilla';
import type { Config } from '@bili-dragon/runtime/config';
import type { DashboardStore } from './dashboard-store';

interface SettingsState {
  config: Config | null;
  baseline: string;
  setConfig: (next: Config | null | ((current: Config | null) => Config | null)) => void;
  receive: (config: Config) => void;
  save: () => Promise<void>;
  reset: () => void;
}
export function createSettingsStore(dashboard: DashboardStore) {
  return createStore<SettingsState>()((set, get) => ({
    config: null,
    baseline: '',
    setConfig: (next) => set({ config: typeof next === 'function' ? next(get().config) : next }),
    receive(config) {
      const current = get();
      const baseline = JSON.stringify(config);
      if (
        (!current.config || JSON.stringify(current.config) === current.baseline) &&
        baseline !== current.baseline
      )
        set({ config: structuredClone(config), baseline });
    },
    async save() {
      const config = get().config;
      if (!config) return;
      const submitted = structuredClone(config);
      if (await dashboard.getState().perform((client) => client.config(submitted), '已保存'))
        set({ baseline: JSON.stringify(submitted) });
    },
    reset() {
      const config = dashboard.getState().state?.config;
      if (config) set({ config: structuredClone(config), baseline: JSON.stringify(config) });
    },
  }));
}
