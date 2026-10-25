import { i as __toESM } from "./rolldown-runtime-DYf_mQCB.js";
import { L as require_react, o as require_jsx_runtime } from "./matchContext-Bm7-ArXH.js";
import { n as NativeSelectOption, t as NativeSelect } from "./native-select-DbcBliUc.js";
import { o as Panel } from "./common-BEruSkQj.js";
import { t as ActivityList } from "./activity-list-CZ_ofmoq.js";
// src/routes/activity.tsx?tsr-split=component
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var states = {
	running: "进行中",
	success: "已完成",
	failed: "未完成",
	unknown: "待核查",
	draft: "待审核"
};
function ActivityPage() {
	const [type, setType] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "行动记录" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "review-filters activity-filters",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelect, {
				"aria-label": "行动类型",
				value: type,
				onChange: (event) => {
					setType(event.target.value);
				},
				children: Object.entries({
					"": "全部行动",
					dm: "私信",
					comments: "评论",
					search: "搜索",
					read: "阅读素材",
					diary: "日记",
					favorite: "收藏",
					task: "运行任务",
					feedback: "查看反馈"
				}).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelectOption, {
					value,
					children: label
				}, value))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
				"aria-label": "行动结果",
				value: status,
				onChange: (event) => {
					setStatus(event.target.value);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelectOption, {
					value: "",
					children: "全部结果"
				}), Object.entries(states).map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelectOption, {
					value,
					children: label
				}, value))]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivityList, {
			type,
			status
		}, type + status)
	] });
}
export { ActivityPage as component };
