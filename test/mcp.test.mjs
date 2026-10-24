import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
test("真实 MCP stdio 握手、工具发现与拒绝非法参数", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dragon-mcp-"));
  const client = new Client({ name: "test", version: "1" });
  t.after(async () => {
    await client.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [fileURLToPath(new URL("../server.mjs", import.meta.url))],
      env: { ...process.env, BILI_DRAGON_DATA: dir },
      stderr: "pipe",
    }),
  );
  const list = await client.listTools();
  assert.equal(list.tools.length, 5);
  const state = await client.callTool({ name: "dragon_status", arguments: {} });
  assert.equal(JSON.parse(state.content[0].text).hasCredentials, false);
  const bad = await client.callTool({
    name: "dragon_read",
    arguments: { action: "shell" },
  });
  assert.equal(bad.isError, true);
});
