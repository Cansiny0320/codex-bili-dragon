import http, { type ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import type { AddressInfo } from 'node:net';
import { RPCHandler, BodyLimitPlugin } from '@orpc/server/node';
import { root, version } from './paths.js';
import { redact } from './upstream.js';
import { errorMessage } from './types.js';
import { catalog, type DragonService } from './service.js';
import { createActions, createApi, type DaemonControl } from './api.js';

type Render = (request: Request) => Promise<Response>;
export async function createHttp(
  service: DragonService,
  daemon: DaemonControl,
  {
    port = 18841,
    render,
    stop,
    updateControl,
  }: {
    port?: number;
    render?: Render;
    stop?: () => void;
    updateControl?: {
      token: string;
      activate: () => void;
      shutdown: () => void;
      held: () => boolean;
    };
  } = {},
) {
  const token = crypto.randomBytes(32).toString('base64url');
  const actions = createActions(service, daemon);
  const handler = new RPCHandler(createApi(service, daemon), {
    plugins: [new BodyLimitPlugin({ maxBodySize: 128 * 1024 })],
  });
  let origin = '';
  let renderApp = render;
  let quiescing = !!updateControl;
  let requests = 0;
  const send = (
    res: ServerResponse,
    status: number,
    value: unknown,
    type = 'application/json; charset=utf-8',
  ) => {
    res.writeHead(status, {
      'content-type': type,
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    });
    res.end(type.startsWith('application/json') ? JSON.stringify(value) : value);
  };
  const server = http.createServer(async (req, res) => {
    try {
      if (req.headers.host !== new URL(origin).host) {
        send(res, 403, { error: 'Host 不匹配' });
        return;
      }
      const url = new URL(req.url ?? '/', origin);
      if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/rpc/')) {
        const auth = Buffer.from(req.headers.authorization ?? ''),
          expected = Buffer.from('Bearer ' + token);
        if (auth.length !== expected.length || !crypto.timingSafeEqual(auth, expected)) {
          send(res, 401, { error: '请通过启动时显示的链接打开管理页' });
          return;
        }
        if (req.method === 'GET' && url.pathname === '/api/state') {
          send(res, 200, actions.state());
          return;
        }
        if (req.method === 'GET' && url.pathname === '/api/runtime') {
          send(res, 200, {
            pid: process.pid,
            version,
            protocol: 1,
            held: updateControl?.held() ?? false,
          });
          return;
        }
        if (req.method !== 'POST') {
          send(res, 405, { error: '方法不支持' });
          return;
        }
        if (
          req.headers.origin !== origin ||
          !String(req.headers['content-type'] ?? '').startsWith('application/json')
        ) {
          send(res, 403, { error: '请求来源或格式不匹配' });
          return;
        }
        if (Number(req.headers['content-length'] ?? 0) > 128 * 1024) {
          send(res, 413, { error: '请求过大' });
          return;
        }
        if (url.pathname === '/api/update-activate' || url.pathname === '/api/update-shutdown') {
          if (
            !updateControl ||
            req.headers['x-update-token'] !== updateControl.token ||
            !updateControl.held()
          ) {
            send(res, 403, { error: '无效更新会话' });
            return;
          }
          if (url.pathname === '/api/update-activate') updateControl.activate();
          else updateControl.shutdown();
          send(res, 200, { ok: true });
          return;
        }
        if (quiescing) {
          send(res, 503, {
            error: '后台正在切换，请稍后重新打开管理页；发送结果不明时请先核查记录。',
          });
          return;
        }
        requests++;
        let counted = true;
        const finish = () => {
          if (counted) {
            counted = false;
            requests--;
          }
        };
        // Count until the handler has completed, even when the client disconnects mid-write.
        res.once('finish', finish);
        try {
          if (url.pathname.startsWith('/rpc/')) {
            const { matched } = await handler.handle(req, res, { prefix: '/rpc' });
            if (!matched) send(res, 404, { error: '接口不存在' });
            return;
          }
          let body = '';
          for await (const chunk of req) {
            body += chunk;
            if (Buffer.byteLength(body) > 128 * 1024) {
              send(res, 413, { error: '请求过大' });
              return;
            }
          }
          const data: unknown = JSON.parse(body || '{}');
          const id =
            typeof data === 'object' && data !== null && 'id' in data && typeof data.id === 'string'
              ? data.id
              : '';
          let result: unknown;
          switch (url.pathname) {
            case '/api/models':
              result = await actions.models();
              break;
            case '/api/activity':
              result = actions.activity(data);
              break;
            case '/api/material':
              result = actions.material(data);
              break;
            case '/api/tool': {
              const input = data as { name?: unknown; arguments?: unknown };
              const tool = catalog(service).find((item) => item.name === input?.name);
              if (!tool) throw Error('未知工具');
              result = await tool.call(input.arguments ?? {});
              break;
            }
            case '/api/stop':
              if (!stop) throw Error('请通过启动终端停止此前台实例');
              await actions.pause();
              result = { stopping: true };
              stop();
              break;
            case '/api/config':
              result = await actions.config(data);
              break;
            case '/api/credentials':
              result = await actions.credentials(data);
              break;
            case '/api/login-start':
              result = await actions.loginStart();
              break;
            case '/api/login-poll':
            case '/api/login-cancel': {
              const handle =
                typeof data === 'object' &&
                data !== null &&
                'handle' in data &&
                typeof data.handle === 'string'
                  ? data.handle
                  : '';
              if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(handle))
                throw Error('无效登录会话');
              result =
                url.pathname === '/api/login-poll'
                  ? await actions.loginPoll(handle)
                  : actions.loginCancel(handle);
              break;
            }
            case '/api/check-login':
              result = await actions.checkLogin();
              break;
            case '/api/run':
              result = actions.run();
              break;
            case '/api/pause':
              result = await actions.pause();
              break;
            case '/api/approve':
              result = await actions.approve(id);
              break;
            case '/api/reject':
              result = actions.reject(id);
              break;
            case '/api/dismiss':
              result = actions.dismiss(id);
              break;
            default:
              send(res, 404, { error: '接口不存在' });
              return;
          }
          send(res, 200, result ?? { ok: true });
        } finally {
          finish();
        }
        return;
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        send(res, 405, { error: '方法不支持' });
        return;
      }
      const assets = path.join(root, 'dist/dashboard/client');
      const file = path.resolve(assets, '.' + decodeURIComponent(url.pathname));
      const relative = path.relative(assets, file);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        send(res, 404, { error: '不存在' });
        return;
      }
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        const mime: Record<string, string> = {
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.png': 'image/png',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
          '.woff2': 'font/woff2',
        };
        const type = mime[path.extname(file)];
        if (!type) {
          send(res, 404, { error: '不存在' });
          return;
        }
        send(res, 200, fs.readFileSync(file), type);
        return;
      }
      if (!renderApp) {
        const entry = path.join(root, 'dist/dashboard/server/server.js');
        if (!fs.existsSync(entry)) {
          send(res, 503, { error: '管理页尚未构建，请运行 pnpm build' });
          return;
        }
        const module = (await import(pathToFileURL(entry).href)) as { default: { fetch: Render } };
        renderApp = module.default.fetch;
      }
      const response = await renderApp(new Request(url, { headers: { accept: 'text/html' } }));
      const nonce = crypto.randomBytes(18).toString('base64');
      const html = (await response.text()).replaceAll('<script', '<script nonce="' + nonce + '"');
      res.setHeader(
        'content-security-policy',
        "default-src 'self'; script-src 'self' 'nonce-" +
          nonce +
          "'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.hdslb.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
      );
      send(res, response.status, html, 'text/html; charset=utf-8');
    } catch (error) {
      if (!res.headersSent)
        send(res, 400, { error: redact(errorMessage(error), service.store.dir) });
      else res.end();
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  origin = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
  return {
    origin,
    token,
    url: origin + '/#' + token,
    server,
    busy: () => requests > 0,
    gate: (closed: boolean) => {
      quiescing = closed;
    },
    close: () => {
      service.login.dispose();
      return new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
  };
}
