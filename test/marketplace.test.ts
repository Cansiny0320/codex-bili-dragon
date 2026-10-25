import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { prepareMarketplace } from '../scripts/marketplace.js';

test('市场只包含已校验的预构建文件，额外凭据不会被发布，更新清除旧文件', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-marketplace-'));
  try {
    const source = path.join(dir, 'package'),
      output = path.join(dir, 'marketplace');
    const contents: Record<string, string> = {
      'plugin.json': '{"name":"codex-bili-dragon","version":"0.7.0"}',
      'mcp.json': '{}',
      'dist/runtime/mcp.js': '// built server',
      'dist/mcp-app/index.html': '<html>built UI</html>',
    };
    for (const [name, text] of Object.entries(contents)) {
      fs.mkdirSync(path.dirname(path.join(source, name)), { recursive: true });
      fs.writeFileSync(path.join(source, name), text);
    }
    fs.writeFileSync(
      path.join(source, 'bundle.json'),
      JSON.stringify({
        version: '0.7.0',
        files: Object.fromEntries(
          Object.entries(contents).map(([name, text]) => [
            name,
            createHash('sha256').update(text).digest('hex'),
          ]),
        ),
      }),
    );
    fs.writeFileSync(path.join(source, 'credentials.json'), 'must not publish');
    const result = prepareMarketplace(source, output);
    const catalog = JSON.parse(
      fs.readFileSync(path.join(output, '.agents/plugins/marketplace.json'), 'utf8'),
    );
    assert.equal(catalog.name, 'bili-dragon');
    assert.equal(catalog.plugins[0].source.path, './plugins/codex-bili-dragon');
    assert.equal(result.version, '0.7.0');
    const installed = path.join(output, catalog.plugins[0].source.path);
    assert.ok(fs.existsSync(path.join(installed, 'dist/runtime/mcp.js')));
    assert.equal(fs.existsSync(path.join(installed, 'credentials.json')), false);
    fs.writeFileSync(path.join(installed, 'old-build.js'), 'old');
    prepareMarketplace(source, output);
    assert.equal(fs.existsSync(path.join(installed, 'old-build.js')), false);
    fs.writeFileSync(path.join(source, 'dist/runtime/mcp.js'), 'tampered');
    assert.throws(() => prepareMarketplace(source, output), /校验失败/);
    assert.equal(
      fs.readFileSync(path.join(installed, 'dist/runtime/mcp.js'), 'utf8'),
      '// built server',
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
