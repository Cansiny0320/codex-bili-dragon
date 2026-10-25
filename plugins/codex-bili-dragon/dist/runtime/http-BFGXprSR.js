import { a as activityInput, i as materialView, n as catalog, o as credentialsSchema, r as materialInput, s as redact } from "./service-Bs_eI39T.js";
import { g as exclusive, p as updateState, v as errorMessage } from "./runtime-BQhNtnnM.js";
import { a as version, r as root } from "./paths-5G6hh4eK.js";
import { _ as string, g as record, p as object, u as literal, y as unknown } from "./schemas-BWrad36H.js";
import { c as taskPrompt, l as DateTime, o as baseInstructions, r as configSchema, s as developerInstructions } from "./policy-DjEN7pXP.js";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import crypto, { createHash } from "node:crypto";
import readline from "node:readline";
import { EventEmitter } from "node:events";
import http from "node:http";
import { Buffer as Buffer$1 } from "node:buffer";
import { Readable } from "node:stream";
// src/codex.ts
const accountResponse = object({ account: object({ type: string() }).nullable() });
const configResponse = object({ config: object({ mcp_servers: record(string(), unknown()).optional() }).optional() });
const threadResponse = object({ thread: object({
	id: string(),
	status: object({ type: string() }).optional()
}) });
const turnSchema = object({
	id: string(),
	status: string(),
	error: object({ message: string() }).nullish()
});
const toolCallSchema = object({
	threadId: string(),
	tool: string(),
	arguments: unknown()
});
function findCodex(override = "") {
	if (override) return override;
	if (process.env.BILI_DRAGON_CODEX) return process.env.BILI_DRAGON_CODEX;
	if (process.platform === "win32" && process.env.LOCALAPPDATA) {
		const bin = path.join(process.env.LOCALAPPDATA, "OpenAI/Codex/bin");
		if (fs.existsSync(bin)) {
			const candidates = fs.readdirSync(bin, { withFileTypes: true }).filter((x) => x.isDirectory()).map((x) => path.join(bin, x.name, "codex.exe")).filter((x) => fs.existsSync(x)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
			if (candidates[0]) return candidates[0];
			if (fs.existsSync(path.join(bin, "codex.exe"))) return path.join(bin, "codex.exe");
		}
	}
	if (process.platform === "win32") try {
		return execFileSync("where.exe", ["codex.exe"], {
			encoding: "utf8",
			windowsHide: true
		}).trim().split(/\r?\n/)[0];
	} catch {
		throw Error("未找到兼容 Codex 可执行文件；请设置 BILI_DRAGON_CODEX 或安装 Codex 桌面版。");
	}
	return "codex";
}
const disabledFeatures = [
	"shell_tool",
	"unified_exec",
	"apply_patch_freeform",
	"js_repl",
	"apps",
	"connectors",
	"plugins",
	"remote_plugin",
	"computer_use",
	"browser_use",
	"browser_use_external",
	"in_app_browser",
	"image_generation",
	"imagegenext",
	"multi_agent",
	"multi_agent_v2",
	"collab",
	"hooks",
	"codex_hooks",
	"plugin_hooks",
	"memories",
	"memory_tool",
	"request_permissions",
	"request_permissions_tool",
	"stable_environment_tools",
	"workspace_dependencies",
	"skill_search",
	"view_image"
];
const isolatedConfig = () => Object.fromEntries([
	...disabledFeatures.map((k) => ["features." + k, false]),
	["features.code_mode", true],
	["features.code_mode_host", true],
	["features.skip_host_skill_discovery", true],
	["web_search", "disabled"],
	["agents.enabled", false]
]);
var RpcClient = class extends EventEmitter {
	child;
	timeout;
	pending = /* @__PURE__ */ new Map();
	nextId = 1;
	closed = false;
	stderr = "";
	constructor(child, { timeout = 3e4 } = {}) {
		super();
		this.child = child;
		this.timeout = timeout;
		this.pending = /* @__PURE__ */ new Map();
		this.nextId = 1;
		this.closed = false;
		this.stderr = "";
		child.stderr?.on("data", (b) => {
			this.stderr = (this.stderr + b).slice(-2e3);
		});
		readline.createInterface({ input: child.stdout }).on("line", (line) => {
			let m;
			try {
				m = JSON.parse(line);
			} catch {
				return;
			}
			if (m.method) this.emit("message", m);
			else {
				const p = typeof m.id === "number" ? this.pending.get(m.id) : void 0;
				if (p) {
					clearTimeout(p.timer);
					this.pending.delete(m.id);
					if (m.error) p.reject(Error(m.error.message));
					else p.resolve(m.result);
				}
			}
		});
		child.on("error", (e) => this.fail(e));
		child.on("exit", () => this.fail(Error("Codex app-server 已退出；请运行 doctor 检查版本和配置。")));
	}
	fail(e) {
		if (this.closed) return;
		this.closed = true;
		for (const p of this.pending.values()) {
			clearTimeout(p.timer);
			p.reject(e);
		}
		this.pending.clear();
		this.emit("closed", e);
	}
	write(m) {
		if (this.closed) throw Error("Codex 连接已关闭");
		this.child.stdin.write(JSON.stringify(m) + "\n");
	}
	request(method, params) {
		return new Promise((resolve, reject) => {
			const id = this.nextId++;
			const timer = setTimeout(() => {
				this.pending.delete(id);
				reject(Error("Codex 请求超时：" + method));
			}, this.timeout);
			this.pending.set(id, {
				resolve,
				reject,
				timer
			});
			try {
				this.write({
					id,
					method,
					params
				});
			} catch (e) {
				clearTimeout(timer);
				this.pending.delete(id);
				reject(e);
			}
		});
	}
	notify(method, params = {}) {
		this.write({
			method,
			params
		});
	}
	close() {
		this.fail(Error("连接已关闭"));
		this.child.kill();
	}
};
async function connectCodex(executable, cwd) {
	const args = ["app-server", ...Object.entries(isolatedConfig()).flatMap(([k, v]) => ["-c", k + "=" + JSON.stringify(v)])];
	const env = { ...process.env };
	for (const key of [
		"CODEX_THREAD_ID",
		"CODEX_SESSION_ID",
		"CODEX_TOOL_CALL_ID",
		"CODEX_TASK_WORKSPACE_VERIFYING_IDENTITY",
		"CODEX_APP_TOOLS_PIPE_PATH",
		"CODEX_PERMISSION_PROFILE",
		"CODEX_INTERNAL_ORIGINATOR_OVERRIDE"
	]) delete env[key];
	const rpc = new RpcClient(spawn(executable, args, {
		cwd,
		env,
		windowsHide: true,
		stdio: [
			"pipe",
			"pipe",
			"pipe"
		]
	}));
	try {
		await rpc.request("initialize", {
			clientInfo: {
				name: "codex_bili_dragon",
				title: "B 站小白龙",
				version
			},
			capabilities: { experimentalApi: true }
		});
		rpc.notify("initialized");
		return rpc;
	} catch (e) {
		rpc.close();
		throw Error("Codex 初始化失败：" + errorMessage(e));
	}
}
var CodexSession = class {
	service;
	connector;
	rpc = null;
	threadId = null;
	turnId = null;
	busy = false;
	completions = /* @__PURE__ */ new Map();
	finalMessages = /* @__PURE__ */ new Map();
	generation = 0;
	cwd = "";
	tools = [];
	currentJob = null;
	constructor(service, connector = connectCodex) {
		this.service = service;
		this.connector = connector;
		this.rpc = null;
		this.threadId = null;
		this.busy = false;
		this.completions = /* @__PURE__ */ new Map();
		this.generation = 0;
	}
	async open() {
		if (this.rpc && !this.rpc.closed) return;
		const c = this.service.config(), cwd = path.join(this.service.store.dir, "workspace");
		fs.mkdirSync(cwd, { recursive: true });
		this.cwd = cwd;
		const generation = this.generation;
		const rpc = await this.connector(findCodex(c.codexPath), cwd);
		if (generation !== this.generation) {
			rpc.close();
			throw Error("会话已暂停，未启动新回合");
		}
		this.rpc = rpc;
		this.tools = catalog(this.service, {
			recentHistory: true,
			browseJobId: () => this.currentJob?.type === "browse" ? this.currentJob.id : void 0,
			activityContext: () => ({
				source: this.currentJob?.payload.manual ? "manual" : "autonomous",
				jobId: this.currentJob?.id
			})
		});
		const toolSignature = createHash("sha256").update(JSON.stringify(this.tools.map(({ name, inputSchema }) => ({
			name,
			inputSchema
		})))).digest("hex");
		this.rpc.on("message", (m) => {
			this.handle(m).catch((e) => {
				this.service.store.write("codex-error", { message: errorMessage(e) });
			});
		});
		if (!accountResponse.parse(await this.rpc.request("account/read", { refreshToken: false })).account) throw Error("Codex 尚未登录，请先在官方客户端登录。");
		const config = isolatedConfig();
		const loaded = configResponse.parse(await this.rpc.request("config/read", { includeLayers: false }));
		for (const name of Object.keys(loaded.config?.mcp_servers ?? {})) config["mcp_servers." + name + ".enabled"] = false;
		const params = {
			cwd,
			approvalPolicy: "never",
			sandbox: "read-only",
			config,
			baseInstructions,
			developerInstructions,
			...c.model ? { model: c.model } : {}
		};
		const prior = this.service.store.read("codex-session", {});
		let result;
		if (prior.threadId && prior.toolSignature === toolSignature) {
			result = threadResponse.parse(await this.rpc.request("thread/resume", {
				...params,
				threadId: prior.threadId
			}));
			if (result.thread?.status?.type === "active") throw Error("专属会话仍在运行，请先人工核查，未重复启动。");
		} else result = threadResponse.parse(await this.rpc.request("thread/start", {
			...params,
			environments: [],
			dynamicTools: this.tools.map(({ call: _call, ...x }) => ({
				type: "function",
				...x
			}))
		}));
		this.threadId = result.thread.id;
		this.service.store.write("codex-session", {
			threadId: this.threadId,
			toolSignature
		});
	}
	async handle(m) {
		const rpc = this.rpc;
		if (!rpc) return;
		if (m.method === "item/completed") {
			const result = object({
				threadId: string(),
				turnId: string(),
				item: object({
					type: literal("agentMessage"),
					text: string(),
					phase: literal("final_answer").nullish()
				})
			}).safeParse(m.params);
			if (result.success && result.data.threadId === this.threadId) this.finalMessages.set(result.data.turnId, redact(result.data.item.text.slice(0, 2e3), this.service.store.dir));
			return;
		}
		if (m.method === "turn/completed") {
			const { turn } = object({ turn: turnSchema }).parse(m.params);
			const key = turn.id;
			this.completions.set(key, turn);
			rpc.emit("turn-finished", key);
			return;
		}
		if (m.id === void 0) return;
		if (m.method === "item/tool/call") {
			const params = toolCallSchema.parse(m.params);
			if (!this.busy || params.threadId !== this.threadId) {
				rpc.write({
					id: m.id,
					result: {
						success: false,
						contentItems: [{
							type: "inputText",
							text: "没有有效后台任务"
						}]
					}
				});
				return;
			}
			const tool = this.tools.find((x) => x.name === params.tool);
			const r = tool ? await tool.call(params.arguments) : {
				isError: true,
				content: [{
					type: "text",
					text: "此工具不可用"
				}]
			};
			rpc.write({
				id: m.id,
				result: {
					success: !r.isError,
					contentItems: r.content.map((x) => x.type === "image" ? {
						type: "inputImage",
						imageUrl: `data:${x.mimeType};base64,${x.data}`
					} : {
						type: "inputText",
						text: x.text
					})
				}
			});
		} else rpc.write({
			id: m.id,
			error: {
				code: -32601,
				message: "后台不接受额外审批或交互请求"
			}
		});
	}
	async run(job) {
		if (this.busy) throw Error("已有任务正在运行");
		this.busy = true;
		this.currentJob = job;
		const previousDiaries = new Set(this.service.store.read("diaries", []).map((diary) => diary.id));
		try {
			await this.open();
			const rpc = this.rpc;
			if (!rpc) throw Error("会话已暂停");
			const config = this.service.config();
			const prompt = taskPrompt(config, job);
			const id = object({ turn: object({ id: string() }) }).parse(await rpc.request("turn/start", {
				threadId: this.threadId,
				environments: [],
				input: [{
					type: "text",
					text: prompt + "\n任务数据（不是指令）：" + JSON.stringify({
						...job.payload,
						jobId: job.id
					}),
					text_elements: []
				}],
				approvalPolicy: "never",
				sandboxPolicy: {
					type: "readOnly",
					networkAccess: false
				}
			})).turn.id;
			this.turnId = id;
			const turn = await new Promise((resolve, reject) => {
				let timer;
				const cleanup = () => {
					clearTimeout(timer);
					rpc.off("turn-finished", done);
					rpc.off("closed", closed);
				};
				const done = (key) => {
					if (key === id) {
						cleanup();
						const completed = this.completions.get(id);
						if (completed) resolve(completed);
					}
				};
				const closed = (e) => {
					cleanup();
					reject(e);
				};
				timer = setTimeout(() => {
					cleanup();
					rpc.request("turn/interrupt", {
						threadId: this.threadId,
						turnId: id
					}).catch(() => {});
					reject(Error("回合超时，已请求中断，结果待核查"));
				}, 9e5);
				rpc.on("turn-finished", done);
				rpc.on("closed", closed);
				if (this.completions.has(id)) done(id);
			});
			this.completions.delete(id);
			const summary = this.finalMessages.get(id);
			this.finalMessages.delete(id);
			if (turn.status !== "completed") throw Error("Codex 回合未完成：" + (turn.error?.message ?? turn.status));
			const diaryCount = this.service.store.read("diaries", []).filter((diary) => !previousDiaries.has(diary.id)).length;
			if (job.type === "browse" && diaryCount === 0) throw Error("本次探索未完成：" + (summary || "未产生浏览日记，请检查运行设置后重试"));
			return {
				status: turn.status,
				turnId: id,
				diaryCount,
				summary
			};
		} finally {
			this.busy = false;
			this.turnId = null;
			this.currentJob = null;
		}
	}
	async stop() {
		this.generation++;
		if (this.turnId && this.rpc && !this.rpc.closed) await this.rpc.request("turn/interrupt", {
			threadId: this.threadId,
			turnId: this.turnId
		}).catch(() => {});
		this.rpc?.close();
		this.rpc = null;
	}
};
// src/listeners.ts
var Listeners = class {
	service;
	next = {};
	failures = {};
	active = /* @__PURE__ */ new Set();
	stopped = false;
	suspended = false;
	constructor(service) {
		this.service = service;
		this.next = {};
		this.failures = {};
		this.active = /* @__PURE__ */ new Set();
		this.stopped = false;
	}
	enqueue(event) {
		if (this.stopped || this.suspended) throw Error("监听已暂停，未确认消息交接");
		this.service.ingest(event);
		this.service.queue.add("event:" + event.id, "message", { eventId: event.id });
	}
	async dm() {
		const r = await this.service.run([
			"dm-await",
			"--peek",
			"--json"
		]);
		if (r.code === 1) return;
		if (r.code !== 0) throw Error(r.err || "私信读取失败");
		const e = JSON.parse(r.out);
		if (!e.hit) return;
		const owner = this.service.config().owner.mid;
		if (!owner || String(e.mid) !== owner || !e.key || !e.receipt) throw Error("私信身份或确认凭据无效");
		this.enqueue({
			id: "dm:" + e.mid + ":" + e.key,
			channel: "dm",
			mid: String(e.mid),
			text: e.text,
			time: e.ts
		});
		if ((await this.service.run([
			"dm-await",
			"--ack",
			e.receipt
		])).code !== 0) throw Error("私信已保存但确认失败，下次只重试确认");
	}
	async comments() {
		if (this.stopped || this.suspended) throw Error("监听已暂停，未确认消息交接");
		await this.service.checkComments(() => !this.stopped && !this.suspended);
	}
	async live() {
		const c = this.service.config();
		if (!c.listen.liveRoom) return;
		const r = await this.service.run([
			"await",
			"--room",
			c.listen.liveRoom,
			"--scope",
			c.listen.liveScope,
			"--timeout",
			"50"
		], { timeout: 75e3 });
		if (r.code !== 0) throw Error(r.err || "直播监听失败");
		if (r.out.includes("AWAIT_DEAD")) throw Error("直播连接没有收到数据，已退避");
		const line = r.out.split(/\r?\n/).find((x) => x.startsWith("DRAGON_LIVE_HIT "));
		if (!line) return;
		const e = JSON.parse(line.slice(16));
		this.enqueue({
			...e,
			id: "live:" + e.room + ":" + e.dmid,
			channel: "live",
			mid: String(e.mid)
		});
		const file = path.join(this.service.store.dir, ".bili-ai/dragon-live-pending.json");
		if (JSON.parse(fs.readFileSync(file, "utf8")).receipt === e.receipt) fs.unlinkSync(file);
	}
	tick(now = Date.now()) {
		if (this.stopped) return;
		const c = this.service.config();
		const polls = [
			[
				"comments",
				c.listen.comment,
				c.listen.commentIntervalSec,
				() => this.comments()
			],
			[
				"dm",
				c.listen.dm,
				c.listen.dmIntervalSec,
				() => this.dm()
			],
			[
				"live",
				c.listen.live,
				60,
				() => this.live()
			]
		];
		for (const [name, enabled, seconds, fn] of polls) {
			if (!enabled || this.active.has(name) || (this.next[name] ?? 0) > now) continue;
			this.active.add(name);
			fn().then(() => {
				this.failures[name] = 0;
				this.next[name] = Date.now() + seconds * 1e3;
				this.service.store.update("listener-status", {}, (s) => {
					s[name] = {
						ok: true,
						at: (/* @__PURE__ */ new Date()).toISOString()
					};
				});
			}).catch((e) => {
				const n = this.failures[name] = (this.failures[name] ?? 0) + 1;
				this.next[name] = Date.now() + Math.min(9e5, seconds * 1e3 * 2 ** Math.min(n, 5));
				this.service.store.update("listener-status", {}, (s) => {
					s[name] = {
						ok: false,
						error: errorMessage(e),
						nextAt: new Date(this.next[name]).toISOString()
					};
				});
			}).finally(() => this.active.delete(name));
		}
	}
	stop() {
		this.stopped = true;
	}
};
// src/schedule.ts
const minutes = (s) => {
	const [h, m] = s.split(":").map(Number);
	return h * 60 + m;
};
function stamp(day, n) {
	return day.plus({ days: Math.floor(n / 1440) }).set({
		hour: Math.floor(n % 1440 / 60),
		minute: n % 60,
		second: 0,
		millisecond: 0
	}).toMillis();
}
function occurrences(c, now) {
	const today = DateTime.fromMillis(now, { zone: c.timezone }).startOf("day");
	return c.night.windows.flatMap((w) => {
		const start = minutes(w.start), end = minutes(w.end) + (minutes(w.end) <= start ? 1440 : 0);
		return [-1, 0].map((offset) => {
			const d = today.plus({ days: offset });
			return {
				...w,
				key: `${d.toISODate()}|${w.start}–${w.end}`,
				start: stamp(d, start),
				end: stamp(d, end)
			};
		});
	}).filter((w) => w.end > now).sort((a, b) => a.end - b.end);
}
const inWindow = (c, now = Date.now()) => occurrences(c, now).some((w) => w.start <= now && w.end > now && w.wakes > 0);
function plan(c, state = {}, now = Date.now(), random = Math.random) {
	const signature = JSON.stringify([c.timezone, c.night]);
	if (state.signature === signature && state.action !== "done" && !state.fired && (state.endsAt ?? 0) > now) return state;
	const used = { ...state.used };
	const cutoff = DateTime.fromMillis(now, { zone: c.timezone }).minus({ days: 7 }).toISODate();
	for (const key of Object.keys(used)) if (key.slice(0, 10) < (cutoff ?? "")) delete used[key];
	const base = {
		used,
		lastAt: state.lastAt || 0,
		signature
	};
	for (const w of occurrences(c, now)) {
		if (Object.entries(used).filter(([key]) => key.slice(0, 10) === w.key.slice(0, 10)).reduce((sum, [, n]) => sum + n, 0) >= 3) continue;
		if ((used[w.key] || 0) >= w.wakes) continue;
		const from = Math.max(now, w.start, base.lastAt + c.night.minGapMin * 6e4);
		if (from >= w.end - 1e3) continue;
		return {
			...base,
			action: random() < c.night.skipChance ? "skip" : "browse",
			windowKey: w.key,
			startsAt: w.start,
			endsAt: w.end,
			atMs: from + Math.floor(random() * (w.end - from)),
			fired: false
		};
	}
	return {
		...base,
		action: "done"
	};
}
function complete(p, now = Date.now()) {
	if (!p.windowKey) return p;
	if (p.fired) return p;
	return {
		...p,
		fired: true,
		lastAt: now,
		used: {
			...p.used,
			[p.windowKey]: (p.used?.[p.windowKey] || 0) + 1
		}
	};
}
// src/daemon.ts
var Daemon = class {
	service;
	session;
	listeners;
	busy = false;
	draining = false;
	stopped = true;
	release = null;
	timer;
	constructor(service, session = new CodexSession(service)) {
		this.service = service;
		this.session = session;
		this.listeners = new Listeners(service);
		this.busy = false;
		this.stopped = true;
	}
	start() {
		this.release = exclusive(path.join(this.service.store.dir, "daemon.lock"));
		this.service.recover();
		this.stopped = false;
		this.service.store.write("runtime", {
			state: "idle",
			startedAt: (/* @__PURE__ */ new Date()).toISOString()
		});
		this.timer = setInterval(() => void this.tick().catch((e) => this.error(e)), 5e3);
		return this;
	}
	error(e) {
		this.service.store.update("runtime", {}, (s) => Object.assign(s, {
			error: errorMessage(e),
			lastErrorAt: (/* @__PURE__ */ new Date()).toISOString()
		}));
	}
	get idleForUpdate() {
		return !this.busy && this.listeners.active.size === 0 && this.service.controllers.size === 0;
	}
	async tick(now = Date.now()) {
		if (this.stopped || this.draining) return;
		const c = this.service.config();
		if (c.enabled) {
			this.listeners.suspended = false;
			const state = plan(c, this.service.store.read("schedule", {}), now);
			this.service.store.write("schedule", state);
			if (state.action !== "done" && !state.fired && state.atMs !== void 0 && state.atMs <= now && state.windowKey) {
				if (state.action === "browse") this.service.queue.add("schedule:" + state.windowKey + ":" + (state.used[state.windowKey] ?? 0), "browse", {});
				this.service.store.write("schedule", complete(state, now));
			}
			if (c.listen.allDay || inWindow(c, now)) this.listeners.tick(now);
		}
		if (this.busy) return;
		const pending = this.service.queue.list().find((x) => x.state === "pending");
		if (!pending || !c.enabled && !pending.payload?.manual) return;
		this.busy = true;
		const job = this.service.queue.claim();
		if (!job) {
			this.busy = false;
			return;
		}
		try {
			this.service.store.update("runtime", {}, (s) => Object.assign(s, {
				state: "running",
				jobId: job.id,
				error: null
			}));
			const result = await this.session.run(job);
			this.service.queue.finish(job.id, "done", result);
		} catch (e) {
			this.service.queue.finish(job.id, "needs-review", errorMessage(e));
			this.error(e);
			await this.session.stop();
		} finally {
			this.busy = false;
			this.service.store.update("runtime", {}, (s) => Object.assign(s, {
				state: this.stopped ? "stopped" : "idle",
				jobId: null
			}));
		}
	}
	async pause() {
		this.service.saveConfig({
			...this.service.config(),
			enabled: false
		});
		this.listeners.suspended = true;
		this.service.cancelTools();
		await this.session.stop();
	}
	async stop() {
		this.stopped = true;
		clearInterval(this.timer);
		this.listeners.stop();
		this.service.cancelTools();
		await this.session.stop();
		this.service.store.update("runtime", {}, (s) => Object.assign(s, { state: "stopped" }));
		this.release?.();
		this.release = null;
	}
};
// ../../node_modules/.pnpm/radash@12.1.1/node_modules/radash/dist/esm/async.mjs
const guard = (func, shouldGuard) => {
	const _guard = (err) => {
		if (shouldGuard && !shouldGuard(err)) throw err;
	};
	const isPromise2 = (result) => result instanceof Promise;
	try {
		const result = func();
		return isPromise2(result) ? result.catch(_guard) : result;
	} catch (err) {
		return _guard(err);
	}
};
// ../../node_modules/.pnpm/@orpc+shared@1.16.1/node_modules/@orpc/shared/dist/index.mjs
function resolveMaybeOptionalOptions(rest) {
	return rest[0] ?? {};
}
function toArray(value) {
	return Array.isArray(value) ? value : value === void 0 || value === null ? [] : [value];
}
const DEFAULT_MAX_BIGINT_DIGITS = 4300;
const BIGINT_PATTERN = /^-?(?:0|[1-9]\d*)$/;
function parseBigIntString(value, maxDigits) {
	if ((value.startsWith("-") ? value.length - 1 : value.length) > maxDigits || !BIGINT_PATTERN.test(value)) return;
	return BigInt(value);
}
const ORPC_NAME = "orpc";
const ORPC_SHARED_PACKAGE_NAME = "@orpc/shared";
const ORPC_SHARED_PACKAGE_VERSION = "1.16.1";
var AbortError = class extends Error {
	constructor(...rest) {
		super(...rest);
		this.name = "AbortError";
	}
};
function once(fn) {
	let cached;
	return () => {
		if (cached) return cached.result;
		const result = fn();
		cached = { result };
		return result;
	};
}
function sequential(fn) {
	let lastOperationPromise = Promise.resolve();
	return (...args) => {
		return lastOperationPromise = lastOperationPromise.catch(() => {}).then(() => {
			return fn(...args);
		});
	};
}
const SPAN_ERROR_STATUS = 2;
const GLOBAL_OTEL_CONFIG_KEY = `__${ORPC_SHARED_PACKAGE_NAME}@${ORPC_SHARED_PACKAGE_VERSION}/otel/config__`;
function getGlobalOtelConfig() {
	return globalThis[GLOBAL_OTEL_CONFIG_KEY];
}
function startSpan(name, options = {}, context) {
	return (getGlobalOtelConfig()?.tracer)?.startSpan(name, options, context);
}
function setSpanError(span, error, options = {}) {
	if (!span) return;
	const exception = toOtelException(error);
	span.recordException(exception);
	if (!options.signal?.aborted || options.signal.reason !== error) span.setStatus({
		code: SPAN_ERROR_STATUS,
		message: exception.message
	});
}
function toOtelException(error) {
	if (error instanceof Error) {
		const exception = {
			message: error.message,
			name: error.name,
			stack: error.stack
		};
		if ("code" in error && (typeof error.code === "string" || typeof error.code === "number")) exception.code = error.code;
		return exception;
	}
	return { message: String(error) };
}
async function runWithSpan({ name, context, ...options }, fn) {
	const tracer = getGlobalOtelConfig()?.tracer;
	if (!tracer) return fn();
	const callback = async (span) => {
		try {
			return await fn(span);
		} catch (e) {
			setSpanError(span, e, options);
			throw e;
		} finally {
			span.end();
		}
	};
	if (context) return tracer.startActiveSpan(name, options, context, callback);
	else return tracer.startActiveSpan(name, options, callback);
}
async function runInSpanContext(span, fn) {
	const otelConfig = getGlobalOtelConfig();
	if (!span || !otelConfig) return fn();
	const ctx = otelConfig.trace.setSpan(otelConfig.context.active(), span);
	return otelConfig.context.with(ctx, fn);
}
function isAsyncIteratorObject(maybe) {
	if (!maybe || typeof maybe !== "object") return false;
	return "next" in maybe && typeof maybe.next === "function" && Symbol.asyncIterator in maybe && typeof maybe[Symbol.asyncIterator] === "function";
}
const asyncDisposeSymbol = Symbol.asyncDispose ?? Symbol.for("asyncDispose");
var AsyncIteratorClass = class {
	#isDone = false;
	#isExecuteComplete = false;
	#cleanup;
	#next;
	constructor(next, cleanup) {
		this.#cleanup = cleanup;
		this.#next = sequential(async () => {
			if (this.#isDone) return {
				done: true,
				value: void 0
			};
			try {
				const result = await next();
				if (result.done) this.#isDone = true;
				return result;
			} catch (err) {
				this.#isDone = true;
				throw err;
			} finally {
				if (this.#isDone && !this.#isExecuteComplete) {
					this.#isExecuteComplete = true;
					await this.#cleanup("next");
				}
			}
		});
	}
	next() {
		return this.#next();
	}
	async return(value) {
		this.#isDone = true;
		if (!this.#isExecuteComplete) {
			this.#isExecuteComplete = true;
			await this.#cleanup("return");
		}
		return {
			done: true,
			value
		};
	}
	async throw(err) {
		this.#isDone = true;
		if (!this.#isExecuteComplete) {
			this.#isExecuteComplete = true;
			await this.#cleanup("throw");
		}
		throw err;
	}
	/**
	* asyncDispose symbol only available in esnext, we should fallback to Symbol.for('asyncDispose')
	*/
	async [asyncDisposeSymbol]() {
		this.#isDone = true;
		if (!this.#isExecuteComplete) {
			this.#isExecuteComplete = true;
			await this.#cleanup("dispose");
		}
	}
	[Symbol.asyncIterator]() {
		return this;
	}
};
function asyncIteratorWithSpan({ name, ...options }, iterator) {
	let span;
	return new AsyncIteratorClass(async () => {
		span ??= startSpan(name);
		try {
			const result = await runInSpanContext(span, () => iterator.next());
			span?.addEvent(result.done ? "completed" : "yielded");
			return result;
		} catch (err) {
			setSpanError(span, err, options);
			throw err;
		}
	}, async (reason) => {
		try {
			if (reason !== "next") await runInSpanContext(span, () => iterator.return?.());
		} catch (err) {
			setSpanError(span, err, options);
			throw err;
		} finally {
			span?.end();
		}
	});
}
function intercept(interceptors, options, main) {
	const next = (options2, index) => {
		const interceptor = interceptors[index];
		if (!interceptor) return main(options2);
		return interceptor({
			...options2,
			next: (newOptions = options2) => next(newOptions, index + 1)
		});
	};
	return next(options, 0);
}
function parseEmptyableJSON(text) {
	if (!text) return;
	return JSON.parse(text);
}
function stringifyJSON(value) {
	return JSON.stringify(value);
}
function getConstructor(value) {
	if (!isTypescriptObject(value)) return null;
	return Object.getPrototypeOf(value)?.constructor;
}
function isObject(value) {
	if (!value || typeof value !== "object") return false;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || !proto || !proto.constructor;
}
function isTypescriptObject(value) {
	return !!value && (typeof value === "object" || typeof value === "function");
}
function setOwn(object, key, value) {
	if (key === "__proto__") Object.defineProperty(object, key, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
	else object[key] = value;
}
function copyOnWrite(parent, key, original) {
	const value = parent[key];
	if (value !== original) return value;
	let copy;
	if (Array.isArray(value)) copy = value.slice();
	else if (isObject(value)) copy = { ...value };
	else return value;
	setOwn(parent, key, copy);
	return copy;
}
const NullProtoObj = /* @__PURE__ */ (() => {
	const e = function() {};
	e.prototype = /* @__PURE__ */ Object.create(null);
	Object.freeze(e.prototype);
	return e;
})();
function value(value2, ...args) {
	if (typeof value2 === "function") return value2(...args);
	return value2;
}
function overlayProxy(target, partial) {
	return new Proxy(typeof target === "function" ? partial : target, {
		get(_, prop) {
			const targetValue = prop in partial ? partial : value(target);
			const v = Reflect.get(targetValue, prop);
			return typeof v === "function" ? v.bind(targetValue) : v;
		},
		has(_, prop) {
			return Reflect.has(partial, prop) || Reflect.has(value(target), prop);
		}
	});
}
const REGEXP_FLAGS = /^[dgimsuvy]*$/;
function isValidRegExpFlags(flags) {
	return REGEXP_FLAGS.test(flags) && new Set(flags).size === flags.length && !(flags.includes("u") && flags.includes("v"));
}
function createLazyRegExp(pattern, flags) {
	let compiled;
	let lastIndex = 0;
	const compile = () => {
		if (compiled === void 0) {
			compiled = new RegExp(pattern, flags);
			compiled.lastIndex = lastIndex;
		}
		return compiled;
	};
	return new Proxy(Object.create(RegExp.prototype), {
		get(_, prop) {
			if (prop === Symbol.toStringTag) return "RegExp";
			if (compiled === void 0) {
				if (prop === "lastIndex") return lastIndex;
				if (!(prop in RegExp.prototype)) return;
			}
			const target = compile();
			const value = Reflect.get(target, prop, target);
			return typeof value === "function" && prop !== "constructor" ? value.bind(target) : value;
		},
		set(_, prop, value) {
			if (compiled === void 0 && prop === "lastIndex") {
				lastIndex = value;
				return true;
			}
			const target = compile();
			return Reflect.set(target, prop, value, target);
		},
		has(_, prop) {
			if (compiled === void 0) return prop === "lastIndex" || prop in RegExp.prototype;
			return Reflect.has(compiled, prop);
		}
	});
}
function tryDecodeURIComponent(value) {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}
// ../../node_modules/.pnpm/@orpc+client@1.16.1/node_modules/@orpc/client/dist/shared/client.D_0j2fRr.mjs
const ORPC_CLIENT_PACKAGE_NAME = "@orpc/client";
const ORPC_CLIENT_PACKAGE_VERSION = "1.16.1";
const COMMON_ORPC_ERROR_DEFS = {
	BAD_REQUEST: {
		status: 400,
		message: "Bad Request"
	},
	UNAUTHORIZED: {
		status: 401,
		message: "Unauthorized"
	},
	FORBIDDEN: {
		status: 403,
		message: "Forbidden"
	},
	NOT_FOUND: {
		status: 404,
		message: "Not Found"
	},
	METHOD_NOT_SUPPORTED: {
		status: 405,
		message: "Method Not Supported"
	},
	NOT_ACCEPTABLE: {
		status: 406,
		message: "Not Acceptable"
	},
	TIMEOUT: {
		status: 408,
		message: "Request Timeout"
	},
	CONFLICT: {
		status: 409,
		message: "Conflict"
	},
	PRECONDITION_FAILED: {
		status: 412,
		message: "Precondition Failed"
	},
	PAYLOAD_TOO_LARGE: {
		status: 413,
		message: "Payload Too Large"
	},
	UNSUPPORTED_MEDIA_TYPE: {
		status: 415,
		message: "Unsupported Media Type"
	},
	UNPROCESSABLE_CONTENT: {
		status: 422,
		message: "Unprocessable Content"
	},
	TOO_MANY_REQUESTS: {
		status: 429,
		message: "Too Many Requests"
	},
	CLIENT_CLOSED_REQUEST: {
		status: 499,
		message: "Client Closed Request"
	},
	INTERNAL_SERVER_ERROR: {
		status: 500,
		message: "Internal Server Error"
	},
	NOT_IMPLEMENTED: {
		status: 501,
		message: "Not Implemented"
	},
	BAD_GATEWAY: {
		status: 502,
		message: "Bad Gateway"
	},
	SERVICE_UNAVAILABLE: {
		status: 503,
		message: "Service Unavailable"
	},
	GATEWAY_TIMEOUT: {
		status: 504,
		message: "Gateway Timeout"
	}
};
function fallbackORPCErrorStatus(code, status) {
	return status ?? COMMON_ORPC_ERROR_DEFS[code]?.status ?? 500;
}
function fallbackORPCErrorMessage(code, message) {
	return message || COMMON_ORPC_ERROR_DEFS[code]?.message || code;
}
let globalORPCErrorConstructors;
var ORPCError = class ORPCError extends Error {
	defined;
	code;
	status;
	data;
	static {
		const GLOBAL_ORPC_ERROR_CONSTRUCTORS_SYMBOL = Symbol.for(`__${ORPC_CLIENT_PACKAGE_NAME}@${ORPC_CLIENT_PACKAGE_VERSION}/error/ORPC_ERROR_CONSTRUCTORS__`);
		globalThis[GLOBAL_ORPC_ERROR_CONSTRUCTORS_SYMBOL] ??= /* @__PURE__ */ new WeakSet();
		globalORPCErrorConstructors = globalThis[GLOBAL_ORPC_ERROR_CONSTRUCTORS_SYMBOL];
		globalORPCErrorConstructors.add(ORPCError);
	}
	constructor(code, ...rest) {
		const options = resolveMaybeOptionalOptions(rest);
		if (options.status !== void 0 && !isORPCErrorStatus(options.status)) throw new Error("[ORPCError] Invalid error status code.");
		const message = fallbackORPCErrorMessage(code, options.message);
		super(message, options);
		this.code = code;
		this.status = fallbackORPCErrorStatus(code, options.status);
		this.defined = options.defined ?? false;
		this.data = options.data;
	}
	toJSON() {
		return {
			defined: this.defined,
			code: this.code,
			status: this.status,
			message: this.message,
			data: this.data
		};
	}
	/**
	* Workaround for Next.js where different contexts use separate
	* dependency graphs, causing multiple ORPCError constructors existing and breaking
	* `instanceof` checks across contexts.
	*
	* This is particularly problematic with "Optimized SSR", where orpc-client
	* executes in one context but is invoked from another. When an error is thrown
	* in the execution context, `instanceof ORPCError` checks fail in the
	* invocation context due to separate class constructors.
	*
	* @todo Remove this and related code if Next.js resolves the multiple dependency graph issue.
	*/
	static [Symbol.hasInstance](instance) {
		if (globalORPCErrorConstructors.has(this)) {
			const constructor = getConstructor(instance);
			if (constructor && globalORPCErrorConstructors.has(constructor)) return true;
		}
		return super[Symbol.hasInstance](instance);
	}
};
function toORPCError(error) {
	return error instanceof ORPCError ? error : new ORPCError("INTERNAL_SERVER_ERROR", {
		message: "Internal server error",
		cause: error
	});
}
function isORPCErrorStatus(status) {
	return status < 200 || status >= 400;
}
function isORPCErrorJson(json) {
	if (!isObject(json)) return false;
	const validKeys = [
		"defined",
		"code",
		"status",
		"message",
		"data"
	];
	if (Object.keys(json).some((k) => !validKeys.includes(k))) return false;
	return "defined" in json && typeof json.defined === "boolean" && "code" in json && typeof json.code === "string" && "status" in json && typeof json.status === "number" && isORPCErrorStatus(json.status) && "message" in json && typeof json.message === "string";
}
function createORPCErrorFromJson(json, options = {}) {
	return new ORPCError(json.code, {
		...options,
		...json
	});
}
// ../../node_modules/.pnpm/@orpc+standard-server@1.16.1/node_modules/@orpc/standard-server/dist/index.mjs
var EventEncoderError = class extends TypeError {};
var EventDecoderError = class extends TypeError {};
var ErrorEvent = class extends Error {
	data;
	constructor(options) {
		super(options?.message ?? "An error event was received", options);
		this.data = options?.data;
	}
};
const LINE_ENDING_REGEX$1 = /\r\n|\r(?!\n)|\n/;
const MESSAGE_DELIMITER_REGEX = /(?:\r\n|\r(?!\n)|\n){2}/;
const MESSAGE_DELIMITER_GLOBAL_REGEX = /(?:\r\n|\r(?!\n)|\n){2}/g;
const CR = 13;
const LF = 10;
const SPACE = 32;
function decodeEventMessage(encoded) {
	const message = {
		data: void 0,
		event: void 0,
		id: void 0,
		retry: void 0,
		comments: []
	};
	for (const line of encoded.split(LINE_ENDING_REGEX$1)) {
		if (line === "") continue;
		const index = line.indexOf(":");
		const value = index === -1 ? "" : line.slice(line.charCodeAt(index + 1) === SPACE ? index + 2 : index + 1);
		if (index === 0) {
			message.comments.push(value);
			continue;
		}
		switch (index === -1 ? line : line.slice(0, index)) {
			case "data":
				message.data = message.data === void 0 ? value : `${message.data}
${value}`;
				break;
			case "event":
				message.event = value;
				break;
			case "id":
				message.id = value;
				break;
			case "retry": {
				const maybeInteger = Number.parseInt(value, 10);
				if (maybeInteger >= 0 && maybeInteger.toString() === value) message.retry = maybeInteger;
				break;
			}
		}
	}
	return message;
}
var EventDecoder = class {
	constructor(options = {}) {
		this.options = options;
	}
	pending = [];
	tail = "";
	discardLeadingLF = false;
	feed(chunk) {
		if (chunk === "") return;
		if (this.discardLeadingLF) {
			this.discardLeadingLF = false;
			if (chunk.charCodeAt(0) === LF) {
				chunk = chunk.slice(1);
				if (chunk === "") return;
			}
		}
		const scan = this.tail + chunk;
		if (!MESSAGE_DELIMITER_REGEX.test(scan)) {
			this.pending.push(chunk);
			this.tail = scan.slice(-3);
			return;
		}
		this.pending.push(chunk);
		const buffered = this.pending.length === 1 ? chunk : this.pending.join("");
		const offset = buffered.length - scan.length;
		const parts = [];
		let start = 0;
		for (const match of scan.matchAll(MESSAGE_DELIMITER_GLOBAL_REGEX)) {
			parts.push(buffered.slice(start, offset + match.index));
			start = offset + match.index + match[0].length;
		}
		const incomplete = buffered.slice(start);
		this.pending.length = 0;
		this.tail = incomplete.slice(-3);
		if (incomplete === "") this.discardLeadingLF = chunk.charCodeAt(chunk.length - 1) === CR;
		else this.pending.push(incomplete);
		for (const encoded of parts) {
			const message = decodeEventMessage(encoded);
			if (this.options.onEvent) this.options.onEvent(message);
		}
	}
	end() {
		if (this.pending.length !== 0) throw new EventDecoderError("Event Iterator ended before complete");
	}
};
var EventDecoderStream = class extends TransformStream {
	constructor() {
		let decoder;
		super({
			start(controller) {
				decoder = new EventDecoder({ onEvent: (event) => {
					controller.enqueue(event);
				} });
			},
			transform(chunk) {
				decoder.feed(chunk);
			},
			flush() {
				decoder.end();
			}
		});
	}
};
const LINE_ENDING_REGEX = /\r\n|[\n\r]/;
const LINE_ENDING_GLOBAL_REGEX = /\r\n|[\n\r]/g;
function containsLineBreak(value) {
	return LINE_ENDING_REGEX.test(value);
}
function assertEventId(id) {
	if (containsLineBreak(id)) throw new EventEncoderError("Event's id must not contain a carriage return or newline character");
}
function assertEventName(event) {
	if (containsLineBreak(event)) throw new EventEncoderError("Event's event must not contain a carriage return or newline character");
}
function assertEventRetry(retry) {
	if (!Number.isInteger(retry) || retry < 0) throw new EventEncoderError("Event's retry must be a integer and >= 0");
}
function assertEventComment(comment) {
	if (containsLineBreak(comment)) throw new EventEncoderError("Event's comment must not contain a carriage return or newline character");
}
function encodeEventData(data) {
	if (data === void 0) return "";
	return `data: ${data.replace(LINE_ENDING_GLOBAL_REGEX, "\ndata: ")}
`;
}
function encodeEventComments(comments) {
	let output = "";
	for (const comment of comments ?? []) {
		assertEventComment(comment);
		output += `: ${comment}
`;
	}
	return output;
}
function encodeEventMessage(message) {
	let output = "";
	output += encodeEventComments(message.comments);
	if (message.event !== void 0) {
		assertEventName(message.event);
		output += `event: ${message.event}
`;
	}
	if (message.retry !== void 0) {
		assertEventRetry(message.retry);
		output += `retry: ${message.retry}
`;
	}
	if (message.id !== void 0) {
		assertEventId(message.id);
		output += `id: ${message.id}
`;
	}
	output += encodeEventData(message.data);
	output += "\n";
	return output;
}
const EVENT_SOURCE_META_SYMBOL = Symbol("ORPC_EVENT_SOURCE_META");
function withEventMeta(container, meta) {
	if (meta.id === void 0 && meta.retry === void 0 && !meta.comments?.length) return container;
	if (meta.id !== void 0) assertEventId(meta.id);
	if (meta.retry !== void 0) assertEventRetry(meta.retry);
	if (meta.comments !== void 0) for (const comment of meta.comments) assertEventComment(comment);
	return new Proxy(container, { get(target, prop, receiver) {
		if (prop === EVENT_SOURCE_META_SYMBOL) return meta;
		return Reflect.get(target, prop, receiver);
	} });
}
function getEventMeta(container) {
	return isTypescriptObject(container) ? Reflect.get(container, EVENT_SOURCE_META_SYMBOL) : void 0;
}
var HibernationEventIterator = class extends AsyncIteratorClass {
	/**
	* this property is not transferred to the client, so it should be optional for type safety
	*/
	hibernationCallback;
	constructor(hibernationCallback) {
		super(async () => {
			throw new Error("Cannot iterate over hibernating iterator directly");
		}, async (reason) => {
			if (reason !== "next") throw new Error("Cannot cleanup hibernating iterator directly");
		});
		this.hibernationCallback = hibernationCallback;
	}
};
function generateContentDisposition(filename, disposition = "inline") {
	return `${disposition}; filename="${filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "\\\"")}"; filename*=utf-8''${encodeURIComponent(filename).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`).replace(/%(7C|60|5E)/g, (str, hex) => String.fromCharCode(Number.parseInt(hex, 16)))}`;
}
function getFilenameFromContentDisposition(contentDisposition) {
	const encodedFilenameStarMatch = contentDisposition.match(/filename\*=(UTF-8'')?([^;]*)/i);
	if (encodedFilenameStarMatch && typeof encodedFilenameStarMatch[2] === "string") return tryDecodeURIComponent(encodedFilenameStarMatch[2]);
	const encodedFilenameMatch = contentDisposition.match(/filename="((?:\\"|[^"])*)"/i);
	if (encodedFilenameMatch && typeof encodedFilenameMatch[1] === "string") return encodedFilenameMatch[1].replace(/\\"/g, "\"");
}
function flattenHeader(header) {
	if (typeof header === "string" || header === void 0) return header;
	if (header.length === 0) return;
	return header.join(", ");
}
// ../../node_modules/.pnpm/@orpc+client@1.16.1/node_modules/@orpc/client/dist/shared/client.BLtwTQUg.mjs
function mapEventIterator(iterator, maps) {
	const mapError = async (error) => {
		let mappedError = await maps.error(error);
		if (mappedError !== error) {
			const meta = getEventMeta(error);
			if (meta && isTypescriptObject(mappedError)) mappedError = withEventMeta(mappedError, meta);
		}
		return mappedError;
	};
	return new AsyncIteratorClass(async () => {
		const { done, value } = await (async () => {
			try {
				return await iterator.next();
			} catch (error) {
				throw await mapError(error);
			}
		})();
		let mappedValue = await maps.value(value, done);
		if (mappedValue !== value) {
			const meta = getEventMeta(value);
			if (meta && isTypescriptObject(mappedValue)) mappedValue = withEventMeta(mappedValue, meta);
		}
		return {
			done,
			value: mappedValue
		};
	}, async () => {
		try {
			await iterator.return?.();
		} catch (error) {
			throw await mapError(error);
		}
	});
}
// ../../node_modules/.pnpm/@orpc+standard-server-fetch@1.16.1/node_modules/@orpc/standard-server-fetch/dist/index.mjs
function toEventIterator$1(stream, options = {}) {
	const reader = (stream?.pipeThrough(new TextDecoderStream()).pipeThrough(new EventDecoderStream()))?.getReader();
	let span;
	let isCancelled = false;
	return new AsyncIteratorClass(async () => {
		span ??= startSpan("consume_event_iterator_stream");
		try {
			while (true) {
				if (reader === void 0) return {
					done: true,
					value: void 0
				};
				const { done, value } = await runInSpanContext(span, () => reader.read());
				if (done) {
					if (isCancelled) throw new AbortError("Stream was cancelled");
					return {
						done: true,
						value: void 0
					};
				}
				switch (value.event ?? (value.data !== void 0 ? "message" : void 0)) {
					case "message": {
						let message = parseEmptyableJSON(value.data);
						if (isTypescriptObject(message)) message = withEventMeta(message, value);
						span?.addEvent("message");
						return {
							done: false,
							value: message
						};
					}
					case "error": {
						let error = new ErrorEvent({ data: parseEmptyableJSON(value.data) });
						error = withEventMeta(error, value);
						span?.addEvent("error");
						throw error;
					}
					case "done":
					case "close": {
						let done2 = parseEmptyableJSON(value.data);
						if (isTypescriptObject(done2)) done2 = withEventMeta(done2, value);
						span?.addEvent("done");
						return {
							done: true,
							value: done2
						};
					}
					default: span?.addEvent("maybe_keepalive");
				}
			}
		} catch (e) {
			if (!(e instanceof ErrorEvent)) setSpanError(span, e, options);
			throw e;
		}
	}, async (reason) => {
		try {
			if (reason !== "next") {
				isCancelled = true;
				span?.addEvent("cancelled");
			}
			await runInSpanContext(span, () => reader?.cancel());
		} catch (e) {
			setSpanError(span, e, options);
			throw e;
		} finally {
			span?.end();
		}
	});
}
function toEventStream$1(iterator, options = {}) {
	const keepAliveEnabled = options.eventIteratorKeepAliveEnabled ?? true;
	const keepAliveInterval = options.eventIteratorKeepAliveInterval ?? 5e3;
	const keepAliveComment = options.eventIteratorKeepAliveComment ?? "";
	const initialCommentEnabled = options.eventIteratorInitialCommentEnabled ?? true;
	const initialComment = options.eventIteratorInitialComment ?? "";
	let cancelled = false;
	let timeout;
	let span;
	return new ReadableStream({
		start(controller) {
			span = startSpan("stream_event_iterator");
			if (initialCommentEnabled) controller.enqueue(encodeEventMessage({ comments: [initialComment] }));
		},
		async pull(controller) {
			try {
				if (keepAliveEnabled) timeout = setInterval(() => {
					controller.enqueue(encodeEventMessage({ comments: [keepAliveComment] }));
					span?.addEvent("keepalive");
				}, keepAliveInterval);
				const value = await runInSpanContext(span, () => iterator.next());
				clearInterval(timeout);
				if (cancelled) return;
				const meta = getEventMeta(value.value);
				if (!value.done || value.value !== void 0 || meta !== void 0) {
					const event = value.done ? "done" : "message";
					controller.enqueue(encodeEventMessage({
						...meta,
						event,
						data: stringifyJSON(value.value)
					}));
					span?.addEvent(event);
				}
				if (value.done) {
					controller.close();
					span?.end();
				}
			} catch (err) {
				clearInterval(timeout);
				if (cancelled) return;
				if (err instanceof ErrorEvent) {
					controller.enqueue(encodeEventMessage({
						...getEventMeta(err),
						event: "error",
						data: stringifyJSON(err.data)
					}));
					span?.addEvent("error");
					controller.close();
				} else {
					setSpanError(span, err);
					controller.error(err);
				}
				span?.end();
			}
		},
		async cancel() {
			try {
				cancelled = true;
				clearInterval(timeout);
				span?.addEvent("cancelled");
				await runInSpanContext(span, () => iterator.return?.());
			} catch (e) {
				setSpanError(span, e);
				throw e;
			} finally {
				span?.end();
			}
		}
	}).pipeThrough(new TextEncoderStream());
}
// ../../node_modules/.pnpm/@orpc+standard-server-node@1.16.1/node_modules/@orpc/standard-server-node/dist/index.mjs
function toEventIterator(stream, options = {}) {
	return toEventIterator$1(Readable.toWeb(stream), options);
}
function toEventStream(iterator, options = {}) {
	return Readable.fromWeb(toEventStream$1(iterator, options));
}
function toStandardBody(req, options = {}) {
	if (req.body !== void 0) return Promise.resolve(req.body);
	return runWithSpan({
		name: "parse_standard_body",
		signal: options.signal
	}, async () => {
		const contentDisposition = req.headers["content-disposition"];
		const contentType = req.headers["content-type"];
		if (typeof contentDisposition === "string") return _streamToFile(req, getFilenameFromContentDisposition(contentDisposition) ?? "blob", contentType ?? "");
		if (!contentType || contentType.startsWith("application/json")) return parseEmptyableJSON(await _streamToString(req));
		if (contentType.startsWith("multipart/form-data")) return _streamToFormData(req, contentType);
		if (contentType.startsWith("application/x-www-form-urlencoded")) {
			const text = await _streamToString(req);
			return new URLSearchParams(text);
		}
		if (contentType.startsWith("text/event-stream")) return toEventIterator(req, options);
		if (contentType.startsWith("text/plain")) return _streamToString(req);
		return _streamToFile(req, "blob", contentType);
	});
}
function toNodeHttpBody(body, headers, options = {}) {
	if (body instanceof ReadableStream) return Readable.fromWeb(body);
	const currentContentDisposition = flattenHeader(headers["content-disposition"]);
	delete headers["content-type"];
	delete headers["content-disposition"];
	if (body === void 0) return;
	if (body instanceof Blob) {
		headers["content-type"] = body.type;
		headers["content-length"] = body.size.toString();
		headers["content-disposition"] = currentContentDisposition ?? generateContentDisposition(body instanceof File ? body.name : "blob");
		return Readable.fromWeb(body.stream());
	}
	if (body instanceof FormData) {
		const response = new Response(body);
		headers["content-type"] = response.headers.get("content-type");
		return Readable.fromWeb(response.body);
	}
	if (body instanceof URLSearchParams) {
		headers["content-type"] = "application/x-www-form-urlencoded";
		return body.toString();
	}
	if (isAsyncIteratorObject(body)) {
		headers["content-type"] = "text/event-stream";
		return toEventStream(body, options);
	}
	headers["content-type"] = "application/json";
	return stringifyJSON(body);
}
function _streamToFormData(stream, contentType) {
	return new Response(stream, { headers: { "content-type": contentType } }).formData();
}
async function _streamToString(stream) {
	const decoder = new TextDecoder();
	let text = "";
	for await (const chunk of stream) text += decoder.decode(Buffer$1.isBuffer(chunk) ? chunk : Buffer$1.from(chunk), { stream: true });
	text += decoder.decode();
	return text;
}
async function _streamToFile(stream, fileName, contentType) {
	const chunks = [];
	for await (const chunk of stream) chunks.push(chunk);
	return new File(chunks, fileName, { type: contentType });
}
function toNodeHttpHeaders(headers) {
	const nodeHttpHeaders = {};
	for (const [key, value] of Object.entries(headers)) if (value !== void 0) nodeHttpHeaders[key] = value;
	return nodeHttpHeaders;
}
function toStandardMethod(method) {
	return method ?? "GET";
}
function isNodeResponseStreamEnded(res) {
	const stream = "stream" in res ? res.stream : res;
	return stream.closed || stream.destroyed || stream.writableFinished;
}
function toAbortSignal(stream) {
	const controller = new AbortController();
	if (stream.errored) controller.abort(stream.errored);
	else if (isNodeResponseStreamEnded(stream)) {
		if (!stream.writableFinished || !stream.writableEnded) controller.abort(new AbortError("Writable stream closed before it finished writing"));
	} else {
		stream.once("error", (error) => controller.abort(error));
		stream.once("close", () => {
			if (!stream.writableFinished || !stream.writableEnded) controller.abort(new AbortError("Writable stream closed before it finished writing"));
		});
	}
	return controller.signal;
}
function toStandardUrl(req) {
	const protocol = "encrypted" in req.socket && req.socket.encrypted ? "https:" : "http:";
	const origin = guard(() => new URL(`${protocol}//${req.headers.host ?? "localhost"}`).origin) ?? `${protocol}//localhost`;
	const path = req.originalUrl ?? req.url ?? "/";
	return new URL(`${origin}${path.startsWith("/") ? "" : "/"}${path}`);
}
function toStandardLazyRequest(req, res) {
	const signal = toAbortSignal(res);
	return {
		method: toStandardMethod(req.method),
		url: toStandardUrl(req),
		headers: req.headers,
		body: once(() => toStandardBody(req, { signal })),
		signal
	};
}
function sendStandardResponse(res, standardResponse, options = {}) {
	return new Promise((resolve, reject) => {
		const resHeaders = { ...standardResponse.headers };
		const resBody = toNodeHttpBody(standardResponse.body, resHeaders, options);
		if (isNodeResponseStreamEnded(res)) {
			if (typeof resBody === "object" && !resBody.closed) resBody.destroy();
			if (res.errored) reject(res.errored);
			else resolve();
			return;
		}
		res.once("error", reject);
		res.once("close", resolve);
		res.writeHead(standardResponse.status, toNodeHttpHeaders(resHeaders));
		if (resBody === void 0) res.end();
		else if (typeof resBody === "string") res.end(resBody);
		else {
			res.once("close", () => {
				if (!resBody.closed) resBody.destroy(res.errored ?? void 0);
			});
			resBody.once("error", (error) => res.destroy(error));
			resBody.pipe(res);
		}
	});
}
// ../../node_modules/.pnpm/@orpc+server@1.16.1_ws@8.22.0/node_modules/@orpc/server/dist/shared/server.DZ5BIITo.mjs
function resolveFriendlyStandardHandleOptions(options) {
	return {
		...options,
		context: options.context ?? {}
	};
}
// ../../node_modules/.pnpm/@orpc+client@1.16.1/node_modules/@orpc/client/dist/shared/client.BPI7fHX3.mjs
const STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES = {
	BIGINT: 0,
	DATE: 1,
	NAN: 2,
	UNDEFINED: 3,
	URL: 4,
	REGEXP: 5,
	SET: 6,
	MAP: 7
};
const BUILT_IN_TYPES = new Set(Object.values(STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES));
const SERIALIZED_REGEXP_FORMAT = /^\/(.*)\/([a-z]*)$/;
function invalidSerializedData(detail) {
	return /* @__PURE__ */ new TypeError(`Invalid RPC serialized data: ${detail}`);
}
function invalidSerializedType(type, name, expected) {
	return invalidSerializedData(`type ${type} (${name}) expects ${expected}.`);
}
var StandardRPCJsonSerializer = class {
	customSerializers;
	constructor(options = {}) {
		this.customSerializers = options.customJsonSerializers ?? [];
		if (this.customSerializers.length !== new Set(this.customSerializers.map((custom) => custom.type)).size) throw new Error("Custom serializer type must be unique.");
	}
	serialize(data, segments = [], meta = [], maps = [], blobs = []) {
		for (const custom of this.customSerializers) if (custom.condition(data)) {
			const result = this.serialize(custom.serialize(data), segments, meta, maps, blobs);
			meta.push([custom.type, ...segments]);
			return result;
		}
		if (data instanceof Blob) {
			maps.push(segments);
			blobs.push(data);
			return [
				data,
				meta,
				maps,
				blobs
			];
		}
		if (typeof data === "bigint") {
			meta.push([STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.BIGINT, ...segments]);
			return [
				data.toString(),
				meta,
				maps,
				blobs
			];
		}
		if (data instanceof Date) {
			meta.push([STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.DATE, ...segments]);
			if (Number.isNaN(data.getTime())) return [
				null,
				meta,
				maps,
				blobs
			];
			return [
				data.toISOString(),
				meta,
				maps,
				blobs
			];
		}
		if (Number.isNaN(data)) {
			meta.push([STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.NAN, ...segments]);
			return [
				null,
				meta,
				maps,
				blobs
			];
		}
		if (data instanceof URL) {
			meta.push([STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.URL, ...segments]);
			return [
				data.toString(),
				meta,
				maps,
				blobs
			];
		}
		if (data instanceof RegExp) {
			meta.push([STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.REGEXP, ...segments]);
			return [
				data.toString(),
				meta,
				maps,
				blobs
			];
		}
		if (data instanceof Set) {
			const result = this.serialize(Array.from(data), segments, meta, maps, blobs);
			meta.push([STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.SET, ...segments]);
			return result;
		}
		if (data instanceof Map) {
			const result = this.serialize(Array.from(data.entries()), segments, meta, maps, blobs);
			meta.push([STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.MAP, ...segments]);
			return result;
		}
		if (Array.isArray(data)) return [
			data.map((v, i) => {
				if (v === void 0) {
					meta.push([
						STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.UNDEFINED,
						...segments,
						i
					]);
					return null;
				}
				return this.serialize(v, [...segments, i], meta, maps, blobs)[0];
			}),
			meta,
			maps,
			blobs
		];
		if (isObject(data)) {
			const json = {};
			for (const k in data) {
				if (k === "toJSON" && typeof data[k] === "function") continue;
				json[k] = this.serialize(data[k], [...segments, k], meta, maps, blobs)[0];
			}
			return [
				json,
				meta,
				maps,
				blobs
			];
		}
		return [
			data,
			meta,
			maps,
			blobs
		];
	}
	deserialize(json, meta, maps, getBlob) {
		const ref = { data: json };
		const input = { data: json };
		if (maps && getBlob) maps.forEach((segments, i) => {
			const blob = getBlob(i);
			if (!(blob instanceof Blob)) throw invalidSerializedData(`blob ${i} is not a Blob.`);
			let original = input;
			let currentRef = ref;
			let preSegment = "data";
			segments.forEach((segment) => {
				original = original[preSegment];
				currentRef = copyOnWrite(currentRef, preSegment, original);
				preSegment = segment;
				if (!Object.hasOwn(currentRef, preSegment)) throw invalidSerializedData(`segment "${preSegment}" does not exist.`);
			});
			currentRef[preSegment] = blob;
		});
		for (const item of meta) {
			const type = item[0];
			const custom = this.customSerializers.find((custom2) => custom2.type === type);
			if (custom === void 0 && !BUILT_IN_TYPES.has(type)) continue;
			let original = input;
			let currentRef = ref;
			let preSegment = "data";
			for (let i = 1; i < item.length; i++) {
				original = original[preSegment];
				currentRef = copyOnWrite(currentRef, preSegment, original);
				preSegment = item[i];
				if (!Object.hasOwn(currentRef, preSegment)) throw invalidSerializedData(`segment "${preSegment}" does not exist.`);
			}
			if (custom !== void 0) {
				currentRef[preSegment] = custom.deserialize(currentRef[preSegment]);
				continue;
			}
			const serialized = currentRef[preSegment];
			switch (type) {
				case STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.BIGINT: {
					if (typeof serialized !== "string") throw invalidSerializedType(type, "bigint", "a string");
					const value = parseBigIntString(serialized, DEFAULT_MAX_BIGINT_DIGITS);
					if (value === void 0) throw invalidSerializedType(type, "bigint", `a decimal integer string of at most ${DEFAULT_MAX_BIGINT_DIGITS} digits`);
					currentRef[preSegment] = value;
					break;
				}
				case STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.DATE:
					if (typeof serialized !== "string" && serialized !== null) throw invalidSerializedType(type, "date", "a string or null");
					currentRef[preSegment] = new Date(serialized ?? NaN);
					break;
				case STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.NAN:
					if (serialized !== null) throw invalidSerializedType(type, "nan", "null");
					currentRef[preSegment] = NaN;
					break;
				case STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.UNDEFINED:
					if (serialized !== null) throw invalidSerializedType(type, "undefined", "null");
					currentRef[preSegment] = void 0;
					break;
				case STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.URL:
					if (typeof serialized !== "string") throw invalidSerializedType(type, "url", "a string");
					currentRef[preSegment] = new URL(serialized);
					break;
				case STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.REGEXP: {
					if (typeof serialized !== "string") throw invalidSerializedType(type, "regexp", "a string");
					const match = serialized.match(SERIALIZED_REGEXP_FORMAT);
					if (match === null || !isValidRegExpFlags(match[2])) throw invalidSerializedData(`type ${type} (regexp) expects a "/pattern/flags" string.`);
					currentRef[preSegment] = createLazyRegExp(match[1], match[2]);
					break;
				}
				case STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.SET:
					if (!Array.isArray(serialized)) throw invalidSerializedType(type, "set", "an array");
					currentRef[preSegment] = new Set(serialized);
					break;
				case STANDARD_RPC_JSON_SERIALIZER_BUILT_IN_TYPES.MAP:
					if (!Array.isArray(serialized)) throw invalidSerializedType(type, "map", "an array");
					currentRef[preSegment] = new Map(serialized);
			}
		}
		return ref.data;
	}
};
function toHttpPath(path) {
	return `/${path.map(encodeURIComponent).join("/")}`;
}
var StandardRPCSerializer = class {
	constructor(jsonSerializer) {
		this.jsonSerializer = jsonSerializer;
	}
	serialize(data) {
		if (isAsyncIteratorObject(data)) return mapEventIterator(data, {
			value: async (value) => this.#serialize(value, false),
			error: async (e) => {
				return new ErrorEvent({
					data: this.#serialize(toORPCError(e).toJSON(), false),
					cause: e
				});
			}
		});
		return this.#serialize(data, true);
	}
	#serialize(data, enableFormData) {
		const [json, meta_, maps, blobs] = this.jsonSerializer.serialize(data);
		const meta = meta_.length === 0 ? void 0 : meta_;
		if (!enableFormData || blobs.length === 0) return {
			json,
			meta
		};
		const form = new FormData();
		form.set("data", stringifyJSON({
			json,
			meta,
			maps
		}));
		blobs.forEach((blob, i) => {
			form.set(i.toString(), blob);
		});
		return form;
	}
	deserialize(data) {
		if (isAsyncIteratorObject(data)) return mapEventIterator(data, {
			value: async (value) => this.#deserialize(value),
			error: async (e) => {
				if (!(e instanceof ErrorEvent)) return e;
				const deserialized = this.#deserialize(e.data);
				if (isORPCErrorJson(deserialized)) return createORPCErrorFromJson(deserialized, { cause: e });
				return new ErrorEvent({
					data: deserialized,
					cause: e
				});
			}
		});
		return this.#deserialize(data);
	}
	#deserialize(data) {
		if (data === void 0) return;
		if (!(data instanceof FormData)) return this.jsonSerializer.deserialize(data.json, data.meta ?? []);
		const serialized = JSON.parse(data.get("data"));
		return this.jsonSerializer.deserialize(serialized.json, serialized.meta ?? [], serialized.maps, (i) => data.get(i.toString()));
	}
};
// ../../node_modules/.pnpm/@orpc+contract@1.16.1/node_modules/@orpc/contract/dist/shared/contract.D_dZrO__.mjs
var ValidationError = class extends Error {
	issues;
	data;
	constructor(options) {
		super(options.message, options);
		this.issues = options.issues;
		this.data = options.data;
	}
};
function mergeErrorMap(errorMap1, errorMap2) {
	return {
		...errorMap1,
		...errorMap2
	};
}
async function validateORPCError(map, error) {
	const { code, status, message, data, cause, defined } = error;
	const config = map?.[error.code];
	if (!config || fallbackORPCErrorStatus(error.code, config.status) !== error.status) return defined ? new ORPCError(code, {
		defined: false,
		status,
		message,
		data,
		cause
	}) : error;
	if (!config.data) return defined ? error : new ORPCError(code, {
		defined: true,
		status,
		message,
		data,
		cause
	});
	const validated = await config.data["~standard"].validate(error.data);
	if (validated.issues) return defined ? new ORPCError(code, {
		defined: false,
		status,
		message,
		data,
		cause
	}) : error;
	return new ORPCError(code, {
		defined: true,
		status,
		message,
		data: validated.value,
		cause
	});
}
var ContractProcedure = class {
	/**
	* This property holds the defined options for the contract procedure.
	*/
	"~orpc";
	constructor(def) {
		if (def.route?.successStatus && isORPCErrorStatus(def.route.successStatus)) throw new Error("[ContractProcedure] Invalid successStatus.");
		if (Object.values(def.errorMap).some((val) => val && val.status && !isORPCErrorStatus(val.status))) throw new Error("[ContractProcedure] Invalid error status code.");
		this["~orpc"] = def;
	}
};
function isContractProcedure(item) {
	if (item instanceof ContractProcedure) return true;
	return (typeof item === "object" || typeof item === "function") && item !== null && "~orpc" in item && typeof item["~orpc"] === "object" && item["~orpc"] !== null && "errorMap" in item["~orpc"] && "route" in item["~orpc"] && "meta" in item["~orpc"];
}
// ../../node_modules/.pnpm/@orpc+contract@1.16.1/node_modules/@orpc/contract/dist/index.mjs
function mergeMeta(meta1, meta2) {
	return {
		...meta1,
		...meta2
	};
}
function mergeRoute(a, b) {
	return {
		...a,
		...b
	};
}
function prefixRoute(route, prefix) {
	if (!route.path) return route;
	return {
		...route,
		path: `${prefix}${route.path}`
	};
}
function unshiftTagRoute(route, tags) {
	return {
		...route,
		tags: [...tags, ...route.tags ?? []]
	};
}
function mergePrefix(a, b) {
	return a ? `${a}${b}` : b;
}
function mergeTags(a, b) {
	return a ? [...a, ...b] : b;
}
function enhanceRoute(route, options) {
	let router = route;
	if (options.prefix) router = prefixRoute(router, options.prefix);
	if (options.tags?.length) router = unshiftTagRoute(router, options.tags);
	return router;
}
function enhanceContractRouter(router, options) {
	if (isContractProcedure(router)) return new ContractProcedure({
		...router["~orpc"],
		errorMap: mergeErrorMap(options.errorMap, router["~orpc"].errorMap),
		route: enhanceRoute(router["~orpc"].route, options)
	});
	if (typeof router !== "object" || router === null) return router;
	const enhanced = {};
	for (const key in router) enhanced[key] = enhanceContractRouter(router[key], options);
	return enhanced;
}
new class ContractBuilder extends ContractProcedure {
	constructor(def) {
		super(def);
		this["~orpc"].prefix = def.prefix;
		this["~orpc"].tags = def.tags;
	}
	/**
	* Sets or overrides the initial meta.
	*
	* @see {@link https://orpc.dev/docs/metadata Metadata Docs}
	*/
	$meta(initialMeta) {
		return new ContractBuilder({
			...this["~orpc"],
			meta: initialMeta
		});
	}
	/**
	* Sets or overrides the initial route.
	* This option is typically relevant when integrating with OpenAPI.
	*
	* @see {@link https://orpc.dev/docs/openapi/routing OpenAPI Routing Docs}
	* @see {@link https://orpc.dev/docs/openapi/input-output-structure OpenAPI Input/Output Structure Docs}
	*/
	$route(initialRoute) {
		return new ContractBuilder({
			...this["~orpc"],
			route: initialRoute
		});
	}
	/**
	* Sets or overrides the initial input schema.
	*
	* @see {@link https://orpc.dev/docs/procedure#initial-configuration Initial Procedure Configuration Docs}
	*/
	$input(initialInputSchema) {
		return new ContractBuilder({
			...this["~orpc"],
			inputSchema: initialInputSchema
		});
	}
	/**
	* Adds type-safe custom errors to the contract.
	* The provided errors are spared-merged with any existing errors in the contract.
	*
	* @see {@link https://orpc.dev/docs/error-handling#type%E2%80%90safe-error-handling Type-Safe Error Handling Docs}
	*/
	errors(errors) {
		return new ContractBuilder({
			...this["~orpc"],
			errorMap: mergeErrorMap(this["~orpc"].errorMap, errors)
		});
	}
	/**
	* Sets or updates the metadata for the contract.
	* The provided metadata is spared-merged with any existing metadata in the contract.
	*
	* @see {@link https://orpc.dev/docs/metadata Metadata Docs}
	*/
	meta(meta) {
		return new ContractBuilder({
			...this["~orpc"],
			meta: mergeMeta(this["~orpc"].meta, meta)
		});
	}
	/**
	* Sets or updates the route definition for the contract.
	* The provided route is spared-merged with any existing route in the contract.
	* This option is typically relevant when integrating with OpenAPI.
	*
	* @see {@link https://orpc.dev/docs/openapi/routing OpenAPI Routing Docs}
	* @see {@link https://orpc.dev/docs/openapi/input-output-structure OpenAPI Input/Output Structure Docs}
	*/
	route(route) {
		return new ContractBuilder({
			...this["~orpc"],
			route: mergeRoute(this["~orpc"].route, route)
		});
	}
	/**
	* Defines the input validation schema for the contract.
	*
	* @see {@link https://orpc.dev/docs/procedure#input-output-validation Input Validation Docs}
	*/
	input(schema) {
		return new ContractBuilder({
			...this["~orpc"],
			inputSchema: schema
		});
	}
	/**
	* Defines the output validation schema for the contract.
	*
	* @see {@link https://orpc.dev/docs/procedure#input-output-validation Output Validation Docs}
	*/
	output(schema) {
		return new ContractBuilder({
			...this["~orpc"],
			outputSchema: schema
		});
	}
	/**
	* Prefixes all procedures in the contract router.
	* The provided prefix is post-appended to any existing router prefix.
	*
	* @note This option does not affect procedures that do not define a path in their route definition.
	*
	* @see {@link https://orpc.dev/docs/openapi/routing#route-prefixes OpenAPI Route Prefixes Docs}
	*/
	prefix(prefix) {
		return new ContractBuilder({
			...this["~orpc"],
			prefix: mergePrefix(this["~orpc"].prefix, prefix)
		});
	}
	/**
	* Adds tags to all procedures in the contract router.
	* This helpful when you want to group procedures together in the OpenAPI specification.
	*
	* @see {@link https://orpc.dev/docs/openapi/openapi-specification#operation-metadata OpenAPI Operation Metadata Docs}
	*/
	tag(...tags) {
		return new ContractBuilder({
			...this["~orpc"],
			tags: mergeTags(this["~orpc"].tags, tags)
		});
	}
	/**
	* Applies all of the previously defined options to the specified contract router.
	*
	* @see {@link https://orpc.dev/docs/router#extending-router Extending Router Docs}
	*/
	router(router) {
		return enhanceContractRouter(router, this["~orpc"]);
	}
}({
	errorMap: {},
	route: {},
	meta: {}
});
const DEFAULT_CONFIG$1 = {
	defaultMethod: "POST",
	defaultSuccessStatus: 200,
	defaultSuccessDescription: "OK",
	defaultInputStructure: "compact",
	defaultOutputStructure: "compact"
};
function fallbackContractConfig(key, value) {
	if (value === void 0) return DEFAULT_CONFIG$1[key];
	return value;
}
// ../../node_modules/.pnpm/@orpc+server@1.16.1_ws@8.22.0/node_modules/@orpc/server/dist/shared/server.DEBcqOjg.mjs
const LAZY_SYMBOL = Symbol("ORPC_LAZY_SYMBOL");
function lazy(loader, meta = {}) {
	return { [LAZY_SYMBOL]: {
		loader,
		meta
	} };
}
function isLazy(item) {
	return (typeof item === "object" || typeof item === "function") && item !== null && LAZY_SYMBOL in item;
}
function getLazyMeta(lazied) {
	return lazied[LAZY_SYMBOL].meta;
}
function unlazy(lazied) {
	return isLazy(lazied) ? lazied[LAZY_SYMBOL].loader() : Promise.resolve({ default: lazied });
}
function isStartWithMiddlewares(middlewares, compare) {
	if (compare.length > middlewares.length) return false;
	for (let i = 0; i < middlewares.length; i++) {
		if (compare[i] === void 0) return true;
		if (middlewares[i] !== compare[i]) return false;
	}
	return true;
}
function mergeMiddlewares(first, second, options) {
	if (options.dedupeLeading && isStartWithMiddlewares(second, first)) return second;
	return [...first, ...second];
}
function addMiddleware(middlewares, addition) {
	return [...middlewares, addition];
}
var Procedure = class {
	/**
	* This property holds the defined options.
	*/
	"~orpc";
	constructor(def) {
		this["~orpc"] = def;
	}
};
function isProcedure(item) {
	if (item instanceof Procedure) return true;
	return isContractProcedure(item) && "middlewares" in item["~orpc"] && "inputValidationIndex" in item["~orpc"] && "outputValidationIndex" in item["~orpc"] && "handler" in item["~orpc"];
}
function mergeCurrentContext(context, other) {
	return {
		...context,
		...other
	};
}
function createORPCErrorConstructorMap(errors) {
	return new Proxy(errors, { get(target, code) {
		if (typeof code !== "string") return Reflect.get(target, code);
		const item = (...rest) => {
			const options = resolveMaybeOptionalOptions(rest);
			const config = errors[code];
			return new ORPCError(code, {
				defined: Boolean(config),
				status: config?.status,
				message: options.message ?? config?.message,
				data: options.data,
				cause: options.cause
			});
		};
		return item;
	} });
}
function middlewareOutputFn(output) {
	return {
		output,
		context: {}
	};
}
function createProcedureClient(lazyableProcedure, ...rest) {
	const options = resolveMaybeOptionalOptions(rest);
	return async (...[input, callerOptions]) => {
		const path = toArray(options.path);
		const { default: procedure } = await unlazy(lazyableProcedure);
		const clientContext = callerOptions?.context ?? {};
		const context = await value(options.context ?? {}, clientContext);
		const errors = createORPCErrorConstructorMap(procedure["~orpc"].errorMap);
		const validateError = async (e) => {
			if (e instanceof ORPCError) return await validateORPCError(procedure["~orpc"].errorMap, e);
			return e;
		};
		try {
			const output = await runWithSpan({
				name: "call_procedure",
				signal: callerOptions?.signal
			}, (span) => {
				span?.setAttribute("procedure.path", [...path]);
				return intercept(toArray(options.interceptors), {
					context,
					input,
					errors,
					path,
					procedure,
					signal: callerOptions?.signal,
					lastEventId: callerOptions?.lastEventId
				}, (interceptorOptions) => executeProcedureInternal(interceptorOptions.procedure, interceptorOptions));
			});
			if (isAsyncIteratorObject(output)) {
				if (output instanceof HibernationEventIterator) return output;
				return overlayProxy(output, mapEventIterator(asyncIteratorWithSpan({
					name: "consume_event_iterator_output",
					signal: callerOptions?.signal
				}, output), {
					value: (v) => v,
					error: (e) => validateError(e)
				}));
			}
			return output;
		} catch (e) {
			throw await validateError(e);
		}
	};
}
async function validateInput(procedure, input) {
	const schema = procedure["~orpc"].inputSchema;
	if (!schema) return input;
	return runWithSpan({ name: "validate_input" }, async () => {
		const result = await schema["~standard"].validate(input);
		if (result.issues) throw new ORPCError("BAD_REQUEST", {
			message: "Input validation failed",
			data: { issues: result.issues },
			cause: new ValidationError({
				message: "Input validation failed",
				issues: result.issues,
				data: input
			})
		});
		return result.value;
	});
}
async function validateOutput(procedure, output) {
	const schema = procedure["~orpc"].outputSchema;
	if (!schema) return output;
	return runWithSpan({ name: "validate_output" }, async () => {
		const result = await schema["~standard"].validate(output);
		if (result.issues) throw new ORPCError("INTERNAL_SERVER_ERROR", {
			message: "Output validation failed",
			cause: new ValidationError({
				message: "Output validation failed",
				issues: result.issues,
				data: output
			})
		});
		return result.value;
	});
}
async function executeProcedureInternal(procedure, options) {
	const middlewares = procedure["~orpc"].middlewares;
	const inputValidationIndex = Math.min(Math.max(0, procedure["~orpc"].inputValidationIndex), middlewares.length);
	const outputValidationIndex = Math.min(Math.max(0, procedure["~orpc"].outputValidationIndex), middlewares.length);
	const next = async (index, context, input) => {
		let currentInput = input;
		if (index === inputValidationIndex) currentInput = await validateInput(procedure, currentInput);
		const mid = middlewares[index];
		const output = mid ? await runWithSpan({
			name: `middleware.${mid.name}`,
			signal: options.signal
		}, async (span) => {
			span?.setAttribute("middleware.index", index);
			span?.setAttribute("middleware.name", mid.name);
			return (await mid({
				...options,
				context,
				next: async (...[nextOptions]) => {
					const nextContext = nextOptions?.context ?? {};
					return {
						output: await next(index + 1, mergeCurrentContext(context, nextContext), currentInput),
						context: nextContext
					};
				}
			}, currentInput, middlewareOutputFn)).output;
		}) : await runWithSpan({
			name: "handler",
			signal: options.signal
		}, () => procedure["~orpc"].handler({
			...options,
			context,
			input: currentInput
		}));
		if (index === outputValidationIndex) return await validateOutput(procedure, output);
		return output;
	};
	return next(0, options.context, options.input);
}
const HIDDEN_ROUTER_CONTRACT_SYMBOL = Symbol("ORPC_HIDDEN_ROUTER_CONTRACT");
function getHiddenRouterContract(router) {
	return router[HIDDEN_ROUTER_CONTRACT_SYMBOL];
}
function getRouter(router, path) {
	let current = router;
	for (let i = 0; i < path.length; i++) {
		const segment = path[i];
		if (!current) return;
		if (isProcedure(current)) return;
		if (!isTypescriptObject(current)) return;
		if (!isLazy(current)) {
			current = current[segment];
			continue;
		}
		const lazied = current;
		const rest = path.slice(i);
		return lazy(async () => {
			return unlazy(getRouter((await unlazy(lazied)).default, rest));
		}, getLazyMeta(lazied));
	}
	return current;
}
function createAccessibleLazyRouter(lazied) {
	return new Proxy(lazied, { get(target, key) {
		if (typeof key !== "string") return Reflect.get(target, key);
		return createAccessibleLazyRouter(getRouter(lazied, [key]));
	} });
}
function enhanceRouter(router, options) {
	if (isLazy(router)) {
		const laziedMeta = getLazyMeta(router);
		const enhancedPrefix = laziedMeta?.prefix ? mergePrefix(options.prefix, laziedMeta?.prefix) : options.prefix;
		return createAccessibleLazyRouter(lazy(async () => {
			const { default: unlaziedRouter } = await unlazy(router);
			return unlazy(enhanceRouter(unlaziedRouter, options));
		}, {
			...laziedMeta,
			prefix: enhancedPrefix
		}));
	}
	if (isProcedure(router)) {
		const newMiddlewares = mergeMiddlewares(options.middlewares, router["~orpc"].middlewares, { dedupeLeading: options.dedupeLeadingMiddlewares });
		const newMiddlewareAdded = newMiddlewares.length - router["~orpc"].middlewares.length;
		return new Procedure({
			...router["~orpc"],
			route: enhanceRoute(router["~orpc"].route, options),
			errorMap: mergeErrorMap(options.errorMap, router["~orpc"].errorMap),
			middlewares: newMiddlewares,
			inputValidationIndex: router["~orpc"].inputValidationIndex + newMiddlewareAdded,
			outputValidationIndex: router["~orpc"].outputValidationIndex + newMiddlewareAdded
		});
	}
	if (typeof router !== "object" || router === null) return router;
	const enhanced = {};
	for (const key in router) enhanced[key] = enhanceRouter(router[key], options);
	return enhanced;
}
function traverseContractProcedures(options, callback, lazyOptions = []) {
	let currentRouter = options.router;
	const hiddenContract = isTypescriptObject(options.router) ? getHiddenRouterContract(options.router) : void 0;
	if (hiddenContract !== void 0) currentRouter = hiddenContract;
	if (isLazy(currentRouter)) lazyOptions.push({
		router: currentRouter,
		path: options.path
	});
	else if (isContractProcedure(currentRouter)) callback({
		contract: currentRouter,
		path: options.path
	});
	else if (typeof currentRouter === "object" && currentRouter !== null) for (const key in currentRouter) traverseContractProcedures({
		router: currentRouter[key],
		path: [...options.path, key]
	}, callback, lazyOptions);
	return lazyOptions;
}
function createContractedProcedure(procedure, contract) {
	return new Procedure({
		...procedure["~orpc"],
		errorMap: contract["~orpc"].errorMap,
		route: contract["~orpc"].route,
		meta: contract["~orpc"].meta
	});
}
// ../../node_modules/.pnpm/@orpc+server@1.16.1_ws@8.22.0/node_modules/@orpc/server/dist/shared/server.CMf4nKky.mjs
var CompositeStandardHandlerPlugin = class {
	plugins;
	constructor(plugins = []) {
		this.plugins = [...plugins].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	}
	init(options, router) {
		for (const plugin of this.plugins) plugin.init?.(options, router);
	}
};
var StandardHandler = class {
	constructor(router, matcher, codec, options) {
		this.matcher = matcher;
		this.codec = codec;
		new CompositeStandardHandlerPlugin(options.plugins).init(options, router);
		this.interceptors = toArray(options.interceptors);
		this.clientInterceptors = toArray(options.clientInterceptors);
		this.rootInterceptors = toArray(options.rootInterceptors);
		this.matcher.init(router);
	}
	interceptors;
	clientInterceptors;
	rootInterceptors;
	async handle(request, options) {
		const prefix = options.prefix?.replace(/\/$/, "") || void 0;
		if (prefix && !request.url.pathname.startsWith(`${prefix}/`) && request.url.pathname !== prefix) return {
			matched: false,
			response: void 0
		};
		return intercept(this.rootInterceptors, {
			...options,
			request,
			prefix
		}, async (interceptorOptions) => {
			return runWithSpan({ name: `${request.method} ${request.url.pathname}` }, async (span) => {
				let step;
				try {
					return await intercept(this.interceptors, interceptorOptions, async ({ request: request2, context, prefix: prefix2 }) => {
						const method = request2.method;
						const url = request2.url;
						const pathname = prefix2 ? url.pathname.replace(prefix2, "") : url.pathname;
						const match = await runWithSpan({ name: "find_procedure" }, () => this.matcher.match(method, `/${pathname.replace(/^\/|\/$/g, "")}`));
						if (!match) return {
							matched: false,
							response: void 0
						};
						span?.updateName(`${ORPC_NAME}.${match.path.join("/")}`);
						span?.setAttribute("rpc.system", ORPC_NAME);
						span?.setAttribute("rpc.method", match.path.join("."));
						step = "decode_input";
						let input = await runWithSpan({ name: "decode_input" }, () => this.codec.decode(request2, match.params, match.procedure));
						step = void 0;
						if (isAsyncIteratorObject(input)) input = asyncIteratorWithSpan({
							name: "consume_event_iterator_input",
							signal: request2.signal
						}, input);
						const client = createProcedureClient(match.procedure, {
							context,
							path: match.path,
							interceptors: this.clientInterceptors
						});
						step = "call_procedure";
						const output = await client(input, {
							signal: request2.signal,
							lastEventId: flattenHeader(request2.headers["last-event-id"])
						});
						step = void 0;
						return {
							matched: true,
							response: this.codec.encode(output, match.procedure)
						};
					});
				} catch (e) {
					if (step !== "call_procedure") setSpanError(span, e);
					const error = step === "decode_input" && !(e instanceof ORPCError) ? new ORPCError("BAD_REQUEST", {
						message: `Malformed request. Ensure the request body is properly formatted and the 'Content-Type' header is set correctly.`,
						cause: e
					}) : toORPCError(e);
					return {
						matched: true,
						response: this.codec.encodeError(error)
					};
				}
			});
		});
	}
};
var StandardRPCCodec = class {
	constructor(serializer) {
		this.serializer = serializer;
	}
	async decode(request, _params, _procedure) {
		const serialized = request.method === "GET" ? parseEmptyableJSON(request.url.searchParams.getAll("data").at(-1)) : await request.body();
		return this.serializer.deserialize(serialized);
	}
	encode(output, _procedure) {
		if (output instanceof ReadableStream) return {
			status: 200,
			headers: {},
			body: output
		};
		return {
			status: 200,
			headers: {},
			body: this.serializer.serialize(output)
		};
	}
	encodeError(error) {
		return {
			status: error.status,
			headers: {},
			body: this.serializer.serialize(error.toJSON())
		};
	}
};
var StandardRPCMatcher = class {
	filter;
	tree = new NullProtoObj();
	pendingRouters = [];
	constructor(options = {}) {
		this.filter = options.filter ?? true;
	}
	init(router, path = []) {
		const laziedOptions = traverseContractProcedures({
			router,
			path
		}, (traverseOptions) => {
			if (!value(this.filter, traverseOptions)) return;
			const { path: path2, contract } = traverseOptions;
			const httpPath = toHttpPath(path2);
			if (isProcedure(contract)) this.tree[httpPath] = {
				path: path2,
				contract,
				procedure: contract,
				router
			};
			else this.tree[httpPath] = {
				path: path2,
				contract,
				procedure: void 0,
				router
			};
		});
		this.pendingRouters.push(...laziedOptions.map((option) => ({
			...option,
			httpPathPrefix: toHttpPath(option.path)
		})));
	}
	async match(_method, pathname) {
		while (true) {
			const pendingRouter = this.pendingRouters.find((pendingRouter2) => pathname.startsWith(pendingRouter2.httpPathPrefix));
			if (!pendingRouter) break;
			pendingRouter.initPromise ??= unlazy(pendingRouter.router).then(({ default: router }) => {
				this.init(router, pendingRouter.path);
				this.pendingRouters.splice(this.pendingRouters.indexOf(pendingRouter), 1);
			}).catch((error) => {
				pendingRouter.initPromise = void 0;
				throw error;
			});
			await pendingRouter.initPromise;
		}
		const match = this.tree[pathname];
		if (!match) return;
		if (!match.procedure) {
			const { default: maybeProcedure } = await unlazy(getRouter(match.router, match.path));
			if (!isProcedure(maybeProcedure)) throw new Error(`
          [Contract-First] Missing or invalid implementation for procedure at path: ${toHttpPath(match.path)}.
          Ensure that the procedure is correctly defined and matches the expected contract.
        `);
			match.procedure = createContractedProcedure(maybeProcedure, match.contract);
		}
		return {
			path: match.path,
			procedure: match.procedure
		};
	}
};
var StandardRPCHandler = class extends StandardHandler {
	constructor(router, options = {}) {
		const serializer = new StandardRPCSerializer(new StandardRPCJsonSerializer(options));
		const matcher = new StandardRPCMatcher(options);
		const codec = new StandardRPCCodec(serializer);
		super(router, matcher, codec, options);
	}
};
// ../../node_modules/.pnpm/@orpc+server@1.16.1_ws@8.22.0/node_modules/@orpc/server/dist/shared/server.TEVCLCFC.mjs
const STRICT_GET_METHOD_PLUGIN_IS_GET_METHOD_CONTEXT_SYMBOL = Symbol("STRICT_GET_METHOD_PLUGIN_IS_GET_METHOD_CONTEXT");
var StrictGetMethodPlugin = class {
	error;
	/**
	* make sure execute before batch plugin to get real method
	*/
	order = 7e6;
	constructor(options = {}) {
		this.error = options.error ?? new ORPCError("METHOD_NOT_SUPPORTED");
	}
	init(options) {
		options.rootInterceptors ??= [];
		options.clientInterceptors ??= [];
		options.rootInterceptors.unshift((options2) => {
			const isGetMethod = options2.request.method === "GET";
			return options2.next({
				...options2,
				context: {
					...options2.context,
					[STRICT_GET_METHOD_PLUGIN_IS_GET_METHOD_CONTEXT_SYMBOL]: isGetMethod
				}
			});
		});
		options.clientInterceptors.unshift((options2) => {
			if (typeof options2.context[STRICT_GET_METHOD_PLUGIN_IS_GET_METHOD_CONTEXT_SYMBOL] !== "boolean") throw new TypeError("[StrictGetMethodPlugin] strict GET method context has been corrupted or modified by another plugin or interceptor");
			const procedureMethod = fallbackContractConfig("defaultMethod", options2.procedure["~orpc"].route.method);
			if (options2.context[STRICT_GET_METHOD_PLUGIN_IS_GET_METHOD_CONTEXT_SYMBOL] && procedureMethod !== "GET") throw this.error;
			return options2.next();
		});
	}
};
// ../../node_modules/.pnpm/@orpc+server@1.16.1_ws@8.22.0/node_modules/@orpc/server/dist/adapters/node/index.mjs
var BodyLimitPlugin = class {
	maxBodySize;
	constructor(options) {
		this.maxBodySize = options.maxBodySize;
	}
	initRuntimeAdapter(options) {
		options.adapterInterceptors ??= [];
		options.adapterInterceptors.push(async (options2) => {
			const throwPayloadTooLarge = () => {
				if (!("stream" in options2.response) && !options2.response.headersSent) options2.response.setHeader("connection", "close");
				throw new ORPCError("PAYLOAD_TOO_LARGE");
			};
			const checkHeader = once(() => {
				if (Number(options2.request.headers["content-length"]) > this.maxBodySize) throwPayloadTooLarge();
			});
			const originalEmit = options2.request.emit;
			let currentBodySize = 0;
			options2.request.emit = (event, ...args) => {
				if (event === "data") {
					checkHeader();
					currentBodySize += args[0].length;
					if (currentBodySize > this.maxBodySize) throwPayloadTooLarge();
				}
				return originalEmit.call(options2.request, event, ...args);
			};
			try {
				return await options2.next(options2);
			} finally {
				options2.request.emit = originalEmit;
			}
		});
	}
};
var CompositeNodeHttpHandlerPlugin = class extends CompositeStandardHandlerPlugin {
	initRuntimeAdapter(options) {
		for (const plugin of this.plugins) plugin.initRuntimeAdapter?.(options);
	}
};
var NodeHttpHandler = class {
	constructor(standardHandler, options = {}) {
		this.standardHandler = standardHandler;
		new CompositeNodeHttpHandlerPlugin(options.plugins).initRuntimeAdapter(options);
		this.adapterInterceptors = toArray(options.adapterInterceptors);
		this.sendStandardResponseOptions = options;
	}
	sendStandardResponseOptions;
	adapterInterceptors;
	async handle(request, response, ...rest) {
		return intercept(this.adapterInterceptors, {
			...resolveFriendlyStandardHandleOptions(resolveMaybeOptionalOptions(rest)),
			request,
			response,
			sendStandardResponseOptions: this.sendStandardResponseOptions
		}, async ({ request: request2, response: response2, sendStandardResponseOptions, ...options }) => {
			const standardRequest = toStandardLazyRequest(request2, response2);
			const result = await this.standardHandler.handle(standardRequest, options);
			if (!result.matched) return { matched: false };
			await sendStandardResponse(response2, result.response, sendStandardResponseOptions);
			return { matched: true };
		});
	}
};
var RPCHandler = class extends NodeHttpHandler {
	constructor(router, options = {}) {
		if (options.strictGetMethodPluginEnabled ?? true) {
			options.plugins ??= [];
			options.plugins.push(new StrictGetMethodPlugin());
		}
		super(new StandardRPCHandler(router, options), options);
	}
};
// ../../node_modules/.pnpm/@orpc+server@1.16.1_ws@8.22.0/node_modules/@orpc/server/dist/index.mjs
const DEFAULT_CONFIG = {
	initialInputValidationIndex: 0,
	initialOutputValidationIndex: 0,
	dedupeLeadingMiddlewares: true
};
function fallbackConfig(key, value) {
	if (value === void 0) return DEFAULT_CONFIG[key];
	return value;
}
function decorateMiddleware(middleware) {
	const decorated = ((...args) => middleware(...args));
	decorated.mapInput = (mapInput) => {
		return decorateMiddleware((options, input, ...rest) => middleware(options, mapInput(input), ...rest));
	};
	decorated.concat = (concatMiddleware, mapInput) => {
		const mapped = mapInput ? decorateMiddleware(concatMiddleware).mapInput(mapInput) : concatMiddleware;
		return decorateMiddleware((options, input, output, ...rest) => {
			return middleware({
				...options,
				next: (...[nextOptions1]) => mapped({
					...options,
					context: {
						...options.context,
						...nextOptions1?.context
					},
					next: (...[nextOptions2]) => options.next({ context: {
						...nextOptions1?.context,
						...nextOptions2?.context
					} })
				}, input, output, ...rest)
			}, input, output, ...rest);
		});
	};
	return decorated;
}
function createActionableClient(client) {
	const action = async (input) => {
		try {
			return [null, await client(input)];
		} catch (error) {
			if (error instanceof Error && "digest" in error && typeof error.digest === "string" && error.digest.startsWith("NEXT_")) throw error;
			if (error instanceof Response && "options" in error && isObject(error.options) || isObject(error) && error.isNotFound === true) throw error;
			return [toORPCError(error).toJSON(), void 0];
		}
	};
	return action;
}
var DecoratedProcedure = class DecoratedProcedure extends Procedure {
	/**
	* Adds type-safe custom errors.
	* The provided errors are spared-merged with any existing errors.
	*
	* @see {@link https://orpc.dev/docs/error-handling#type%E2%80%90safe-error-handling Type-Safe Error Handling Docs}
	*/
	errors(errors) {
		return new DecoratedProcedure({
			...this["~orpc"],
			errorMap: mergeErrorMap(this["~orpc"].errorMap, errors)
		});
	}
	/**
	* Sets or updates the metadata.
	* The provided metadata is spared-merged with any existing metadata.
	*
	* @see {@link https://orpc.dev/docs/metadata Metadata Docs}
	*/
	meta(meta) {
		return new DecoratedProcedure({
			...this["~orpc"],
			meta: mergeMeta(this["~orpc"].meta, meta)
		});
	}
	/**
	* Sets or updates the route definition.
	* The provided route is spared-merged with any existing route.
	* This option is typically relevant when integrating with OpenAPI.
	*
	* @see {@link https://orpc.dev/docs/openapi/routing OpenAPI Routing Docs}
	* @see {@link https://orpc.dev/docs/openapi/input-output-structure OpenAPI Input/Output Structure Docs}
	*/
	route(route) {
		return new DecoratedProcedure({
			...this["~orpc"],
			route: mergeRoute(this["~orpc"].route, route)
		});
	}
	use(middleware, mapInput) {
		const mapped = mapInput ? decorateMiddleware(middleware).mapInput(mapInput) : middleware;
		return new DecoratedProcedure({
			...this["~orpc"],
			middlewares: addMiddleware(this["~orpc"].middlewares, mapped)
		});
	}
	/**
	* Make this procedure callable (works like a function while still being a procedure).
	*
	* @see {@link https://orpc.dev/docs/client/server-side Server-side Client Docs}
	*/
	callable(...rest) {
		const client = createProcedureClient(this, ...rest);
		return new Proxy(client, {
			get: (target, key) => {
				return Reflect.has(this, key) ? Reflect.get(this, key) : Reflect.get(target, key);
			},
			has: (target, key) => {
				return Reflect.has(this, key) || Reflect.has(target, key);
			}
		});
	}
	/**
	* Make this procedure compatible with server action.
	*
	* @see {@link https://orpc.dev/docs/server-action Server Action Docs}
	*/
	actionable(...rest) {
		const action = createActionableClient(createProcedureClient(this, ...rest));
		return new Proxy(action, {
			get: (target, key) => {
				return Reflect.has(this, key) ? Reflect.get(this, key) : Reflect.get(target, key);
			},
			has: (target, key) => {
				return Reflect.has(this, key) || Reflect.has(target, key);
			}
		});
	}
};
const os = new class Builder {
	/**
	* This property holds the defined options.
	*/
	"~orpc";
	constructor(def) {
		this["~orpc"] = def;
	}
	/**
	* Sets or overrides the config.
	*
	* @see {@link https://orpc.dev/docs/client/server-side#middlewares-order Middlewares Order Docs}
	* @see {@link https://orpc.dev/docs/best-practices/dedupe-middleware#configuration Dedupe Middleware Docs}
	*/
	$config(config) {
		const inputValidationCount = this["~orpc"].inputValidationIndex - fallbackConfig("initialInputValidationIndex", this["~orpc"].config.initialInputValidationIndex);
		const outputValidationCount = this["~orpc"].outputValidationIndex - fallbackConfig("initialOutputValidationIndex", this["~orpc"].config.initialOutputValidationIndex);
		return new Builder({
			...this["~orpc"],
			config,
			dedupeLeadingMiddlewares: fallbackConfig("dedupeLeadingMiddlewares", config.dedupeLeadingMiddlewares),
			inputValidationIndex: fallbackConfig("initialInputValidationIndex", config.initialInputValidationIndex) + inputValidationCount,
			outputValidationIndex: fallbackConfig("initialOutputValidationIndex", config.initialOutputValidationIndex) + outputValidationCount
		});
	}
	/**
	* Set or override the initial context.
	*
	* @see {@link https://orpc.dev/docs/context Context Docs}
	*/
	$context() {
		return new Builder({
			...this["~orpc"],
			middlewares: [],
			inputValidationIndex: fallbackConfig("initialInputValidationIndex", this["~orpc"].config.initialInputValidationIndex),
			outputValidationIndex: fallbackConfig("initialOutputValidationIndex", this["~orpc"].config.initialOutputValidationIndex)
		});
	}
	/**
	* Sets or overrides the initial meta.
	*
	* @see {@link https://orpc.dev/docs/metadata Metadata Docs}
	*/
	$meta(initialMeta) {
		return new Builder({
			...this["~orpc"],
			meta: initialMeta
		});
	}
	/**
	* Sets or overrides the initial route.
	* This option is typically relevant when integrating with OpenAPI.
	*
	* @see {@link https://orpc.dev/docs/openapi/routing OpenAPI Routing Docs}
	* @see {@link https://orpc.dev/docs/openapi/input-output-structure OpenAPI Input/Output Structure Docs}
	*/
	$route(initialRoute) {
		return new Builder({
			...this["~orpc"],
			route: initialRoute
		});
	}
	/**
	* Sets or overrides the initial input schema.
	*
	* @see {@link https://orpc.dev/docs/procedure#initial-configuration Initial Procedure Configuration Docs}
	*/
	$input(initialInputSchema) {
		return new Builder({
			...this["~orpc"],
			inputSchema: initialInputSchema
		});
	}
	/**
	* Creates a middleware.
	*
	* @see {@link https://orpc.dev/docs/middleware Middleware Docs}
	*/
	middleware(middleware) {
		return decorateMiddleware(middleware);
	}
	/**
	* Adds type-safe custom errors.
	* The provided errors are spared-merged with any existing errors.
	*
	* @see {@link https://orpc.dev/docs/error-handling#type%E2%80%90safe-error-handling Type-Safe Error Handling Docs}
	*/
	errors(errors) {
		return new Builder({
			...this["~orpc"],
			errorMap: mergeErrorMap(this["~orpc"].errorMap, errors)
		});
	}
	use(middleware, mapInput) {
		const mapped = mapInput ? decorateMiddleware(middleware).mapInput(mapInput) : middleware;
		return new Builder({
			...this["~orpc"],
			middlewares: addMiddleware(this["~orpc"].middlewares, mapped)
		});
	}
	/**
	* Sets or updates the metadata.
	* The provided metadata is spared-merged with any existing metadata.
	*
	* @see {@link https://orpc.dev/docs/metadata Metadata Docs}
	*/
	meta(meta) {
		return new Builder({
			...this["~orpc"],
			meta: mergeMeta(this["~orpc"].meta, meta)
		});
	}
	/**
	* Sets or updates the route definition.
	* The provided route is spared-merged with any existing route.
	* This option is typically relevant when integrating with OpenAPI.
	*
	* @see {@link https://orpc.dev/docs/openapi/routing OpenAPI Routing Docs}
	* @see {@link https://orpc.dev/docs/openapi/input-output-structure OpenAPI Input/Output Structure Docs}
	*/
	route(route) {
		return new Builder({
			...this["~orpc"],
			route: mergeRoute(this["~orpc"].route, route)
		});
	}
	/**
	* Defines the input validation schema.
	*
	* @see {@link https://orpc.dev/docs/procedure#input-output-validation Input Validation Docs}
	*/
	input(schema) {
		return new Builder({
			...this["~orpc"],
			inputSchema: schema,
			inputValidationIndex: fallbackConfig("initialInputValidationIndex", this["~orpc"].config.initialInputValidationIndex) + this["~orpc"].middlewares.length
		});
	}
	/**
	* Defines the output validation schema.
	*
	* @see {@link https://orpc.dev/docs/procedure#input-output-validation Output Validation Docs}
	*/
	output(schema) {
		return new Builder({
			...this["~orpc"],
			outputSchema: schema,
			outputValidationIndex: fallbackConfig("initialOutputValidationIndex", this["~orpc"].config.initialOutputValidationIndex) + this["~orpc"].middlewares.length
		});
	}
	/**
	* Defines the handler of the procedure.
	*
	* @see {@link https://orpc.dev/docs/procedure Procedure Docs}
	*/
	handler(handler) {
		return new DecoratedProcedure({
			...this["~orpc"],
			handler
		});
	}
	/**
	* Prefixes all procedures in the router.
	* The provided prefix is post-appended to any existing router prefix.
	*
	* @note This option does not affect procedures that do not define a path in their route definition.
	*
	* @see {@link https://orpc.dev/docs/openapi/routing#route-prefixes OpenAPI Route Prefixes Docs}
	*/
	prefix(prefix) {
		return new Builder({
			...this["~orpc"],
			prefix: mergePrefix(this["~orpc"].prefix, prefix)
		});
	}
	/**
	* Adds tags to all procedures in the router.
	* This helpful when you want to group procedures together in the OpenAPI specification.
	*
	* @see {@link https://orpc.dev/docs/openapi/openapi-specification#operation-metadata OpenAPI Operation Metadata Docs}
	*/
	tag(...tags) {
		return new Builder({
			...this["~orpc"],
			tags: mergeTags(this["~orpc"].tags, tags)
		});
	}
	/**
	* Applies all of the previously defined options to the specified router.
	*
	* @see {@link https://orpc.dev/docs/router#extending-router Extending Router Docs}
	*/
	router(router) {
		return enhanceRouter(router, this["~orpc"]);
	}
	/**
	* Create a lazy router
	* And applies all of the previously defined options to the specified router.
	*
	* @see {@link https://orpc.dev/docs/router#extending-router Extending Router Docs}
	*/
	lazy(loader) {
		return enhanceRouter(lazy(loader), this["~orpc"]);
	}
}({
	config: {},
	route: {},
	meta: {},
	errorMap: {},
	inputValidationIndex: fallbackConfig("initialInputValidationIndex"),
	outputValidationIndex: fallbackConfig("initialOutputValidationIndex"),
	middlewares: [],
	dedupeLeadingMiddlewares: true
});
// src/api.ts
function createActions(service, daemon) {
	return {
		activity: (input) => service.activity.list(activityInput.parse(input)),
		material: (input) => {
			const value = materialInput.parse(input);
			return materialView(service.store, value.bvid, value.kind);
		},
		state: () => ({
			...service.status(),
			config: service.config(),
			updates: {
				...updateState(service.store.dir),
				runtimeVersion: version,
				supported: service.updatesSupported
			},
			evidence: service.store.read("evidence", {}),
			listeners: service.store.read("listener-status", {}),
			schedule: service.store.read("schedule", {})
		}),
		config: (input) => service.configure(input, () => daemon.pause()),
		credentials: (input) => service.login.manual(input, () => daemon.pause()),
		checkLogin: () => service.checkAccount(() => daemon.pause()),
		loginStart: () => service.login.start(),
		loginPoll: async (handle) => {
			const result = await service.login.poll(handle, () => daemon.pause());
			if (result.status === "success" && result.account) await service.recordAccount(result.account, () => daemon.pause());
			return result;
		},
		loginCancel: (handle) => service.login.cancel(handle),
		run: () => {
			if (service.queue.list().some((j) => ["pending", "running"].includes(j.state))) throw Error("已有待处理任务，请先完成或暂停后核查");
			const job = service.queue.add("manual:" + crypto.randomUUID(), "browse", { manual: true });
			daemon.tick().catch((error) => daemon.error(error));
			return job;
		},
		pause: async () => {
			await daemon.pause();
			return { paused: true };
		},
		approve: (id) => service.activity.run("approve", { id }, { source: "manual" }, () => service.approve(id)),
		reject: (id) => service.activity.run("reject", { id }, { source: "manual" }, () => service.reject(id)),
		dismiss: (id) => {
			const job = service.queue.list().find((j) => j.id === id);
			if (!job || !["needs-review", "pending"].includes(job.state)) throw Error("仅能关闭待核查或待处理任务");
			return service.queue.dismiss(id);
		}
	};
}
function createApi(service, daemon) {
	const actions = createActions(service, daemon);
	const base = os.use(async ({ next }) => {
		try {
			return await next();
		} catch (error) {
			throw new ORPCError("BAD_REQUEST", { message: redact(errorMessage(error), service.store.dir) });
		}
	});
	const id = object({ id: string().min(1) }).strict();
	const loginHandle = object({ handle: string().uuid() }).strict();
	return {
		activity: base.input(activityInput).handler(({ input }) => actions.activity(input)),
		material: base.input(materialInput).handler(({ input }) => actions.material(input)),
		state: base.handler(() => actions.state()),
		config: base.input(configSchema).handler(({ input }) => actions.config(input)),
		credentials: base.input(credentialsSchema).handler(({ input }) => actions.credentials(input)),
		checkLogin: base.handler(() => actions.checkLogin()),
		loginStart: base.handler(() => actions.loginStart()),
		loginPoll: base.input(loginHandle).handler(({ input }) => actions.loginPoll(input.handle)),
		loginCancel: base.input(loginHandle).handler(({ input }) => actions.loginCancel(input.handle)),
		run: base.handler(() => actions.run()),
		pause: base.handler(() => actions.pause()),
		approve: base.input(id).handler(({ input }) => actions.approve(input.id)),
		reject: base.input(id).handler(({ input }) => actions.reject(input.id)),
		dismiss: base.input(id).handler(({ input }) => actions.dismiss(input.id))
	};
}
// src/http.ts
async function createHttp(service, daemon, { port = 18841, render, stop, updateControl } = {}) {
	const token = crypto.randomBytes(32).toString("base64url");
	const actions = createActions(service, daemon);
	const handler = new RPCHandler(createApi(service, daemon), { plugins: [new BodyLimitPlugin({ maxBodySize: 131072 })] });
	let origin = "";
	let renderApp = render;
	let quiescing = !!updateControl;
	let requests = 0;
	const send = (res, status, value, type = "application/json; charset=utf-8") => {
		res.writeHead(status, {
			"content-type": type,
			"cache-control": "no-store",
			"x-content-type-options": "nosniff",
			"referrer-policy": "no-referrer"
		});
		res.end(type.startsWith("application/json") ? JSON.stringify(value) : value);
	};
	const server = http.createServer(async (req, res) => {
		try {
			if (req.headers.host !== new URL(origin).host) {
				send(res, 403, { error: "Host 不匹配" });
				return;
			}
			const url = new URL(req.url ?? "/", origin);
			if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/rpc/")) {
				const auth = Buffer.from(req.headers.authorization ?? ""), expected = Buffer.from("Bearer " + token);
				if (auth.length !== expected.length || !crypto.timingSafeEqual(auth, expected)) {
					send(res, 401, { error: "请通过启动时显示的链接打开管理页" });
					return;
				}
				if (req.method === "GET" && url.pathname === "/api/state") {
					send(res, 200, actions.state());
					return;
				}
				if (req.method === "GET" && url.pathname === "/api/runtime") {
					send(res, 200, {
						pid: process.pid,
						version,
						protocol: 1,
						held: updateControl?.held() ?? false
					});
					return;
				}
				if (req.method !== "POST") {
					send(res, 405, { error: "方法不支持" });
					return;
				}
				if (req.headers.origin !== origin || !String(req.headers["content-type"] ?? "").startsWith("application/json")) {
					send(res, 403, { error: "请求来源或格式不匹配" });
					return;
				}
				if (Number(req.headers["content-length"] ?? 0) > 131072) {
					send(res, 413, { error: "请求过大" });
					return;
				}
				if (url.pathname === "/api/update-activate" || url.pathname === "/api/update-shutdown") {
					if (!updateControl || req.headers["x-update-token"] !== updateControl.token || !updateControl.held()) {
						send(res, 403, { error: "无效更新会话" });
						return;
					}
					if (url.pathname === "/api/update-activate") updateControl.activate();
					else updateControl.shutdown();
					send(res, 200, { ok: true });
					return;
				}
				if (quiescing) {
					send(res, 503, { error: "后台正在切换，请稍后重新打开管理页；发送结果不明时请先核查记录。" });
					return;
				}
				requests++;
				let counted = true;
				const finish = () => {
					if (counted) {
						counted = false;
						requests--;
					}
				};
				res.once("finish", finish);
				try {
					if (url.pathname.startsWith("/rpc/")) {
						const { matched } = await handler.handle(req, res, { prefix: "/rpc" });
						if (!matched) send(res, 404, { error: "接口不存在" });
						return;
					}
					let body = "";
					for await (const chunk of req) {
						body += chunk;
						if (Buffer.byteLength(body) > 131072) {
							send(res, 413, { error: "请求过大" });
							return;
						}
					}
					const data = JSON.parse(body || "{}");
					const id = typeof data === "object" && data !== null && "id" in data && typeof data.id === "string" ? data.id : "";
					let result;
					switch (url.pathname) {
						case "/api/activity":
							result = actions.activity(data);
							break;
						case "/api/material":
							result = actions.material(data);
							break;
						case "/api/tool": {
							const input = data;
							const tool = catalog(service).find((item) => item.name === input?.name);
							if (!tool) throw Error("未知工具");
							result = await tool.call(input.arguments ?? {});
							break;
						}
						case "/api/stop":
							if (!stop) throw Error("请通过启动终端停止此前台实例");
							await actions.pause();
							result = { stopping: true };
							stop();
							break;
						case "/api/config":
							result = await actions.config(data);
							break;
						case "/api/credentials":
							result = await actions.credentials(data);
							break;
						case "/api/login-start":
							result = await actions.loginStart();
							break;
						case "/api/login-poll":
						case "/api/login-cancel": {
							const handle = typeof data === "object" && data !== null && "handle" in data && typeof data.handle === "string" ? data.handle : "";
							if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(handle)) throw Error("无效登录会话");
							result = url.pathname === "/api/login-poll" ? await actions.loginPoll(handle) : actions.loginCancel(handle);
							break;
						}
						case "/api/check-login":
							result = await actions.checkLogin();
							break;
						case "/api/run":
							result = actions.run();
							break;
						case "/api/pause":
							result = await actions.pause();
							break;
						case "/api/approve":
							result = await actions.approve(id);
							break;
						case "/api/reject":
							result = actions.reject(id);
							break;
						case "/api/dismiss":
							result = actions.dismiss(id);
							break;
						default:
							send(res, 404, { error: "接口不存在" });
							return;
					}
					send(res, 200, result ?? { ok: true });
				} finally {
					finish();
				}
				return;
			}
			if (req.method !== "GET" && req.method !== "HEAD") {
				send(res, 405, { error: "方法不支持" });
				return;
			}
			const assets = path.join(root, "dist/dashboard/client");
			const file = path.resolve(assets, "." + decodeURIComponent(url.pathname));
			const relative = path.relative(assets, file);
			if (relative.startsWith("..") || path.isAbsolute(relative)) {
				send(res, 404, { error: "不存在" });
				return;
			}
			if (fs.existsSync(file) && fs.statSync(file).isFile()) {
				const type = {
					".js": "text/javascript",
					".css": "text/css",
					".png": "image/png",
					".svg": "image/svg+xml",
					".ico": "image/x-icon",
					".woff2": "font/woff2"
				}[path.extname(file)];
				if (!type) {
					send(res, 404, { error: "不存在" });
					return;
				}
				send(res, 200, fs.readFileSync(file), type);
				return;
			}
			if (!renderApp) {
				const entry = path.join(root, "dist/dashboard/server/server.js");
				if (!fs.existsSync(entry)) {
					send(res, 503, { error: "管理页尚未构建，请运行 pnpm build" });
					return;
				}
				renderApp = (await import(pathToFileURL(entry).href)).default.fetch;
			}
			const response = await renderApp(new Request(url, { headers: { accept: "text/html" } }));
			const nonce = crypto.randomBytes(18).toString("base64");
			const html = (await response.text()).replaceAll("<script", "<script nonce=\"" + nonce + "\"");
			res.setHeader("content-security-policy", "default-src 'self'; script-src 'self' 'nonce-" + nonce + "'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.hdslb.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
			send(res, response.status, html, "text/html; charset=utf-8");
		} catch (error) {
			if (!res.headersSent) send(res, 400, { error: redact(errorMessage(error), service.store.dir) });
			else res.end();
		}
	});
	await new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(port, "127.0.0.1", resolve);
	});
	origin = "http://127.0.0.1:" + server.address().port;
	return {
		origin,
		token,
		url: origin + "/#" + token,
		server,
		busy: () => requests > 0,
		gate: (closed) => {
			quiescing = closed;
		},
		close: () => {
			service.login.dispose();
			return new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
		}
	};
}
export { connectCodex as a, threadResponse as c, configResponse as i, Daemon as n, findCodex as o, accountResponse as r, isolatedConfig as s, createHttp as t };

//# sourceMappingURL=http-BFGXprSR.js.map