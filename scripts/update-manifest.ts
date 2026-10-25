import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Bump when existing persisted data can no longer be read safely by the prior runtime.
const dataContract = 1;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) =>
  fs.readFileSync(path.join(root, file), 'utf8').replaceAll('\r\n', '\n');
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const source = (name: string) => read('packages/runtime/src/' + name + '.ts');
const service = source('service');
const skillFiles = (directory: string): string[] =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? skillFiles(path.join(directory, entry.name))
        : [path.join(directory, entry.name)],
    );
const metadata = ['plugin.json', '.codex-plugin/plugin.json']
  .map((file) => {
    const { version: _version, ...rest } = JSON.parse(read(file));
    return JSON.stringify(rest);
  })
  .join('\n');
const pluginContract =
  metadata +
  read('mcp.json') +
  hash(fs.readFileSync(path.join(root, 'assets/icon.png')).toString('base64')) +
  skillFiles(path.join(root, 'skills'))
    .sort()
    .map(
      (file) =>
        path.relative(root, file).replaceAll('\\', '/') +
        fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n'),
    )
    .join('\n');
const bridgeFiles = [
  'mcp',
  'mcp-server',
  'runtime',
  'paths',
  'update-package',
  'update-state',
  'store',
  'types',
  'upstream',
  'login',
  'activity',
  'materials',
  'config',
  'policy',
];
const manifest = {
  schema: 1,
  version: (JSON.parse(read('package.json')) as { version: string }).version,
  bridge: hash(
    bridgeFiles.map((name) => name + '\n' + source(name)).join('\n') +
      read('pnpm-lock.yaml') +
      pluginContract,
  ),
  contract: hash(
    source('api') +
      service.slice(service.indexOf('const bvid'), service.indexOf('export class DragonService')) +
      service.slice(service.indexOf('export type CatalogService')),
  ),
  data: dataContract,
  protocol: 1,
};
fs.mkdirSync(path.join(root, 'dist/runtime'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'dist/runtime/update.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
