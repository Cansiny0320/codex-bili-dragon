import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const walk = (dir: string): string[] =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.name !== 'node_modules' && e.name !== '.tanstack')
    .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const files = walk(path.join(root, 'vendor/upstream/tools')).filter((f) => f.endsWith('.mjs'));
for (const file of files) {
  execFileSync(process.execPath, ['--check', file], { windowsHide: true, stdio: 'pipe' });
  assert.ok(
    !/process\.env\.(HOME|USERPROFILE|DSH_HOME|BILI_WHALE_CONFIG)|\bos\d?\.homedir\(/.test(
      fs.readFileSync(file, 'utf8'),
    ),
    '未隔离的上游路径：' + path.relative(root, file),
  );
}
const json = (file: string) =>
  JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')) as Record<string, unknown>;
const plugin = json('plugin.json'),
  overlay = json('.codex-plugin/plugin.json'),
  pkg = json('package.json');
assert.equal(plugin.name, 'codex-bili-dragon');
assert.equal(plugin.version, pkg.version);
assert.equal(overlay.version, pkg.version);
const mcp = json('mcp.json') as { mcpServers: Record<string, { args: string[] }> };
assert.equal(mcp.mcpServers['codex-bili-dragon'].args[0], '${PLUGIN_ROOT}/dist/runtime/mcp.js');
for (const dir of ['packages', 'apps', 'scripts', 'test'])
  assert.ok(
    !walk(path.join(root, dir)).some((f) => !f.includes('node_modules') && /\.(mjs|js)$/.test(f)),
    '自有源码须使用 TypeScript',
  );
console.log('插件入口、第三方语法与数据路径隔离检查通过。');
