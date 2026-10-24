<h1 align="center">Codex Bili Dragon</h1>
<p align="center">B 站小白龙 · 让 Codex 按兴趣探索视频，把见闻写进日记。</p>
<p align="center">
  <a href="https://github.com/Cansiny0320/codex-bili-dragon/actions"><img src="https://github.com/Cansiny0320/codex-bili-dragon/actions/workflows/ci.yml/badge.svg" alt="Checks"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6" alt="Strict TypeScript">
</p>
<p align="center"><a href="docs/usage.md">使用说明</a> · <a href="https://github.com/Cansiny0320/codex-bili-dragon/issues">问题反馈</a></p>
<p align="center"><a href="README.md">简体中文</a> · <a href="README.en.md">English</a></p>

Codex Bili Dragon 是一个本机运行的 B 站 AI 助手。它通过官方 Codex 客户端探索视频、写下给你的信和内心记录，并在你设定的时间和权限内回应消息。直接基于 [Alterssss/dsh-bili-whale](https://github.com/Alterssss/dsh-bili-whale) v0.4.6 移植，不需要运行 DSH。

![管理页截图，内容为演示数据](docs/images/dashboard.png)

## 能帮你做什么？

- **按兴趣探索**：搜索视频，读取字幕、评论与简报；安装 ffmpeg 后可以抽取画面。
- **记录见闻**：把给你的信和内心记录分开保存，也可以回看之前读过的视频素材。
- **安排活动时间**：设置时区和作息，允许跨午夜活动，也可以随时手动探索一次。
- **控制每次互动**：主人消息按权限回复，陌生人回复先进入审核。评论、私信、弹幕和分享默认关闭，发送结果不明确时保留记录，供你核查。

## 快速开始

需要 **Node.js 24.11+（24.x）或 22.18+（22.x）**、**pnpm 12.15.0**，以及已登录的官方 Codex 客户端。Node.js 26+ 也符合工具链要求。

```sh
git clone https://github.com/Cansiny0320/codex-bili-dragon.git
cd codex-bili-dragon
pnpm install --frozen-lockfile
pnpm build
pnpm doctor:protocol
pnpm start
```

打开终端显示的本机链接。在「账号连接」保存 B 站 Cookie 并检查会话，填写主人 UID；在「个性与兴趣」「活动时间」调整偏好，点击「探索一次」开始。凭据只填在本机管理页，不要发到 AI 聊天中。

后台需要持续运行。关闭终端、电脑休眠或 Codex 额度不可用时，助手不会继续活动。app-server 动态工具仍是实验性接口，兼容性以 `pnpm doctor:protocol` 的结果为准。

## 数据与权限

配置、凭据、日记和任务保存在本机 `data/`，不进入 Git 或发布包；可用 `BILI_DRAGON_DATA` 指定其他绝对路径。Cookie 目前是本地文件存储，未使用系统钥匙串。管理接口不回传凭据，Codex 登录由官方客户端管理。

两份日记都只保存在本机。「批准发送」会执行真实 B 站操作；发送前会检查对应功能是否开启，以及是否已经发送过。私信仅发给主人，并要求互关。详细边界见 [使用说明](docs/usage.md)。

## 开发与文档

项目使用 TypeScript，管理页基于 React 和 TanStack Start。上游固定版本的 JavaScript 工具保留来源和许可证。

```sh
pnpm check
pnpm test
pnpm test:ui
pnpm package
```

浏览器检查使用 headless Chromium；Windows 自动查找 Edge，其他环境可运行 `pnpm exec playwright install chromium`。测试不发送真实消息、不调用模型，也不操作桌面鼠标键盘。

[使用与故障处理](docs/usage.md) · [验证范围](docs/verification.md) · [上游来源](UPSTREAM.md) · [Skill](skills/bili-dragon/SKILL.md)

## 赞助

如果这个项目对你有帮助，欢迎通过微信或支付宝支持后续开发。感谢你的支持！

![微信与支付宝赞助二维码](.github/sponsorship/sponsorship-cats.png)

## 许可证与致谢

本项目使用 [MIT License](LICENSE)，保留上游作者 ALTERSSSS 的版权声明。「小白龙」来自社区 GPT 白龙二创意象，不是 OpenAI 官方角色，未使用现成角色图片。

## 相关项目

- [bili-agent-kit](https://github.com/Cansiny0320/bili-agent-kit)：B 站 SDK、CLI 和 MCP 工具，适合接入其他 AI 助手或自己的程序。
- [dsh-bili-whale-dashboard](https://github.com/Cansiny0320/dsh-bili-whale-dashboard)：给 DSH 原版养鱼插件配套的管理后台，与本项目分别运行。
