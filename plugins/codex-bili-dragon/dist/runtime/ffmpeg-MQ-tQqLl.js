import { n as dataRoot } from "./paths-5G6hh4eK.js";
import { t as unzipSync } from "./esm-BCaQKQvd.js";
import path from "node:path";
import { execFile } from "node:child_process";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
// src/ffmpeg-assets.json
var ffmpeg_assets_default = {
	"win32-x64": {
		"version": "9.0.2-17-g2a571b6068",
		"url": "https://github.com/BtbN/FFmpeg-Builds/releases/download/autobuild-2026-09-30-13-08/ffmpeg-n9.0.2-17-g2a571b6068-win64-lgpl-shared-9.0.zip",
		"sha256": "7157177b8a6cb2174c1650ba8c71b363f2c78cba5330f88c4c02cf5b2b880646",
		"root": "ffmpeg-n9.0.2-17-g2a571b6068-win64-lgpl-shared-9.0",
		"format": "zip",
		"source": "https://github.com/BtbN/FFmpeg-Builds/tree/autobuild-2026-09-30-13-08",
		"minimum": "Windows 10 22H2"
	},
	"win32-arm64": {
		"version": "9.0.2-17-g2a571b6068",
		"url": "https://github.com/BtbN/FFmpeg-Builds/releases/download/autobuild-2026-09-30-13-08/ffmpeg-n9.0.2-17-g2a571b6068-winarm64-lgpl-shared-9.0.zip",
		"sha256": "f3133abf5c2b6ae45bd428d480cf830a9fbda3a3866dc249110e85f99f13b8ce",
		"root": "ffmpeg-n9.0.2-17-g2a571b6068-winarm64-lgpl-shared-9.0",
		"format": "zip",
		"source": "https://github.com/BtbN/FFmpeg-Builds/tree/autobuild-2026-09-30-13-08",
		"minimum": "Windows 10 22H2"
	},
	"linux-x64": {
		"version": "9.0.2-17-g2a571b6068",
		"url": "https://github.com/BtbN/FFmpeg-Builds/releases/download/autobuild-2026-09-30-13-08/ffmpeg-n9.0.2-17-g2a571b6068-linux64-lgpl-shared-9.0.tar.xz",
		"sha256": "7a1ba2af36e5beeb98151e766a903b1d115f2206a86571f17f873cd7292c424f",
		"root": "ffmpeg-n9.0.2-17-g2a571b6068-linux64-lgpl-shared-9.0",
		"format": "tar",
		"source": "https://github.com/BtbN/FFmpeg-Builds/tree/autobuild-2026-09-30-13-08",
		"minimum": "glibc 2.28 / Linux 4.18"
	},
	"linux-arm64": {
		"version": "9.0.2-17-g2a571b6068",
		"url": "https://github.com/BtbN/FFmpeg-Builds/releases/download/autobuild-2026-09-30-13-08/ffmpeg-n9.0.2-17-g2a571b6068-linuxarm64-lgpl-shared-9.0.tar.xz",
		"sha256": "1aa02c59afe06dea2602b40517a5cb75c0ff6d524f217b5aea1f0ca07977cd51",
		"root": "ffmpeg-n9.0.2-17-g2a571b6068-linuxarm64-lgpl-shared-9.0",
		"format": "tar",
		"source": "https://github.com/BtbN/FFmpeg-Builds/tree/autobuild-2026-09-30-13-08",
		"minimum": "glibc 2.28 / Linux 4.18"
	},
	"darwin-x64": {
		"version": "9.0.1-1",
		"url": "https://github.com/dfloresc/ffmpeg-macos-builds/releases/download/v9.0.1-1/ffmpeg-9.0.1-1-lgpl-macos-x86_64.tar.xz",
		"sha256": "d63ad731cbf1eb71c2055130fedfbd7e49edd60a9815ab763e72ba802c1ac666",
		"root": "ffmpeg-9.0.1-1-lgpl-macos-x86_64",
		"format": "tar",
		"source": "https://github.com/dfloresc/ffmpeg-macos-builds/releases/tag/v9.0.1-1",
		"minimum": "macOS 12"
	},
	"darwin-arm64": {
		"version": "9.0.1-1",
		"url": "https://github.com/dfloresc/ffmpeg-macos-builds/releases/download/v9.0.1-1/ffmpeg-9.0.1-1-lgpl-macos-arm64.tar.xz",
		"sha256": "d0ea5ea43a5adfa5d01d4137c9e5a61728b800a812f12917a26fd7af0c14c03a",
		"root": "ffmpeg-9.0.1-1-lgpl-macos-arm64",
		"format": "tar",
		"source": "https://github.com/dfloresc/ffmpeg-macos-builds/releases/tag/v9.0.1-1",
		"minimum": "macOS 12"
	}
};
// src/ffmpeg.ts
const execute = promisify(execFile);
const pending = /* @__PURE__ */ new Map();
function selectFfmpegAsset(platform = process.platform, arch = process.arch) {
	const asset = ffmpeg_assets_default[platform + "-" + arch];
	if (!asset) throw Error(`暂不支持自动安装 FFmpeg：${platform}/${arch}，可通过 FFMPEG 指定可执行文件`);
	return asset;
}
function dependencyDirectory(dir, platform, arch, asset) {
	return path.join(dir, "dependencies/ffmpeg", `${platform}-${arch}-${asset.version}-${asset.sha256.slice(0, 12)}`);
}
function fileExists(file) {
	if (!file) return false;
	try {
		return fs.statSync(file).isFile();
	} catch {
		return false;
	}
}
function findFfmpeg(dir = dataRoot, env = process.env) {
	if (fileExists(env.FFMPEG)) return path.resolve(env.FFMPEG);
	const exe = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
	try {
		const asset = selectFfmpegAsset();
		const cached = path.join(dependencyDirectory(dir, process.platform, process.arch, asset), "bin", exe);
		if (fileExists(cached)) return cached;
	} catch {}
	for (const directory of (env.PATH ?? "").split(path.delimiter)) {
		if (!directory) continue;
		const file = path.resolve(directory, exe);
		if (fileExists(file)) return file;
	}
	return null;
}
async function verifyExecutable(file) {
	const { stdout } = await execute(file, ["-hide_banner", "-version"], {
		windowsHide: true,
		timeout: 15e3
	});
	if (!stdout.startsWith("ffmpeg version ")) throw Error("FFmpeg 可执行文件验证失败");
}
async function downloadArchive(url) {
	const response = await fetch(url, { signal: AbortSignal.timeout(3e5) });
	if (!response.ok || !response.body) throw Error(`FFmpeg 下载失败：HTTP ${response.status}，请重新运行安装命令`);
	const chunks = [];
	let size = 0;
	for await (const chunk of response.body) {
		size += chunk.byteLength;
		if (size > 268435456) throw Error("FFmpeg 下载文件超出预期大小");
		chunks.push(chunk);
	}
	return Buffer.concat(chunks);
}
function archiveRelative(name, root) {
	const normalized = name.replaceAll("\\", "/");
	if (normalized.startsWith("/") || normalized.includes(":") || normalized.split("/").includes("..") || normalized !== root && !normalized.startsWith(root + "/")) throw Error("FFmpeg 压缩包包含无效路径");
	return normalized.slice(root.length).replace(/^\//, "");
}
function checkExtractedPaths(directory) {
	const base = fs.realpathSync(directory);
	const walk = (current) => {
		for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
			const file = path.join(current, entry.name);
			const relative = path.relative(base, fs.realpathSync(file));
			if (relative.startsWith("..") || path.isAbsolute(relative)) throw Error("FFmpeg 压缩包包含无效路径");
			if (entry.isDirectory()) walk(file);
		}
	};
	walk(directory);
}
async function ensureFfmpeg(dir = dataRoot, options = {}) {
	const platform = options.platform ?? process.platform, arch = options.arch ?? process.arch;
	const env = options.env ?? process.env, verify = options.verify ?? verifyExecutable;
	if (env.FFMPEG) {
		if (!path.isAbsolute(env.FFMPEG) || !fileExists(env.FFMPEG)) throw Error("FFMPEG 必须指向存在的可执行文件绝对路径");
		await verify(env.FFMPEG);
		return env.FFMPEG;
	}
	const asset = options.asset ?? selectFfmpegAsset(platform, arch);
	const destination = dependencyDirectory(path.resolve(dir), platform, arch, asset);
	const exe = platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
	const executable = path.join(destination, "bin", exe);
	if (fileExists(executable)) {
		await verify(executable);
		return executable;
	}
	if (!options.platform && !options.arch) {
		const existing = findFfmpeg(dir, env);
		if (existing) try {
			await verify(existing);
			return existing;
		} catch {}
	}
	const active = pending.get(destination);
	if (active) return active;
	const prepare = async () => {
		const parent = path.dirname(destination);
		fs.mkdirSync(parent, {
			recursive: true,
			mode: 448
		});
		const temporary = fs.mkdtempSync(path.join(parent, ".download-"));
		try {
			options.progress?.(`正在下载 FFmpeg ${asset.version}（${platform}/${arch}）…`);
			const archive = await (options.download ?? downloadArchive)(asset.url);
			if (createHash("sha256").update(archive).digest("hex") !== asset.sha256) throw Error("FFmpeg 下载文件校验失败，请重新运行安装命令");
			const unpacked = path.join(temporary, "unpacked");
			fs.mkdirSync(unpacked);
			if (asset.format === "zip") for (const [name, bytes] of Object.entries(unzipSync(archive))) {
				const relative = archiveRelative(name, asset.root);
				if (!relative || name.endsWith("/")) continue;
				const output = path.join(unpacked, relative);
				fs.mkdirSync(path.dirname(output), { recursive: true });
				fs.writeFileSync(output, bytes);
			}
			else {
				const downloaded = path.join(temporary, "download.tar.xz");
				fs.writeFileSync(downloaded, archive);
				const { stdout } = await execute("tar", ["-tf", downloaded], {
					windowsHide: true,
					timeout: 3e4,
					maxBuffer: 4194304
				});
				for (const name of stdout.split(/\r?\n/).filter(Boolean)) archiveRelative(name.replace(/\/$/, ""), asset.root);
				await execute("tar", [
					"-xf",
					downloaded,
					"--strip-components=1",
					"-C",
					unpacked
				], {
					windowsHide: true,
					timeout: 6e4
				});
				checkExtractedPaths(unpacked);
			}
			const candidate = path.join(unpacked, "bin", exe);
			if (!fileExists(candidate)) throw Error("FFmpeg 下载包缺少可执行文件");
			if (platform !== "win32") fs.chmodSync(candidate, 493);
			await verify(candidate);
			fs.writeFileSync(path.join(unpacked, "dragon-dependency.json"), JSON.stringify({
				...asset,
				platform,
				arch
			}, null, 2) + "\n");
			try {
				fs.renameSync(unpacked, destination);
			} catch (error) {
				if (!fileExists(executable)) throw error;
				await verify(executable);
			}
			options.progress?.("FFmpeg 已安装并验证。");
			return executable;
		} finally {
			const relative = path.relative(parent, temporary);
			if (relative.startsWith(".download-") && !relative.includes(path.sep)) fs.rmSync(temporary, {
				recursive: true,
				force: true
			});
		}
	};
	const task = prepare().finally(() => pending.delete(destination));
	pending.set(destination, task);
	return task;
}
export { findFfmpeg as n, ensureFfmpeg as t };

//# sourceMappingURL=ffmpeg-MQ-tQqLl.js.map