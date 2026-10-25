import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Store } from '../packages/runtime/src/store.js';
import { validateConfig, defaults } from '../packages/runtime/src/config.js';
test('corrupt state fails closed and atomic updates retain data', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bili-dragon-test-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  const s = new Store(dir);
  s.update('counter', { n: 0 }, (d) => {
    d.n++;
  });
  assert.equal(s.read<{ n: number }>('counter').n, 1);
  fs.writeFileSync(path.join(dir, 'counter.json'), '{broken');
  assert.throws(() => s.read('counter', {}), /损坏/);
  assert.throws(() => s.read('../escape'), /路径/);
});
test('默认只启用私信权限，保留明确关闭；拒绝无效时区和未知配置', () => {
  const c = validateConfig({});
  assert.equal(c.enabled, false);
  assert.deepEqual(c.permissions, { comments: false, dm: true, live: false, favorites: false });
  assert.equal(validateConfig({ permissions: { dm: false } }).permissions.dm, false);
  assert.throws(() => validateConfig({ timezone: 'made/up' }));
  assert.throws(() =>
    validateConfig({
      night: { windows: [{ start: '25:01', end: '24:00', wakes: 1 }] },
    }),
  );
  assert.throws(() => validateConfig({ permissions: { shell: true } }));
  assert.equal(defaults.persona.name, '小白龙');
});
