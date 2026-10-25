import { randomUUID } from 'node:crypto';
import QRCode from 'qrcode';
import { z } from 'zod';

const cookieValue = z
  .string()
  .trim()
  .min(1)
  .regex(/^[^;\r\n]+$/)
  .refine((value) => !value.includes(String.fromCharCode(0)));
export const credentialsSchema = z
  .object({
    sessdata: cookieValue.max(2048),
    bili_jct: z
      .string()
      .trim()
      .regex(/^[a-f\d]{32}$/i),
    buvid3: cookieValue.max(256),
  })
  .strict();
export type Credentials = z.infer<typeof credentialsSchema>;
export interface LoginAccount {
  uid: string;
  name: string;
  avatar?: string;
}
export interface AccountState {
  status: 'unconfigured' | 'connected' | 'expired';
  account?: LoginAccount;
}
export interface LoginProgress {
  status: 'waiting' | 'scanned' | 'success' | 'expired' | 'cancelled';
  account?: LoginAccount;
}
export interface LoginQr {
  handle: string;
  image: string;
  expiresAt: number;
}
interface Storage {
  read(): Credentials | null;
  save(value: Credentials): void;
}
export interface LoginOptions {
  fetch?: typeof fetch;
  now?: () => number;
}
interface Attempt {
  handle: string;
  key: string;
  expiresAt: number;
  controller: AbortController;
  timer: ReturnType<typeof setTimeout>;
  result: LoginProgress;
  nextPoll: number;
  pending?: Promise<LoginProgress>;
}
const envelope = z.object({ code: z.number(), data: z.unknown().optional() });
const qrSchema = z.object({
  qrcode_key: z.string().min(1).max(256),
  url: z.string().url().max(2048),
});
const navSchema = z.object({
  isLogin: z.literal(true),
  mid: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]),
  uname: z.string().max(200),
  face: z.string().optional(),
});
class LoginError extends Error {}

function avatar(input?: string) {
  if (!input) return;
  try {
    const url = new URL(input.startsWith('//') ? 'https:' + input : input);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.port ||
      !url.hostname.endsWith('.hdslb.com')
    )
      return;
    url.protocol = 'https:';
    return url.href;
  } catch {
    return;
  }
}

