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
    const codex = findCodex();
    execFileSync(
      codex,
      [
        'mcp',
        'add',
        'codex-bili-dragon',
        '--env',
        'BILI_DRAGON_DATA=' + dataRoot,
        '--',
        process.execPath,
        path.join(root, 'dist/runtime/mcp.js'),
      ],
      { stdio: 'inherit', windowsHide: true },
    );
    console.log('MCP 已注册。重启或刷新 Codex 后可使用 dragon_* 工具；自主后台仍需 pnpm start。');
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
    'Codex Bili Dragon\n\n  pnpm start                       启动本地后台和管理页\n  pnpm doctor                  检查 Codex 登录与 ffmpeg\n  pnpm doctor -- --protocol     检查动态工具协议（不调用模型）\n  node dist/runtime/cli.js install      注册本地 MCP（修改 Codex 用户配置）\n  pnpm mcp                     启动 MCP stdio\n\n环境变量：BILI_DRAGON_DATA、BILI_DRAGON_CODEX、BILI_DRAGON_PORT',
  );
}
main().catch((e) => {
  console.error(errorMessage(e));
  process.exitCode = 1;
});
