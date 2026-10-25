import { useEffect, useState } from 'react';
import type { Config } from '@bili-dragon/runtime/config';
import type { DashboardClient } from '../lib/dashboard-store';
import { useDashboard } from '../lib/state';
import { Field } from './common';
import { NativeSelect, NativeSelectOption } from './ui/native-select';
import { Button } from './ui/button';

type Catalog = Awaited<ReturnType<DashboardClient['models']>>;
const effortLabels: Record<string, string> = {
  none: '不思考',
  minimal: '极低',
  low: '低',
  medium: '中',
  high: '高',
  xhigh: '更高',
  max: '最高',
  ultra: 'Ultra',
};
export function ModelSettings({
  config,
  setConfig,
}: {
  config: Config;
  setConfig: (config: Config) => void;
}) {
  const client = useDashboard((s) => s.client);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let current = true;
    setCatalog(null);
    setError('');
    if (client)
      void client
        .models()
        .then((value) => {
          if (current) setCatalog(value);
        })
        .catch((reason: unknown) => {
          if (current) setError(reason instanceof Error ? reason.message : '无法读取可用模型');
        });
    return () => {
      current = false;
    };
  }, [client, config.codexPath, retry]);
  const selected = catalog?.models.find(
    (item) => item.model === (config.model || catalog.defaultModel),
  );
  const defaultModel = catalog?.models.find((item) => item.model === catalog.defaultModel);
  const efforts = selected?.supportedReasoningEfforts ?? [];
  const defaultEffort =
    selected?.model === catalog?.defaultModel
      ? catalog?.defaultReasoningEffort
      : selected?.defaultReasoningEffort;
  return (
    <section className="settings-section model-settings">
      <h2>模型与思考深度</h2>
      <div className="form-columns">
        <Field label="模型">
          <NativeSelect
            aria-label="模型"
            value={config.model}
            onChange={(event) =>
              setConfig({ ...config, model: event.target.value, reasoningEffort: '' })
            }
          >
            <NativeSelectOption value="">
              跟随 Codex 默认{defaultModel ? `（${defaultModel.displayName}）` : ''}
            </NativeSelectOption>
            {config.model &&
              !catalog?.models.some((item) => item.model === config.model && !item.hidden) && (
                <NativeSelectOption value={config.model}>
                  {config.model}（已保存）
                </NativeSelectOption>
              )}
            {catalog?.models
              .filter((item) => !item.hidden)
              .map((item) => (
                <NativeSelectOption key={item.id} value={item.model}>
                  {item.displayName}
                </NativeSelectOption>
              ))}
          </NativeSelect>
        </Field>
        <Field label="思考深度">
          <NativeSelect
            aria-label="思考深度"
            value={config.reasoningEffort}
            onChange={(event) => setConfig({ ...config, reasoningEffort: event.target.value })}
          >
            <NativeSelectOption value="">
              默认{defaultEffort ? `（${effortLabels[defaultEffort] ?? defaultEffort}）` : ''}
            </NativeSelectOption>
            {config.reasoningEffort &&
              !efforts.some((item) => item.reasoningEffort === config.reasoningEffort) && (
                <NativeSelectOption value={config.reasoningEffort}>
                  {config.reasoningEffort}（已保存）
                </NativeSelectOption>
              )}
            {efforts.map((item) => (
              <NativeSelectOption key={item.reasoningEffort} value={item.reasoningEffort}>
                {effortLabels[item.reasoningEffort] ?? item.reasoningEffort}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </div>
      {error ? (
        <div className="error-text">
          {error}{' '}
          <Button variant="ghost" onClick={() => setRetry((value) => value + 1)}>
            重试
          </Button>
        </div>
      ) : (
        !catalog && <p className="muted">正在读取可用模型…</p>
      )}
    </section>
  );
}
