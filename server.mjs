import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Store } from "./src/store.mjs";
import { dataRoot } from "./src/paths.mjs";
import { DragonService, catalog } from "./src/service.mjs";
const tools = catalog(new DragonService(new Store(dataRoot)));
const server = new Server(
  { name: "codex-bili-dragon", version: "0.1.0" },
  { capabilities: { tools: {} } },
);
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map(({ call, ...tool }) => tool),
}));
server.setRequestHandler(CallToolRequestSchema, async (r) => {
  const tool = tools.find((x) => x.name === r.params.name);
  if (!tool) throw Error("未知工具");
  return tool.call(r.params.arguments ?? {});
});
await server.connect(new StdioServerTransport());
