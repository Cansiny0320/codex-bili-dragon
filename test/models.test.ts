import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import {
  readModelCatalog,
  resolveModelSelection,
  ModelCatalogCache,
} from '../packages/runtime/src/models.js';

const model = (name: string, efforts = ['low', 'high']) => ({
  id: name,
  model: name,
  displayName: name.toUpperCase(),
  hidden: false,
  isDefault: name === 'catalog-default',
  defaultReasoningEffort: 'low',
  supportedReasoningEfforts: efforts.map((reasoningEffort) => ({
    reasoningEffort,
    description: reasoningEffort,
  })),
});

test('模型目录读取全部分页，并优先使用实际配置的默认模型和深度', async () => {
  const calls: { method: string; params: Record<string, unknown> }[] = [];
  const catalog = await readModelCatalog(
    {
      async request(method, params) {
        calls.push({ method, params });
        if (method === 'config/read')
          return { config: { model: 'configured', model_reasoning_effort: 'high' } };
        return params.cursor
          ? { data: [model('configured')], nextCursor: null }
          : { data: [model('catalog-default')], nextCursor: 'page-2' };
      },
    },
    '/workspace',
  );
  assert.equal(catalog.models.length, 2);
  assert.equal(catalog.defaultModel, 'configured');
  assert.equal(catalog.defaultReasoningEffort, 'high');
  assert.equal(calls[0].params.cwd, '/workspace');
  assert.deepEqual(resolveModelSelection(catalog, { model: '', reasoningEffort: '' }), {
    model: 'configured',
    effort: 'high',
  });
  assert.deepEqual(
    resolveModelSelection(catalog, { model: 'catalog-default', reasoningEffort: '' }),
    { model: 'catalog-default', effort: 'low' },
  );
  assert.throws(
    () => resolveModelSelection(catalog, { model: 'missing', reasoningEffort: '' }),
    /不可用/,
  );
  assert.throws(
    () => resolveModelSelection(catalog, { model: 'configured', reasoningEffort: 'ultra' }),
    /不支持/,
  );
});

test('没有显式 Codex 默认配置时采用目录默认；不把第一个模型假定为默认', async () => {
  const catalog = await readModelCatalog(
    {
      async request(method) {
        return method === 'config/read'
          ? { config: { model: null, model_reasoning_effort: null } }
          : { data: [model('other'), model('catalog-default')], nextCursor: null };
      },
    },
    '/workspace',
  );
  assert.deepEqual(resolveModelSelection(catalog, { model: '', reasoningEffort: '' }), {
    model: 'catalog-default',
    effort: 'low',
  });
});

test('重复分页游标明确失败，目录失败不产生伪造模型', async () => {
  await assert.rejects(
    readModelCatalog(
      {
        async request(method) {
          return method === 'config/read'
            ? { config: {} }
            : { data: [model('catalog-default')], nextCursor: 'same' };
        },
      },
      '/workspace',
    ),
    /游标/,
  );
  await assert.rejects(
    readModelCatalog(
      {
        request: async () => {
          throw Error('离线');
        },
      },
      '/workspace',
    ),
    /离线/,
  );
});

test('模型目录缓存合并并发请求，切换路径、到期和失败后会重新读取', async () => {
  const cache = new ModelCatalogCache(100);
  const value = {
    models: [model('catalog-default')],
    defaultModel: 'catalog-default',
    defaultReasoningEffort: 'low',
  };
  let calls = 0;
  const load = async () => {
    calls++;
    return value;
  };
  await Promise.all([cache.get('a', load, 0), cache.get('a', load, 0)]);
  await cache.get('a', load, 99);
  assert.equal(calls, 1);
  await cache.get('a', load, 100);
  await cache.get('b', load, 100);
  assert.equal(calls, 3);
  await assert.rejects(
    cache.get(
      'c',
      async () => {
        throw Error('离线');
      },
      100,
    ),
    /离线/,
  );
  await cache.get('c', load, 101);
  assert.equal(calls, 4);
});
