import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createDragonMcp } from './mcp-server.js';
await createDragonMcp().connect(new StdioServerTransport());
