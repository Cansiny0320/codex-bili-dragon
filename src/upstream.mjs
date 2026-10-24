import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { vendor } from "./paths.mjs";
import { atomic } from "./store.mjs";
import { readConfig } from "./config.mjs";
export function syncUpstream(store, config) {
  fs.mkdirSync(path.join(store.dir, ".bili-ai"), {
    recursive: true,
    mode: 0o700,
  });
  fs.mkdirSync(path.join(store.dir, "runtime"), {
    recursive: true,
    mode: 0o700,
  });
  atomic(path.join(store.dir, "upstream-config.json"), {
    ...config,
    notify: {
      type: "file",
      path: path.join(store.dir, "runtime", "notifications.jsonl"),
    },
    persona: { ...config.persona },
    self: {},
    aliases: [config.persona.name],
  });
  atomic(path.join(store.dir, ".bili-ai", "persona.md"), config.persona.body);
  atomic(
    path.join(store.dir, "runtime", "whale-diary.md"),
    "# 已读视频\n" +
      store
        .read("diaries", [])
        .filter((x) => x.bvid)
        .map((x) => x.bvid)
        .join("\n"),
  );
}
export function redact(value, dir) {
  let s = String(value);
  try {
    const c = JSON.parse(
      fs.readFileSync(path.join(dir, ".bili-ai/credentials.json"), "utf8"),
    );
    for (const v of Object.values(c))
      if (typeof v === "string" && v.length > 3)
        s = s
          .split(v)
          .join("[已隐藏]")
          .split(encodeURIComponent(v))
          .join("[已隐藏]");
  } catch {}
  return s;
}
export function runUpstream(
  store,
  args,
  { channel = "", timeout = 180000, signal } = {},
) {
  const routes = {
    session: "verify/session.mjs",
    search: "commands/search.mjs",
    video: "commands/video-content.mjs",
    subtitles: "commands/subtitles.mjs",
    comments: "commands/comments.mjs",
    debrief: "commands/debrief.mjs",
    "watch-video": "commands/bili-watch.mjs",
    feed: "commands/feed.mjs",
    quota: "commands/quota.mjs",
    "comment-digest": "commands/comment-digest.mjs",
    "dm-await": "commands/dm-await.mjs",
    await: "commands/danmaku-await.mjs",
    comment: "commands/comment.mjs",
    dm: "commands/dm.mjs",
    danmaku: "commands/danmaku.mjs",
  };
  const target = routes[args[0]];
  if (!target) throw Error("不支持的上游命令");
  return new Promise((resolve, reject) =>
    execFile(
      process.execPath,
      [path.join(vendor, "tools", target), ...args.slice(1)],
      {
        cwd: store.dir,
        windowsHide: true,
        timeout,
        signal,
        maxBuffer: 16 * 1024 * 1024,
        env: {
          ...process.env,
          TZ: readConfig(store).timezone,
          BILI_DRAGON_DATA: store.dir,
          BILI_DRAGON_WRITE_CHANNEL: channel,
          DSH_NODE: process.execPath,
        },
      },
      (error, stdout, stderr) => {
        const result = {
          code: error ? (Number.isInteger(error.code) ? error.code : 3) : 0,
          out: redact(stdout, store.dir),
          err: redact(stderr, store.dir),
        };
        if (
          error?.killed ||
          error?.code === "ETIMEDOUT" ||
          error?.code === "ABORT_ERR"
        )
          reject(Error("工具超时，结果未确认；不要自动重新发送。"));
        else resolve(result);
      },
    ),
  );
}
