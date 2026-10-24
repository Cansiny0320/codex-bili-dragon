import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { root } from "../src/paths.mjs";
if (!process.env.npm_execpath) throw Error("请使用 npm run package");
const dir = path.join(root, "dist");
fs.mkdirSync(dir, { recursive: true });
const out = execFileSync(
  process.execPath,
  [
    process.env.npm_execpath,
    "pack",
    "--ignore-scripts",
    "--json",
    "--pack-destination",
    dir,
  ],
  { cwd: root, encoding: "utf8", windowsHide: true },
);
const [pack] = JSON.parse(out);
for (const file of pack.files) {
  if (
    /(^|\/)(data|node_modules|\.git|work)(\/|$)|credentials\.json|auth\.json|\.env$|config\.local/.test(
      file.path,
    )
  )
    throw Error("归档包含不应发布的文件：" + file.path);
}
console.log(path.join(dir, pack.filename));
console.log(
  `${pack.files.length} 个文件，${pack.size} bytes；发布清单检查通过。`,
);
