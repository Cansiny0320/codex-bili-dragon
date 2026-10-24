import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const options = {
  cwd: root,
  encoding: 'utf8' as const,
  windowsHide: true,
  shell: process.platform === 'win32',
};
const preview = JSON.parse(execFileSync(npm, ['pack', '--dry-run', '--json'], options)) as {
  files: { path: string }[];
}[];
for (const { path: file } of preview[0].files)
  if (
    /^(data|work|node_modules)\/|credentials\.json|auth\.json|cookies.*\.txt|\.env(?:\.|$)/i.test(
      file,
    )
  )
    throw Error('安装包包含私密文件：' + file);
if (
  !preview[0].files.some((f) => f.path === 'dist/runtime/mcp.js') ||
  !preview[0].files.some((f) => f.path === 'dist/dashboard/server/server.js')
)
  throw Error('缺少构建产物，请先运行 pnpm build');
const output = path.join(root, 'dist');
fs.mkdirSync(output, { recursive: true });
const result = JSON.parse(
  execFileSync(npm, ['pack', '--json', '--pack-destination', 'dist'], options),
) as { filename: string }[];
console.log(path.join(output, result[0].filename));
