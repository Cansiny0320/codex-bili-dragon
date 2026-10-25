import fs from 'node:fs';
import path from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  type CallToolResult,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { catalog } from './service.js';
import { configSchema } from './config.js';
import { root, dataRoot, version } from './paths.js';
import {
  ensureRuntime,
  findRuntime,
  requestRuntime,
  stopRuntime,
  type RuntimeConnection,
} from './runtime.js';
import { errorMessage } from './types.js';
import { redact } from './upstream.js';
import { credentialsSchema } from './login.js';

export const appUri = 'ui://bili-dragon/dashboard';
const empty = z.object({}).strict();
const id = z.object({ id: z.string().min(1).max(200) }).strict();
const adminSchemas = {
  state: empty,
  config: configSchema,
  credentials: credentialsSchema,
  checkLogin: empty,
  loginStart: empty,
  loginPoll: z.object({ handle: z.string().uuid() }).strict(),
  loginCancel: z.object({ handle: z.string().uuid() }).strict(),
  run: empty,
  pause: empty,
  approve: id,
  reject: id,
  dismiss: id,
};
type AdminAction = keyof typeof adminSchemas;
const adminNames: Record<AdminAction, string> = {
  state: '读取管理页',
  config: '保存设置',
  credentials: '保存账号连接',
  checkLogin: '检查账号连接',
  loginStart: '获取登录二维码',
  loginPoll: '检查扫码状态',
  loginCancel: '取消扫码登录',
  run: '立即活动',
  pause: '暂停活动',
  approve: '确认发送草稿',
  reject: '拒绝草稿',
  dismiss: '关闭已核查任务',
};
const icon = fs.readFileSync(path.join(root, 'assets/icon.png'));
const icons = [
  {
    src: 'data:image/png;base64,' + icon.toString('base64'),
    mimeType: 'image/png',
    sizes: ['512x512'],
  },
];

export function createDragonMcp(dir = dataRoot) {
  let connection: RuntimeConnection | undefined;
  let stopped = false;
  const start = async () => {
    connection = await ensureRuntime(dir);
    stopped = false;
    return connection;
  };
  const call = async <T = unknown>(action: string, input?: unknown): Promise<T> => {
    if (stopped) throw Error('后台已停止，请让 Codex 启动小白龙，或重新打开管理页。');
    return requestRuntime<T>(connection ?? (await start()), action, input);
  };
  const forward = (name: string, args: unknown) =>
    call<CallToolResult>('tool', { name, arguments: args });
  const publicTools = catalog({
    store: { dir },
    status: () => forward('dragon_status', {}),
    read: (args) => forward('dragon_read', args),
    diary: (args) => forward('dragon_diary', args),
    reply: (eventId, text) => forward('dragon_reply', { eventId, text }),
    share: (args) => forward('dragon_share', args),
  });
  const open = async (): Promise<CallToolResult> => {
    await start();
    return {
      content: [{ type: 'text', text: '已打开 B 站小白龙管理页。' }],
      structuredContent: { state: await call('state') },
    };
  };
  const entries: Tool[] = [
    ...publicTools.map(({ call: _call, ...tool }) => tool),
    {
      name: 'dragon_sidebar',
      title: 'B 站小白龙',
      description: '从 Codex 侧边栏打开小白龙管理页。',
      icons,
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, openWorldHint: false },
      _meta: {
        ui: { resourceUri: appUri, visibility: ['app'] },
        'openai/ui': { entrypoints: [{ type: 'global' }] },
      },
    },
    {
      name: 'dragon_open',
      title: '小白龙管理页',
      description:
        '用户要求打开、设置或查看小白龙时，在 Codex 对话右侧打开管理页。仅启动本地服务，不启用自动活动。',
      icons,
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, openWorldHint: false },
      _meta: { ui: { resourceUri: appUri }, 'openai/ui': { entrypoints: [{ type: 'thread' }] } },
    },
    {
      name: 'dragon_control',
      title: '小白龙后台',
      description:
        '仅在用户要求时启动、暂停或停止本机小白龙后台。start 不启用自动活动或发送权限；status 只检查运行状态。',
      inputSchema: z.toJSONSchema(
        z.object({ action: z.enum(['start', 'status', 'pause', 'stop']) }).strict(),
      ) as Tool['inputSchema'],
      annotations: { destructiveHint: false, openWorldHint: false },
    },
    ...Object.entries(adminSchemas).map(([action, schema]): Tool => ({
      name: 'dragon_admin_' + action,
      title: adminNames[action as AdminAction],
      description: '管理页专用：' + adminNames[action as AdminAction],
      inputSchema: z.toJSONSchema(schema) as Tool['inputSchema'],
      annotations: {
        readOnlyHint: action === 'state',
        destructiveHint: action === 'approve',
        openWorldHint: ['approve', 'checkLogin', 'run', 'loginStart', 'loginPoll'].includes(action),
      },
      _meta: { ui: { visibility: ['app'] } },
    })),
  ];
  const server = new Server(
    { name: 'codex-bili-dragon', version, icons },
    { capabilities: { tools: {}, resources: {} } },
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: entries }));
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [{ uri: appUri, name: 'B 站小白龙管理页', mimeType: 'text/html;profile=mcp-app' }],
  }));
  server.setRequestHandler(ReadResourceRequestSchema, async ({ params }) => {
    if (params.uri !== appUri) throw Error('未知界面资源');
    return {
      contents: [
        {
          uri: appUri,
          mimeType: 'text/html;profile=mcp-app',
          text: fs.readFileSync(path.join(root, 'dist/mcp-app/index.html'), 'utf8'),
          _meta: {
            ui: { csp: { resourceDomains: ['https://*.hdslb.com'], connectDomains: [] } },
            'openai/ui': {
              preferredDisplayMode: 'fullscreen',
              availableDisplayModes: ['fullscreen'],
            },
          },
        },
      ],
    };
  });
  server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
    try {
      const input = params.arguments ?? {};
      if (params.name === 'dragon_open' || params.name === 'dragon_sidebar') {
        empty.parse(input);
        return await open();
      }
      if (params.name === 'dragon_control') {
        const { action } = z
          .object({ action: z.enum(['start', 'status', 'pause', 'stop']) })
          .strict()
          .parse(input);
        let result: unknown;
        if (action === 'start') {
          const ready = await start();
          result = { running: true, version: ready.version };
        } else if (action === 'status') {
          const ready = await findRuntime(dir);
          result = { running: !!ready, version: ready?.version };
        } else if (action === 'stop') {
          result = await stopRuntime(dir);
          stopped = true;
          connection = undefined;
        } else result = await call('pause');
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
      const admin = params.name.replace(/^dragon_admin_/, '') as AdminAction;
      if (params.name.startsWith('dragon_admin_') && Object.hasOwn(adminSchemas, admin)) {
        const value = adminSchemas[admin].parse(input);
        const endpoint = admin.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase());
        const result = await call(endpoint, value);
        return { content: [], structuredContent: { result } };
      }
      const tool = publicTools.find((item) => item.name === params.name);
      if (!tool) throw Error('未知工具');
      return await tool.call(input);
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: redact(errorMessage(error), dir) }] };
    }
  });
  return server;
}
