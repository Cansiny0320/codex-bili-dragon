import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export function prepareMarketplace(sourceDirectory: string, outputDirectory: string) {
  const source = fs.realpathSync(sourceDirectory);
  const output = path.resolve(outputDirectory);
  const pluginDirectory = path.join(output, 'plugins/codex-bili-dragon');
  if (
    output === source ||
    output.startsWith(source + path.sep) ||
    source.startsWith(output + path.sep)
  )
    throw Error('市场输出目录必须与安装包目录分开');
  const bundle = JSON.parse(fs.readFileSync(path.join(source, 'bundle.json'), 'utf8')) as {
    version: string;
    files: Record<string, string>;
  };
  const plugin = JSON.parse(fs.readFileSync(path.join(source, 'plugin.json'), 'utf8')) as {
    name: string;
    version: string;
  };
  if (plugin.name !== 'codex-bili-dragon' || plugin.version !== bundle.version)
    throw Error('插件身份或版本不一致');
  for (const required of [
    'plugin.json',
    'mcp.json',
    'dist/runtime/mcp.js',
    'dist/mcp-app/index.html',
  ])
    if (!bundle.files[required]) throw Error('缺少预构建文件：' + required);
  for (const [relative, expected] of Object.entries(bundle.files)) {
    const file = path.resolve(source, relative);
    if (!file.startsWith(source + path.sep) || !fs.realpathSync(file).startsWith(source + path.sep))
      throw Error('安装包路径越界：' + relative);
    if (
      /^(?:data|work|node_modules)\/|(?:^|\/)(?:credentials\.json|auth\.json|\.env(?:\.|$))/.test(
        relative,
      )
    )
      throw Error('安装包包含私密或开发文件：' + relative);
    if (createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== expected)
      throw Error('安装包校验失败：' + relative);
  }
  // Only replace this plugin, leaving Git history and other marketplace files intact.
  if (fs.existsSync(pluginDirectory) && fs.realpathSync(pluginDirectory) !== pluginDirectory)
    throw Error('市场插件目录不能是符号链接');
  fs.rmSync(pluginDirectory, { recursive: true, force: true });
  for (const relative of [...Object.keys(bundle.files), 'bundle.json']) {
    const target = path.join(pluginDirectory, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(source, relative), target);
  }
  const catalog = {
    name: 'bili-dragon',
    interface: { displayName: 'B 站小白龙' },
    plugins: [
      {
        name: plugin.name,
        source: { source: 'local', path: './plugins/codex-bili-dragon' },
        policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
        category: 'Productivity',
      },
    ],
  };
  const catalogFile = path.join(output, '.agents/plugins/marketplace.json');
  fs.mkdirSync(path.dirname(catalogFile), { recursive: true });
  fs.writeFileSync(catalogFile, JSON.stringify(catalog, null, 2) + '\n');
  return {
    directory: output,
    version: plugin.version,
    files: Object.keys(bundle.files).length + 1,
  };
}
