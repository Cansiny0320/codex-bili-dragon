import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { unzipSync } from 'fflate';
import assets from './ffmpeg-assets.json';
import { dataRoot } from './paths.js';

export interface FfmpegAsset {
  version: string;
  url: string;
  sha256: string;
  root: string;
  format: string;
  source: string;
  minimum: string;
}
interface PrepareOptions {
  platform?: string;
  arch?: string;
  env?: NodeJS.ProcessEnv;
  asset?: FfmpegAsset;
  download?: (url: string) => Promise<Buffer>;
  verify?: (file: string) => Promise<void>;
  progress?: (message: string) => void;
}
const execute = promisify(execFile);
const pending = new Map<string, Promise<string>>();
export function selectFfmpegAsset(
  platform = process.platform as string,
  arch = process.arch as string,
): FfmpegAsset {
  const asset = (assets as Record<string, FfmpegAsset>)[platform + '-' + arch];
  if (!asset)
    throw Error(`暂不支持自动安装 FFmpeg：${platform}/${arch}，可通过 FFMPEG 指定可执行文件`);
  return asset;
}
function dependencyDirectory(dir: string, platform: string, arch: string, asset: FfmpegAsset) {
  return path.join(
    dir,
    'dependencies/ffmpeg',
    `${platform}-${arch}-${asset.version}-${asset.sha256.slice(0, 12)}`,
  );
}
function fileExists(file: string | undefined): file is string {
  if (!file) return false;
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}
export function findFfmpeg(dir = dataRoot, env = process.env): string | null {
  if (fileExists(env.FFMPEG)) return path.resolve(env.FFMPEG);
  const exe = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  try {
    const asset = selectFfmpegAsset();
    const cached = path.join(
      dependencyDirectory(dir, process.platform, process.arch, asset),
      'bin',
      exe,
    );
    if (fileExists(cached)) return cached;
  } catch {
    /* A custom/system installation can support other architectures. */
  }
  for (const directory of (env.PATH ?? '').split(path.delimiter)) {
    if (!directory) continue;
    const file = path.resolve(directory, exe);
    if (fileExists(file)) return file;
  }
  return null;
}
async function verifyExecutable(file: string) {
  const { stdout } = await execute(file, ['-hide_banner', '-version'], {
    windowsHide: true,
    timeout: 15000,
  });
  if (!stdout.startsWith('ffmpeg version ')) throw Error('FFmpeg 可执行文件验证失败');
}
async function downloadArchive(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(300000) });
  if (!response.ok || !response.body)
    throw Error(`FFmpeg 下载失败：HTTP ${response.status}，请重新运行安装命令`);
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.byteLength;
    if (size > 256 * 1024 * 1024) throw Error('FFmpeg 下载文件超出预期大小');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
function archiveRelative(name: string, root: string) {
  const normalized = name.replaceAll('\\', '/');
  if (
    normalized.startsWith('/') ||
    normalized.includes(':') ||
    normalized.split('/').includes('..') ||
    (normalized !== root && !normalized.startsWith(root + '/'))
  )
    throw Error('FFmpeg 压缩包包含无效路径');
  return normalized.slice(root.length).replace(/^\//, '');
}
function checkExtractedPaths(directory: string) {
  const base = fs.realpathSync(directory);
  const walk = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      const relative = path.relative(base, fs.realpathSync(file));
      if (relative.startsWith('..') || path.isAbsolute(relative))
        throw Error('FFmpeg 压缩包包含无效路径');
      if (entry.isDirectory()) walk(file);
    }
  };
  walk(directory);
}
export async function ensureFfmpeg(dir = dataRoot, options: PrepareOptions = {}): Promise<string> {
  const platform = options.platform ?? process.platform,
    arch = options.arch ?? process.arch;
  const env = options.env ?? process.env,
    verify = options.verify ?? verifyExecutable;
  if (env.FFMPEG) {
    if (!path.isAbsolute(env.FFMPEG) || !fileExists(env.FFMPEG))
      throw Error('FFMPEG 必须指向存在的可执行文件绝对路径');
    await verify(env.FFMPEG);
    return env.FFMPEG;
  }
  const asset = options.asset ?? selectFfmpegAsset(platform, arch);
  const destination = dependencyDirectory(path.resolve(dir), platform, arch, asset);
  const exe = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const executable = path.join(destination, 'bin', exe);
  if (fileExists(executable)) {
    await verify(executable);
    return executable;
  }
  if (!options.platform && !options.arch) {
    const existing = findFfmpeg(dir, env);
    if (existing) {
      try {
        await verify(existing);
        return existing;
      } catch {
        /* Install a working private copy. */
      }
    }
  }
  const active = pending.get(destination);
  if (active) return active;
  const prepare = async () => {
    const parent = path.dirname(destination);
    fs.mkdirSync(parent, { recursive: true, mode: 0o700 });
    const temporary = fs.mkdtempSync(path.join(parent, '.download-'));
    try {
      options.progress?.(`正在下载 FFmpeg ${asset.version}（${platform}/${arch}）…`);
      const archive = await (options.download ?? downloadArchive)(asset.url);
      if (createHash('sha256').update(archive).digest('hex') !== asset.sha256)
        throw Error('FFmpeg 下载文件校验失败，请重新运行安装命令');
      const unpacked = path.join(temporary, 'unpacked');
      fs.mkdirSync(unpacked);
      if (asset.format === 'zip') {
        for (const [name, bytes] of Object.entries(unzipSync(archive))) {
          const relative = archiveRelative(name, asset.root);
          if (!relative || name.endsWith('/')) continue;
          const output = path.join(unpacked, relative);
          fs.mkdirSync(path.dirname(output), { recursive: true });
          fs.writeFileSync(output, bytes);
        }
      } else {
        const downloaded = path.join(temporary, 'download.tar.xz');
        fs.writeFileSync(downloaded, archive);
        const { stdout } = await execute('tar', ['-tf', downloaded], {
          windowsHide: true,
          timeout: 30000,
          maxBuffer: 4 * 1024 * 1024,
        });
        for (const name of stdout.split(/\r?\n/).filter(Boolean))
          archiveRelative(name.replace(/\/$/, ''), asset.root);
        await execute('tar', ['-xf', downloaded, '--strip-components=1', '-C', unpacked], {
          windowsHide: true,
          timeout: 60000,
        });
        checkExtractedPaths(unpacked);
      }
      const candidate = path.join(unpacked, 'bin', exe);
      if (!fileExists(candidate)) throw Error('FFmpeg 下载包缺少可执行文件');
      if (platform !== 'win32') fs.chmodSync(candidate, 0o755);
      await verify(candidate);
      fs.writeFileSync(
        path.join(unpacked, 'dragon-dependency.json'),
        JSON.stringify({ ...asset, platform, arch }, null, 2) + '\n',
      );
      try {
        fs.renameSync(unpacked, destination);
      } catch (error) {
        if (!fileExists(executable)) throw error;
        await verify(executable);
      }
      options.progress?.('FFmpeg 已安装并验证。');
      return executable;
    } finally {
      const relative = path.relative(parent, temporary);
      if (relative.startsWith('.download-') && !relative.includes(path.sep))
        fs.rmSync(temporary, { recursive: true, force: true });
    }
  };
  const task = prepare().finally(() => pending.delete(destination));
  pending.set(destination, task);
  return task;
}
