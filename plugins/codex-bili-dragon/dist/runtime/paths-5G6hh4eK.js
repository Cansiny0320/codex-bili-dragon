import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
// src/paths.ts
function projectRoot() {
	let dir = path.dirname(fileURLToPath(import.meta.url));
	while (!fs.existsSync(path.join(dir, ".codex-plugin/plugin.json"))) {
		const parent = path.dirname(dir);
		if (parent === dir) throw Error("找不到插件根目录");
		dir = parent;
	}
	return dir;
}
const root = projectRoot();
if (process.env.BILI_DRAGON_DATA && !path.isAbsolute(process.env.BILI_DRAGON_DATA)) throw Error("BILI_DRAGON_DATA 必须是绝对路径");
const appRoot = process.platform === "win32" ? path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData/Local"), "CodexBiliDragon") : process.platform === "darwin" ? path.join(os.homedir(), "Library/Application Support/CodexBiliDragon") : path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local/share"), "codex-bili-dragon");
const dataRoot = path.resolve(process.env.BILI_DRAGON_DATA || path.join(appRoot, "data"));
const vendor = path.join(root, "vendor/upstream");
const version = JSON.parse(fs.readFileSync(path.join(root, "plugin.json"), "utf8")).version;
export { version as a, vendor as i, dataRoot as n, root as r, appRoot as t };

//# sourceMappingURL=paths-5G6hh4eK.js.map