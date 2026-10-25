import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { Store, atomic } from '../packages/runtime/src/store.js';
import { DragonService } from '../packages/runtime/src/service.js';
import { createHttp } from '../packages/runtime/src/http.js';
import { connectionPath } from '../packages/runtime/src/runtime.js';
import { version, root } from '../packages/runtime/src/paths.js';
import { loginFixture } from './login-fixture.js';

test('MCP App 真实 stdio 桥接：八页、保存和审核，凭据不进入日志', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-mcp-ui-'));
  const output = process.env.DRAGON_PLUGIN_SCREENSHOTS || path.resolve('work/plugin-ui');
  fs.mkdirSync(output, { recursive: true });
  const store = new Store(dir),
    outgoing: string[][] = [];
  const login = loginFixture();
  const service = new DragonService(
    store,
    async (args) => {
      outgoing.push(args);
      return { code: 0, out: '模拟成功', err: '' };
    },
    { fetch: login.fetch },
  );
  store.write('diaries', [
    {
      id: 'local-diary',
      title: '本地日记',
      publicText: '给你的信。',
      privateText: '自己的想法。',
      evidence: '隔离测试数据',
      at: new Date().toISOString(),
    },
  ]);
  service.ingest({
    id: 'review-me',
    channel: 'comments',
    mid: '20000',
    name: '观众',
    text: '你怎么看？',
    oid: '123',
    rpid: '456',
    business: 1,
  });
  await service.reply('review-me', '谢谢分享。');
  const web = await createHttp(
    service,
    {
      pause: async () => {
        service.saveConfig({ ...service.config(), enabled: false });
      },
      tick: async () => {
        const job = service.queue.claim();
        if (job) service.queue.finish(job.id, 'done', { fixture: true });
      },
      error: () => {},
    },
    { port: 0 },
  );
  atomic(connectionPath(dir), {
    origin: web.origin,
    token: web.token,
    pid: process.pid,
    version,
    root,
  });
  const client = new Client({ name: 'mcp-app-ui-test', version: '1' });
  const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : fs.existsSync(edge)
        ? { executablePath: edge }
        : {}),
  });
  try {
    await client.connect(
      new StdioClientTransport({
        command: process.execPath,
        args: [path.join(root, 'dist/runtime/mcp.js')],
        env: { ...process.env, BILI_DRAGON_DATA: dir },
        stderr: 'pipe',
      }),
    );
    const resource = (await client.readResource({ uri: 'ui://bili-dragon/dashboard' })).contents[0];
    assert.ok('text' in resource);
    const initial = CallToolResultSchema.parse(
      await client.callTool({ name: 'dragon_sidebar', arguments: {} }),
    );
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.route('https://test.hdslb.com/**', (route) =>
      route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52"><rect width="52" height="52" fill="#cfe0ff"/></svg>',
      }),
    );
    const logs: string[] = [],
      errors: string[] = [],
      responses: unknown[] = [];
    page.on('console', (message) => {
      logs.push(message.text());
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.exposeFunction(
      'callMcp',
      async (input: { name: string; arguments: Record<string, unknown> }) => {
        const value = await client.callTool(input);
        responses.push(value);
        return value;
      },
    );
    await page.setContent(
      '<html><body style="margin:0"><iframe title="小白龙" style="width:100vw;height:100vh;border:0" sandbox="allow-scripts allow-same-origin"></iframe></body></html>',
    );
    await page.evaluate(
      ({ html, initial }) => {
        const frame = document.querySelector('iframe')!;
        window.addEventListener('message', async (event) => {
          if (event.source !== frame.contentWindow || event.data?.jsonrpc !== '2.0') return;
          const message = event.data,
            send = (value: unknown) => frame.contentWindow!.postMessage(value, '*');
          if (message.method === 'ui/initialize')
            send({
              jsonrpc: '2.0',
              id: message.id,
              result: {
                protocolVersion: message.params.protocolVersion,
                hostInfo: { name: 'isolated-desktop-test', version: '26.1025.1' },
                hostCapabilities: { serverTools: {}, serverResources: {}, openLinks: {} },
                hostContext: { displayMode: 'fullscreen', platform: 'desktop', theme: 'light' },
              },
            });
          else if (message.method === 'ui/notifications/initialized')
            send({ jsonrpc: '2.0', method: 'ui/notifications/tool-result', params: initial });
          else if (message.method === 'tools/call') {
            try {
              const call = (window as unknown as { callMcp: (input: unknown) => Promise<unknown> })
                .callMcp;
              send({ jsonrpc: '2.0', id: message.id, result: await call(message.params) });
            } catch {
              send({
                jsonrpc: '2.0',
                id: message.id,
                error: { code: -32000, message: '测试桥接失败' },
              });
            }
          } else if (message.id !== undefined) send({ jsonrpc: '2.0', id: message.id, result: {} });
        });
        frame.srcdoc = html.replace(
          '<head>',
          "<head><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: https:; connect-src 'none'\">",
        );
      },
      { html: resource.text as string, initial },
    );
    const frame = page.frameLocator('iframe');
    await frame.getByRole('heading', { name: '小白龙休息中' }).waitFor();
    const pages = [
      '首页',
      '观看记录',
      '日记',
      '待我审核',
      '个性与兴趣',
      '活动时间',
      '操作权限',
      '账号连接',
    ];
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      for (let index = 0; index < pages.length; index++) {
        if (width === 390) await frame.getByRole('button', { name: '打开导航' }).click();
        await frame
          .getByRole('navigation')
          .getByRole('link', { name: pages[index], exact: index !== 3 })
          .click();
        await frame.getByText('正在加载', { exact: true }).waitFor({ state: 'hidden' });
        assert.deepEqual(await frame.getByRole('alert').allTextContents(), [], pages[index]);
        assert.equal(
          await frame
            .locator('body')
            .evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
          pages[index],
        );
        await page.screenshot({
          path: path.join(output, `${index + 1}-${width}.png`),
          animations: 'disabled',
        });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    const navigate = async (name: string) =>
      frame
        .getByRole('navigation')
        .getByRole('link', { name, exact: name !== '待我审核' })
        .click();
    await navigate('个性与兴趣');
    await frame.getByLabel('小白龙的名字', { exact: true }).fill('原生小白龙');
    await frame.getByRole('button', { name: '保存更改' }).click();
    await frame.getByRole('status').waitFor();
    assert.equal(service.config().persona.name, '原生小白龙');
    await navigate('待我审核');
    assert.ok(await frame.getByRole('button', { name: '批准发送' }).isDisabled());
    await navigate('操作权限');
    await frame.getByRole('switch', { name: '发送评论', exact: true }).click();
    await frame.getByRole('button', { name: '保存更改' }).click();
    await frame.getByRole('status').waitFor();
    await navigate('待我审核');
    await frame.getByRole('button', { name: '批准发送' }).click();
    await frame.getByText('暂无待审核的消息。').waitFor();
    assert.equal(outgoing.filter((args) => args[0] === 'comment').length, 1);
    await navigate('账号连接');
    await frame.getByAltText('B 站登录二维码').waitFor();
    assert.equal(await frame.getByLabel('SESSDATA', { exact: true }).isVisible(), false);
    assert.equal(await frame.locator('.brand strong').textContent(), 'B 站小白龙');
    await frame.locator('.brand img').evaluate((img) => {
      if (!(img instanceof HTMLImageElement) || !img.complete || img.naturalWidth === 0)
        throw Error('Brand avatar did not load');
    });
    login.status(86090);
    await frame.getByText('扫码成功，请在手机上确认', { exact: true }).waitFor();
    login.status(0);
    await frame.getByRole('heading', { name: '扫码测试账号', exact: true }).waitFor();
    await frame.getByText('UID 12345', { exact: true }).waitFor();
    assert.equal(service.config().enabled, false);
    await navigate('首页');
    await frame.locator('.account-summary').getByText('扫码测试账号', { exact: true }).waitFor();
    await frame.locator('.account-summary').getByText('UID 12345', { exact: true }).waitFor();
    assert.equal(
      await frame.locator('.account-summary img').getAttribute('src'),
      'https://test.hdslb.com/avatar.svg',
    );
    await navigate('账号连接');
    await frame.getByRole('heading', { name: '扫码测试账号', exact: true }).waitFor();
    assert.equal(service.config().accountMode, 'single');
    assert.equal(service.config().owner.mid, '12345');
    assert.equal(await frame.getByLabel('主人 UID', { exact: true }).count(), 0);
    await frame.getByLabel('账号模式', { exact: true }).selectOption('dual');
    await frame.getByLabel('主人 UID', { exact: true }).fill('20000');
    await frame.getByLabel('主人 B 站昵称（评论 @ 用）', { exact: true }).fill('主人');
    await frame.getByRole('button', { name: '保存更改', exact: true }).click();
    await frame.getByRole('status').waitFor();
    assert.equal(service.config().accountMode, 'dual');
    assert.equal(service.config().owner.mid, '20000');
    await frame.getByLabel('账号模式', { exact: true }).selectOption('single');
    await frame.getByRole('button', { name: '保存更改', exact: true }).click();
    await frame.getByRole('status').waitFor();
    await navigate('操作权限');
    assert.equal(
      await frame.getByRole('switch', { name: '发送私信', exact: false }).isDisabled(),
      true,
    );
    assert.equal(
      await frame.getByRole('switch', { name: '主动分享', exact: false }).isDisabled(),
      true,
    );
    await navigate('首页');
    await frame.locator('.account-summary').getByText('扫码测试账号', { exact: true }).waitFor();
    await page.screenshot({
      path: path.join(output, 'home-connected-desktop.png'),
      animations: 'disabled',
    });
    await navigate('账号连接');
    await frame.getByRole('heading', { name: '扫码测试账号', exact: true }).waitFor();
    await page.screenshot({
      path: path.join(output, 'single-account-desktop.png'),
      animations: 'disabled',
    });
    assert.ok(!JSON.stringify(responses).includes('qr-fixture-secret-must-not-log'));
    assert.ok(!logs.join('\n').includes('qr-fixture-secret-must-not-log'));
    await frame.getByText('高级选项', { exact: true }).click();
    await frame.getByLabel('SESSDATA', { exact: true }).fill('mcp-ui-secret-must-not-log');
    await frame.getByLabel('bili_jct', { exact: true }).fill('b'.repeat(32));
    await frame.getByLabel('buvid3', { exact: true }).fill('mcp-ui-buvid');
    await frame.getByRole('button', { name: '保存凭据' }).click();
    await frame.getByRole('heading', { name: '扫码测试账号', exact: true }).waitFor();
    assert.equal(await frame.getByLabel('SESSDATA', { exact: true }).inputValue(), '');
    assert.ok(!JSON.stringify(responses).includes('mcp-ui-secret-must-not-log'));
    assert.ok(!logs.join('\n').includes('mcp-ui-secret-must-not-log'));
    assert.deepEqual(errors, []);
    console.log('MCP App 八页与真实桥接验证通过。');
  } finally {
    await client.close();
    await browser.close();
    await web.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
