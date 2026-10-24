import fs from 'node:fs';
import path from 'node:path';
import { dataRoot } from './paths.js';
import { validateConfig, type Config } from './config.js';
import type { Channel } from './types.js';
export function assertChannel(config: Config, channel: Channel) {
  if (config.permissions?.[channel] !== true) throw Error('该发送通道未启用：' + channel);
}
export function assertVendorWrite(input: string | URL | Request, options: RequestInit = {}) {
  const method = String(
    options.method || (input instanceof Request ? input.method : 'GET'),
  ).toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return;
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  const channel = process.env.BILI_DRAGON_WRITE_CHANNEL;
  const routes: Record<string, string[]> = {
    comments: ['api.bilibili.com/x/v2/reply/add'],
    dm: ['api.vc.bilibili.com/web_im/v1/web_im/send_msg'],
    live: ['api.live.bilibili.com/msg/send'],
  };
  if (url.protocol !== 'https:' || !channel || !routes[channel]?.includes(url.host + url.pathname))
    throw Error('当前工具没有该外部写入权限');
  const config = validateConfig(
    JSON.parse(fs.readFileSync(path.join(dataRoot, 'config.json'), 'utf8')),
  );
  assertChannel(config, channel as Channel);
}
