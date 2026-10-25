import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import { defaults, validateConfig } from '../packages/runtime/src/config.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DragonService } from '../packages/runtime/src/service.js';
import { Store } from '../packages/runtime/src/store.js';
import { modelFixture } from '../scripts/model-fixture.js';

test('新配置不预设兴趣，开启分享、私信监听和更新，但不唤醒活动', () => {
  assert.deepEqual(defaults.preferences, { like: [], dislike: [] });
  assert.doesNotMatch(defaults.persona.body, /技术、小制作、讲清楚的冷知识/);
  assert.equal(defaults.share.enabled, true);
  assert.equal(defaults.share.via, 'dm');
  assert.equal(defaults.listen.dm, true);
  assert.equal(defaults.updates.enabled, true);
  assert.equal(defaults.enabled, false);
  assert.equal(defaults.model, '');
  assert.equal(defaults.reasoningEffort, '');
});

test('模型配置拒绝不支持的组合；保存可用模型不打断当前任务，离线仍可恢复默认', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-settings-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  const service = new DragonService(new Store(dir));
  service.models = async () => modelFixture;
  service.saveConfig({ ...service.config(), enabled: true });
  let pauses = 0;
  const pause = async () => {
    pauses++;
  };
  await assert.rejects(
    service.configure(
      { ...service.config(), model: 'fixture-fast', reasoningEffort: 'high' },
      pause,
    ),
    /不支持/,
  );
  assert.equal(service.config().model, '');
  await service.configure(
    { ...service.config(), model: 'fixture-thinking', reasoningEffort: 'high' },
    pause,
  );
  assert.equal(service.config().model, 'fixture-thinking');
  assert.equal(service.config().enabled, true);
  assert.equal(pauses, 0);
  service.models = async () => {
    throw Error('离线');
  };
  await service.configure({ ...service.config(), model: '', reasoningEffort: '' }, pause);
  assert.equal(service.config().model, '');
  assert.equal(service.config().reasoningEffort, '');
  assert.equal(pauses, 0);
});

test('已保存的自定义兴趣、人设与显式关闭值保持不变', () => {
  const config = validateConfig({
    preferences: { like: ['木工'], dislike: ['剧透'] },
    persona: { body: '喜欢学习木工，先看实际过程。' },
    share: { enabled: false },
    listen: { dm: false },
    updates: { enabled: false },
    model: 'custom-model',
  });
  assert.deepEqual(config.preferences, { like: ['木工'], dislike: ['剧透'] });
  assert.equal(config.persona.body, '喜欢学习木工，先看实际过程。');
  assert.equal(config.share.enabled, false);
  assert.equal(config.listen.dm, false);
  assert.equal(config.updates.enabled, false);
  assert.equal(config.model, 'custom-model');
  assert.equal(config.reasoningEffort, '');
});

test('分享配置接受旧上下限之外的数值，次数和天数仍需有效非负整数', () => {
  const config = validateConfig({
    share: { minScore: -1, silentAfterDays: 90 },
    quota: { shareDaily: 50 },
  });
  assert.equal(config.share.minScore, -1);
  assert.equal(config.share.silentAfterDays, 90);
  assert.equal(config.quota.shareDaily, 50);
  assert.equal(validateConfig({ share: { minScore: 25, silentAfterDays: 0 } }).share.minScore, 25);
  for (const shareDaily of [-1, 1.5, Infinity, NaN])
    assert.throws(() => validateConfig({ quota: { shareDaily } }));
  for (const silentAfterDays of [-1, 1.5, Infinity, NaN])
    assert.throws(() => validateConfig({ share: { silentAfterDays } }));
  for (const minScore of [Infinity, NaN])
    assert.throws(() => validateConfig({ share: { minScore } }));
});
