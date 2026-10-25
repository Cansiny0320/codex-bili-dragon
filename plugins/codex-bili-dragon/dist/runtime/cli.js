#!/usr/bin/env node
import { a as configResponse, c as isolatedConfig, i as accountResponse, l as threadResponse, n as catalog, o as connectCodex, s as findCodex, t as DragonService } from "./service-ByUvAcd3.js";
import { a as stopRuntime, h as atomic, i as requestRuntime, m as Store, n as ensureRuntime, r as findRuntime, v as errorMessage } from "./runtime-BQhNtnnM.js";
import { n as dataRoot, r as root, t as appRoot } from "./paths-5G6hh4eK.js";
import { t as ensureFfmpeg } from "./ffmpeg-MQ-tQqLl.js";
import { n as Daemon, t as createHttp } from "./http-BsBWPWCD.js";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createHash } from "node:crypto";
// src/install.ts
const pluginName = "codex-bili-dragon";
const marketplaceName = "bili-dragon";
function installPlugin(options = {}) {
	const source = path.resolve(options.source ?? root);
	const destination = path.resolve(options.destination ?? path.join(appRoot, "plugin-source"));
	if (!path.isAbsolute(options.node ?? process.execPath)) throw Error("Node 路径必须为绝对路径");
	const node = options.node ?? process.execPath;
	const codex = options.codex ?? findCodex();
	const run = options.run ?? ((command, args) => execFileSync(command, args, {
		encoding: "utf8",
		windowsHide: true,
		stdio: [
			"ignore",
			"pipe",
			"pipe"
		]
	}));
	const manifest = JSON.parse(fs.readFileSync(path.join(source, "plugin.json"), "utf8"));
	if (manifest.name !== pluginName) throw Error("安装包身份不匹配");
	const bundle = JSON.parse(fs.readFileSync(path.join(source, "bundle.json"), "utf8"));
	for (const [relative, hash] of Object.entries(bundle.files)) {
		const file = path.resolve(source, relative);
		if (path.relative(source, file).startsWith("..") || path.isAbsolute(relative)) throw Error("安装包包含无效路径");
		if (createHash("sha256").update(fs.readFileSync(file)).digest("hex") !== hash) throw Error("安装包校验失败：" + relative);
	}
	for (const file of [
		"dist/runtime/mcp.js",
		"dist/runtime/worker.js",
		"dist/mcp-app/index.html",
		"assets/icon.png"
	]) if (!Object.hasOwn(bundle.files, file)) throw Error("安装包不完整：" + file);
	if (!/Install a plugin|plugin add/.test(run(codex, [
		"plugin",
		"add",
		"--help"
	]))) throw Error("当前 Codex 尚不支持插件安装命令，请更新桌面应用。");
	const digest = createHash("sha256").update(JSON.stringify(bundle.files)).digest("hex").slice(0, 12);
	const copy = path.join(destination, "releases", manifest.version + "-" + digest);
	if (!fs.existsSync(copy)) {
		fs.mkdirSync(copy, {
			recursive: true,
			mode: 448
		});
		for (const relative of [...Object.keys(bundle.files), "bundle.json"]) {
			const target = path.join(copy, relative);
			fs.mkdirSync(path.dirname(target), { recursive: true });
			fs.copyFileSync(path.join(source, relative), target);
		}
	}
	const mcp = JSON.parse(fs.readFileSync(path.join(copy, "mcp.json"), "utf8"));
	mcp.mcpServers[pluginName].command = path.basename(node);
	mcp.mcpServers[pluginName].env = {
		...mcp.mcpServers[pluginName].env,
		PATH: path.dirname(node) + path.delimiter + (process.env.PATH ?? "")
	};
	atomic(path.join(copy, "mcp.json"), mcp);
	const marketplaceFile = path.join(destination, ".agents/plugins/marketplace.json");
	const marketplace = fs.existsSync(marketplaceFile) ? JSON.parse(fs.readFileSync(marketplaceFile, "utf8")) : {
		name: marketplaceName,
		interface: { displayName: "B 站小白龙" },
		plugins: []
	};
	if (marketplace.name !== marketplaceName) throw Error("目标插件源属于其他项目，未覆盖");
	const entry = {
		name: pluginName,
		source: {
			source: "local",
			path: "./" + path.relative(destination, copy).replaceAll("\\", "/")
		},
		policy: {
			installation: "AVAILABLE",
			authentication: "ON_INSTALL"
		},
		category: "Productivity"
	};
	marketplace.plugins = [...marketplace.plugins.filter((item) => item.name !== pluginName), entry];
	atomic(marketplaceFile, marketplace);
	const registered = JSON.parse(run(codex, [
		"plugin",
		"marketplace",
		"add",
		destination,
		"--json"
	]));
	const installed = JSON.parse(run(codex, [
		"plugin",
		"add",
		pluginName + "@" + marketplaceName,
		"--json"
	]));
	if (!installed.installedPath) throw Error("Codex 未返回已安装路径，请检查插件安装状态");
	if (!fs.existsSync(path.join(installed.installedPath, "dist/mcp-app/index.html"))) throw Error("Codex 安装副本缺少管理页资源");
	return {
		...installed,
		registered,
		source: copy,
		version: manifest.version,
		dashboardUrl: "codex://plugins/codex-bili-dragon@bili-dragon/app/dragon_sidebar"
	};
}
// src/migrate.ts
function migrateData(source, target) {
	if (!path.isAbsolute(source) || !path.isAbsolute(target)) throw Error("数据目录必须为绝对路径");
	const from = fs.realpathSync(source), to = path.resolve(target);
	if (!fs.statSync(from).isDirectory()) throw Error("旧数据目录不存在");
	const relative = path.relative(from, to);
	if (!relative || !relative.startsWith("..") && !path.isAbsolute(relative)) throw Error("新数据目录不能位于旧目录中");
	if (fs.existsSync(to) && fs.readdirSync(to).length) throw Error("目标目录已有数据，未覆盖");
	fs.cpSync(from, to, {
		recursive: true,
		filter: (file) => {
			if (fs.lstatSync(file).isSymbolicLink()) throw Error("旧数据含符号链接，请先核查");
			return !/\.lock$|\.tmp$|^(?:connection\.json|server\.log)$/.test(path.basename(file));
		}
	});
	return {
		migrated: true,
		source: from,
		target: to
	};
}
// src/cli.ts
const command = process.argv[2] ?? "help";
async function main() {
	if (command === "mcp") {
		await import("./mcp.js");
		return;
	}
	if (command === "start") {
		await ensureFfmpeg(dataRoot, { progress: (message) => console.error(message) });
		const running = await ensureRuntime();
		console.log(JSON.stringify({
			running: true,
			version: running.version,
			message: "本地后台已启动。请在 Codex 打开 B 站小白龙管理页。"
		}));
		return;
	}
	if (command === "stop") {
		console.log(JSON.stringify(await stopRuntime()));
		return;
	}
	if (command === "status") {
		const running = await findRuntime();
		console.log(JSON.stringify({
			running: !!running,
			version: running?.version
		}));
		return;
	}
	if (command === "pause") {
		const running = await findRuntime();
		if (running) await requestRuntime(running, "pause");
		console.log(JSON.stringify({ paused: true }));
		return;
	}
	if (command === "migrate-data") {
		if (!process.argv[3]) throw Error("请指定旧版数据目录");
		console.log(JSON.stringify(migrateData(path.resolve(process.argv[3]), dataRoot)));
		return;
	}
	if (command === "serve") {
		await ensureFfmpeg(dataRoot, { progress: (message) => console.error(message) });
		const service = new DragonService(new Store(dataRoot));
		const daemon = new Daemon(service).start();
		let web;
		try {
			web = await createHttp(service, daemon, { port: Number(process.env.BILI_DRAGON_PORT ?? 18841) });
		} catch (e) {
			await daemon.stop();
			throw e;
		}
		console.log("B 站小白龙已启动，仅本机可访问。\n" + web.url + "\n按 Ctrl+C 停止。链接包含本机会话令牌，请勿分享。");
		let closing = false;
		const stop = async () => {
			if (closing) return;
			closing = true;
			await daemon.stop();
			await web.close();
		};
		process.on("SIGINT", () => void stop());
		process.on("SIGTERM", () => void stop());
		return;
	}
	if (command === "doctor") {
		const codex = findCodex();
		console.log("Node: " + process.version);
		console.log("Codex: " + execFileSync(codex, ["--version"], {
			encoding: "utf8",
			windowsHide: true
		}).trim());
		const ff = (await import(pathToFileURL(path.join(root, "vendor/upstream/tools/lib/ffmpeg.mjs")).href)).ffmpegInfo();
		console.log("ffmpeg: " + (ff.ok ? "可用" : "未找到（字幕、搜索仍可用；抽帧需要安装或设置 FFMPEG）"));
		const rpc = await connectCodex(codex, root);
		try {
			const account = accountResponse.parse(await rpc.request("account/read", { refreshToken: false }));
			console.log("Codex 登录: " + (account.account?.type ?? "未登录"));
			if (process.argv.includes("--protocol")) {
				const config = isolatedConfig(), loaded = configResponse.parse(await rpc.request("config/read", { includeLayers: false }));
				for (const key of Object.keys(loaded.config?.mcp_servers ?? {})) config["mcp_servers." + key + ".enabled"] = false;
				if (!threadResponse.parse(await rpc.request("thread/start", {
					ephemeral: true,
					cwd: root,
					sandbox: "read-only",
					approvalPolicy: "never",
					environments: [],
					config,
					dynamicTools: [{
						type: "function",
						name: "dragon_probe",
						description: "本地协议检查工具，不执行任何操作",
						inputSchema: {
							type: "object",
							properties: {},
							additionalProperties: false
						}
					}]
				})).thread?.id) throw Error("缺少会话 ID");
				console.log("动态工具 / 专属会话协议: 可用（未调用模型）");
			}
		} finally {
			rpc.close();
		}
		return;
	}
	if (command === "install") {
		await ensureFfmpeg(dataRoot, { progress: (message) => console.error(message) });
		console.log(JSON.stringify(installPlugin()));
		return;
	}
	if (command === "tools") {
		const service = new DragonService(new Store(dataRoot));
		console.log(JSON.stringify(catalog(service).map(({ call: _call, ...tool }) => tool), null, 2));
		return;
	}
	console.log("Codex Bili Dragon\n\n  node dist/runtime/cli.js install   安装 Codex 插件（使用预构建插件包）\n  node dist/runtime/cli.js start     启动共享后台\n  node dist/runtime/cli.js status    查看后台状态\n  node dist/runtime/cli.js pause     暂停活动\n  node dist/runtime/cli.js stop      停止后台\n  node dist/runtime/cli.js serve     前台运行网页管理页\n  node dist/runtime/cli.js doctor    检查 Codex 登录与 ffmpeg\n  node dist/runtime/cli.js migrate-data <旧目录>  复制旧数据，保留原文件\n\n环境变量：BILI_DRAGON_DATA、BILI_DRAGON_CODEX、BILI_DRAGON_PORT");
}
main().catch((e) => {
	console.error(errorMessage(e));
	process.exitCode = 1;
});
export {};

//# sourceMappingURL=cli.js.map