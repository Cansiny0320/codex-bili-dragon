import { i as __toESM } from "./rolldown-runtime-DYf_mQCB.js";
import { L as require_react, o as require_jsx_runtime } from "./matchContext-Bm7-ArXH.js";
import { D as formatTime, O as useDashboard, n as Button, t as createLucideIcon } from "./createLucideIcon-BmtKeUIw.js";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-DiMSKtwS.js";
import { n as NativeSelectOption, t as NativeSelect } from "./native-select-DbcBliUc.js";
import { a as Loading, o as Panel, r as Empty } from "./common-BEruSkQj.js";
import { c as CircleAlert, o as Clock } from "./router-D3aR2GNG.js";
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/circle-question-mark.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData = {
	name: "circle-question-mark",
	size: 24,
	node: [
		["circle", {
			cx: "12",
			cy: "12",
			r: "10",
			key: "1mglay"
		}],
		["path", {
			d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",
			key: "1u773s"
		}],
		["path", {
			d: "M12 17h.01",
			key: "p32p05"
		}]
	],
	aliases: ["help-circle", "circle-help"]
};
__iconData.node;
var CircleQuestionMark = createLucideIcon(__iconData);
// src/routes/review.tsx?tsr-split=component
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Review() {
	const { state, loading, busy, perform } = useDashboard((s) => ({
		state: s.state,
		loading: s.loading,
		busy: s.busy,
		perform: s.perform
	}));
	const [channel, setChannel] = (0, import_react.useState)("comments"), [selected, setSelected] = (0, import_react.useState)(""), [showAll, setAll] = (0, import_react.useState)(false);
	if (!state) return loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, {}) : null;
	const drafts = state.drafts.filter((d) => state.inbox.find((e) => e.id === d.eventId)?.channel === channel && (showAll || d.state === "draft"));
	const draft = drafts.find((d) => d.id === selected) ?? drafts[0];
	const event = state.inbox.find((e) => e.id === draft?.eventId);
	const issues = state.jobs.filter((j) => j.state === "needs-review" || j.state === "pending");
	const ops = state.operations.filter((o) => o.state === "needs-review" || o.state === "sending");
	const labels = {
		draft: "待审核",
		sending: "发送中",
		sent: "已发送",
		rejected: "已拒绝",
		"needs-review": "待核查"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
		value: channel,
		onValueChange: (value) => setChannel(value),
		className: (draft || ops.length || issues.length ? "split-page" : "page-stack") + " review-page",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
			className: "list-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "待我审核" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "review-filters",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsList, {
						variant: "line",
						children: [
							"comments",
							"dm",
							"live"
						].map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
							value: c,
							children: [[
								"评论",
								"私信",
								"直播弹幕"
							][i], /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: state.drafts.filter((d) => d.state === "draft" && state.inbox.find((e) => e.id === d.eventId)?.channel === c).length })]
						}, c))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
						"aria-label": "审核筛选",
						value: String(showAll),
						onChange: (e) => setAll(e.target.value === "true"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelectOption, {
							value: "false",
							children: "待处理"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelectOption, {
							value: "true",
							children: "全部记录"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: channel,
					children: drafts.length ? drafts.map((d) => {
						const e = state.inbox.find((x) => x.id === d.eventId);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "ghost",
							className: "review-list-item block h-auto whitespace-normal " + (draft?.id === d.id ? "selected" : ""),
							onClick: () => setSelected(d.id),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "review-row-heading",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: e?.title || e?.name || e?.uname || `UID ${e?.mid ?? "—"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: labels[d.state] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "muted",
									children: formatTime(d.createdAt)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: e?.text })
							]
						}, d.id);
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "暂无待审核的消息。" })
				})
			]
		}), (draft || ops.length > 0 || issues.length > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
			className: "review-detail",
			children: [
				draft && event ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: event.title || `UID ${event.mid}` }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "muted",
						children: formatTime(draft.createdAt)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "content-divider",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "原消息" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: event.name || event.uname || `UID ${event.mid}` }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "message-text",
								children: event.text
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "content-divider",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "小白龙想这样回" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("blockquote", {
								className: "reply-text",
								children: draft.text
							}),
							draft.state === "draft" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "approval-actions",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "secondary",
									disabled: busy,
									onClick: () => void perform((c) => c.reject({ id: draft.id })),
									children: "拒绝"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									disabled: busy || !state.config.permissions[event.channel],
									onClick: () => void perform((c) => c.approve({ id: draft.id })),
									children: "批准发送"
								})]
							}), !state.config.permissions[event.channel] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "muted",
								children: "请先在操作权限中开启此发送通道。"
							})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "muted",
								children: labels[draft.state]
							})
						]
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "选一条消息，看看小白龙想怎么回。" }),
				ops.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "content-divider",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "发送结果" }), ops.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "issue-row",
						children: [o.state === "sending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleQuestionMark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: o.state === "sending" ? "发送中，等待结果" : "结果不明，需要核查" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: o.error || o.key })] })]
					}, o.key))]
				}),
				issues.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "content-divider",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "待核查任务" }), issues.map((j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "issue-row",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: j.state === "pending" ? "等待处理" : "任务中断" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: typeof j.result === "string" ? j.result : formatTime(j.createdAt) })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								disabled: busy,
								onClick: () => void perform((c) => c.dismiss({ id: j.id })),
								children: "关闭待办"
							})
						]
					}, j.id))]
				})
			]
		})]
	});
}
export { Review as component };
