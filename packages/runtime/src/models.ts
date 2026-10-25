import { z } from 'zod';
import type { RpcConnection } from './codex.js';

const modelSchema = z.object({
  id: z.string(),
  model: z.string().min(1),
  displayName: z.string(),
  hidden: z.boolean(),
  isDefault: z.boolean(),
  defaultReasoningEffort: z.string(),
  supportedReasoningEfforts: z.array(
    z.object({
      reasoningEffort: z.string(),
      description: z.string(),
    }),
  ),
});
const modelPage = z.object({ data: z.array(modelSchema), nextCursor: z.string().nullish() });
const modelDefaults = z.object({
  model: z.string().nullish(),
  model_reasoning_effort: z.string().nullish(),
});
export interface ModelCatalog {
  models: z.infer<typeof modelSchema>[];
  defaultModel: string;
  defaultReasoningEffort: string;
}

export async function readModelCatalog(
  rpc: Pick<RpcConnection, 'request'>,
  cwd: string,
  loadedConfig?: z.infer<typeof modelDefaults>,
): Promise<ModelCatalog> {
  const config =
    loadedConfig ??
    z
      .object({ config: modelDefaults })
      .parse(await rpc.request('config/read', { includeLayers: false, cwd })).config;
  const models: ModelCatalog['models'] = [];
  const cursors = new Set<string>();
  let cursor: string | null | undefined;
  do {
    const page = modelPage.parse(
      await rpc.request('model/list', {
        limit: 100,
        includeHidden: true,
        ...(cursor ? { cursor } : {}),
      }),
    );
    models.push(...page.data);
    cursor = page.nextCursor;
    if (cursor) {
      if (cursors.has(cursor)) throw Error('Codex 模型目录返回重复分页游标');
      cursors.add(cursor);
    }
  } while (cursor);
  const defaultModel = config.model || models.find((model) => model.isDefault)?.model || '';
  const entry = models.find((model) => model.model === defaultModel);
  return {
    models,
    defaultModel,
    defaultReasoningEffort: config.model_reasoning_effort || entry?.defaultReasoningEffort || '',
  };
}

export function resolveModelSelection(
  catalog: ModelCatalog,
  selection: { model: string; reasoningEffort: string },
) {
  const model = selection.model || catalog.defaultModel;
  const entry = catalog.models.find((item) => item.model === model);
  if (!entry) throw Error('所选 Codex 模型不可用：' + (model || '默认模型'));
  const effort =
    selection.reasoningEffort ||
    (model === catalog.defaultModel
      ? catalog.defaultReasoningEffort
      : entry.defaultReasoningEffort);
  if (effort && !entry.supportedReasoningEfforts.some((item) => item.reasoningEffort === effort))
    throw Error(`模型 ${model} 不支持思考深度 ${effort}，请重新选择。`);
  return { model, effort };
}

export class ModelCatalogCache {
  private entries = new Map<string, { expires: number; pending: Promise<ModelCatalog> }>();
  constructor(private ttl = 5 * 60 * 1000) {}
  get(key: string, load: () => Promise<ModelCatalog>, now = Date.now()) {
    const existing = this.entries.get(key);
    if (existing && existing.expires > now) return existing.pending;
    const pending = load().catch((error: unknown) => {
      if (this.entries.get(key)?.pending === pending) this.entries.delete(key);
      throw error;
    });
    this.entries.set(key, { expires: now + this.ttl, pending });
    return pending;
  }
}
