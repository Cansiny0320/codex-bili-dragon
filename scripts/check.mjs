import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { root } from "../src/paths.mjs";
const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
    );
const source = [
  ...["src", "bin", "test", "scripts", "vendor/upstream/tools", "web"].flatMap(
    (d) => walk(path.join(root, d)),
  ),
  path.join(root, "server.mjs"),
];
for (const file of source.filter((x) => /\.(mjs|js)$/.test(x)))
  execFileSync(process.execPath, ["--check", file], {
    stdio: "pipe",
    windowsHide: true,
  });
const plugin = JSON.parse(fs.readFileSync(path.join(root, "plugin.json"))),
  overlay = JSON.parse(
    fs.readFileSync(path.join(root, ".codex-plugin/plugin.json")),
  ),
  mcp = JSON.parse(fs.readFileSync(path.join(root, "mcp.json")));
assert.equal(plugin.name, "codex-bili-dragon");
assert.equal(overlay.name, plugin.name);
assert.equal(overlay.version, plugin.version);
assert.ok(
  plugin.extensions["com.openai"].interface.shortDescription.length <= 30,
);
assert.equal(
  mcp.mcpServers["codex-bili-dragon"].args[0],
  "${PLUGIN_ROOT}/server.mjs",
);
for (const file of source.filter(
  (x) =>
    x.endsWith(".mjs") && x.includes(path.join("vendor", "upstream", "tools")),
)) {
  const text = fs.readFileSync(file, "utf8");
  assert.ok(
    !/process\.env\.(HOME|USERPROFILE|DSH_HOME|BILI_WHALE_CONFIG)|\bos\d?\.homedir\(/.test(
      text,
    ),
    "未隔离的上游路径：" + path.relative(root, file),
  );
}
console.log("语法、插件清单、入口和上游数据路径检查通过。");
