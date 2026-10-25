import { o as require_jsx_runtime } from "./matchContext-Bm7-ArXH.js";
import { k as useSettings } from "./createLucideIcon-BmtKeUIw.js";
import { n as NativeSelectOption, t as NativeSelect } from "./native-select-DbcBliUc.js";
import { a as Loading, f as Input, i as Field, l as StatusBar, o as Panel, s as SaveBar, u as Toggle } from "./common-BEruSkQj.js";
import { t as Mail } from "./mail-cNZMDL23.js";
import { t as MessageSquare } from "./message-square-Dd8LBsos.js";
import { s as CirclePlay } from "./router-Dzj4kQME.js";
// src/routes/permissions.tsx?tsr-split=component
var import_jsx_runtime = require_jsx_runtime();
function Permissions() {
	const settings = useSettings();
	const { config, setConfig } = settings;
	if (!config) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, {});
	const s = config.share;
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
									min: 0,
									max: 20,
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
									min: 0,
									max: 3,
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
									min: 1,
									max: 30,
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
				})
			]
		})]
	});
}
export { Permissions as component };
