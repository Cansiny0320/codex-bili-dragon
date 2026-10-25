import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { root, appRoot } from './paths.js';
import { atomic } from './store.js';
import { findCodex } from './codex.js';

const pluginName = 'codex-bili-dragon';
const marketplaceName = 'bili-dragon';
export interface InstallOptions {
  source?: string;
  destination?: string;
  node?: string;
  codex?: string;
  run?: (command: string, args: string[]) => string;
}
export function installPlugin(options: InstallOptions = {}) {
  const source = path.resolve(options.source ?? root);
  const destination = path.resolve(options.destination ?? path.join(appRoot, 'plugin-source'));
  if (!path.isAbsolute(options.node ?? process.execPath)) throw Error('Node 路径必须为绝对路径');
  const node = options.node ?? process.execPath;
  const codex = options.codex ?? findCodex();
  const run =
    options.run ??
    ((command, args) =>
      execFileSync(command, args, {
        encoding: 'utf8',
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      }));
  const manifest = JSON.parse(fs.readFileSync(path.join(source, 'plugin.json'), 'utf8')) as {
    name: string;
    version: string;
  };
  if (manifest.name !== pluginName) throw Error('安装包身份不匹配');
  const bundle = JSON.parse(fs.readFileSync(path.join(source, 'bundle.json'), 'utf8')) as {
    files: Record<string, string>;
  };
  for (const [relative, hash] of Object.entries(bundle.files)) {
    const file = path.resolve(source, relative);
    if (path.relative(source, file).startsWith('..') || path.isAbsolute(relative))
      throw Error('安装包包含无效路径');
    if (createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== hash)
      throw Error('安装包校验失败：' + relative);
  }
  for (const file of [
    'dist/runtime/mcp.js',
    'dist/runtime/worker.js',
    'dist/mcp-app/index.html',
    'assets/icon.png',
  ])
    if (!Object.hasOwn(bundle.files, file)) throw Error('安装包不完整：' + file);
  if (!/Install a plugin|plugin add/.test(run(codex, ['plugin', 'add', '--help'])))
    throw Error('当前 Codex 尚不支持插件安装命令，请更新桌面应用。');
  const digest = createHash('sha256')
    .update(JSON.stringify(bundle.files))
    .digest('hex')
    .slice(0, 12);
  const copy = path.join(destination, 'releases', manifest.version + '-' + digest);
  if (!fs.existsSync(copy)) {
    fs.mkdirSync(copy, { recursive: true, mode: 0o700 });
    for (const relative of [...Object.keys(bundle.files), 'bundle.json']) {
      const target = path.join(copy, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(source, relative), target);
    }
  }
  const mcp = JSON.parse(fs.readFileSync(path.join(copy, 'mcp.json'), 'utf8')) as {
    mcpServers: Record<string, { command: string; env?: Record<string, string> }>;
  };
  // Portable MCP commands must be executable tokens; absolute paths are rejected.
  // Pin the chosen runtime for this server without changing the user's global PATH.
  mcp.mcpServers[pluginName].command = path.basename(node);
  mcp.mcpServers[pluginName].env = {
    ...mcp.mcpServers[pluginName].env,
    PATH: path.dirname(node) + path.delimiter + (process.env.PATH ?? ''),
  };
  atomic(path.join(copy, 'mcp.json'), mcp);
  const marketplaceFile = path.join(destination, '.agents/plugins/marketplace.json');
  type Entry = { name: string; [key: string]: unknown };
  type Marketplace = { name: string; interface: { displayName: string }; plugins: Entry[] };
  const marketplace: Marketplace = fs.existsSync(marketplaceFile)
    ? (JSON.parse(fs.readFileSync(marketplaceFile, 'utf8')) as Marketplace)
    : { name: marketplaceName, interface: { displayName: 'B 站小白龙' }, plugins: [] };
  if (marketplace.name !== marketplaceName) throw Error('目标插件源属于其他项目，未覆盖');
  const entry: Entry = {
    name: pluginName,
    source: {
      source: 'local',
      path: './' + path.relative(destination, copy).replaceAll('\\', '/'),
    },
    policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
    category: 'Productivity',
  };
  marketplace.plugins = [...marketplace.plugins.filter((item) => item.name !== pluginName), entry];
  atomic(marketplaceFile, marketplace);
  const registered: unknown = JSON.parse(
    run(codex, ['plugin', 'marketplace', 'add', destination, '--json']),
  );
  const installed = JSON.parse(
    run(codex, ['plugin', 'add', pluginName + '@' + marketplaceName, '--json']),
  ) as { installedPath?: string; pluginId?: string };
  if (!installed.installedPath) throw Error('Codex 未返回已安装路径，请检查插件安装状态');
  if (!fs.existsSync(path.join(installed.installedPath, 'dist/mcp-app/index.html')))
    throw Error('Codex 安装副本缺少管理页资源');
  return {
    ...installed,
    registered,
    source: copy,
    version: manifest.version,
    dashboardUrl: 'codex://plugins/' + pluginName + '@' + marketplaceName + '/app/dragon_sidebar',
  };
}
