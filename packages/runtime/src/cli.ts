#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { errorMessage } from './types.js';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root, dataRoot } from './paths.js';
import { Store } from './store.js';
import { DragonService, catalog } from './service.js';
import { Daemon } from './daemon.js';
import { createHttp } from './http.js';
import { ensureRuntime, findRuntime, requestRuntime, stopRuntime } from './runtime.js';
import { installPlugin } from './install.js';
import { migrateData } from './migrate.js';
import { ensureFfmpeg } from './ffmpeg.js';
import {
  findCodex,
  connectCodex,
  isolatedConfig,
  accountResponse,
  configResponse,
  threadResponse,
} from './codex.js';
const command = process.argv[2] ?? 'help';
async function main() {
  if (command === 'mcp') {
    await import('./mcp.js');
    return;
  }
  if (command === 'start') {
    await ensureFfmpeg(dataRoot, { progress: (message) => console.error(message) });
    const running = await ensureRuntime();
    console.log(
      JSON.stringify({
        running: true,
        version: running.version,
        message: '本地后台已启动。请在 Codex 打开 B 站小白龙管理页。',
      }),
    );
    return;
  }
  if (command === 'stop') {
    console.log(JSON.stringify(await stopRuntime()));
    return;
  }
  if (command === 'status') {
    const running = await findRuntime();
    console.log(JSON.stringify({ running: !!running, version: running?.version }));
    return;
  }
  if (command === 'pause') {
    const running = await findRuntime();
    if (running) await requestRuntime(running, 'pause');
    console.log(JSON.stringify({ paused: true }));
    return;
  }
  if (command === 'migrate-data') {
    if (!process.argv[3]) throw Error('请指定旧版数据目录');
    console.log(JSON.stringify(migrateData(path.resolve(process.argv[3]), dataRoot)));
    return;
  }
  if (command === 'serve') {
    await ensureFfmpeg(dataRoot, { progress: (message) => console.error(message) });
    const service = new DragonService(new Store(dataRoot));
    const daemon = new Daemon(service).start();
    let web;
    try {
      web = await createHttp(service, daemon, {
        port: Number(process.env.BILI_DRAGON_PORT ?? 18841),
      });
    } catch (e) {
      await daemon.stop();
      throw e;
    }
    console.log(
      'B 站小白龙已启动，仅本机可访问。\n' +
        web.url +
        '\n按 Ctrl+C 停止。链接包含本机会话令牌，请勿分享。',
    );
    let closing = false;
    const stop = async () => {
      if (closing) return;
      closing = true;
      await daemon.stop();
      await web.close();
    };
    process.on('SIGINT', () => void stop());
    process.on('SIGTERM', () => void stop());
    return;
  }
  if (command === 'doctor') {
    const codex = findCodex();
    console.log('Node: ' + process.version);
    console.log(
      'Codex: ' +
        execFileSync(codex, ['--version'], {
          encoding: 'utf8',
          windowsHide: true,
        }).trim(),
    );
    const ffmpegModule = (await import(
      pathToFileURL(path.join(root, 'vendor/upstream/tools/lib/ffmpeg.mjs')).href
    )) as { ffmpegInfo: () => { ok: boolean } };
    const ff = ffmpegModule.ffmpegInfo();
    console.log(
      'ffmpeg: ' + (ff.ok ? '可用' : '未找到（字幕、搜索仍可用；抽帧需要安装或设置 FFMPEG）'),
    );
    const rpc = await connectCodex(codex, root);
    try {
      const account = accountResponse.parse(
        await rpc.request('account/read', { refreshToken: false }),
      );
      console.log('Codex 登录: ' + (account.account?.type ?? '未登录'));
      if (process.argv.includes('--protocol')) {
        const config = isolatedConfig(),
          loaded = configResponse.parse(await rpc.request('config/read', { includeLayers: false }));
        for (const key of Object.keys(loaded.config?.mcp_servers ?? {}))
          config['mcp_servers.' + key + '.enabled'] = false;
        const started = threadResponse.parse(
          await rpc.request('thread/start', {
            ephemeral: true,
            cwd: root,
            sandbox: 'read-only',
            approvalPolicy: 'never',
            environments: [],
            config,
            dynamicTools: [
              {
                type: 'function',
                name: 'dragon_probe',
                description: '本地协议检查工具，不执行任何操作',
                inputSchema: {
                  type: 'object',
                  properties: {},
                  additionalProperties: false,
                },
              },
            ],
          }),
        );
        if (!started.thread?.id) throw Error('缺少会话 ID');
        console.log('动态工具 / 专属会话协议: 可用（未调用模型）');
      }
    } finally {
      rpc.close();
    }
    return;
  }
  if (command === 'install') {
    await ensureFfmpeg(dataRoot, { progress: (message) => console.error(message) });
    console.log(JSON.stringify(installPlugin()));
    return;
  }
  if (command === 'tools') {
    const service = new DragonService(new Store(dataRoot));
    console.log(
      JSON.stringify(
        catalog(service).map(({ call: _call, ...tool }) => tool),
        null,
        2,
      ),
    );
    return;
  }
  console.log(
    'Codex Bili Dragon\n\n  node dist/runtime/cli.js install   安装 Codex 插件（使用预构建插件包）\n  node dist/runtime/cli.js start     启动共享后台\n  node dist/runtime/cli.js status    查看后台状态\n  node dist/runtime/cli.js pause     暂停活动\n  node dist/runtime/cli.js stop      停止后台\n  node dist/runtime/cli.js serve     前台运行网页管理页\n  node dist/runtime/cli.js doctor    检查 Codex 登录与 ffmpeg\n  node dist/runtime/cli.js migrate-data <旧目录>  复制旧数据，保留原文件\n\n环境变量：BILI_DRAGON_DATA、BILI_DRAGON_CODEX、BILI_DRAGON_PORT',
  );
}
main().catch((e) => {
  console.error(errorMessage(e));
  process.exitCode = 1;
});
