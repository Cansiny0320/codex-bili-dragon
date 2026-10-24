import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Store } from "../src/store.mjs";
import { DragonService } from "../src/service.mjs";
function setup(t, run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dragon-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return new DragonService(new Store(dir), run);
}
test("分享目标必须匹配实际读取的视频，不能把 BV 和 aid 拼成另一条评论", async (t) => {
  const calls = [];
  const s = setup(t, async (args) => {
    calls.push(args);
    return {
      code: 0,
      out: JSON.stringify({ ok: true, bvid: "BV1234567890", aid: 99 }),
      err: "",
    };
  });
  s.saveConfig({
    ...s.config(),
    share: { ...s.config().share, enabled: true },
    permissions: { comments: true, dm: false, live: false },
  });
  s.store.write("evidence", { BV1234567890: { actions: ["subtitles"] } });
  await assert.rejects(
    s.share({
      bvid: "BV1234567890",
      aid: "10",
      text: "推荐",
      score: 18,
      reason: "内容很有意思值得分享",
    }),
    /不匹配/,
  );
  assert.ok(calls.every((x) => x[0] !== "comment"));
});
test("陌生人只能进入草稿；审核仍检查开关；重复审核不重复发送", async (t) => {
  let calls = 0;
  const s = setup(t, async () => {
    calls++;
    return { code: 0, out: "ok", err: "" };
  });
  s.saveConfig({ ...s.config(), owner: { mid: "1", name: "主人" } });
  s.ingest({
    id: "c1",
    channel: "comments",
    mid: "2",
    oid: "10",
    root: "11",
    rpid: "12",
    business: 1,
    text: "hello",
  });
  const draft = await s.reply("c1", "你好");
  assert.equal(draft.state, "draft");
  assert.equal(calls, 0);
  await assert.rejects(s.approve(draft.id), /未启用/);
  assert.equal(calls, 0);
  s.saveConfig({
    ...s.config(),
    permissions: { comments: true, dm: false, live: false },
  });
  await s.approve(draft.id);
  await assert.rejects(s.approve(draft.id));
  assert.equal(calls, 1);
});
test("发送超时保留未确认账本；相同事件换内容也不能重发", async (t) => {
  let calls = 0;
  const s = setup(t, async () => {
    calls++;
    throw Error("timeout");
  });
  s.saveConfig({
    ...s.config(),
    owner: { mid: "1", name: "" },
    permissions: { comments: true, dm: false, live: false },
  });
  s.ingest({
    id: "c1",
    channel: "comments",
    mid: "1",
    oid: "10",
    root: "11",
    rpid: "12",
    business: 1,
    text: "hello",
  });
  await assert.rejects(s.reply("c1", "你好"));
  await assert.rejects(s.reply("c1", "再试一次"), /核查|重复/);
  assert.equal(calls, 1);
  assert.equal(s.store.read("operations")[0].state, "needs-review");
});
test("凭据不进入状态，未读视频不能分享，工具不允许传任意命令", async (t) => {
  const s = setup(t, async () => ({ code: 0, out: "ok", err: "" }));
  s.setCredentials({
    sessdata: "test-secret",
    bili_jct: "a".repeat(32),
    buvid3: "test-buvid",
  });
  assert.ok(!JSON.stringify(s.status()).includes("test-secret"));
  await assert.rejects(
    s.share({
      bvid: "BV1234567890",
      aid: "10",
      text: "推荐",
      score: 18,
      reason: "这是一段足够长的原因",
    }),
  );
  await assert.rejects(s.read({ action: "shell", query: "anything" }));
});
