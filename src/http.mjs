import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { root } from "./paths.mjs";
import { redact } from "./upstream.mjs";
export async function createHttp(service, daemon, { port = 18841 } = {}) {
  const token = crypto.randomBytes(32).toString("base64url");
  let origin;
  const send = (
    res,
    status,
    value,
    type = "application/json; charset=utf-8",
  ) => {
    res.writeHead(status, {
      "content-type": type,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "content-security-policy":
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    });
    res.end(
      type.startsWith("application/json") ? JSON.stringify(value) : value,
    );
  };
  const server = http.createServer(async (req, res) => {
    try {
      if (req.headers.host !== new URL(origin).host) {
        send(res, 403, { error: "Host 不匹配" });
        return;
      }
      const url = new URL(req.url, origin);
      if (!url.pathname.startsWith("/api/")) {
        const files = {
          "/": ["index.html", "text/html; charset=utf-8"],
          "/app.js": ["app.js", "text/javascript; charset=utf-8"],
          "/style.css": ["style.css", "text/css; charset=utf-8"],
        };
        const file = files[url.pathname];
        if (req.method !== "GET" || !file) {
          send(res, 404, { error: "不存在" });
          return;
        }
        send(
          res,
          200,
          fs.readFileSync(path.join(root, "web", file[0])),
          file[1],
        );
        return;
      }
      const auth = Buffer.from(req.headers.authorization ?? ""),
        expected = Buffer.from("Bearer " + token);
      if (
        auth.length !== expected.length ||
        !crypto.timingSafeEqual(auth, expected)
      ) {
        send(res, 401, { error: "请通过启动时显示的链接打开管理页" });
        return;
      }
      if (req.method === "GET" && url.pathname === "/api/state") {
        send(res, 200, {
          ...service.status(),
          listeners: service.store.read("listener-status", {}),
          schedule: service.store.read("schedule", {}),
        });
        return;
      }
      if (req.method !== "POST") {
        send(res, 405, { error: "方法不支持" });
        return;
      }
      if (
        req.headers.origin !== origin ||
        !String(req.headers["content-type"] ?? "").startsWith(
          "application/json",
        )
      ) {
        send(res, 403, { error: "请求来源或格式不匹配" });
        return;
      }
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 128 * 1024) {
          send(res, 413, { error: "请求过大" });
          return;
        }
      }
      const data = JSON.parse(body || "{}");
      let result;
      switch (url.pathname) {
        case "/api/config": {
          const old = service.config();
          result = service.saveConfig({ ...data, codexPath: old.codexPath });
          if (old.enabled && !result.enabled) await daemon.pause();
          break;
        }
        case "/api/credentials":
          result = service.setCredentials(data);
          break;
        case "/api/check-login":
          result = await service.read({ action: "session" });
          break;
        case "/api/run":
          if (
            service.queue
              .list()
              .some((x) => ["pending", "running"].includes(x.state))
          )
            throw Error("已有待处理任务，请先完成或暂停后核查");
          result = service.queue.add(
            "manual:" + crypto.randomUUID(),
            "browse",
            { manual: true },
          );
          void daemon.tick().catch((e) => daemon.error?.(e));
          break;
        case "/api/pause":
          await daemon.pause();
          result = { paused: true };
          break;
        case "/api/approve":
          result = await service.approve(data.id);
          break;
        case "/api/reject":
          result = service.reject(data.id);
          break;
        case "/api/dismiss": {
          const j = service.queue.list().find((x) => x.id === data.id);
          if (!j || !["needs-review", "pending"].includes(j.state))
            throw Error("仅能关闭待核查或待处理任务");
          result = service.queue.dismiss(data.id);
          break;
        }
        default:
          send(res, 404, { error: "接口不存在" });
          return;
      }
      send(res, 200, result ?? { ok: true });
    } catch (e) {
      send(res, 400, { error: redact(e.message, service.store.dir) });
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  origin = "http://127.0.0.1:" + server.address().port;
  return {
    origin,
    token,
    url: origin + "/#" + token,
    server,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
