import fs from "node:fs";
import path from "node:path";
import { atomic } from "./store.mjs";
export class Listeners {
  constructor(service) {
    this.service = service;
    this.next = {};
    this.failures = {};
    this.active = new Set();
    this.stopped = false;
  }
  enqueue(event) {
    if (this.stopped || this.suspended)
      throw Error("监听已暂停，未确认消息交接");
    this.service.ingest(event);
    this.service.queue.add("event:" + event.id, "message", {
      eventId: event.id,
    });
    if (event.mid && String(event.mid) === this.service.config().owner.mid) {
      const file = path.join(this.service.store.dir, ".bili-ai/feedback.json");
      let state = {};
      try {
        state = JSON.parse(fs.readFileSync(file, "utf8"));
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
      if (!(state.events ?? []).some((x) => x.eventId === event.id)) {
        state.last = new Date().toISOString();
        state.events = [
          ...(state.events ?? []),
          { at: state.last, eventId: event.id, note: "收到主人消息" },
        ].slice(-200);
        atomic(file, state);
      }
    }
  }
  async dm() {
    const r = await this.service.run(["dm-await", "--peek", "--json"]);
    if (r.code === 1) return;
    if (r.code !== 0) throw Error(r.err || "私信读取失败");
    const e = JSON.parse(r.out);
    if (!e.hit) return;
    const owner = this.service.config().owner.mid;
    if (!owner || String(e.mid) !== owner || !e.key || !e.receipt)
      throw Error("私信身份或确认凭据无效");
    this.enqueue({
      id: "dm:" + e.mid + ":" + e.key,
      channel: "dm",
      mid: String(e.mid),
      text: e.text,
      time: e.ts,
    });
    const ack = await this.service.run(["dm-await", "--ack", e.receipt]);
    if (ack.code !== 0) throw Error("私信已保存但确认失败，下次只重试确认");
  }
  async comments() {
    const r = await this.service.run([
      "comment-digest",
      "--hours",
      "24",
      "--pages",
      "2",
      "--json",
    ]);
    if (r.code !== 0) throw Error(r.err || "评论读取失败");
    const data = JSON.parse(r.out);
    if (!data.ok || !Array.isArray(data.items))
      throw Error("评论读取不完整，未推进游标");
    const cursor = this.service.store.read("comment-cursor", null);
    const ids = data.items.map(
      (e) => String(e.kind ?? "reply") + ":" + String(e.id ?? e.rpid),
    );
    if (cursor) {
      for (let i = 0; i < data.items.length; i++)
        if (!cursor.ids.includes(ids[i]))
          this.enqueue({
            ...data.items[i],
            mid: String(data.items[i].mid ?? ""),
            id: "comment:" + ids[i],
            channel: "comments",
          });
    }
    this.service.store.write("comment-cursor", {
      ids: [...new Set([...(cursor?.ids ?? []), ...ids])].slice(-5000),
    });
  }
  async live() {
    const c = this.service.config();
    if (!c.listen.liveRoom) return;
    const r = await this.service.run(
      [
        "await",
        "--room",
        c.listen.liveRoom,
        "--scope",
        c.listen.liveScope,
        "--timeout",
        "50",
      ],
      { timeout: 75000 },
    );
    if (r.code !== 0) throw Error(r.err || "直播监听失败");
    if (r.out.includes("AWAIT_DEAD"))
      throw Error("直播连接没有收到数据，已退避");
    const line = r.out
      .split(/\r?\n/)
      .find((x) => x.startsWith("DRAGON_LIVE_HIT "));
    if (!line) return;
    const e = JSON.parse(line.slice(16));
    this.enqueue({
      ...e,
      id: "live:" + e.room + ":" + e.dmid,
      channel: "live",
      mid: String(e.mid),
    });
    const file = path.join(
      this.service.store.dir,
      ".bili-ai/dragon-live-pending.json",
    );
    const pending = JSON.parse(fs.readFileSync(file, "utf8"));
    if (pending.receipt === e.receipt) fs.unlinkSync(file);
  }
  tick(now = Date.now()) {
    if (this.stopped) return;
    const c = this.service.config();
    for (const [name, enabled, seconds, fn] of [
      [
        "comments",
        c.listen.comment,
        c.listen.commentIntervalSec,
        () => this.comments(),
      ],
      ["dm", c.listen.dm, c.listen.dmIntervalSec, () => this.dm()],
      ["live", c.listen.live, 60, () => this.live()],
    ]) {
      if (!enabled || this.active.has(name) || (this.next[name] ?? 0) > now)
        continue;
      this.active.add(name);
      void fn()
        .then(() => {
          this.failures[name] = 0;
          this.next[name] = Date.now() + seconds * 1000;
          this.service.store.update("listener-status", {}, (s) => {
            s[name] = { ok: true, at: new Date().toISOString() };
          });
        })
        .catch((e) => {
          const n = (this.failures[name] = (this.failures[name] ?? 0) + 1);
          this.next[name] =
            Date.now() + Math.min(900000, seconds * 1000 * 2 ** Math.min(n, 5));
          this.service.store.update("listener-status", {}, (s) => {
            s[name] = {
              ok: false,
              error: e.message,
              nextAt: new Date(this.next[name]).toISOString(),
            };
          });
        })
        .finally(() => this.active.delete(name));
    }
  }
  stop() {
    this.stopped = true;
  }
}
