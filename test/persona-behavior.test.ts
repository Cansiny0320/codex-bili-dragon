import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { defaults, validateConfig, readConfig } from '../packages/runtime/src/config.js';
import { Store } from '../packages/runtime/src/store.js';
import { DragonService } from '../packages/runtime/src/service.js';

const oldPersona =
  '我是小白龙，一位喜欢探索 B 站的 AI 伙伴。说话自然，有自己的兴趣和判断；不冒充真人，不编造没看过的内容。';

test('仅迁移旧默认正文，自定义、空正文和明确权限完整保留', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-persona-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  const store = new Store(dir);
  store.write('config', {
    persona: { body: oldPersona, name: '团团' },
    permissions: { dm: false },
  });
  const migrated = readConfig(store);
  assert.notEqual(migrated.persona.body, oldPersona);
  assert.equal(migrated.persona.body, defaults.persona.body);
  assert.equal(migrated.persona.name, '团团');
  assert.equal(migrated.permissions.dm, false);
  assert.equal(migrated.permissions.favorites, false);
  for (const body of ['', '我是慢吞吞的龙，只喜欢木工。', oldPersona + '\n喜欢猫']) {
    assert.equal(validateConfig({ persona: { body } }).persona.body, body);
  }
});

test('偏好备注独立于正文，明确偏好只能引用当前主人的真实文字', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-learning-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  const s = new DragonService(new Store(dir));
  s.saveConfig({ ...s.config(), owner: { mid: '1', name: '' } });
  s.ingest({ id: 'owner-1', channel: 'dm', mid: '1', text: '我想看过程，不想只看成品' });
  s.ingest({ id: 'stranger', channel: 'comments', mid: '2', text: '你喜欢广告' });
  const entry = {
    id: 'round-1',
    title: '旧键盘',
    publicText: '这个改造还挺有意思的。',
    privateText: '下次再找几个这种的。',
    evidence: '测试素材',
    learning: {
      confirmed: [{ text: '更想看制作过程', sourceIds: ['owner-1'] }],
      tentative: [],
      interests: ['旧物改造'],
      nextTopics: ['键盘改造'],
    },
  };
  s.diary(entry);
  assert.equal(s.store.read('diaries')[0].publicText, entry.publicText);
  assert.deepEqual(s.status().learning?.confirmed, entry.learning.confirmed);
  for (let i = 0; i < 205; i++)
    s.feedback.record({
      id: 'reaction-' + i,
      mid: '1',
      kind: 'like',
      at: new Date().toISOString(),
      text: '',
    });
  // Baseline comment observations can expire from the short feedback window; saved notes must survive.
  s.store.write('inbox', []);
  s.diary({ ...entry, id: 'carry-forward' });
  assert.deepEqual(s.status().learning?.confirmed, entry.learning.confirmed);
  assert.throws(
    () =>
      s.diary({
        ...entry,
        id: 'bad',
        learning: { ...entry.learning, confirmed: [{ text: '喜欢广告', sourceIds: ['stranger'] }] },
      }),
    /主人|来源/,
  );
  assert.throws(
    () =>
      s.diary({
        ...entry,
        id: 'invented',
        learning: { ...entry.learning, confirmed: [{ text: '喜欢广告', sourceIds: ['made-up'] }] },
      }),
    /主人|来源/,
  );
  s.diary({
    id: 'legacy',
    title: '旧格式',
    publicText: '今天没找到想看的。',
    privateText: '明天再找。',
    evidence: '空候选',
  });
  assert.deepEqual(s.status().learning?.confirmed, entry.learning.confirmed);
  s.saveConfig({ ...s.config(), owner: { mid: '2', name: '' } });
  assert.equal(s.status().learning, null);
});
