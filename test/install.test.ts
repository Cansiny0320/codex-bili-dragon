import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { installPlugin } from '../packages/runtime/src/install';

test('安装器校验包、注册原生插件并固定运行时，重复安装保留其他条目与数据', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-install-'));
  try {
    const source = path.join(directory, 'package'),
      destination = path.join(directory, 'source');
    const entries: Record<string, string> = {
      'plugin.json': '{"name":"codex-bili-dragon","version":"0.3.0"}',
      'mcp.json':
        '{"mcpServers":{"codex-bili-dragon":{"command":"node","args":["${PLUGIN_ROOT}/dist/runtime/mcp.js"]}}}',
      'dist/runtime/mcp.js': '',
      'dist/runtime/worker.js': '',
      'dist/mcp-app/index.html': '<html></html>',
      'assets/icon.png': 'test-image',
    };
    for (const [file, contents] of Object.entries(entries)) {
      fs.mkdirSync(path.dirname(path.join(source, file)), { recursive: true });
      fs.writeFileSync(path.join(source, file), contents);
    }
    fs.writeFileSync(
      path.join(source, 'bundle.json'),
      JSON.stringify({
        files: Object.fromEntries(
          Object.entries(entries).map(([file, content]) => [
            file,
            createHash('sha256').update(content).digest('hex'),
          ]),
        ),
      }),
    );
    const marketplaceFile = path.join(destination, '.agents/plugins/marketplace.json');
    fs.mkdirSync(path.dirname(marketplaceFile), { recursive: true });
    fs.writeFileSync(
      marketplaceFile,
      '{"name":"bili-dragon","interface":{"displayName":"B 站小白龙"},"plugins":[{"name":"keep-other-plugin"}]}',
    );
    const data = path.join(directory, 'data');
    fs.mkdirSync(data);
    fs.writeFileSync(path.join(data, 'diaries.json'), '[{"id":"keep"}]');
    const commands: string[][] = [];
    const run = (_command: string, args: string[]) => {
      commands.push(args);
      if (args.includes('--help')) return 'Install a plugin';
      if (args[1] === 'marketplace') return '{}';
      const market = JSON.parse(fs.readFileSync(marketplaceFile, 'utf8'));
      const entry = market.plugins.find((p: { name: string }) => p.name === 'codex-bili-dragon');
      return JSON.stringify({
        pluginId: 'codex-bili-dragon@bili-dragon',
        installedPath: path.resolve(destination, entry.source.path),
      });
    };
    const first = installPlugin({ source, destination, codex: 'codex', run });
    const second = installPlugin({ source, destination, codex: 'codex', run });
    assert.equal(first.installedPath, second.installedPath);
    const mcp = JSON.parse(fs.readFileSync(path.join(first.source, 'mcp.json'), 'utf8'));
    assert.equal(mcp.mcpServers['codex-bili-dragon'].command, path.basename(process.execPath));
    assert.equal(
      mcp.mcpServers['codex-bili-dragon'].env.PATH.split(path.delimiter)[0],
      path.dirname(process.execPath),
    );
    assert.equal(JSON.parse(fs.readFileSync(marketplaceFile, 'utf8')).plugins.length, 2);
    assert.equal(fs.readFileSync(path.join(data, 'diaries.json'), 'utf8'), '[{"id":"keep"}]');
    assert.ok(
      commands.some((args) => args.join(' ') === 'plugin add codex-bili-dragon@bili-dragon --json'),
    );
    assert.ok(commands.every((args) => !args.includes('mcp')));
    fs.writeFileSync(path.join(source, 'dist/runtime/mcp.js'), 'modified');
    assert.throws(() => installPlugin({ source, destination, codex: 'codex', run }), /校验失败/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
