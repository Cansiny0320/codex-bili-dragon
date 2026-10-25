import { t as DragonService } from "./service-ByUvAcd3.js";
import { c as readManifest, d as readTransition, f as transitionPath, h as atomic, l as stageUpdate, m as Store, o as compatible, p as updateState, s as newer, t as connectionPath, v as errorMessage } from "./runtime-BQhNtnnM.js";
import { a as version, n as dataRoot, r as root } from "./paths-5G6hh4eK.js";
import { _ as string, a as array, o as boolean, p as object } from "./schemas-BWrad36H.js";
import { n as Daemon, t as createHttp } from "./http-BsBWPWCD.js";
import path from "node:path";
import { spawn } from "node:child_process";
import fs from "node:fs";
import { randomBytes } from "node:crypto";
import { setTimeout } from "node:timers/promises";
// src/update.ts
const repository = "Cansiny0320/codex-bili-dragon";
const interval = 216e5;
async function download(url, limit, fetcher) {
	const response = await fetcher(url, {
		headers: {
			"user-agent": "codex-bili-dragon-updater",
			accept: "application/octet-stream"
		},
		signal: AbortSignal.timeout(6e4)
	});
	if (!response.ok || !response.body) throw Error("下载更新失败：HTTP " + response.status);
	if (Number(response.headers.get("content-length") ?? 0) > limit) throw Error("更新下载超出大小限制");
	const reader = response.body.getReader(), chunks = [];
	let length = 0;
	try {
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			length += value.length;
			if (length > limit) throw Error("更新下载超出大小限制");
			chunks.push(value);
		}
	} finally {
		await reader.cancel();
	}
	return Buffer.concat(chunks);
}
async function latestUpdate(dir, current, fetcher = fetch, downloading = () => {}) {
	const response = await fetcher("https://api.github.com/repos/" + repository + "/releases/latest", {
		headers: {
			accept: "application/vnd.github+json",
			"user-agent": "codex-bili-dragon-updater"
		},
		signal: AbortSignal.timeout(3e4)
	});
	if (!response.ok) throw Error("检查更新失败：HTTP " + response.status);
	const release = object({
		tag_name: string(),
		draft: boolean(),
		prerelease: boolean(),
		assets: array(object({ name: string() }))
	}).parse(await response.json());
	const next = release.tag_name.replace(/^v/, "");
	if (release.draft || release.prerelease || !newer(next, current)) return null;
	const name = "codex-bili-dragon-" + next + "-plugin.zip";
	if (![name, name + ".sha256"].every((asset) => release.assets.some((item) => item.name === asset))) throw Error("稳定版本缺少更新包或校验文件");
	downloading(next);
	const base = "https://github.com/" + repository + "/releases/download/" + release.tag_name + "/" + name;
	const checksum = (await download(base + ".sha256", 1024, fetcher)).toString("utf8").trim();
	const match = /^([a-f0-9]{64})\s+\*?([^\r\n]+)$/.exec(checksum);
	if (!match || match[2] !== name) throw Error("更新校验文件无效");
	const archive = await download(base, 67108864, fetcher);
	return {
		root: stageUpdate(dir, archive, match[1], next),
		version: next
	};
}
var Updater = class {
	daemon;
	host;
	fetcher;
	timer;
	running = false;
	stopped = false;
	nextCheck = 0;
	constructor(daemon, host, fetcher = fetch) {
		this.daemon = daemon;
		this.host = host;
		this.fetcher = fetcher;
	}
	start() {
		this.timer = setInterval(() => void this.tick(), 3e4);
		this.tick();
		return this;
	}
	stop() {
		this.stopped = true;
		clearInterval(this.timer);
	}
	state(value) {
		const dir = this.daemon.service.store.dir;
		new Store(dir).write("update-state", {
			...updateState(dir),
			...value
		});
	}
	async tick(now = Date.now()) {
		if (this.running || this.stopped) return;
		if (!this.daemon.service.config().updates.enabled) {
			this.nextCheck = 0;
			return;
		}
		if (now < this.nextCheck) return;
		this.running = true;
		this.nextCheck = now + interval;
		const dir = this.daemon.service.store.dir;
		try {
			if (!readManifest(root)) {
				this.state({
					status: "reload-required",
					message: "当前版本缺少兼容清单，请更新并重新加载插件。"
				});
				return;
			}
			this.state({
				status: "checking",
				checkedAt: new Date(now).toISOString(),
				message: void 0
			});
			const candidate = await latestUpdate(dir, version, this.fetcher, (availableVersion) => this.state({
				status: "downloading",
				availableVersion
			}));
			if (this.stopped || !this.daemon.service.config().updates.enabled) {
				this.state({ status: "idle" });
				return;
			}
			if (!candidate) {
				this.state({
					status: "idle",
					availableVersion: void 0
				});
				return;
			}
			if (!compatible(readManifest(root), readManifest(candidate.root))) {
				this.state({
					status: "reload-required",
					message: "新版本需要重新加载插件，请在 Codex 插件市场更新后重新加载。"
				});
				return;
			}
			if (updateState(dir).failedVersion === candidate.version) {
				this.state({
					status: "error",
					message: "此版本启动失败，已保留原版本。请等待后续版本或手动更新。"
				});
				return;
			}
			await this.apply(candidate);
		} catch (error) {
			this.state({
				status: "error",
				message: errorMessage(error)
			});
		} finally {
			this.running = false;
		}
	}
	async apply(candidate, waitMs = 12e4) {
		const dir = this.daemon.service.store.dir;
		this.daemon.draining = true;
		this.state({
			status: "waiting",
			availableVersion: candidate.version,
			message: "等待当前任务完成后更新。"
		});
		let handedOff = false;
		try {
			const deadline = Date.now() + waitMs;
			while (!this.daemon.idleForUpdate || this.host.busy()) {
				if (this.stopped || !this.daemon.service.config().updates.enabled) {
					this.state({
						status: "idle",
						message: void 0
					});
					return;
				}
				if (Date.now() >= deadline) {
					this.state({
						status: "waiting",
						message: "当前任务仍在进行，更新已延期。"
					});
					return;
				}
				await setTimeout(100);
			}
			if (this.stopped || !this.daemon.service.config().updates.enabled) {
				this.state({
					status: "idle",
					message: void 0
				});
				return;
			}
			this.host.gate(true);
			if (fs.existsSync(transitionPath(dir))) throw Error("上次更新切换尚未完成，请核查后台日志");
			atomic(transitionPath(dir), {
				oldRoot: root,
				newRoot: candidate.root,
				version: candidate.version,
				oldPid: process.pid,
				token: randomBytes(32).toString("base64url"),
				startedAt: Date.now()
			});
			const log = fs.openSync(path.join(dir, "server.log"), "a", 384);
			const child = spawn(process.execPath, [path.join(root, "dist/runtime/update-runner.js")], {
				cwd: root,
				env: {
					...process.env,
					BILI_DRAGON_DATA: dir
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
			try {
				await new Promise((resolve, reject) => {
					child.once("spawn", resolve);
					child.once("error", reject);
				});
				const readyBy = Date.now() + 1e4;
				while (readTransition(dir)?.runnerPid !== child.pid) {
					if (child.exitCode !== null || Date.now() >= readyBy) throw Error("更新切换进程未就绪，继续使用当前后台");
					await setTimeout(100);
				}
			} catch (error) {
				fs.rmSync(transitionPath(dir), { force: true });
				throw error;
			}
			child.unref();
			handedOff = true;
			this.state({
				status: "switching",
				message: "正在切换后台，请稍候重新打开管理页。"
			});
			await this.host.stop();
		} finally {
			if (!handedOff) {
				this.daemon.draining = false;
				this.host.gate(false);
			}
		}
	}
};
// src/worker.ts
async function main() {
	const service = new DragonService(new Store(dataRoot));
	service.updatesSupported = true;
	const transition = readTransition(dataRoot);
	const heldToken = process.env.BILI_DRAGON_UPDATE_TOKEN;
	if (transition && heldToken !== transition.token) throw Error("后台正在更新，暂不启动其他实例");
	const daemon = new Daemon(service);
	let held = !!heldToken;
	let armed = false;
	daemon.draining = held;
	daemon.start();
	let updater;
	let activationTimer;
	let refreshing = false;
	let closing = false;
	let web;
	const stop = async () => {
		if (closing) return;
		closing = true;
		updater?.stop();
		clearInterval(activationTimer);
		try {
			await daemon.stop();
			await web.close();
		} finally {
			fs.rmSync(connectionPath(dataRoot), { force: true });
		}
	};
	try {
		web = await createHttp(service, daemon, {
			port: 0,
			stop: () => {
				setImmediate(() => void stop());
			},
			updateControl: heldToken ? {
				token: heldToken,
				held: () => held,
				activate: () => {
					armed = true;
				},
				shutdown: () => {
					setImmediate(() => void stop());
				}
			} : void 0
		});
		atomic(connectionPath(dataRoot), {
			origin: web.origin,
			token: web.token,
			pid: process.pid,
			version,
			root
		});
		const resume = () => {
			held = false;
			daemon.draining = false;
			web.gate(false);
			updater = new Updater(daemon, {
				busy: () => web.busy() || refreshing,
				gate: web.gate,
				stop
			}).start();
			refreshing = true;
			service.refreshVideoMetadata().catch((error) => daemon.error(error)).finally(() => {
				refreshing = false;
			});
		};
		if (held) activationTimer = setInterval(() => {
			if (armed && !readTransition(dataRoot)) {
				clearInterval(activationTimer);
				resume();
			}
		}, 100);
		else resume();
	} catch (error) {
		await daemon.stop();
		throw error;
	}
	process.on("SIGINT", () => void stop());
	process.on("SIGTERM", () => void stop());
}
main().catch((error) => {
	console.error(errorMessage(error));
	process.exitCode = 1;
});
export {};

//# sourceMappingURL=worker.js.map