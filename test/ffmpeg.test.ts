import { test, type TestContext } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { zipSync, strToU8 } from 'fflate';
import {
  ensureFfmpeg,
  selectFfmpegAsset,
  type FfmpegAsset,
} from '../packages/runtime/src/ffmpeg.js';

function fixture(
  t: TestContext,
  files: Record<string, Uint8Array> = {
    'fixture/bin/ffmpeg.exe': strToU8('fake executable'),
    'fixture/LICENSE.txt': strToU8('fixture license'),
  },
) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-ffmpeg-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  const archive = Buffer.from(zipSync(files));
  const asset: FfmpegAsset = {
    version: 'test-1',
    url: 'https://example.test/fixture.zip',
    sha256: createHash('sha256').update(archive).digest('hex'),
    root: 'fixture',
    format: 'zip',
    source: 'https://example.test/source',
    minimum: 'test',
  };
  return { dir, archive, asset };
}

test('各支持平台选择固定下载与摘要，不支持的平台明确失败', () => {
  for (const platform of ['win32', 'linux', 'darwin'])
    for (const arch of ['x64', 'arm64']) {
      const asset = selectFfmpegAsset(platform, arch);
      assert.match(asset.url, /^https:\/\/github\.com\//);
      assert.doesNotMatch(asset.url, /\/latest\//);
      assert.match(asset.sha256, /^[a-f0-9]{64}$/);
    }
  assert.throws(() => selectFfmpegAsset('linux', 'ia32'), /暂不支持/);
});

test('依赖下载校验、保留许可、验证后落位，再次安装无需网络', async (t) => {
  const { dir, archive, asset } = fixture(t);
  let downloads = 0;
  const options = {
    platform: 'win32',
    arch: 'x64',
    env: {},
    asset,
    download: async () => {
      downloads++;
      return archive;
    },
    verify: async (file: string) => assert.equal(fs.readFileSync(file, 'utf8'), 'fake executable'),
  };
  const executable = await ensureFfmpeg(dir, options);
  assert.ok(fs.existsSync(path.join(path.dirname(executable), '../LICENSE.txt')));
  assert.equal(await ensureFfmpeg(dir, options), executable);
  assert.equal(downloads, 1);
});

test('摘要不符或执行验证失败不能留下已安装依赖', async (t) => {
  const { dir, archive, asset } = fixture(t);
  let verified = false;
  await assert.rejects(
    ensureFfmpeg(dir, {
      platform: 'win32',
      arch: 'x64',
      env: {},
      asset,
      download: async () => Buffer.from('corrupted'),
      verify: async () => {
        verified = true;
      },
    }),
    /校验失败/,
  );
  assert.equal(verified, false);
  await assert.rejects(
    ensureFfmpeg(dir, {
      platform: 'win32',
      arch: 'x64',
      env: {},
      asset,
      download: async () => archive,
      verify: async () => {
        throw Error('cannot execute');
      },
    }),
    /cannot execute/,
  );
  assert.equal(fs.readdirSync(path.join(dir, 'dependencies/ffmpeg')).length, 0);
});

test('压缩包路径不能逃逸', async (t) => {
  const { dir, archive, asset } = fixture(t, { '../escape.exe': strToU8('bad') });
  await assert.rejects(
    ensureFfmpeg(dir, {
      platform: 'win32',
      arch: 'x64',
      env: {},
      asset,
      download: async () => archive,
      verify: async () => {},
    }),
    /无效路径/,
  );
  assert.equal(fs.existsSync(path.join(dir, 'escape.exe')), false);
});

test('新版本下载失败保留旧依赖，显式路径设置不触发下载', async (t) => {
  const { dir, archive, asset } = fixture(t);
  const options = {
    platform: 'win32',
    arch: 'x64',
    env: {},
    asset,
    download: async () => archive,
    verify: async () => {},
  };
  const old = await ensureFfmpeg(dir, options);
  await assert.rejects(
    ensureFfmpeg(dir, {
      ...options,
      asset: { ...asset, version: 'test-2' },
      download: async () => {
        throw Error('offline');
      },
    }),
    /offline/,
  );
  assert.equal(fs.readFileSync(old, 'utf8'), 'fake executable');
  assert.equal(
    await ensureFfmpeg(dir, {
      ...options,
      env: { FFMPEG: old },
      download: async () => {
        throw Error('must not download');
      },
    }),
    old,
  );
});
