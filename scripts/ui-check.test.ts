import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium, type Page } from 'playwright';
import { Store } from '../packages/runtime/src/store.js';
import { DragonService } from '../packages/runtime/src/service.js';
import { createHttp } from '../packages/runtime/src/http.js';
import { loginFixture } from './login-fixture.js';

test('八页桌面/窄屏布局和真实 oRPC 交互，所有外部操作使用替身', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-ui-'));
  const output = process.env.DRAGON_SCREENSHOTS || path.resolve('work/ui-screenshots');
  fs.mkdirSync(output, { recursive: true });
  const store = new Store(dir);
  const calls: string[][] = [];
  const login = loginFixture();
  const service = new DragonService(
    store,
    async (args) => {
      calls.push(args);
      return { code: 0, out: args[0] === 'session' ? '测试会话有效' : '测试发送成功', err: '' };
    },
    { fetch: login.fetch },
  );
  service.saveConfig({
    ...service.config(),
    owner: { mid: '10001', name: '你' },
    preferences: { like: ['科技', '有趣知识', '自然', '音乐'], dislike: ['标题党', '引战'] },
  });
  const now = new Date().toISOString();
  const titles = [
    '深海为什么会发光？',
    '把日常声音变成一首歌',
    '星星离我们究竟有多远',
    '森林里的微小世界',
    '机械钟表如何记录时间',
  ];
  store.write(
    'evidence',
    Object.fromEntries(
      titles.map((title, i) => [
        'BV123456789' + i,
        {
          title,
          author: ['自然观察', '声音实验室', '宇宙漫游', '山野笔记', '机械之美'][i],
          cover: 'https://test.hdslb.com/' + i + '.svg',
          duration: 240 + i * 62,
          actions: ['subtitles', 'comments', 'frames'],
          at: now,
          materials: {
            subtitles: '00:00 今天一起认识这个有趣的问题。\n00:26 从日常观察开始，理解背后的原理。',
            comments: '观众：这个解释很清楚，希望继续分享。',
          },
        },
      ]),
    ),
  );
  store.write(
    'diaries',
    titles.slice(0, 3).map((title, i) => ({
      id: 'diary-' + i,
      bvid: 'BV123456789' + i,
      title,
      at: now,
      publicText:
        '今天发现了一件很有意思的事。\n视频从一个很小的问题展开，把不容易看见的细节慢慢讲清楚。\n我把有趣的片段记在这里，希望你也会喜欢。',
      privateText: '内心记录：这次解释有清晰的例子。下一次可以找不同观点交叉验证。',
      evidence: '读取了视频字幕与评论，尚未核实字幕之外的细节。',
    })),
  );
  for (let i = 0; i < 3; i++) {
    service.ingest({
      id: 'comment-' + i,
      channel: 'comments',
      mid: String(20001 + i),
      name: '观众 ' + (i + 1),
      title: titles[i],
      text: '这段解释很有趣，你最喜欢哪个部分？',
      oid: String(100 + i),
      rpid: String(200 + i),
      business: 1,
    });
    await service.reply(
      'comment-' + i,
      '我喜欢从日常观察出发的部分，很容易理解，也让我想继续查一查。',
    );
  }
  const http = await createHttp(
    service,
    {
      pause: async () => {
        service.saveConfig({ ...service.config(), enabled: false });
        store.write('runtime', { state: 'idle' });
      },
      tick: async () => {
        const j = service.queue.claim();
        if (j) service.queue.finish(j.id, 'done', { fixture: true });
        store.write('runtime', { state: 'idle' });
      },
      error: () => {},
    },
    { port: 0 },
  );
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
    const context = await browser.newContext({
      viewport: { width: 1536, height: 1024 },
      locale: 'zh-CN',
    });
    await context.route('https://test.hdslb.com/**', async (route) => {
      const n = Number(new URL(route.request().url()).pathname[1]);
      const colors = ['#1f637b', '#b67a4b', '#333e75', '#4c785e', '#87705e'];
      await route.fulfill({
        contentType: 'image/svg+xml',
        body: `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="${colors[n]}"/><circle cx="430" cy="150" r="110" fill="#ffffff22"/><path d="M0 340 Q200 90 350 300 T640 180 V400 H0" fill="#ffffff20"/><text x="35" y="350" font-size="32" fill="white" font-family="sans-serif">${titles[n]}</text></svg>`,
      });
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => {
      errors.push(e.message);
      console.log('PAGE ERROR', e.message);
    });
    page.on('console', (m) => {
      if (m.type() === 'error') {
        errors.push(m.text());
        console.log('CONSOLE', m.text());
      }
    });
    page.setDefaultTimeout(15000);
    await page.goto(http.url);
    await page
      .getByRole('heading', { name: '小白龙休息中' })
      .waitFor()
      .catch(async (e: unknown) => {
        console.log(await page.locator('body').innerText());
        await page.screenshot({ path: path.join(output, 'failure.png') });
        throw e;
      });
    assert.equal(new URL(page.url()).hash, '');
    for (const [type, heading] of [
      ['browse', '小白龙正在逛 B 站中'],
      ['message', '小白龙正在回消息'],
    ]) {
      store.write('jobs', [
        {
          id: 'status-test',
          key: 'status-test',
          type,
          payload: {},
          state: 'running',
          createdAt: now,
        },
      ]);
      store.write('runtime', { state: 'running', jobId: 'status-test' });
      await page.reload();
      await page.getByRole('heading', { name: heading, exact: true }).waitFor();
      assert.equal(
        await page.getByRole('button', { name: '让小白龙休息', exact: true }).count(),
        1,
      );
      assert.equal(await page.getByRole('button', { name: '去逛一逛', exact: true }).count(), 0);
    }
    store.write('jobs', []);
    store.write('runtime', { state: 'idle' });
    const routes = [
      '/',
      '/videos',
      '/diary',
      '/review',
      '/personality',
      '/schedule',
      '/permissions',
      '/account',
    ];
    async function checkLayout(p: Page, name: string) {
      await p.locator('main').waitFor();
      await p.getByText('正在加载', { exact: true }).waitFor({ state: 'hidden' });
      assert.equal(await p.locator('[role="alert"]').count(), 0, name);
      const overflow = await p.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      assert.equal(overflow, false, '页面横向溢出：' + name);
      await p.screenshot({
        path: path.join(output, name + '.png'),
        fullPage: true,
        animations: 'disabled',
      });
    }
    for (const route of routes) {
      await page.goto(http.origin + route);
      await checkLayout(page, (route.slice(1) || 'home') + '-desktop');
    }
    await page.goto(http.origin + '/personality');
    await page.getByLabel('小白龙的名字', { exact: true }).fill('测试小白龙');
    await page.getByRole('button', { name: '添加关键词' }).first().click();
    await page.getByLabel('喜欢的内容关键词新增关键词').fill('天文');
    await page.getByRole('button', { name: '添加', exact: true }).click();
    await page.getByRole('button', { name: '保存更改' }).click();
    await page.getByRole('status').waitFor();
    assert.equal(service.config().persona.name, '测试小白龙');
    assert.ok(service.config().preferences.like.includes('天文'));
    await page.reload();
    assert.equal(await page.getByLabel('小白龙的名字', { exact: true }).inputValue(), '测试小白龙');
    await page.goto(http.origin + '/review');
    assert.equal(await page.getByRole('button', { name: '批准发送' }).isDisabled(), true);
    await page.getByRole('button', { name: '拒绝', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.review-list-item').length === 2);
    assert.equal(calls.length, 0);
    await page.goto(http.origin + '/permissions');
    await page.getByRole('switch', { name: '发送评论', exact: true }).click();
    await page.getByRole('button', { name: '保存更改' }).click();
    await page.getByRole('status').waitFor();
    assert.equal(service.config().permissions.comments, true);
    await page.goto(http.origin + '/review');
    await page.getByRole('button', { name: '批准发送' }).click();
    await page.waitForFunction(() => document.querySelectorAll('.review-list-item').length === 1);
    assert.equal(calls.filter((args) => args[0] === 'comment').length, 1);
    await page.goto(http.origin + '/account');
    await page.getByAltText('B 站登录二维码').waitFor();
    assert.equal(await page.getByLabel('SESSDATA', { exact: true }).isVisible(), false);
    login.status(86090);
    await page.getByText('扫码成功，请在手机上确认', { exact: true }).waitFor();
    login.status(0);
    await page.getByRole('heading', { name: '扫码测试账号', exact: true }).waitFor();
    await page.getByText('UID 12345', { exact: true }).waitFor();
    assert.equal(service.config().owner.mid, '10001');
    await page.goto(http.origin);
    await page.locator('.account-summary').getByText('扫码测试账号', { exact: true }).waitFor();
    await page.locator('.account-summary').getByText('UID 12345', { exact: true }).waitFor();
    assert.equal(
      await page.locator('.account-summary img').getAttribute('src'),
      'https://test.hdslb.com/avatar.svg',
    );
    assert.ok(!(await page.locator('.account-summary').innerText()).includes('10001'));
    await page.reload();
    await page.locator('.account-summary').getByText('扫码测试账号', { exact: true }).waitFor();
    await page.goto(http.origin + '/account');
    await page.getByRole('heading', { name: '扫码测试账号', exact: true }).waitFor();
    login.status(86038);
    await page.getByRole('button', { name: '重新扫码登录', exact: true }).click();
    await page.getByText('二维码已失效', { exact: true }).waitFor();
    login.status(86101);
    await page.getByRole('button', { name: '刷新二维码', exact: true }).click();
    await page.getByAltText('B 站登录二维码').waitFor();
    await page.getByText('高级选项', { exact: true }).click();
    await page.getByLabel('SESSDATA', { exact: true }).fill('ui-fixture-secret');
    await page.getByLabel('bili_jct', { exact: true }).fill('a'.repeat(32));
    await page.getByLabel('buvid3', { exact: true }).fill('ui-fixture-buvid');
    await page.getByRole('button', { name: '保存凭据' }).click();
    await page.getByRole('heading', { name: '扫码测试账号', exact: true }).waitFor();
    assert.equal(await page.getByLabel('SESSDATA', { exact: true }).inputValue(), '');
    await page.getByRole('button', { name: '检查连接' }).click();
    await page.getByRole('heading', { name: '扫码测试账号', exact: true }).waitFor();
    const stateBody = await (
      await fetch(http.origin + '/api/state', {
        headers: { authorization: 'Bearer ' + http.token },
      })
    ).text();
    assert.ok(!stateBody.includes('ui-fixture-secret'));
    await page.goto(http.origin + '/videos');
    await page.getByLabel('搜索视频标题或 BV 号').fill('星星');
    assert.equal(await page.locator('.video-list-item').count(), 1);
    await page.goto(http.origin + '/diary');
    await page.getByRole('button', { name: '内心日记', exact: true }).click();
    await page.locator('.diary-prose').getByText('内心记录：', { exact: false }).waitFor();
    await page.getByRole('button', { name: '上个月' }).click();
    await page.getByText('这个月还没有日记。').waitFor();
    await page.goto(http.origin);
    await page.getByRole('button', { name: '去逛一逛' }).click();
    await page.waitForFunction(() => !document.querySelector('button:disabled'));
    assert.equal(service.queue.list().at(-1)?.state, 'done');
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of routes) {
      await page.goto(http.origin + route);
      await checkLayout(page, (route.slice(1) || 'home') + '-mobile');
    }
    await page.getByRole('button', { name: '打开导航' }).click();
    await page.getByRole('navigation').getByRole('link', { name: '首页', exact: true }).click();
    await page.getByRole('heading', { name: '小白龙休息中' }).waitFor();
    assert.equal(await page.locator('.sidebar.is-open').count(), 0);
    await page.goto(http.origin + '/permissions');
    const enabledSwitch = page.getByRole('switch', { name: '发送评论', exact: true });
    await enabledSwitch.waitFor();
    const track = await enabledSwitch.boundingBox();
    const thumb = await enabledSwitch.locator('[data-slot="switch-thumb"]').boundingBox();
    assert.ok(
      track && thumb && thumb.x >= track.x && thumb.x + thumb.width <= track.x + track.width + 1,
      '开关滑块应在轨道内',
    );
    assert.notEqual(
      await page
        .getByRole('button', { name: '去逛一逛' })
        .evaluate((el) => getComputedStyle(el).backgroundColor),
      'rgba(0, 0, 0, 0)',
    );
    await page.goto(http.origin + '/schedule');
    await page.getByLabel('时区', { exact: true }).fill('Invalid/Zone');
    await page.getByRole('button', { name: '保存更改' }).click();
    await page.getByRole('alert').waitFor();
    assert.equal(service.config().timezone, 'Asia/Shanghai');
    assert.equal(await page.getByLabel('时区', { exact: true }).inputValue(), 'Invalid/Zone');
    // Empty and unauthenticated states must remain usable without inventing records.
    store.write('diaries', []);
    store.write('drafts', []);
    store.write('evidence', {});
    for (const [route, message] of [
      ['/', '小白龙还没出门逛过。'],
      ['/videos', '小白龙还没出门逛过。'],
      ['/diary', '这个月还没有日记。'],
      ['/review', '暂无待审核的消息。'],
    ]) {
      await page.goto(http.origin + route);
      await page.getByText(message, { exact: true }).waitFor();
    }
    const anonymous = await browser.newContext();
    const noToken = await anonymous.newPage();
    await noToken.goto(http.origin);
    await noToken
      .getByRole('alert')
      .getByText('请用后台启动时显示的完整链接打开管理页。')
      .waitFor();
    await anonymous.close();
    assert.deepEqual(
      errors.filter((e) => !e.includes('400 (Bad Request)')),
      [],
    );
    console.log('UI 验证通过，截图：' + output);
  } finally {
    await browser.close();
    await http.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
