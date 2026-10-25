import { i as __toESM } from "./rolldown-runtime-DYf_mQCB.js";
import { L as require_react, o as require_jsx_runtime } from "./matchContext-Bm7-ArXH.js";
import { O as useDashboard, k as useSettings, n as Button, t as createLucideIcon } from "./createLucideIcon-BmtKeUIw.js";
import { n as NativeSelectOption, t as NativeSelect } from "./native-select-DbcBliUc.js";
import { a as Loading, f as Input, i as Field, o as Panel, s as SaveBar } from "./common-BEruSkQj.js";
import { n as CollapsibleContent, r as CollapsibleTrigger, t as Collapsible } from "./collapsible-DY5CxP_-.js";
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/eye-off.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$2 = {
	name: "eye-off",
	size: 24,
	node: [
		["path", {
			d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",
			key: "ct8e1f"
		}],
		["path", {
			d: "M14.084 14.158a3 3 0 0 1-4.242-4.242",
			key: "151rxh"
		}],
		["path", {
			d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",
			key: "13bj9a"
		}],
		["path", {
			d: "m2 2 20 20",
			key: "1ooewy"
		}]
	]
};
__iconData$2.node;
var EyeOff = createLucideIcon(__iconData$2);
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/eye.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$1 = {
	name: "eye",
	size: 24,
	node: [["path", {
		d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
		key: "1nclc0"
	}], ["circle", {
		cx: "12",
		cy: "12",
		r: "3",
		key: "1v7zrd"
	}]]
};
__iconData$1.node;
var Eye = createLucideIcon(__iconData$1);
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/refresh-cw.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData = {
	name: "refresh-cw",
	size: 24,
	node: [
		["path", {
			d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
			key: "v9h5vc"
		}],
		["path", {
			d: "M21 3v5h-5",
			key: "1q7to0"
		}],
		["path", {
			d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
			key: "3uifl3"
		}],
		["path", {
			d: "M8 16H3v5",
			key: "1cv678"
		}]
	]
};
__iconData.node;
var RefreshCw = createLucideIcon(__iconData);
// src/components/bili-login.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function BiliLogin() {
	const { client, state, busy, perform, refresh } = useDashboard((s) => ({
		client: s.client,
		state: s.state,
		busy: s.busy,
		perform: s.perform,
		refresh: s.refresh
	}));
	const [phase, setPhase] = (0, import_react.useState)("loading");
	const [qr, setQr] = (0, import_react.useState)(null);
	const [account, setAccount] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	const [savedNotice, setSavedNotice] = (0, import_react.useState)("");
	const [credentials, setCredentials] = (0, import_react.useState)({
		sessdata: "",
		bili_jct: "",
		buvid3: ""
	});
	const [revealed, setRevealed] = (0, import_react.useState)(false);
	const generation = (0, import_react.useRef)(0), handle = (0, import_react.useRef)(null);
	const timer = (0, import_react.useRef)(null);
	const initiallyConfigured = (0, import_react.useRef)(state?.hasCredentials ?? false);
	const refreshRef = (0, import_react.useRef)(refresh);
	refreshRef.current = refresh;
	const cancel = (0, import_react.useCallback)(() => {
		generation.current++;
		if (timer.current) clearTimeout(timer.current);
		timer.current = null;
		if (handle.current && client) client.loginCancel({ handle: handle.current }).catch(() => {});
		handle.current = null;
	}, [client]);
	const start = (0, import_react.useCallback)(async () => {
		if (!client) return;
		cancel();
		const current = generation.current;
		setPhase("loading");
		setQr(null);
		setError("");
		setSavedNotice("");
		try {
			const next = await client.loginStart();
			if (current !== generation.current) {
				client.loginCancel({ handle: next.handle }).catch(() => {});
				return;
			}
			handle.current = next.handle;
			setQr(next);
			setPhase("waiting");
			const poll = async () => {
				if (current !== generation.current) return;
				try {
					const result = await client.loginPoll({ handle: next.handle });
					if (current !== generation.current) return;
					if (result.status === "success" && result.account) {
						handle.current = null;
						setQr(null);
						setAccount(result.account);
						setPhase("connected");
						setSavedNotice("已连接，活动已暂停");
						refreshRef.current();
					} else if (result.status === "waiting" || result.status === "scanned") {
						setPhase(result.status);
						timer.current = setTimeout(() => void poll(), 2e3);
					} else {
						handle.current = null;
						setPhase("expired");
						setQr(null);
					}
				} catch (cause) {
					if (current !== generation.current) return;
					handle.current = null;
					setQr(null);
					setPhase("error");
					setError(cause instanceof Error ? cause.message : "扫码登录失败，请重试");
				}
			};
			timer.current = setTimeout(() => void poll(), 2e3);
		} catch (cause) {
			if (current !== generation.current) return;
			setPhase("error");
			setError(cause instanceof Error ? cause.message : "无法获取二维码，请重试");
		}
	}, [client, cancel]);
	const check = (0, import_react.useCallback)(async () => {
		if (!client) return;
		cancel();
		const current = generation.current;
		setPhase("loading");
		setError("");
		setSavedNotice("");
		setQr(null);
		try {
			const result = await client.checkLogin();
			if (current !== generation.current) return;
			if (result.status === "connected" && result.account) {
				setAccount(result.account);
				setPhase("connected");
				refreshRef.current();
			} else {
				setAccount(null);
				await start();
			}
		} catch (cause) {
			if (current !== generation.current) return;
			setPhase("error");
			setError(cause instanceof Error ? cause.message : "检查连接失败，请重试");
		}
	}, [
		client,
		cancel,
		start
	]);
	(0, import_react.useEffect)(() => {
		if (initiallyConfigured.current) check();
		else start();
		return cancel;
	}, [
		check,
		start,
		cancel
	]);
	async function saveCredentials() {
		cancel();
		setQr(null);
		if (await perform((c) => c.credentials(credentials), "凭据已保存，活动已暂停")) {
			setCredentials({
				sessdata: "",
				bili_jct: "",
				buvid3: ""
			});
			await check();
		} else {
			setPhase("error");
			setError("未能保存凭据，请检查输入后重试");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "section-heading",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "B 站账号" }), phase === "connected" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "outline",
				disabled: busy,
				onClick: () => void check(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { size: 16 }), "检查连接"]
			})]
		}),
		phase === "connected" && account ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "account-status",
			children: [
				account.avatar && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					className: "account-avatar",
					src: account.avatar,
					alt: "",
					referrerPolicy: "no-referrer",
					onError: (event) => {
						event.currentTarget.style.display = "none";
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: account.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "muted",
					children: ["UID ", account.uid]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					disabled: busy,
					onClick: () => void start(),
					children: "重新扫码登录"
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "qr-login",
			"aria-live": "polite",
			children: [
				qr && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					className: "login-qr",
					src: qr.image,
					width: 240,
					height: 240,
					alt: "B 站登录二维码"
				}),
				phase === "loading" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "正在连接 B 站…" }),
				phase === "waiting" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "使用 B 站 App 扫码登录" }),
				phase === "scanned" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "扫码成功，请在手机上确认" }),
				phase === "expired" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "二维码已失效" }),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					children: error
				}),
				phase !== "loading" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					disabled: busy,
					onClick: () => void start(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { size: 16 }), phase === "error" ? "重新获取二维码" : "刷新二维码"]
				})
			]
		}),
		savedNotice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "muted",
			role: "status",
			children: savedNotice
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Collapsible, {
			className: "manual-login",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleTrigger, {
				className: "disclosure-trigger",
				children: "高级选项"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CollapsibleContent, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "section-heading",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "手动 Cookie" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						"aria-label": revealed ? "隐藏输入" : "显示输入",
						onClick: () => setRevealed(!revealed),
						children: revealed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { size: 18 })
					})]
				}),
				[
					["sessdata", "SESSDATA"],
					["bili_jct", "bili_jct"],
					["buvid3", "buvid3"]
				].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: revealed ? "text" : "password",
						autoComplete: "off",
						value: credentials[key],
						placeholder: state?.hasCredentials ? "已保存；填写以替换" : "",
						onChange: (e) => setCredentials({
							...credentials,
							[key]: e.target.value
						})
					})
				}, key)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "muted",
					children: "在 B 站网页端登录后，从浏览器开发者工具的 Cookie 中复制这三个值。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "save-bar",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						disabled: busy || Object.values(credentials).some((value) => !value.trim()),
						onClick: () => void saveCredentials(),
						children: "保存凭据"
					})
				})
			] })]
		})
	] });
}
// src/routes/account.tsx?tsr-split=component
function Account() {
	const settings = useSettings();
	const { config, setConfig } = settings;
	const { state } = useDashboard((s) => ({ state: s.state }));
	if (!config || !state) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "page-stack account-page",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "page-stack",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "page-title",
					children: "账号连接"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BiliLogin, {}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "账号模式" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(NativeSelect, {
						"aria-label": "账号模式",
						value: config.accountMode ?? (state.account && config.owner.mid && config.owner.mid !== state.account.uid ? "dual" : "single"),
						onChange: (event) => {
							const accountMode = event.target.value;
							const owner = accountMode === "single" && state.account ? {
								mid: state.account.uid,
								name: state.account.name
							} : config.owner.mid === state.account?.uid ? {
								mid: "",
								name: ""
							} : config.owner;
							setConfig({
								...config,
								accountMode,
								owner
							});
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelectOption, {
							value: "single",
							children: "单号模式 · 使用自己的账号"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelectOption, {
							value: "dual",
							children: "双号模式 · 小白龙使用小号"
						})]
					}),
					config.accountMode === "dual" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "主人 UID",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								inputMode: "numeric",
								value: config.owner.mid,
								onChange: (e) => setConfig({
									...config,
									owner: {
										...config.owner,
										mid: e.target.value
									}
								})
							})
						}),
						state.account && config.owner.mid === state.account.uid && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "error-text",
							children: "主人 UID 需要与登录账号不同。"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "主人 B 站昵称（评论 @ 用）",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: config.owner.name,
								onChange: (e) => setConfig({
									...config,
									owner: {
										...config.owner,
										name: e.target.value
									}
								})
							})
						})
					] })
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Collapsible, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleTrigger, {
					className: "disclosure-trigger",
					children: "高级设置"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CollapsibleContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "muted",
						children: "登录信息只保存在这台电脑上，并用于连接 B 站。登录失效时，重新扫码即可。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Codex 可执行文件路径",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: config.codexPath,
							placeholder: "自动检测",
							onChange: (e) => setConfig({
								...config,
								codexPath: e.target.value
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "模型名称（可选）",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: config.model,
							placeholder: "使用 Codex 默认模型",
							onChange: (e) => setConfig({
								...config,
								model: e.target.value
							})
						})
					})
				] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveBar, { ...settings })] })
			]
		})
	});
}
export { Account as component };
