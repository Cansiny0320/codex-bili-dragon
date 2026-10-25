import { a as version, n as dataRoot, r as root } from "./paths-5G6hh4eK.js";
import { _ as string, f as number, g as record, p as object, u as literal } from "./schemas-BWrad36H.js";
import { t as unzipSync } from "./esm-BCaQKQvd.js";
import path from "node:path";
import { spawn } from "node:child_process";
import fs from "node:fs";
import crypto, { createHash, randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
// src/types.ts
const errorMessage = (error) => error instanceof Error ? error.message : String(error);
const errorCode = (error) => typeof error === "object" && error !== null && "code" in error ? error.code : void 0;
// src/store.ts
function atomic(file, value) {
	fs.mkdirSync(path.dirname(file), {
		recursive: true,
		mode: 448
	});
	const temp = file + "." + crypto.randomUUID() + ".tmp";
	try {
		fs.writeFileSync(temp, typeof value === "string" ? value : JSON.stringify(value, null, 2) + "\n", { mode: 384 });
		fs.renameSync(temp, file);
	} finally {
		fs.rmSync(temp, { force: true });
	}
}
function exclusive(file) {
	fs.mkdirSync(path.dirname(file), {
		recursive: true,
		mode: 448
	});
	for (let attempt = 0; attempt < 2; attempt++) try {
		const fd = fs.openSync(file, "wx", 384);
		fs.writeFileSync(fd, JSON.stringify({ pid: process.pid }));
		return () => {
			fs.closeSync(fd);
			fs.rmSync(file, { force: true });
		};
	} catch (e) {
		if (errorCode(e) !== "EEXIST") throw e;
		let owner;
		try {
			owner = JSON.parse(fs.readFileSync(file, "utf8"));
		} catch {
			throw Error("锁文件不完整，请检查运行状态：" + path.basename(file));
		}
		if (!Number.isInteger(owner.pid) || owner.pid < 1) throw Error("无效锁持有者");
		try {
			process.kill(owner.pid, 0);
		} catch (err) {
			if (errorCode(err) === "ESRCH") {
				fs.unlinkSync(file);
				continue;
			}
		}
		throw Error("另一个操作正在进行：" + path.basename(file));
	}
	throw Error("无法取得锁");
}
var Store = class {
	dir;
	constructor(dir) {
		this.dir = dir;
	}
	file(key) {
		if (!/^[a-z0-9-]+$/.test(key)) throw Error("无效数据路径");
		return path.join(this.dir, key + ".json");
	}
	read(key, fallback = null) {
		const file = this.file(key);
		try {
			return JSON.parse(fs.readFileSync(file, "utf8"));
		} catch (e) {
			if (errorCode(e) === "ENOENT") return structuredClone(fallback);
			throw Error("数据损坏，已停止自动处理：" + key);
		}
	}
	write(key, value) {
		atomic(this.file(key), value);
		return value;
	}
	update(key, fallback, fn) {
		const release = exclusive(this.file(key) + ".lock");
		try {
			const data = this.read(key, fallback);
			const result = fn(data);
			this.write(key, data);
			return result ?? data;
		} finally {
			release();
		}
	}
};
// src/update-state.ts
const updateState = (dir) => new Store(dir).read("update-state", { status: "idle" });
const transitionPath = (dir) => path.join(dir, "updates/transition.json");
const transitionSchema = object({
	oldRoot: string(),
	newRoot: string(),
	version: string(),
	oldPid: number().int().positive(),
	token: string().min(40),
	startedAt: number(),
	runnerPid: number().int().positive().optional()
});
function readTransition(dir) {
	if (!fs.existsSync(transitionPath(dir))) return null;
	return transitionSchema.parse(JSON.parse(fs.readFileSync(transitionPath(dir), "utf8")));
}
function activeRoot(dir, fallback) {
	const file = path.join(dir, "updates/active.json");
	if (!fs.existsSync(file)) return fallback;
	const value = object({
		root: string(),
		version: string()
	}).parse(JSON.parse(fs.readFileSync(file, "utf8")));
	const relative = path.relative(path.join(dir, "updates/versions"), value.root);
	if (!/^\d+\.\d+\.\d+-[a-f0-9]{64}$/.test(relative)) throw Error("自动更新目录记录无效");
	return value.root;
}
// src/update-package.ts
const sha = string().regex(/^[a-f0-9]{64}$/);
const stable = string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
const manifestSchema = object({
	schema: number().int().positive(),
	version: stable,
	bridge: sha,
	contract: sha,
	data: number().int().positive(),
	protocol: number().int().positive()
}).strict();
const hash = (value) => createHash("sha256").update(value).digest("hex");
function readManifest(directory) {
	try {
		return manifestSchema.parse(JSON.parse(fs.readFileSync(path.join(directory, "dist/runtime/update.json"), "utf8")));
	} catch {
		return null;
	}
}
function compatible(a, b) {
	return !!a && !!b && a.schema === 1 && a.protocol === 1 && a.schema === b.schema && a.bridge === b.bridge && a.contract === b.contract && a.data === b.data && a.protocol === b.protocol;
}
function newer(candidate, current) {
	if (!stable.safeParse(candidate).success || !stable.safeParse(current).success) return false;
	const a = candidate.split(".").map(Number), b = current.split(".").map(Number);
	for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
	return false;
}
function safeName(name) {
	if (!name || name.includes("\\") || name.includes(":") || name.startsWith("/") || name.split("/").some((part) => !part || part === "." || part === ".." || part.split("").some((char) => char.charCodeAt(0) < 32) || /[. ]$|[<>"|?*]/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) throw Error("更新包包含无效路径");
}
const bundleSchema = object({
	version: stable,
	files: record(string(), sha)
}).strict();
const required = [
	"plugin.json",
	".codex-plugin/plugin.json",
	"package.json",
	"dist/runtime/update.json",
	"dist/runtime/worker.js",
	"dist/runtime/update-runner.js",
	"dist/mcp-app/index.html"
];
function verifyContents(read, names, version) {
	const unique = /* @__PURE__ */ new Set();
	for (const name of names) {
		safeName(name);
		if (unique.has(name.toLowerCase())) throw Error("更新包路径重复");
		unique.add(name.toLowerCase());
	}
	const json = (name) => JSON.parse(Buffer.from(read(name)).toString("utf8"));
	const bundle = bundleSchema.parse(json("bundle.json"));
	if (bundle.version !== version) throw Error("更新包版本不匹配");
	if (names.length !== Object.keys(bundle.files).length + 1 || names.some((name) => name !== "bundle.json" && !Object.hasOwn(bundle.files, name))) throw Error("更新包文件清单不匹配");
	for (const name of required) if (!Object.hasOwn(bundle.files, name)) throw Error("更新包缺少必要文件");
	for (const [name, digest] of Object.entries(bundle.files)) {
		safeName(name);
		if (hash(read(name)) !== digest) throw Error("更新包文件校验失败");
	}
	for (const name of [
		"plugin.json",
		".codex-plugin/plugin.json",
		"package.json"
	]) if (object({
		name: literal("codex-bili-dragon"),
		version: stable
	}).parse(json(name)).version !== version) throw Error("更新包身份或版本不匹配");
	const manifest = manifestSchema.parse(json("dist/runtime/update.json"));
	if (manifest.version !== version) throw Error("兼容清单版本不匹配");
	return manifest;
}
function verifyPackage(directory, version) {
	const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		if (entry.isSymbolicLink()) throw Error("更新包路径不能是链接");
		const file = path.join(dir, entry.name);
		return entry.isDirectory() ? walk(file) : [path.relative(directory, file).replaceAll("\\", "/")];
	});
	return verifyContents((name) => fs.readFileSync(path.join(directory, name)), walk(directory), version);
}
function stageUpdate(dir, zip, digest, version) {
	if (!sha.safeParse(digest).success || hash(zip) !== digest) throw Error("更新包 SHA-256 校验失败");
	stable.parse(version);
	let expanded = 0, count = 0;
	const names = /* @__PURE__ */ new Set();
	const entries = unzipSync(zip, { filter: (entry) => {
		safeName(entry.name);
		if (names.has(entry.name.toLowerCase())) throw Error("更新包路径重复");
		names.add(entry.name.toLowerCase());
		expanded += entry.originalSize;
		if (++count > 1e4 || entry.originalSize > 67108864 || expanded > 268435456) throw Error("更新包超出大小限制");
		return true;
	} });
	verifyContents((name) => {
		if (!entries[name]) throw Error("更新包文件缺失");
		return entries[name];
	}, Object.keys(entries), version);
	const versions = path.join(dir, "updates/versions");
	fs.mkdirSync(versions, {
		recursive: true,
		mode: 448
	});
	const target = path.join(versions, version + "-" + digest);
	if (fs.existsSync(target)) {
		verifyPackage(target, version);
		return target;
	}
	const staging = path.join(versions, ".staging-" + randomUUID());
	fs.mkdirSync(staging);
	try {
		for (const [name, bytes] of Object.entries(entries)) {
			const file = path.join(staging, name);
			fs.mkdirSync(path.dirname(file), { recursive: true });
			fs.writeFileSync(file, bytes, {
				mode: 384,
				flag: "wx"
			});
		}
		fs.renameSync(staging, target);
		return target;
	} finally {
		fs.rmSync(staging, {
			recursive: true,
			force: true
		});
	}
}
// src/runtime.ts
const connectionSchema = object({
	origin: string().regex(/^http:\/\/127\.0\.0\.1:\d+$/),
	token: string().regex(/^[\w-]{40,}$/),
	pid: number().int().positive(),
	version: string(),
	root: string()
});
const connectionPath = (dir) => path.join(dir, "connection.json");
async function requestRuntime(connection, action, input, timeout = 18e4) {
	if (!/^[a-z-]+$/.test(action)) throw Error("无效后台操作");
	const read = action === "state" || action === "runtime";
	const response = await fetch(connection.origin + "/api/" + action, {
		method: read ? "GET" : "POST",
		headers: {
			authorization: "Bearer " + connection.token,
			origin: connection.origin,
			"content-type": "application/json"
		},
		body: read ? void 0 : JSON.stringify(input ?? {}),
		signal: AbortSignal.timeout(timeout)
	});
	const result = await response.json();
	if (!response.ok) {
		const message = typeof result === "object" && result !== null && "error" in result ? String(result.error) : "后台请求失败";
		throw Error(message);
	}
	return result;
}
async function findRuntime(dir = dataRoot) {
	let saved;
	try {
		saved = connectionSchema.parse(JSON.parse(fs.readFileSync(connectionPath(dir), "utf8")));
	} catch (error) {
		if (errorCode(error) === "ENOENT") return null;
		throw Error("后台连接记录损坏，请先核查 connection.json");
	}
	try {
		const status = await requestRuntime(saved, "runtime", void 0, 1e3);
		return status.pid === saved.pid && status.protocol === 1 ? saved : null;
	} catch {
		return null;
	}
}
async function ensureRuntime(dir = dataRoot) {
	for (let attempt = 0; readTransition(dir); attempt++) {
		const transition = readTransition(dir);
		if (attempt >= 600 || Date.now() - transition.startedAt > 18e4) throw Error("后台更新尚未完成，请核查 server.log；未重复提交请求");
		await setTimeout(100);
	}
	const current = await findRuntime(dir);
	if (current) {
		if (current.version !== version && !compatible(readManifest(root), readManifest(current.root))) throw Error("后台版本已变化，请先停止后台，再重新启动。数据会保留。");
		return current;
	}
	const selected = activeRoot(dir, root);
	const selectedManifest = readManifest(selected);
	const directory = selected !== root && selectedManifest && newer(selectedManifest.version, version) && compatible(readManifest(root), selectedManifest) ? selected : root;
	if (directory !== root) verifyPackage(directory, selectedManifest.version);
	fs.mkdirSync(dir, {
		recursive: true,
		mode: 448
	});
	const log = fs.openSync(path.join(dir, "server.log"), "a", 384);
	const child = spawn(process.execPath, [path.join(directory, "dist/runtime/worker.js")], {
		cwd: directory,
		env: {
			...process.env,
			BILI_DRAGON_DATA: dir,
			BILI_DRAGON_UPDATE_TOKEN: ""
		},
		detached: true,
		windowsHide: true,
		stdio: [
			"ignore",
			log,
			log
		]
	});
	fs.closeSync(log);
	let failure;
	child.once("error", (error) => {
		failure = error;
	});
	child.unref();
	for (let attempt = 0; attempt < 100; attempt++) {
		const ready = await findRuntime(dir);
		if (ready) return ready;
		if (failure) throw failure;
		await setTimeout(100);
	}
	throw Error("后台未能启动，请检查数据目录中的 server.log");
}
async function stopRuntime(dir = dataRoot) {
	const current = await findRuntime(dir);
	if (!current) return { stopped: true };
	await requestRuntime(current, "stop");
	for (let attempt = 0; attempt < 100; attempt++) {
		if (!fs.existsSync(connectionPath(dir))) return { stopped: true };
		await setTimeout(100);
	}
	throw Error("后台仍在停止，请稍后检查状态");
}
export { errorCode as _, stopRuntime as a, readManifest as c, readTransition as d, transitionPath as f, exclusive as g, atomic as h, requestRuntime as i, stageUpdate as l, Store as m, ensureRuntime as n, compatible as o, updateState as p, findRuntime as r, newer as s, connectionPath as t, verifyPackage as u, errorMessage as v };

//# sourceMappingURL=runtime-BQhNtnnM.js.map