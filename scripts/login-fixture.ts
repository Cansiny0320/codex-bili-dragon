/** Simulated Bilibili endpoints for browser checks; never contacts a real account. */
export function loginFixture() {
  let status = 86101;
  const calls: string[] = [];
  const transport = (async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    calls.push(url.pathname);
    if (url.pathname.endsWith('/qrcode/generate'))
      return Response.json({
        code: 0,
        data: {
          qrcode_key: 'ui-fixture-qr-key',
          url: 'https://account.bilibili.com/h5/account-h5/auth/scan-web?qrcode_key=ui-fixture-qr-key',
        },
      });
    if (url.pathname.endsWith('/qrcode/poll')) {
      const headers = new Headers();
      if (status === 0) {
        headers.append('set-cookie', 'SESSDATA=qr-fixture-secret-must-not-log; HttpOnly; Secure');
        headers.append('set-cookie', 'bili_jct=' + 'c'.repeat(32) + '; Secure');
      }
      return Response.json({ code: 0, data: { code: status } }, { headers });
    }
    if (url.pathname.endsWith('/finger/spi'))
      return Response.json({ code: 0, data: { b_3: 'qr-fixture-buvid' } });
    if (url.pathname.endsWith('/nav'))
      return Response.json({
        code: 0,
        data: {
          isLogin: true,
          mid: 12345,
          uname: '扫码测试账号',
          face: 'https://test.hdslb.com/avatar.svg',
        },
      });
    throw Error('Unexpected login fixture URL');
  }) as typeof fetch;
  return {
    fetch: transport,
    calls,
    status: (value: number) => {
      status = value;
    },
  };
}
