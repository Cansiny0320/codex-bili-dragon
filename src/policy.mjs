import fs from "node:fs";
import path from "node:path";
import { dataRoot } from "./paths.mjs";
export function assertChannel(config, channel) {
  if (config.permissions?.[channel] !== true)
    throw Error("该发送通道未启用：" + channel);
}
export function assertVendorWrite(input, options = {}) {
  const method = String(
    options.method || (input instanceof Request ? input.method : "GET"),
  ).toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return;
  const url = new URL(
    typeof input === "string" || input instanceof URL ? input : input.url,
  );
  const channel = process.env.BILI_DRAGON_WRITE_CHANNEL;
  const routes = {
    comments: ["api.bilibili.com/x/v2/reply/add"],
    dm: ["api.vc.bilibili.com/web_im/v1/web_im/send_msg"],
    live: ["api.live.bilibili.com/msg/send"],
  };
  if (
    url.protocol !== "https:" ||
    !routes[channel]?.includes(url.host + url.pathname)
  )
    throw Error("当前工具没有该外部写入权限");
  const config = JSON.parse(
    fs.readFileSync(path.join(dataRoot, "config.json"), "utf8"),
  );
  assertChannel(config, channel);
}