export class LoginManager {
  private attempt?: Attempt;
  private committing = false;
  private transport: typeof fetch;
  private now: () => number;
  constructor(
    private storage: Storage,
    options: LoginOptions = {},
  ) {
    this.transport = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
  }
  private async request(url: string, signal?: AbortSignal, credentials?: Credentials) {
    let response: Response;
    try {
      response = await this.transport(url, {
        headers: {
          'user-agent': 'Mozilla/5.0',
          referer: 'https://www.bilibili.com/',
          ...(credentials
            ? {
                cookie: `SESSDATA=${credentials.sessdata}; bili_jct=${credentials.bili_jct}; buvid3=${credentials.buvid3}`,
              }
            : {}),
        },
        redirect: 'error',
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(10000)])
          : AbortSignal.timeout(10000),
      });
    } catch {
      throw new LoginError('无法连接 B 站，请检查网络后重试');
    }
    if (!response.ok)
      throw new LoginError(
        response.status === 429 || response.status === 412
          ? 'B 站暂时限制登录请求，请稍后重试'
          : 'B 站登录请求失败，请稍后重试',
      );
    let body: z.infer<typeof envelope>;
    try {
      body = envelope.parse(await response.json());
    } catch {
      throw new LoginError('B 站登录响应异常，请重试');
    }
    if (body.code === -101) return { response, code: body.code, data: null };
    if (body.code !== 0) throw new LoginError('B 站登录请求失败，请稍后重试');
    return { response, code: 0, data: body.data };
  }
  private finish(attempt: Attempt, result: LoginProgress) {
    clearTimeout(attempt.timer);
    attempt.key = '';
    attempt.result = result;
    attempt.controller.abort();
    return result;
  }
  private current(attempt: Attempt): boolean {
    if (
      this.attempt !== attempt ||
      attempt.result.status === 'cancelled' ||
      attempt.result.status === 'expired'
    )
      return false;
    if (this.now() >= attempt.expiresAt && attempt.result.status !== 'success') {
      this.finish(attempt, { status: 'expired' });
      return false;
    }
    return true;
  }
  cancel(handle: string) {
    if (this.attempt?.handle === handle && this.attempt.result.status !== 'success')
      this.finish(this.attempt, { status: 'cancelled' });
    return { cancelled: true };
  }
  dispose() {
    if (this.attempt) this.cancel(this.attempt.handle);
    this.attempt = undefined;
  }
  async start(): Promise<LoginQr> {
    if (this.committing) throw new LoginError('正在保存账号连接，请稍后重试');
    this.dispose();
    const attempt: Attempt = {
      handle: randomUUID(),
      key: '',
      expiresAt: this.now() + 180000,
      controller: new AbortController(),
      timer: setTimeout(() => {
        this.finish(attempt, { status: 'expired' });
      }, 180000),
      result: { status: 'waiting' },
      nextPoll: 0,
    };
    attempt.timer.unref();
    this.attempt = attempt;
    try {
      const { data } = await this.request(
        'https://passport.bilibili.com/x/passport-login/web/qrcode/generate?source=main-fe-header',
        attempt.controller.signal,
      );
      const qr = qrSchema.parse(data);
      const url = new URL(qr.url);
      if (
        url.protocol !== 'https:' ||
        !['passport.bilibili.com', 'account.bilibili.com'].includes(url.hostname) ||
        url.username ||
        url.password ||
        url.port
      )
        throw new LoginError('二维码地址异常，请重试');
      attempt.key = qr.qrcode_key;
      const image = await QRCode.toDataURL(url.href, {
        width: 240,
        margin: 4,
        errorCorrectionLevel: 'M',
      });
      if (!this.current(attempt)) throw new LoginError('二维码已取消或过期，请重新获取');
      return { handle: attempt.handle, image, expiresAt: attempt.expiresAt };
    } catch (error) {
      this.finish(attempt, { status: 'cancelled' });
      throw error instanceof LoginError ? error : new LoginError('无法生成登录二维码，请重试');
    }
  }
  async poll(handle: string, pause: () => Promise<void>): Promise<LoginProgress> {
    const attempt = this.attempt;
    if (!attempt || attempt.handle !== handle) return { status: 'cancelled' };
    if (!this.current(attempt) || attempt.result.status === 'success') return attempt.result;
    if (attempt.pending) return attempt.pending;
    if (this.now() < attempt.nextPoll) return attempt.result;
    attempt.nextPoll = this.now() + 2000;
    attempt.pending = this.pollOnce(attempt, pause).finally(() => {
      attempt.pending = undefined;
    });
    return attempt.pending;
  }
  private async pollOnce(attempt: Attempt, pause: () => Promise<void>): Promise<LoginProgress> {
    try {
      const { data, response } = await this.request(
        'https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=' +
          encodeURIComponent(attempt.key) +
          '&source=main-fe-header',
        attempt.controller.signal,
      );
      if (!this.current(attempt)) return attempt.result;
      const code = z.object({ code: z.number() }).parse(data).code;
      if (code === 86101 || code === 86090) {
        attempt.result = { status: code === 86101 ? 'waiting' : 'scanned' };
        return attempt.result;
      }
      if (code === 86038) return this.finish(attempt, { status: 'expired' });
      if (code !== 0) throw new LoginError('B 站扫码状态异常，请重新获取二维码');
      const cookies = new Map(
        response.headers.getSetCookie().map((value) => {
          const pair = value.split(';', 1)[0];
          const index = pair.indexOf('=');
          return [pair.slice(0, index), pair.slice(index + 1)];
        }),
      );
      if (!cookies.get('SESSDATA') || !cookies.get('bili_jct'))
        throw new LoginError('扫码未返回完整登录信息，请重新扫码');
      let buvid3 = cookies.get('buvid3');
      if (!buvid3) {
        const spi = await this.request(
          'https://api.bilibili.com/x/frontend/finger/spi',
          attempt.controller.signal,
        );
        buvid3 = z.object({ b_3: z.string() }).parse(spi.data).b_3;
      }
      const parsed = credentialsSchema.safeParse({
        sessdata: cookies.get('SESSDATA'),
        bili_jct: cookies.get('bili_jct'),
        buvid3,
      });
      if (!parsed.success) throw new LoginError('扫码未返回完整登录信息，请重新扫码');
      const account = await this.identity(parsed.data, attempt.controller.signal);
      if (!account) throw new LoginError('扫码登录未通过校验，请重新扫码');
      if (!this.current(attempt)) return attempt.result;
      this.committing = true;
      try {
        await pause();
        if (!this.current(attempt)) return attempt.result;
        this.storage.save(parsed.data);
      } catch {
        throw new LoginError('无法保存账号连接，原有凭据未更改，请重试');
      } finally {
        this.committing = false;
      }
      return this.finish(attempt, { status: 'success', account });
    } catch (error) {
      if (!this.current(attempt)) return attempt.result;
      this.finish(attempt, { status: 'cancelled' });
      throw error instanceof LoginError ? error : new LoginError('B 站登录响应异常，请重新扫码');
    }
  }
  private async identity(
    credentials: Credentials,
    signal?: AbortSignal,
  ): Promise<LoginAccount | null> {
    const { data, code } = await this.request(
      'https://api.bilibili.com/x/web-interface/nav',
      signal,
      credentials,
    );
    if (
      code === -101 ||
      (data && typeof data === 'object' && 'isLogin' in data && data.isLogin === false)
    )
      return null;
    const result = navSchema.safeParse(data);
    if (!result.success) throw new LoginError('B 站账号信息异常，请重试');
    return {
      uid: String(result.data.mid),
      name: result.data.uname,
      avatar: avatar(result.data.face),
    };
  }
  async check(): Promise<AccountState> {
    const credentials = this.storage.read();
    if (!credentials) return { status: 'unconfigured' };
    const account = await this.identity(credentialsSchema.parse(credentials));
    if (JSON.stringify(this.storage.read()) !== JSON.stringify(credentials))
      throw new LoginError('登录账号已变更，请重新检查连接');
    return account ? { status: 'connected', account } : { status: 'expired' };
  }
  async manual(input: unknown, pause: () => Promise<void>) {
    const parsed = credentialsSchema.safeParse(input);
    if (!parsed.success) throw new LoginError('Cookie 格式不正确，请检查三个字段');
    if (this.committing) throw new LoginError('正在保存账号连接，请稍后重试');
    this.dispose();
    this.committing = true;
    try {
      await pause();
      this.storage.save(parsed.data);
    } catch {
      throw new LoginError('无法保存账号连接，原有凭据未更改，请重试');
    } finally {
      this.committing = false;
    }
    return { saved: true };
  }
}
