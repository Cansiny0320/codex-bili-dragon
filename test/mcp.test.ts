import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { stopRuntime } from '../packages/runtime/src/runtime';
test('真实 MCP stdio 握手、工具发现与拒绝非法参数', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-mcp-'));
  fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify({ updates: { enabled: false } }));
  const client = new Client({ name: 'test', version: '1' });
  t.onTestFinished(async () => {
    await client.close();
    await stopRuntime(dir);
    fs.rmSync(dir, { recursive: true, force: true });
  });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [fileURLToPath(new URL('../dist/runtime/mcp.js', import.meta.url))],
      env: { ...process.env, BILI_DRAGON_DATA: dir },
      stderr: 'pipe',
    }),
  );
  const list = await client.listTools();
  const modelTools = list.tools.filter((tool) => {
    const ui = tool._meta?.ui as { visibility?: string[] } | undefined;
    return !ui?.visibility || ui.visibility.includes('model');
  });
  assert.deepEqual(
    modelTools.map((tool) => tool.name),
    [
      'dragon_status',
      'dragon_read',
      'dragon_diary',
      'dragon_reply',
      'dragon_share',
      'dragon_feedback',
      'dragon_favorite',
      'dragon_open',
      'dragon_control',
    ],
  );
  const admin = list.tools.filter((tool) => tool.name.startsWith('dragon_admin_'));
  assert.equal(admin.length, 15);
  assert.equal(
    admin.find((tool) => tool.name === 'dragon_admin_models')?.annotations?.readOnlyHint,
    true,
  );
  assert.ok(admin.every((tool) => JSON.stringify(tool._meta) === '{"ui":{"visibility":["app"]}}'));
  const sidebar = list.tools.find((tool) => tool.name === 'dragon_sidebar')!;
  assert.deepEqual(sidebar._meta?.['openai/ui'], { entrypoints: [{ type: 'global' }] });
  const resources = await client.listResources();
  assert.equal(resources.resources[0].uri, 'ui://bili-dragon/dashboard');
  const resource = await client.readResource({ uri: resources.resources[0].uri });
  assert.equal(resource.contents[0].mimeType, 'text/html;profile=mcp-app');
  assert.ok(
    'text' in resource.contents[0] && resource.contents[0].text.includes('<!doctype html>'),
  );
  const state = CallToolResultSchema.parse(
    await client.callTool({ name: 'dragon_status', arguments: {} }),
  );
  assert.ok(state.content[0].type === 'text');
  assert.equal(JSON.parse(state.content[0].text).hasCredentials, false);
  const bad = await client.callTool({
    name: 'dragon_read',
    arguments: { action: 'shell' },
  });
  assert.equal(bad.isError, true);
  const opened = CallToolResultSchema.parse(
    await client.callTool({ name: 'dragon_open', arguments: {} }),
  );
  assert.equal(opened.isError, undefined);
  assert.ok(opened.structuredContent?.state);
  const invalid = await client.callTool({
    name: 'dragon_admin_config',
    arguments: { timezone: 'not-a-timezone' },
  });
  assert.equal(invalid.isError, true);
  const stateResult = CallToolResultSchema.parse(
    await client.callTool({ name: 'dragon_admin_state', arguments: {} }),
  );
  assert.ok(stateResult.structuredContent);
  const config = (stateResult.structuredContent.result as { config: Record<string, unknown> })
    .config;
  await client.callTool({ name: 'dragon_admin_config', arguments: { ...config, timezone: 'UTC' } });
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8')).timezone, 'UTC');
});
