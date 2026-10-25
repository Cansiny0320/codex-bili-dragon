import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import { LoginManager, type Credentials } from '../packages/runtime/src/login.js';

const secret = {
  sessdata: 'fixture-login-secret%2F',
  bili_jct: 'a'.repeat(32),
  buvid3: 'fixture-buvid',
};
function fixture(qrOrigin = 'https://account.bilibili.com') {
  let now = 1000,
    status = 86101,
    writes = 0,
    pauses = 0;
  let saved: Credentials | null = { ...secret, sessdata: 'previous-account' };
  let failSave = false,
    failNetwork = false,
    missingCookie = false;
  const calls: string[] = [];
  let gate: Promise<void> | undefined;
  const login = new LoginManager(
    {
      read: () => saved,
      save: (value) => {
        if (failSave) throw Error('private disk failure');
        saved = value;
        writes++;
      },
    },
    {
      now: () => now,
      fetch: (async (input: string | URL | Request, init?: RequestInit) => {
        const url = input instanceof Request ? input.url : String(input);
        calls.push(url);
        if (failNetwork) throw Error('network error with fixture-login-secret%2F');
        if (url.includes('/qrcode/generate'))
          return Response.json({
            code: 0,
            data: {
              qrcode_key: 'fixture-key',
              url: qrOrigin + '/h5/account-h5/auth/scan-web?qrcode_key=fixture-key',
            },
          });
        if (url.includes('/qrcode/poll')) {
          const current = status;
          await gate;
          const headers = new Headers();
          if (current === 0 && !missingCookie) {
            headers.append('set-cookie', `SESSDATA=${secret.sessdata}; HttpOnly; Secure`);
            headers.append('set-cookie', `bili_jct=${secret.bili_jct}; Secure`);
            headers.append('set-cookie', 'not-needed=private-extra');
          }
          return Response.json(
            {
              code: 0,
              data: {
                code: current,
                url: 'https://attacker.example/?SESSDATA=wrong',
                refresh_token: 'private-refresh',
              },
            },
            { headers },
          );
        }
        if (url.includes('/finger/spi'))
          return Response.json({ code: 0, data: { b_3: secret.buvid3 } });
        if (url.includes('/nav')) {
          assert.match(new Headers(init?.headers).get('cookie') ?? '', /SESSDATA=/);
          return Response.json({
            code: 0,
            data: {
              isLogin: true,
              mid: 12345,
              uname: '测试账号',
              face: 'http://i0.hdslb.com/bfs/face/test.jpg',
            },
          });
        }
        throw Error('Unexpected URL');
      }) as typeof fetch,
    },
  );
  return {
    login,
    calls,
    pause: async () => {
      pauses++;
    },
    advance: () => {
      now += 2100;
    },
    expire: () => {
      now += 180001;
    },
    status: (value: number) => {
      status = value;
    },
    block: (value: Promise<void> | undefined) => {
      gate = value;
    },
    fail: (kind: 'save' | 'network' | 'cookie') => {
      if (kind === 'save') failSave = true;
      else if (kind === 'network') failNetwork = true;
      else missingCookie = true;
    },
    get saved() {
      return saved;
    },
    get writes() {
      return writes;
    },
    get pauses() {
      return pauses;
    },
  };
}

test('扫码状态、手机确认和账号校验；只保存白名单 Cookie，结果无凭据', async () => {
  const f = fixture();
  const qr = await f.login.start();
  assert.match(qr.image, /^data:image\/png;base64,/);
  assert.ok(!JSON.stringify(qr).includes('fixture-key'));
  assert.equal((await f.login.poll(qr.handle, f.pause)).status, 'waiting');
  f.status(86090);
  f.advance();
  assert.equal((await f.login.poll(qr.handle, f.pause)).status, 'scanned');
  f.status(0);
  f.advance();
  const result = await f.login.poll(qr.handle, f.pause);
  assert.equal(result.status, 'success');
  assert.deepEqual(result.account, {
    uid: '12345',
    name: '测试账号',
    avatar: 'https://i0.hdslb.com/bfs/face/test.jpg',
  });
  assert.deepEqual(f.saved, secret);
  assert.equal(f.writes, 1);
  assert.equal(f.pauses, 1);
  assert.ok(
    !JSON.stringify(result).match(/fixture-login-secret|private-extra|private-refresh|fixture-key/),
  );
  await f.login.poll(qr.handle, f.pause);
  assert.equal(f.writes, 1);
  assert.equal((await f.login.check()).status, 'connected');
  await f.login.manual({ ...secret, sessdata: 'new-manual-account' }, f.pause);
  assert.equal((await f.login.poll(qr.handle, f.pause)).status, 'cancelled');
  f.login.dispose();
});

