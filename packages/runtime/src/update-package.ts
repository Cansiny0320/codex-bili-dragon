import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { unzipSync } from 'fflate';
import { z } from 'zod';

const sha = z.string().regex(/^[a-f0-9]{64}$/);
const stable = z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
const manifestSchema = z
  .object({
    schema: z.number().int().positive(),
    version: stable,
    bridge: sha,
    contract: sha,
    data: z.number().int().positive(),
    protocol: z.number().int().positive(),
  })
  .strict();
export type UpdateManifest = z.infer<typeof manifestSchema>;
export const hash = (value: Uint8Array | string) =>
  createHash('sha256').update(value).digest('hex');
export function readManifest(directory: string): UpdateManifest | null {
  try {
    return manifestSchema.parse(
      JSON.parse(fs.readFileSync(path.join(directory, 'dist/runtime/update.json'), 'utf8')),
    );
  } catch {
    return null;
  }
}
export function compatible(a: UpdateManifest | null, b: UpdateManifest | null) {
  return (
    !!a &&
    !!b &&
    a.schema === 1 &&
    a.protocol === 1 &&
    a.schema === b.schema &&
    a.bridge === b.bridge &&
    a.contract === b.contract &&
    a.data === b.data &&
    a.protocol === b.protocol
  );
}
export function newer(candidate: string, current: string) {
  if (!stable.safeParse(candidate).success || !stable.safeParse(current).success) return false;
  const a = candidate.split('.').map(Number),
    b = current.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}
function safeName(name: string) {
  if (
    !name ||
    name.includes('\\') ||
    name.includes(':') ||
    name.startsWith('/') ||
    name
      .split('/')
      .some(
        (part) =>
          !part ||
          part === '.' ||
          part === '..' ||
          part.split('').some((char) => char.charCodeAt(0) < 32) ||
          /[. ]$|[<>"|?*]/.test(part) ||
          /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part),
      )
  )
    throw Error('更新包包含无效路径');
}
const bundleSchema = z.object({ version: stable, files: z.record(z.string(), sha) }).strict();
const required = [
  'plugin.json',
  '.codex-plugin/plugin.json',
  'package.json',
  'dist/runtime/update.json',
  'dist/runtime/worker.js',
  'dist/runtime/update-runner.js',
  'dist/mcp-app/index.html',
];
function verifyContents(read: (name: string) => Uint8Array, names: string[], version: string) {
  const unique = new Set<string>();
  for (const name of names) {
    safeName(name);
    if (unique.has(name.toLowerCase())) throw Error('更新包路径重复');
    unique.add(name.toLowerCase());
  }
  const json = (name: string): unknown => JSON.parse(Buffer.from(read(name)).toString('utf8'));
  const bundle = bundleSchema.parse(json('bundle.json'));
  if (bundle.version !== version) throw Error('更新包版本不匹配');
  if (
    names.length !== Object.keys(bundle.files).length + 1 ||
    names.some((name) => name !== 'bundle.json' && !Object.hasOwn(bundle.files, name))
  )
    throw Error('更新包文件清单不匹配');
  for (const name of required)
    if (!Object.hasOwn(bundle.files, name)) throw Error('更新包缺少必要文件');
  for (const [name, digest] of Object.entries(bundle.files)) {
    safeName(name);
    if (hash(read(name)) !== digest) throw Error('更新包文件校验失败');
  }
  for (const name of ['plugin.json', '.codex-plugin/plugin.json', 'package.json']) {
    const info = z
      .object({ name: z.literal('codex-bili-dragon'), version: stable })
      .parse(json(name));
    if (info.version !== version) throw Error('更新包身份或版本不匹配');
  }
  const manifest = manifestSchema.parse(json('dist/runtime/update.json'));
  if (manifest.version !== version) throw Error('兼容清单版本不匹配');
  return manifest;
}
export function verifyPackage(directory: string, version: string) {
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      if (entry.isSymbolicLink()) throw Error('更新包路径不能是链接');
      const file = path.join(dir, entry.name);
      return entry.isDirectory()
        ? walk(file)
        : [path.relative(directory, file).replaceAll('\\', '/')];
    });
  return verifyContents(
    (name) => fs.readFileSync(path.join(directory, name)),
    walk(directory),
    version,
  );
}
export function stageUpdate(dir: string, zip: Uint8Array, digest: string, version: string) {
  if (!sha.safeParse(digest).success || hash(zip) !== digest)
    throw Error('更新包 SHA-256 校验失败');
  stable.parse(version);
  let expanded = 0,
    count = 0;
  const names = new Set<string>();
  const entries = unzipSync(zip, {
    filter: (entry) => {
      safeName(entry.name);
      if (names.has(entry.name.toLowerCase())) throw Error('更新包路径重复');
      names.add(entry.name.toLowerCase());
      expanded += entry.originalSize;
      if (++count > 10000 || entry.originalSize > 64 * 1024 * 1024 || expanded > 256 * 1024 * 1024)
        throw Error('更新包超出大小限制');
      return true;
    },
  });
  verifyContents(
    (name) => {
      if (!entries[name]) throw Error('更新包文件缺失');
      return entries[name];
    },
    Object.keys(entries),
    version,
  );
  const versions = path.join(dir, 'updates/versions');
  fs.mkdirSync(versions, { recursive: true, mode: 0o700 });
  const target = path.join(versions, version + '-' + digest);
  if (fs.existsSync(target)) {
    verifyPackage(target, version);
    return target;
  }
  const staging = path.join(versions, '.staging-' + randomUUID());
  fs.mkdirSync(staging);
  try {
    for (const [name, bytes] of Object.entries(entries)) {
      const file = path.join(staging, name);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, bytes, { mode: 0o600, flag: 'wx' });
    }
    fs.renameSync(staging, target);
    return target;
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
}
