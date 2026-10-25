import { i as __toESM } from "./rolldown-runtime-DYf_mQCB.js";
import { L as require_react, o as require_jsx_runtime } from "./matchContext-Bm7-ArXH.js";
import { A as videosFrom, D as formatTime, O as useDashboard, n as Button, t as createLucideIcon } from "./createLucideIcon-BmtKeUIw.js";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-DiMSKtwS.js";
import { a as Loading, f as Input, n as Cover, o as Panel, r as Empty, t as BiliLink } from "./common-BEruSkQj.js";
import { t as MessageSquare } from "./message-square-Dd8LBsos.js";
import { n as Route } from "./router-Dzj4kQME.js";
import { n as CollapsibleContent, r as CollapsibleTrigger, t as Collapsible } from "./collapsible-DY5CxP_-.js";
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/file-text.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$2 = {
	name: "file-text",
	size: 24,
	node: [
		["path", {
			d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
			key: "1oefj6"
		}],
		["path", {
			d: "M14 2v5a1 1 0 0 0 1 1h5",
			key: "wfsgrz"
		}],
		["path", {
			d: "M10 9H8",
			key: "b1mrlr"
		}],
		["path", {
			d: "M16 13H8",
			key: "t4e002"
		}],
		["path", {
			d: "M16 17H8",
			key: "z1uh3a"
		}]
	]
};
__iconData$2.node;
var FileText = createLucideIcon(__iconData$2);
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/image.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$1 = {
	name: "image",
	size: 24,
	node: [
		["rect", {
			width: "18",
			height: "18",
			x: "3",
			y: "3",
			rx: "2",
			ry: "2",
			key: "1m3agn"
		}],
		["circle", {
			cx: "9",
			cy: "9",
			r: "2",
			key: "af1f0g"
		}],
		["path", {
			d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",
			key: "1xmnt7"
		}]
	]
};
__iconData$1.node;
var Image = createLucideIcon(__iconData$1);
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/search.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData = {
	name: "search",
	size: 24,
	node: [["path", {
		d: "m21 21-4.34-4.34",
		key: "14j7rj"
	}], ["circle", {
		cx: "11",
		cy: "11",
		r: "8",
		key: "4ej97u"
	}]]
};
__iconData.node;
var Search = createLucideIcon(__iconData);
// src/routes/videos.tsx?tsr-split=component
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Videos() {
	const { state, loading } = useDashboard((s) => ({
		state: s.state,
		loading: s.loading
	}));
	const { bv } = Route.useSearch();
	const [query, setQuery] = (0, import_react.useState)(""), [selected, setSelected] = (0, import_react.useState)(bv ?? ""), [material, setMaterial] = (0, import_react.useState)("subtitles");
	if (!state) return loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, {}) : null;
	const all = videosFrom(state), filtered = all.filter((v) => (v.title + v.bvid).toLowerCase().includes(query.toLowerCase()));
	const video = all.find((v) => v.bvid === selected) ?? filtered[0];
	const actions = [
		[
			"subtitles",
			"字幕",
			FileText
		],
		[
			"frames",
			"画面",
			Image
		],
		[
			"comments",
			"评论",
			MessageSquare
		]
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "split-page video-page",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
			className: "list-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "观看记录" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "search-box",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { size: 21 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						"aria-label": "搜索视频标题或 BV 号",
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: "搜索视频标题或 BV 号"
					})]
				}),
				filtered.length ? filtered.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					className: "video-list-item h-auto justify-start whitespace-normal " + (v.bvid === video?.bvid ? "selected" : ""),
					onClick: () => setSelected(v.bvid),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, { video: v }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: v.title }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							v.bvid,
							" · ",
							formatTime(v.at)
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "material-badges",
							children: [actions.filter(([key]) => v.actions.includes(key)).map(([key, label, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 15 }), label] }, key)), v.actions.includes("debrief") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "简报" })]
						})
					] })]
				}, v.bvid)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: query ? "没有匹配的观看记录。" : "小白龙还没出门逛过。" })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "page-stack detail-column",
			children: video ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
					video,
					className: "large-cover"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "video-detail-title",
					children: video.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "muted",
					children: [
						video.bvid,
						" · ",
						formatTime(video.at)
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BiliLink, { bvid: video.bvid })
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				className: "materials-panel",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "小白龙读到的内容" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
						value: material,
						onValueChange: (value) => setMaterial(String(value)),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsList, {
							variant: "line",
							className: "mb-3",
							children: actions.map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
								value: key,
								children: label
							}, key))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: material,
							children: video.materials?.[material] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
								className: "material-text",
								children: video.materials[material]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: video.actions.includes(material) ? "这条历史记录未保存素材正文。" : "尚未读取这类素材。" })
						})]
					}),
					video.materials?.debrief && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Collapsible, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleTrigger, {
						className: "disclosure-trigger",
						children: "查看简报"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "material-text",
						children: video.materials.debrief
					}) })] })
				]
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "选择一条观看记录查看详情。" }) })
		})]
	});
}
export { Videos as component };