test('检查连接期间凭据被替换，迟到的旧账号信息不会返回', async () => {
  let saved = { ...secret },
    release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const login = new LoginManager(
    {
      read: () => saved,
      save: (value) => {
        saved = value;
      },
    },
    {
      fetch: (async () => {
        await gate;
        return Response.json({ code: 0, data: { isLogin: true, mid: 100, uname: '旧账号' } });
      }) as typeof fetch,
    },
  );
  const check = login.check();
  await login.manual({ ...secret, sessdata: 'replacement-account' }, async () => {});
  release();
  await assert.rejects(check, /账号已变更/);
});

test('二维码过期和未知状态不覆盖已有凭据', async () => {
  const f = fixture();
  let qr = await f.login.start();
  f.expire();
  assert.equal((await f.login.poll(qr.handle, f.pause)).status, 'expired');
  assert.equal(f.calls.filter((s) => s.includes('/poll')).length, 0);
  qr = await f.login.start();
  f.status(86038);
  assert.equal((await f.login.poll(qr.handle, f.pause)).status, 'expired');
  qr = await f.login.start();
  f.status(99999);
  await assert.rejects(f.login.poll(qr.handle, f.pause), /异常|失败/);
  assert.equal(f.saved?.sessdata, 'previous-account');
  assert.equal(f.writes, 0);
  f.login.dispose();
});

test('兼容 B 站两个官方扫码域名，拒绝非 HTTPS 和其他域名', async () => {
  const legacy = fixture('https://passport.bilibili.com');
  await legacy.login.start();
  legacy.login.dispose();
  for (const origin of [
    'http://account.bilibili.com',
    'https://account.bilibili.com.attacker.example',
  ]) {
    const invalid = fixture(origin);
    await assert.rejects(invalid.login.start(), /二维码地址异常/);
    assert.equal(invalid.writes, 0);
    invalid.login.dispose();
  }
});

test('合并并发轮询并限频；取消后迟到的成功响应不能写入', async () => {
  const f = fixture();
  const qr = await f.login.start();
  let release!: () => void;
  f.block(
    new Promise<void>((r) => {
      release = r;
    }),
  );
  f.status(0);
  const a = f.login.poll(qr.handle, f.pause),
    b = f.login.poll(qr.handle, f.pause);
  await Promise.resolve();
  await Promise.resolve();
  f.login.cancel(qr.handle);
  release();
  assert.equal((await a).status, 'cancelled');
  assert.equal((await b).status, 'cancelled');
  assert.equal(f.calls.filter((s) => s.includes('/poll')).length, 1);
  assert.equal(f.writes, 0);
  assert.equal(f.pauses, 0);
  f.block(undefined);
  f.status(86101);
  const next = await f.login.start();
  await f.login.poll(next.handle, f.pause);
  await f.login.poll(next.handle, f.pause);
  assert.equal(f.calls.filter((s) => s.includes('/poll')).length, 2);
  f.login.dispose();
});

test('新二维码和手动保存使旧尝试失效；保存前暂停，失败保留原凭据', async () => {
  const f = fixture();
  const old = await f.login.start(),
    next = await f.login.start();
  assert.equal((await f.login.poll(old.handle, f.pause)).status, 'cancelled');
  await f.login.manual({ ...secret, sessdata: 'manual-session' }, f.pause);
  assert.equal((await f.login.poll(next.handle, f.pause)).status, 'cancelled');
  assert.equal(f.saved?.sessdata, 'manual-session');
  assert.equal(f.pauses, 1);
  const last = await f.login.start();
  f.status(0);
  f.fail('save');
  await assert.rejects(f.login.poll(last.handle, f.pause), /保存/);
  assert.equal(f.saved?.sessdata, 'manual-session');
  f.login.dispose();
});

test('网络错误和缺失 Cookie 不泄露响应，不使用回跳 URL 的认证参数', async () => {
  const f = fixture(),
    qr = await f.login.start();
  f.fail('network');
  await assert.rejects(
    f.login.poll(qr.handle, f.pause),
    (error: Error) =>
      !error.message.includes('fixture-login-secret') && /网络|连接|请求/.test(error.message),
  );
  f.login.dispose();
  const bad = fixture(),
    badQr = await bad.login.start();
  bad.status(0);
  bad.fail('cookie');
  await assert.rejects(bad.login.poll(badQr.handle, bad.pause), /登录信息/);
  assert.equal(bad.writes, 0);
  assert.equal(bad.pauses, 0);
  bad.login.dispose();
});
