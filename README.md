<h1 align="center">Codex Bili Dragon</h1>
<p align="center">B 站小白龙 · 让 Codex 按兴趣探索视频，把见闻写进日记。</p>
<p align="center">
  <a href="https://github.com/Cansiny0320/codex-bili-dragon/actions"><img src="https://github.com/Cansiny0320/codex-bili-dragon/actions/workflows/ci.yml/badge.svg" alt="Checks"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6" alt="Strict TypeScript">
</p>
<p align="center"><a href="docs/usage.md">使用说明</a> · <a href="https://github.com/Cansiny0320/codex-bili-dragon/issues">问题反馈</a></p>
<p align="center"><a href="README.md">简体中文</a> · <a href="README.en.md">English</a></p>

Codex Bili Dragon 是一个本机运行的 B 站 AI 助手。它通过官方 Codex 客户端探索视频、写下给你的信和内心记录，并在你设定的时间和权限内回应消息。

![管理页截图，内容为演示数据](docs/images/dashboard.png)

## 能帮你做什么？

- **按兴趣探索**：搜索视频，读取字幕、评论与简报；安装时会自动准备 FFmpeg，用于抽取画面。
- **记录见闻**：把给你的信和内心记录分开保存，也可以回看之前读过的视频素材。
- **安排活动时间**：设置时区和作息，允许跨午夜活动，也可以随时手动探索一次。
- **控制每次互动**：主人消息按权限回复，陌生人回复先进入审核。私信权限默认开启，评论、弹幕和分享默认关闭；单号不会给自己发信或主动分享。发送结果不明确时保留记录，供你核查。

## 快速开始

在 Codex 中提供预构建的 `codex-bili-dragon-*-plugin.zip`，并说：

> 帮我安装并启动这个 B 站小白龙插件，打开管理页。

安装助手会校验安装包、注册原生插件并启动本地后台。安装包自带 JavaScript 运行依赖，首次安装会自动下载并校验当前平台的 FFmpeg，保存在插件专用数据目录；无需 npm 包、pnpm 或源码构建。需要可用的 **Node.js 24.11+（24.x）、22.18+（22.x）或 26+**，可复用 Codex 提供的 Node。完整流程见 [安装指南](INSTALL.md)。

发布到 GitHub Releases 后，也可以直接在 Codex 中说：

> 帮我安装并启动 B 站小白龙：https://github.com/Cansiny0320/codex-bili-dragon ，按 INSTALL.md 完成安装并打开管理页。

在管理页的「账号连接」用 B 站 App 扫码，手机确认后自动保存连接并显示头像、昵称和 UID；手动 Cookie 位于高级选项。单号模式自动使用登录账号作为主人；双号模式由小白龙使用小号，另填主人 UID。再设置兴趣、活动时间和权限。登录或更换账号后活动保持暂停，需主动开启。

日常可说「打开小白龙管理页」「暂停小白龙」或「停止小白龙后台」。管理页同时注册 Codex 全局侧边栏与对话右侧入口，支持情况取决于客户端版本。关闭管理页或安装终端不会停止后台；电脑休眠、关机或 Codex 额度不可用时无法继续活动。

## 数据与权限

配置、凭据、日记和任务保存在用户应用数据目录，与插件安装缓存分开；升级和卸载保留数据。具体路径见 [使用说明](docs/usage.md#数据目录)，可用 `BILI_DRAGON_DATA` 指定其他绝对路径。Cookie 目前是本地文件存储，未使用系统钥匙串。管理接口不回传凭据，Codex 登录由官方客户端管理。

两份日记都只保存在本机。「批准发送」会执行真实 B 站操作；发送前会检查对应功能是否开启，以及是否已经发送过。私信仅发给主人，并要求互关。详细边界见 [使用说明](docs/usage.md)。

## 开发与文档

项目使用 TypeScript，管理页基于 React 和 TanStack Start。

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm check
pnpm test
pnpm test:ui
pnpm package
pnpm test:package
```

浏览器检查使用 headless Chromium；Windows 自动查找 Edge，其他环境可运行 `pnpm exec playwright install chromium`。测试不发送真实消息、不调用模型，也不操作桌面鼠标键盘。

[使用与故障处理](docs/usage.md) · [验证范围](docs/verification.md) · [Skill](skills/bili-dragon/SKILL.md)

## 赞助

如果这个项目对你有帮助，欢迎通过微信或支付宝支持后续开发。感谢你的支持！

![微信与支付宝赞助二维码](.github/sponsorship/sponsorship-cats.png)

## 许可证与致谢

项目代码使用 [MIT License](LICENSE)。插件图标采用 [ZipZipPipe 的 GPT 龙娘形象](https://www.pixiv.net/artworks/148186519)，属于非官方同人；图片须署名、不可商用，不适用代码的 MIT 许可，详见 [图标来源](assets/NOTICE.md)。

灵感来源于 [Alterssss/dsh-bili-whale](https://github.com/Alterssss/dsh-bili-whale)。

## 相关项目

- [bili-agent-kit](https://github.com/Cansiny0320/bili-agent-kit)：B 站 SDK、CLI 和 MCP 工具，适合接入其他 AI 助手或自己的程序。
- [dsh-bili-whale-dashboard](https://github.com/Cansiny0320/dsh-bili-whale-dashboard)：给 DSH 原版养鱼插件配套的管理后台，与本项目分别运行。
