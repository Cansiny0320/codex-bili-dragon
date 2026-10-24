const $ = (id) => document.getElementById(id);
const hash = location.hash.slice(1);
if (hash) {
  sessionStorage.setItem("dragon-token", hash);
  history.replaceState(null, "", location.pathname);
}
let config,
  dirty = false;
async function api(route, data) {
  const response = await fetch("/api/" + route, {
    method: data === undefined ? "GET" : "POST",
    headers: {
      authorization: "Bearer " + sessionStorage.getItem("dragon-token"),
      ...(data === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const value = await response.json();
  if (!response.ok) throw Error(value.error || "请求失败");
  return value;
}
function notice(text, error = false) {
  $("notice").textContent = text;
  $("notice").classList.toggle("error", error);
}
function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function empty(target, text) {
  target.replaceChildren(node("div", text, "empty"));
}
const states = {
  pending: "待处理",
  running: "进行中",
  done: "已完成",
  "needs-review": "待核查",
  dismissed: "已关闭",
  draft: "待审核",
  sent: "已发送",
  rejected: "已拒绝",
  sending: "发送中",
  confirmed: "已确认",
};
function card(title, body, meta) {
  const el = node("article", undefined, "card");
  el.append(
    node("h4", title),
    node("div", meta ?? "", "meta"),
    node(
      "div",
      typeof body === "string" ? body : JSON.stringify(body, null, 2),
      "body",
    ),
  );
  return el;
}
function action(label, fn) {
  const button = node("button", label);
  button.type = "button";
  button.onclick = async () => {
    button.disabled = true;
    try {
      await fn();
      notice("已处理");
      await refresh();
    } catch (e) {
      notice(e.message, true);
    } finally {
      button.disabled = false;
    }
  };
  return button;
}
function setConfig(c) {
  config = c;
  if (dirty) return;
  for (const input of $("settingsForm").elements) {
    if (!input.name) continue;
    let v = input.name.split(".").reduce((o, k) => o?.[k], c);
    if (input.name === "night.windows")
      v = v.map((w) => `${w.start} ${w.end} ${w.wakes}`).join("\n");
    else if (Array.isArray(v)) v = v.join("\n");
    if (input.type === "checkbox") input.checked = v;
    else input.value = v ?? "";
  }
}
async function refresh() {
  const s = await api("state");
  setConfig(s.config);
  $("state").textContent =
    s.runtime.state === "running"
      ? "正在探索"
      : s.config.enabled
        ? "按作息活动"
        : "已暂停";
  $("account").textContent = s.hasCredentials ? "已保存凭据" : "尚未配置";
  $("next").textContent =
    s.config.enabled && s.schedule.atMs
      ? new Date(s.schedule.atMs).toLocaleString("zh-CN", {
          timeZone: s.config.timezone,
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "等待开启";
  $("draftCount").textContent = s.drafts.filter(
    (d) => d.state === "draft",
  ).length;
  $("publicTitle").textContent = s.config.persona.diaryTitle;
  for (const [id, key] of [
    ["publicDiary", "publicText"],
    ["privateDiary", "privateText"],
  ]) {
    const target = $(id);
    target.replaceChildren();
    if (!s.diaries.length)
      empty(
        target,
        id === "publicDiary"
          ? "还没有写下第一封信。\n从一次小小的探索开始吧。"
          : "这里会留下小白龙自己的想法。\n暂时留白，也很好。",
      );
    for (const d of [...s.diaries].reverse().slice(0, 30)) {
      const item = card(d.title, d[key], new Date(d.at).toLocaleString());
      item.append(node("div", "实际阅读：" + d.evidence, "evidence"));
      target.append(item);
    }
  }
  $("draftList").replaceChildren();
  if (!s.drafts.length) empty($("draftList"), "暂时没有需要你审核的话。");
  for (const d of [...s.drafts].reverse()) {
    const e = s.inbox.find((x) => x.id === d.eventId);
    const item = card(
      (e?.who || e?.name || e?.mid || "回复草稿") +
        " · " +
        (states[d.state] ?? d.state),
      d.text,
      e?.text ?? d.eventId,
    );
    if (d.state === "draft") {
      const buttons = node("div", undefined, "actions");
      buttons.append(
        action("审核并发送", () => api("approve", { id: d.id })),
        action("不发送", () => api("reject", { id: d.id })),
      );
      item.append(buttons);
    }
    $("draftList").append(item);
  }
  $("inboxList").replaceChildren();
  for (const e of [...s.inbox].reverse().slice(0, 20))
    $("inboxList").append(
      card(
        e.who || e.name || e.mid,
        e.text,
        e.channel + " · " + new Date(e.receivedAt).toLocaleString(),
      ),
    );
  $("jobList").replaceChildren();
  if (!s.jobs.length) empty($("jobList"), "第一段活动足迹，还在等你开启。");
  for (const j of [...s.jobs].reverse().slice(0, 50)) {
    const item = card(
      (j.type === "browse" ? "自主浏览" : "回应消息") +
        " · " +
        (states[j.state] ?? j.state),
      j.result ?? "",
      new Date(j.createdAt).toLocaleString(),
    );
    if (["needs-review", "pending"].includes(j.state))
      item.append(
        action("已核查，关闭记录", () => api("dismiss", { id: j.id })),
      );
    $("jobList").append(item);
  }
  $("operationList").replaceChildren();
  for (const op of [...s.operations].reverse().slice(0, 30))
    $("operationList").append(
      card(
        op.channel + " · " + (states[op.state] ?? op.state),
        op.error || op.result || "",
        op.key,
      ),
    );
  $("listenerStatus").textContent =
    Object.entries(s.listeners)
      .map(([k, v]) => `${k}: ${v.ok ? "正常" : v.error}`)
      .join("\n") || "尚未启用消息监听";
  if (s.runtime.error) notice(s.runtime.error, true);
}
for (const tab of document.querySelectorAll("[data-tab]"))
  tab.onclick = () => {
    for (const el of document.querySelectorAll(".panel"))
      el.hidden = el.id !== tab.dataset.tab;
    for (const el of document.querySelectorAll(".tab"))
      el.classList.toggle("active", el === tab);
  };
$("settingsForm").oninput = () => {
  dirty = true;
};
$("settingsForm").onsubmit = async (e) => {
  e.preventDefault();
  try {
    const next = structuredClone(config);
    for (const input of e.target.elements) {
      if (!input.name) continue;
      const parts = input.name.split(".");
      let target = next;
      for (const part of parts.slice(0, -1)) target = target[part];
      let value =
        input.type === "checkbox"
          ? input.checked
          : input.type === "number"
            ? Number(input.value)
            : input.value;
      if (input.name === "night.windows")
        value = value
          .trim()
          .split(/\n+/)
          .map((line) => {
            const [start, end, wakes] = line.trim().split(/\s+/);
            return { start, end, wakes: Number(wakes) };
          });
      else if (input.name.startsWith("preferences."))
        value = value
          .split("\n")
          .map((v) => v.trim())
          .filter(Boolean);
      target[parts.at(-1)] = value;
    }
    await api("config", next);
    dirty = false;
    notice("设置已保存");
    await refresh();
  } catch (e) {
    notice(e.message, true);
  }
};
$("credentialsForm").onsubmit = async (e) => {
  e.preventDefault();
  try {
    await api("credentials", Object.fromEntries(new FormData(e.target)));
    e.target.reset();
    notice("账号凭据已保存，页面不会回显");
    await refresh();
  } catch (e) {
    notice(e.message, true);
  }
};
for (const [id, route] of [
  ["run", "run"],
  ["pause", "pause"],
  ["checkLogin", "check-login"],
])
  $(id).onclick = async () => {
    const button = $(id);
    button.disabled = true;
    try {
      const result = await api(route, {});
      if (id === "checkLogin")
        $("loginResult").textContent = result.content
          .map((x) => x.text ?? "")
          .join("\n");
      else notice(id === "run" ? "探索任务已加入队列" : "已暂停");
      await refresh();
    } catch (e) {
      notice(e.message, true);
    } finally {
      button.disabled = false;
    }
  };
refresh().catch((e) => notice(e.message, true));
setInterval(() => refresh().catch((e) => notice(e.message, true)), 10000);
