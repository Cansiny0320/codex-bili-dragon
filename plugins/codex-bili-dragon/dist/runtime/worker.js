import { g as errorMessage, m as atomic, o as DragonService, p as Store, t as connectionPath } from "./runtime-mPQ0hftG.js";
import { a as version, n as dataRoot, r as root } from "./paths-5G6hh4eK.js";
import { n as Daemon, t as createHttp } from "./http-CVoFMgmJ.js";
import fs from "node:fs";
// src/worker.ts
async function main() {
	const service = new DragonService(new Store(dataRoot));
	const daemon = new Daemon(service).start();
	let closing = false;
	let web;
	const stop = async () => {
		if (closing) return;
		closing = true;
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
			}
		});
		atomic(connectionPath(dataRoot), {
			origin: web.origin,
			token: web.token,
			pid: process.pid,
			version,
			root
		});
		service.refreshVideoMetadata();
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