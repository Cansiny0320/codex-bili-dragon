import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { zipSync } from 'fflate';

interface PackageInfo {
  name: string;
  version: string;
  license?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}
function dependencyDir(name: string, issuer: string): string {
  let directory = issuer;
  while (true) {
    const candidate = path.join(directory, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) return fs.realpathSync(candidate);
    const parent = path.dirname(directory);
    if (parent === directory) throw Error('缺少运行依赖：' + name);
    directory = parent;
  }
}
function filesIn(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw Error('发布包不能包含符号链接：' + file);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}
export function bundlePlugin(source: string) {
  const project = path.resolve(source);
  const output = path.join(project, 'dist/plugin');
  if (path.relative(project, output).replaceAll('\\', '/') !== 'dist/plugin')
    throw Error('无效打包目录');
  if (
    fs.existsSync(output) &&
    !fs.realpathSync(output).startsWith(fs.realpathSync(project) + path.sep)
  )
    throw Error('打包目录不在项目内');
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });
  const pkg = JSON.parse(
    fs.readFileSync(path.join(project, 'package.json'), 'utf8'),
  ) as PackageInfo;
  const includes = [
    'dist/runtime',
    'dist/dashboard',
    'dist/mcp-app',
    'vendor/upstream',
    'assets',
    'skills',
    'plugin.json',
    'mcp.json',
    '.codex-plugin',
    'LICENSE',
    'UPSTREAM.md',
    'INSTALL.md',
  ];
  for (const relative of includes) {
    const from = path.join(project, relative);
    if (!fs.existsSync(from)) throw Error('缺少发布文件，请先构建：' + relative);
    fs.cpSync(from, path.join(output, relative), {
      recursive: true,
      filter: (file) => !file.endsWith('.map'),
    });
  }
  fs.writeFileSync(
    path.join(output, 'package.json'),
    JSON.stringify(
      { name: pkg.name, version: pkg.version, type: 'module', private: true, license: 'MIT' },
      null,
      2,
    ) + '\n',
  );
  // Runtime and UI builds bundle their imports. Retain upstream license texts without shipping a node_modules tree.
  const visited = new Set<string>(),
    notices: string[] = [];
  const collectNotices = (directory: string) => {
    const from = fs.realpathSync(directory);
    if (visited.has(from)) return;
    visited.add(from);
    const info = JSON.parse(
      fs.readFileSync(path.join(from, 'package.json'), 'utf8'),
    ) as PackageInfo;
    const licenses = fs
      .readdirSync(from, { withFileTypes: true })
      .filter(
        (entry) => entry.isFile() && /^(license|licence|copying|notice)(?:\.|$)/i.test(entry.name),
      );
    if (!info.name.startsWith('@bili-dragon/') && info.name !== pkg.name)
      notices.push(
        info.name +
          '@' +
          info.version +
          ' — ' +
          (info.license ?? 'See package license') +
          '\n' +
          licenses.map((file) => fs.readFileSync(path.join(from, file.name), 'utf8')).join('\n'),
      );
    for (const dependency of Object.keys(info.dependencies ?? {}))
      collectNotices(dependencyDir(dependency, from));
    for (const peer of Object.keys(info.peerDependencies ?? {})) {
      let peerDirectory: string;
      try {
        peerDirectory = dependencyDir(peer, from);
      } catch {
        continue;
      }
      collectNotices(peerDirectory);
    }
  };
  collectNotices(project);
  collectNotices(path.join(project, 'apps/dashboard'));
  fs.writeFileSync(
    path.join(output, 'THIRD_PARTY_NOTICES.txt'),
    notices.join('\n\n' + '='.repeat(72) + '\n\n'),
  );
  const files: Record<string, string> = {};
  for (const file of filesIn(output).sort()) {
    const relative = path.relative(output, file).replaceAll('\\', '/');
    if (/^(?:data|work)\/|(?:^|\/)(?:credentials\.json|auth\.json|\.env(?:\.|$))/.test(relative))
      throw Error('安装包包含私密文件：' + relative);
    files[relative] = createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  }
  fs.writeFileSync(
    path.join(output, 'bundle.json'),
    JSON.stringify({ version: pkg.version, files }, null, 2) + '\n',
  );
  const entries = Object.fromEntries(
    filesIn(output).map((file) => [
      path.relative(output, file).replaceAll('\\', '/'),
      new Uint8Array(fs.readFileSync(file)),
    ]),
  );
  const archive = path.join(project, 'dist', pkg.name + '-' + pkg.version + '-plugin.zip');
  fs.writeFileSync(archive, zipSync(entries, { level: 6 }));
  const sha256 = createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
  fs.writeFileSync(archive + '.sha256', sha256 + '  ' + path.basename(archive) + '\n');
  return { directory: output, archive, sha256, files: Object.keys(entries).length };
}
