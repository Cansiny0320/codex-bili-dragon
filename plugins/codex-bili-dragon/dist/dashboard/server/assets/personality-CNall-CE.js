import { i as __toESM } from "./rolldown-runtime-DYf_mQCB.js";
import { L as require_react, o as require_jsx_runtime } from "./matchContext-Bm7-ArXH.js";
import { O as useDashboard, k as useSettings, n as Button, r as cn } from "./createLucideIcon-BmtKeUIw.js";
import { a as Loading, f as Input, i as Field, o as Panel, s as SaveBar } from "./common-BEruSkQj.js";
import { t as Plus } from "./plus-Bggrmnyj.js";
import { i as NotebookText, r as X } from "./router-D3aR2GNG.js";
// src/components/ui/textarea.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		"data-slot": "textarea",
		className: cn("flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40", className),
		...props
	});
}
// src/routes/personality.tsx?tsr-split=component
function KeywordEditor({ title, values, onChange }) {
	const [adding, setAdding] = (0, import_react.useState)(false), [text, setText] = (0, import_react.useState)("");
	function add() {
		const next = text.trim();
		if (next && !values.includes(next)) onChange([...values, next].slice(0, 20));
		setText("");
		setAdding(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "keyword-editor",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "section-heading",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: title }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					disabled: values.length >= 20,
					onClick: () => setAdding(true),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 15 }), "添加关键词"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "tags removable",
				children: values.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [v, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					"aria-label": "移除" + v,
					onClick: () => onChange(values.filter((x) => x !== v)),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 })
				})] }, v))
			}),
			adding && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "keyword-input",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					autoFocus: true,
					"aria-label": title + "新增关键词",
					value: text,
					onChange: (e) => setText(e.target.value),
					onKeyDown: (e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							add();
						}
						if (e.key === "Escape") setAdding(false);
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: add,
					children: "添加"
				})]
			})
		]
	});
}
function Personality() {
	const settings = useSettings();
	const { config, setConfig } = settings;
	const { state } = useDashboard((s) => ({ state: s.state }));
	if (!config) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, {});
	const p = config.persona;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "settings-grid",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
			className: "settings-main",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "个性与兴趣" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "settings-section",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "基础设置" }),
						[
							["name", "小白龙的名字"],
							["selfClaim", "自称"],
							["ownerTitle", "对你的称呼"],
							["diaryTitle", "写给你的日记标题"]
						].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: p[key],
								maxLength: 2e3,
								onChange: (e) => setConfig({
									...config,
									persona: {
										...p,
										[key]: e.target.value
									}
								})
							})
						}, key)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "性格描述",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								value: p.body,
								maxLength: 2e4,
								rows: 6,
								onChange: (e) => setConfig({
									...config,
									persona: {
										...p,
										body: e.target.value
									}
								})
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "settings-section",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "兴趣偏好" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "keyword-grid",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeywordEditor, {
							title: "喜欢的内容关键词",
							values: config.preferences.like,
							onChange: (like) => setConfig({
								...config,
								preferences: {
									...config.preferences,
									like
								}
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeywordEditor, {
							title: "不喜欢的内容关键词",
							values: config.preferences.dislike,
							onChange: (dislike) => setConfig({
								...config,
								preferences: {
									...config.preferences,
									dislike
								}
							})
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveBar, { ...settings })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
			className: "preview-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "预览" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "persona-preview",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: p.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: p.body })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "content-divider",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotebookText, { size: 20 }), p.diaryTitle] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "preview-prose",
						children: state?.diaries.at(-1)?.publicText || `写给${p.ownerTitle}的日记会以这个标题显示。`
					})]
				})
			]
		})]
	});
}
export { Personality as component };
