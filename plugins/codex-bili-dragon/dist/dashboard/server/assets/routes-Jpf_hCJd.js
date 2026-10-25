import { i as __toESM } from "./rolldown-runtime-DYf_mQCB.js";
import { L as require_react, o as require_jsx_runtime } from "./matchContext-Bm7-ArXH.js";
import { A as videosFrom, D as formatTime, O as useDashboard, j as Link, n as Button } from "./createLucideIcon-BmtKeUIw.js";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-DiMSKtwS.js";
import { P as ChevronRight, a as Loading, c as SectionTitle, d as VideoCard, l as StatusBar, o as Panel, r as Empty } from "./common-BEruSkQj.js";
import { t as Mail } from "./mail-cNZMDL23.js";
import { t as MessageSquare } from "./message-square-Dd8LBsos.js";
import { a as Link2, i as NotebookText, s as CirclePlay } from "./router-D3aR2GNG.js";
// src/routes/index.tsx?tsr-split=component
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const { state, client, loading, busy, perform, refresh } = useDashboard((s) => ({
		state: s.state,
		client: s.client,
		loading: s.loading,
		busy: s.busy,
		perform: s.perform,
		refresh: s.refresh
	}));
	const [channel, setChannel] = (0, import_react.useState)("comments");
	const [account, setAccount] = (0, import_react.useState)(null);
	const [connection, setConnection] = (0, import_react.useState)("检查中…");
	const refreshRef = (0, import_react.useRef)(refresh);
	refreshRef.current = refresh;
	const hasCredentials = state?.hasCredentials;
	(0, import_react.useEffect)(() => {
		if (!client || !hasCredentials) {
			setAccount(null);
			setConnection("未连接");
			return;
		}
		let active = true;
		setConnection("检查中…");
		client.checkLogin().then((result) => {
			if (!active) return;
			setAccount(result.account ?? null);
			setConnection(result.status === "connected" ? "已连接" : result.status === "expired" ? "登录已失效" : "未连接");
			refreshRef.current();
		}).catch(() => {
			if (active) setConnection("连接检查失败");
		});
		return () => {
			active = false;
		};
	}, [client, hasCredentials]);
	if (!state) return loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, {}) : null;
	const videos = videosFrom(state).slice(0, 5), last = state.diaries.at(-1);
	const drafts = state.drafts.filter((d) => d.state === "draft");
	const visible = drafts.filter((d) => state.inbox.find((e) => e.id === d.eventId)?.channel === channel).slice(0, 3);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "home-grid",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "page-stack",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBar, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
					to: "/videos",
					children: "最近逛到的视频"
				}), videos.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "video-grid",
					children: videos.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoCard, { video: v }, v.bvid))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "小白龙还没出门逛过。" })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SectionTitle, {
					to: "/review",
					children: ["待我审核 ", drafts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
						className: "count-badge",
						children: drafts.length
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
					value: channel,
					onValueChange: (value) => setChannel(value),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsList, {
						variant: "line",
						className: "mb-3",
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
							][i], /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: drafts.filter((d) => state.inbox.find((e) => e.id === d.eventId)?.channel === c).length })]
						}, c))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: channel,
						children: visible.length ? visible.map((d) => {
							const e = state.inbox.find((x) => x.id === d.eventId);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "review-preview",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: e?.title || e?.name || e?.uname || `UID ${e?.mid ?? "—"}` }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: formatTime(d.createdAt) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: d.text })
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "row-actions",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "secondary",
										disabled: busy,
										onClick: () => void perform((c) => c.reject({ id: d.id })),
										children: "拒绝"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										disabled: busy || !e || !state.config.permissions[e.channel],
										onClick: () => void perform((c) => c.approve({ id: d.id })),
										children: "批准发送"
									})]
								})]
							}, d.id);
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Empty, { children: [
							"暂无待审核的",
							channel === "comments" ? "评论" : channel === "dm" ? "私信" : "直播弹幕",
							"。"
						] })
					})]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
					to: "/diary",
					children: "最近的日记"
				}), last ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "diary-preview",
					children: [false, true].map((privateDiary) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/diary",
						className: "diary-preview-item",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotebookText, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: privateDiary ? "内心日记" : state.config.persona.diaryTitle }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: formatTime(last.at) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: privateDiary ? last.privateText : last.publicText })
						] })]
					}, String(privateDiary)))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "小白龙还没写过日记。" })] })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "page-stack home-aside",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/schedule",
						className: "section-heading",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "活动时间" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "schedule-summary",
						children: state.config.night.windows.map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							w.start,
							" – ",
							w.end,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [w.wakes, " 次机会"] })
						] }, i))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "timeline",
						children: Array.from({ length: 24 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: state.config.night.windows.some((w) => {
							const a = Number(w.start.slice(0, 2)), b = Number(w.end.slice(0, 2));
							return w.wakes > 0 && (a < b ? i >= a && i < b : i >= a || i < b);
						}) ? "on" : "" }, i))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "timeline-labels",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "00:00" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "06:00" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "12:00" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "18:00" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "24:00" })
						]
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/personality",
					className: "section-heading",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "个性与兴趣" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "tags",
					children: state.config.preferences.like.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t }, t))
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/permissions",
					className: "section-heading",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "操作权限" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {})]
				}), [
					[
						MessageSquare,
						"发布评论",
						"comments"
					],
					[
						Mail,
						"发送私信",
						"dm"
					],
					[
						CirclePlay,
						"发送直播弹幕",
						"live"
					]
				].map(([Icon, label, key]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "summary-row",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 23 }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: key === "dm" && state.config.accountMode === "single" ? "单号不可用" : state.config.permissions[key] ? "允许" : "关闭" })
					]
				}, key))] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/account",
					className: "section-heading",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "账号连接" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/account",
					className: "account-summary",
					children: [account?.avatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: account.avatar,
						alt: "",
						referrerPolicy: "no-referrer"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: account?.name || "B 站账号" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "dot " + (connection === "已连接" ? "green" : "") }), connection] }),
						account && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: ["UID ", account.uid] })
					] })]
				})] }),
				!!state.runtime.error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "任务异常" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "error-text",
						children: state.runtime.error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/review",
						className: "more-link",
						children: ["查看待核查任务", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 17 })]
					})
				] })
			]
		})]
	});
}
export { Home as component };
