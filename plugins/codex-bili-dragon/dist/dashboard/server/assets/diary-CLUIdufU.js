import { i as __toESM } from "./rolldown-runtime-DYf_mQCB.js";
import { L as require_react, o as require_jsx_runtime } from "./matchContext-Bm7-ArXH.js";
import { A as videosFrom, O as useDashboard, n as Button, t as createLucideIcon } from "./createLucideIcon-BmtKeUIw.js";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-DiMSKtwS.js";
import { P as ChevronRight, a as Loading, d as VideoCard, f as Input, n as Cover, o as Panel, r as Empty } from "./common-BEruSkQj.js";
import { i as NotebookText } from "./router-DgAsfa1F.js";
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/chevron-left.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData = {
	name: "chevron-left",
	size: 24,
	node: [["path", {
		d: "m15 18-6-6 6-6",
		key: "1wnfg3"
	}]]
};
__iconData.node;
var ChevronLeft = createLucideIcon(__iconData);
// src/routes/diary.tsx?tsr-split=component
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Diaries() {
	const { state, loading } = useDashboard((s) => ({
		state: s.state,
		loading: s.loading
	}));
	const [privateDiary, setPrivate] = (0, import_react.useState)(false), [selected, setSelected] = (0, import_react.useState)(""), [month, setMonth] = (0, import_react.useState)((/* @__PURE__ */ new Date()).toISOString().slice(0, 7));
	if (!state) return loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, {}) : null;
	const videos = videosFrom(state);
	const entries = [...state.diaries].reverse().filter((d) => d.at.slice(0, 7) === month);
	const diary = entries.find((d) => d.id === selected) ?? entries[0];
	const moveMonth = (delta) => {
		const d = /* @__PURE__ */ new Date(month + "-01T12:00:00");
		d.setMonth(d.getMonth() + delta);
		setMonth(d.toISOString().slice(0, 7));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
		value: privateDiary ? "private" : "public",
		onValueChange: (value) => setPrivate(value === "private"),
		className: "split-page diary-page",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
			className: "list-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "日记" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "month-picker",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							"aria-label": "上个月",
							onClick: () => moveMonth(-1),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 19 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "month",
							"aria-label": "日记月份",
							value: month,
							onChange: (e) => {
								if (e.target.value) setMonth(e.target.value);
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							"aria-label": "下个月",
							onClick: () => moveMonth(1),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { size: 19 })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
					className: "mb-4 w-full",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "public",
						children: "给我的信"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "private",
						children: "内心日记"
					})]
				}),
				entries.length ? entries.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					className: "diary-list-item h-auto justify-start whitespace-normal " + (diary?.id === d.id ? "selected" : ""),
					onClick: () => setSelected(d.id),
					children: [d.bvid && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, { video: videos.find((v) => v.bvid === d.bvid) ?? {} }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: new Date(d.at).toLocaleDateString("zh-CN", {
							month: "long",
							day: "numeric",
							weekday: "short"
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotebookText, { size: 17 }), d.title] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: privateDiary ? d.privateText : d.publicText })
					] })]
				}, d.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "这个月还没有日记。" })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
			value: privateDiary ? "private" : "public",
			className: "min-w-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				className: "diary-reading",
				children: diary ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "diary-meta",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotebookText, {}),
							privateDiary ? "内心日记" : state.config.persona.diaryTitle,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
							new Date(diary.at).toLocaleDateString("zh-CN", {
								year: "numeric",
								month: "long",
								day: "numeric",
								weekday: "short"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: diary.title }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "diary-prose",
						children: (privateDiary ? diary.privateText : diary.publicText).split(/\n+/).map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: p }, i))
					}),
					diary.bvid && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "content-divider",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "相关视频" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "related-videos",
							children: videos.filter((v) => v.bvid === diary.bvid).map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoCard, { video: v }, v.bvid))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "content-divider",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "素材依据" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "evidence-note",
							children: diary.evidence
						})]
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "选择一篇日记阅读。" })
			})
		})]
	});
}
export { Diaries as component };
