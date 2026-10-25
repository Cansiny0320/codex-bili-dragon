import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { unzipSync } from 'fflate';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { version } from '../packages/runtime/src/paths.js';

test('预构建 ZIP 在无 node_modules 的独立目录直接运行 MCP、后台和九页管理界面', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-package-'));
  const plugin = path.join(dir, 'plugin'),
    data = path.join(dir, 'data');
  fs.mkdirSync(data);
  fs.writeFileSync(path.join(data, 'config.json'), JSON.stringify({ updates: { enabled: false } }));
  const entries = unzipSync(
    fs.readFileSync(path.resolve('dist', `codex-bili-dragon-${version}-plugin.zip`)),
  );
  const client = new Client({ name: 'package-smoke', version: '1' });
  try {
    for (const [relative, contents] of Object.entries(entries)) {
      assert.ok(!relative.startsWith('/') && !relative.split('/').includes('..'));
      const file = path.join(plugin, relative);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, contents);
    }
    assert.equal(fs.existsSync(path.join(plugin, 'node_modules')), false);
    await client.connect(
      new StdioClientTransport({
        command: process.execPath,
        args: [path.join(plugin, 'dist/runtime/mcp.js')],
        cwd: plugin,
        env: { ...process.env, BILI_DRAGON_DATA: data },
        stderr: 'pipe',
      }),
    );
    const list = await client.listTools();
    assert.ok(list.tools.some((tool) => tool.name === 'dragon_sidebar'));
    const started = CallToolResultSchema.parse(
      await client.callTool({ name: 'dragon_control', arguments: { action: 'start' } }),
    );
    assert.notEqual(started.isError, true);
    const connection = JSON.parse(fs.readFileSync(path.join(data, 'connection.json'), 'utf8')) as {
      origin: string;
    };
    for (const route of [
      '/',
      '/videos',
      '/activity',
      '/diary',
      '/review',
      '/personality',
      '/schedule',
      '/permissions',
      '/account',
    ]) {
      const response = await fetch(connection.origin + route);
      assert.equal(response.status, 200, route);
      assert.ok((await response.text()).includes('Codex Bili Dragon'));
    }
    const resource = await client.readResource({ uri: 'ui://bili-dragon/dashboard' });
    assert.equal(resource.contents[0].mimeType, 'text/html;profile=mcp-app');
    const quota = CallToolResultSchema.parse(
      await client.callTool({ name: 'dragon_read', arguments: { action: 'quota' } }),
    );
    assert.notEqual(quota.isError, true);
    const stop = CallToolResultSchema.parse(
      await client.callTool({ name: 'dragon_control', arguments: { action: 'stop' } }),
    );
    assert.notEqual(stop.isError, true);
    assert.equal(fs.existsSync(path.join(data, 'connection.json')), false);
  } finally {
    try {
      await client.callTool({ name: 'dragon_control', arguments: { action: 'stop' } });
    } catch {
      /* Already closed or did not start. */
    }
    await client.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
