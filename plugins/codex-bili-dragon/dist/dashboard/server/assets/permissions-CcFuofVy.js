import { i as __toESM } from "./rolldown-runtime-DYf_mQCB.js";
import { L as require_react, o as require_jsx_runtime } from "./matchContext-Bm7-ArXH.js";
import { O as useDashboard, k as useSettings, n as Button, t as createLucideIcon } from "./createLucideIcon-BmtKeUIw.js";
import { n as NativeSelectOption, t as NativeSelect } from "./native-select-DbcBliUc.js";
import { a as Loading, f as Input, i as Field, l as StatusBar, o as Panel, s as SaveBar, u as Toggle } from "./common-BEruSkQj.js";
import { t as Mail } from "./mail-cNZMDL23.js";
import { t as MessageSquare } from "./message-square-Dd8LBsos.js";
import { s as CirclePlay } from "./router-DY6tisPq.js";
import { n as CollapsibleContent, r as CollapsibleTrigger, t as Collapsible } from "./collapsible-DY5CxP_-.js";
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/bookmark.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData = {
	name: "bookmark",
	size: 24,
	node: [["path", {
		d: "M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z",
		key: "oz39mx"
	}]]
};
__iconData.node;
var Bookmark = createLucideIcon(__iconData);
// src/components/model-settings.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var effortLabels = {
	none: "不思考",
	minimal: "极低",
	low: "低",
	medium: "中",
	high: "高",
	xhigh: "更高",
	max: "最高",
	ultra: "Ultra"
};
function ModelSettings({ config, setConfig }) {
	const client = useDashboard((s) => s.client);
	const [catalog, setCatalog] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	const [retry, setRetry] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		let current = true;
		setCatalog(null);
		setError("");
		if (client) client.models().then((value) => {
			if (current) setCatalog(value);
		}).catch((reason) => {
			if (current) setError(reason instanceof Error ? reason.message : "无法读取可用模型");
		});
		return () => {
			current = false;
		};
	}, [
		client,
		config.codexPath,
		retry
	]);
	const selected = catalog?.models.find((item) => item.model === (config.model || catalog.defaultModel));
	const defaultModel = catalog?.models.find((item) => item.model === catalog.defaultModel);
	const efforts = selected?.supportedReasoningEfforts ?? [];
	const defaultEffort = selected?.model === catalog?.defaultModel ? catalog?.defaultReasoningEffort : selected?.defaultReasoningEffort;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "settings-section model-settings",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "模型与思考深度" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "form-columns",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "模型",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
						"aria-label": "模型",
						value: config.model,
						onChange: (event) => setConfig({
							...config,
							model: event.target.value,
							reasoningEffort: ""
						}),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelectOption, {
								value: "",
								children: ["跟随 Codex 默认", defaultModel ? `（${defaultModel.displayName}）` : ""]
							}),
							config.model && !catalog?.models.some((item) => item.model === config.model && !item.hidden) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelectOption, {
								value: config.model,
								children: [config.model, "（已保存）"]
							}),
							catalog?.models.filter((item) => !item.hidden).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelectOption, {
								value: item.model,
								children: item.displayName
							}, item.id))
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "思考深度",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
						"aria-label": "思考深度",
						value: config.reasoningEffort,
						onChange: (event) => setConfig({
							...config,
							reasoningEffort: event.target.value
						}),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelectOption, {
								value: "",
								children: ["默认", defaultEffort ? `（${effortLabels[defaultEffort] ?? defaultEffort}）` : ""]
							}),
							config.reasoningEffort && !efforts.some((item) => item.reasoningEffort === config.reasoningEffort) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelectOption, {
								value: config.reasoningEffort,
								children: [config.reasoningEffort, "（已保存）"]
							}),
							efforts.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelectOption, {
								value: item.reasoningEffort,
								children: effortLabels[item.reasoningEffort] ?? item.reasoningEffort
							}, item.reasoningEffort))
						]
					})
				})]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "error-text",
				children: [
					error,
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => setRetry((value) => value + 1),
						children: "重试"
					})
				]
			}) : !catalog && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "muted",
				children: "正在读取可用模型…"
			})
		]
	});
}
// src/routes/permissions.tsx?tsr-split=component
function Permissions() {
	const settings = useSettings();
	const { config, setConfig } = settings;
	const { state } = useDashboard((s) => ({ state: s.state }));
	if (!config || !state) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, {});
	const s = config.share;
	const l = config.listen;
	const single = config.accountMode === "single";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-stack",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBar, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
			className: "permissions-page",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "section-heading",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "操作权限" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveBar, { ...settings })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "permissions-grid",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "互动权限" }), [
						[
							MessageSquare,
							"发送评论",
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
						],
						[
							Bookmark,
							"自动收藏",
							"favorites"
						]
					].map(([Icon, label, key]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "permission-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
							label,
							checked: config.permissions[key],
							disabled: single && key === "dm",
							description: single && key === "dm" ? "单号模式不能给自己发私信；使用双号模式可发送给主人。" : void 0,
							onChange: (value) => setConfig({
								...config,
								permissions: {
									...config.permissions,
									[key]: value
								}
							})
						})]
					}, key))] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "permission-explanation",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "消息回复" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "muted",
							children: single ? "给其他人的回复，都会先交给你审核。" : "小白龙会按权限回复你。给其他人的回复先交给你审核；私信只发给已互关的主人。"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "settings-section sharing-section",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						label: "主动分享",
						checked: s.enabled,
						disabled: single,
						description: single ? "小白龙会把逛到的内容记在观看记录和日记里。" : void 0,
						onChange: (enabled) => setConfig({
							...config,
							share: {
								...s,
								enabled
							}
						})
					}), !single && s.enabled && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "form-columns four",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "分享方式",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
									disabled: !s.enabled,
									value: s.via,
									onChange: (e) => setConfig({
										...config,
										share: {
											...s,
											via: e.target.value
										}
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelectOption, {
										value: "comment",
										children: "发送评论"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelectOption, {
										value: "dm",
										children: "发送私信"
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "最低分享评分",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									disabled: !s.enabled,
									type: "number",
									value: s.minScore,
									onChange: (e) => setConfig({
										...config,
										share: {
											...s,
											minScore: Number(e.target.value)
										}
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "每日最多分享数",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									disabled: !s.enabled,
									type: "number",
									value: config.quota.shareDaily,
									onChange: (e) => setConfig({
										...config,
										quota: { shareDaily: Number(e.target.value) }
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "无人回应后减少分享（天）",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									disabled: !s.enabled,
									type: "number",
									value: s.silentAfterDays,
									onChange: (e) => setConfig({
										...config,
										share: {
											...s,
											silentAfterDays: Number(e.target.value)
										}
									})
								})
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "settings-section",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "留意新消息" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "form-columns",
							children: [
								["comment", "评论"],
								["dm", "私信"],
								["live", "直播弹幕"]
							].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
								label,
								checked: l[key],
								onChange: (value) => setConfig({
									...config,
									listen: {
										...l,
										[key]: value
									}
								})
							}, key))
						}),
						(l.comment || l.dm || l.live) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Collapsible, {
							className: "listener-details",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleTrigger, {
								className: "disclosure-trigger",
								children: "消息设置"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CollapsibleContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "form-columns",
								children: [
									l.comment && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "检查评论的间隔（秒）",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											min: 60,
											max: 3600,
											value: l.commentIntervalSec,
											onChange: (e) => setConfig({
												...config,
												listen: {
													...l,
													commentIntervalSec: Number(e.target.value)
												}
											})
										})
									}),
									l.dm && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "检查私信的间隔（秒）",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											min: 60,
											max: 3600,
											value: l.dmIntervalSec,
											onChange: (e) => setConfig({
												...config,
												listen: {
													...l,
													dmIntervalSec: Number(e.target.value)
												}
											})
										})
									}),
									l.live && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "直播间号",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											inputMode: "numeric",
											value: l.liveRoom,
											onChange: (e) => setConfig({
												...config,
												listen: {
													...l,
													liveRoom: e.target.value
												}
											})
										})
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "listener-options",
								children: [
									l.live && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
										label: "留意哪些弹幕",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
											value: l.liveScope,
											onChange: (e) => setConfig({
												...config,
												listen: {
													...l,
													liveScope: e.target.value
												}
											}),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelectOption, {
												value: "owner",
												children: "仅主人"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelectOption, {
												value: "mention",
												children: "只看提到小白龙的消息"
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
										label: "活动时间外也留意消息",
										checked: l.allDay,
										onChange: (allDay) => setConfig({
											...config,
											listen: {
												...l,
												allDay
											}
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
										label: "每人只回一次",
										checked: l.oncePerPerson,
										onChange: (oncePerPerson) => setConfig({
											...config,
											listen: {
												...l,
												oncePerPerson
											}
										})
									})
								]
							})] })]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "settings-section",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
							label: "自动更新小白龙",
							checked: config.updates.enabled,
							disabled: !state.updates.supported,
							description: state.updates.supported ? "每六小时检查稳定版；兼容更新在空闲时生效。" : "自动更新仅支持 Codex 共享后台，前台开发模式不自动切换。",
							onChange: (enabled) => setConfig({
								...config,
								updates: { enabled }
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "muted",
							children: ["后台版本 ", state.updates.runtimeVersion]
						}),
						state.updates.message && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							role: "status",
							children: state.updates.message
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModelSettings, {
					config,
					setConfig
				})
			]
		})]
	});
}
export { Permissions as component };
