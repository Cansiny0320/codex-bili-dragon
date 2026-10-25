import { i as __toESM } from "./rolldown-runtime-DYf_mQCB.js";
import { L as require_react, o as require_jsx_runtime } from "./matchContext-Bm7-ArXH.js";
import { D as formatTime, O as useDashboard, j as Link, n as Button } from "./createLucideIcon-BmtKeUIw.js";
import { a as Loading, r as Empty } from "./common-BEruSkQj.js";
// src/components/activity-list.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var sources = {
	autonomous: "自主运行",
	manual: "管理页操作",
	chat: "聊天工具",
	unknown: "来源未记录"
};
var states = {
	running: "进行中",
	success: "已完成",
	failed: "未完成",
	unknown: "待核查",
	draft: "待审核"
};
var pageSize = 30;
function ActivityList({ type = "", status = "", emptyMessage = "没有符合条件的行动记录。" }) {
	const client = useDashboard((state) => state.client);
	const [offset, setOffset] = (0, import_react.useState)(0);
	const [result, setResult] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		let current = true, sequence = 0;
		setResult(null);
		setError("");
		const load = async () => {
			if (!client) return;
			const request = ++sequence;
			try {
				const value = await client.activity({
					type: type || void 0,
					state: status || void 0,
					offset,
					limit: pageSize
				});
				if (current && request === sequence) {
					setResult(value);
					setError("");
				}
			} catch (error) {
				if (current && request === sequence) setError(error instanceof Error ? error.message : "行动记录加载失败");
			}
		};
		load();
		const timer = setInterval(() => void load(), 5e3);
		return () => {
			current = false;
			clearInterval(timer);
		};
	}, [
		client,
		type,
		status,
		offset
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: error }) : !result ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, {}) : !result.items.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: emptyMessage }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "activity-list",
		children: result.items.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivityRow, { row }, row.id))
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "activity-pagination",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "muted",
				children: [
					offset + 1,
					"–",
					offset + result.items.length,
					" / ",
					result.total
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				disabled: offset === 0,
				onClick: () => setOffset(Math.max(0, offset - pageSize)),
				children: "上一页"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				disabled: offset + pageSize >= result.total,
				onClick: () => setOffset(offset + pageSize),
				children: "下一页"
			})
		]
	})] }) });
}
function ActivityRow({ row }) {
	const sent = [
		"share",
		"reply",
		"approve"
	].includes(row.action) && row.channel;
	const result = row.state === "success" && sent ? "已发送" : states[row.state];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
		className: "activity-row",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
				dateTime: row.at,
				title: new Date(row.at).toLocaleString("zh-CN"),
				children: formatTime(row.at)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "activity-heading",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: row.summary }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "muted",
					children: [
						row.channel === "dm" ? "私信 · " : row.channel === "comments" ? "评论 · " : "",
						sources[row.source],
						row.targetName || row.targetMid ? ` · ${row.targetName || row.targetMid}` : ""
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "activity-state " + row.state,
				children: result
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "activity-detail",
			children: [
				row.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "activity-body",
					children: row.text
				}) : sent && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "muted",
					children: "这条历史记录未保存正文。"
				}),
				row.textIncomplete && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "muted",
					children: "历史正文不完整，只保留了当时的日志片段。"
				}),
				row.targetMid && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "muted",
					children: [
						"接收对象：",
						row.targetName ? `${row.targetName} · ` : "",
						"UID ",
						row.targetMid
					]
				}),
				row.error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "activity-error",
					children: row.error
				}),
				row.bvid && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/videos",
					search: { bv: row.bvid },
					className: "text-link",
					children: "查看相关视频"
				}),
				row.action === "diary" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/diary",
					className: "text-link",
					children: "查看日记"
				}),
				row.link && /^https:\/\/www\.bilibili\.com\/video\/BV[0-9A-Za-z]{10}\/?#reply\d+$/.test(row.link) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: row.link,
					target: "_blank",
					rel: "noreferrer",
					className: "text-link",
					children: "查看已发评论"
				}),
				row.finishedAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "muted",
					children: ["结束于 ", formatTime(row.finishedAt)]
				})
			]
		})]
	});
}
export { ActivityList as t };
