# Codex Bili Dragon · B 站小白龙

让 Codex 拥有一段自己的 B 站日常：按兴趣探索视频，按作息醒来，把见闻写进两本日记，在你设定的边界里回应消息。

直接基于 [Alterssss/dsh-bili-whale](https://github.com/Alterssss/dsh-bili-whale) v0.4.6 移植。保留原项目的 B 站工具链，为 Codex 重写 MCP、专属会话驱动、本地后台与管理页。来源与修改见 [UPSTREAM.md](UPSTREAM.md)。

![本地管理页](docs/images/dashboard.png)

## 能做什么

- **阅读素材**：搜索、选题、简介、官方字幕、热评、内容简报；有 ffmpeg 时可抽帧并把图片交给模型。
- **有自己的作息**：时区、跨午夜时段、随机醒来或跳过；每天最多 3 次计划活动，手动探索另计。
- **两本日记**：给你的信、自己的小本子，都保存在本机。不会把“只读了字幕”写成“完整看完视频”。
- **听到有人找它**：评论、私信和直播监听；消息先持久入队，再交给 Codex。没有消息时不唤醒模型。
- **受控互动**：按 UID 识别主人；陌生人的回复必须经管理页审核。评论、私信、直播弹幕与主动分享分别控制，默认全部关闭。
- **不重复发送**：任务唯一键、专属会话串行、发送账本、上游请求退避与配额。结果不确定时保留“待核查”，不自动重试。

这是一个 **Codex 专用的本地项目**，不需要运行 DSH。跨 Harness 的通用工具层属于另一个独立项目，不是这个仓库的迁移目标。

## 快速开始

需要 Node.js 22 或更新版本、已登录的官方 Codex 客户端。抽帧另需 ffmpeg。当前动态工具适配在 Codex `0.164.0-alpha.11.1` 实际通过协议检查；app-server 的相关 API 仍属实验性接口。

```sh
git clone https://github.com/Cansiny0320/codex-bili-dragon.git
cd codex-bili-dragon
npm ci
npm run doctor:protocol
npm start
```

终端会显示一个 `http://127.0.0.1:18841/#...` 链接。它包含本次后台的管理令牌，只在本机使用。打开后：

1. 在“账号与连接”保存你有权操作的 B 站账号的 `SESSDATA`、`bili_jct`、`buvid3`，然后检查登录。不要把这些值发送到 AI 聊天中。
2. 在“人设与作息”填写主人 UID、昵称、兴趣和活动时段。
3. 可以先保持所有发送通道关闭，点击“现在逛一会儿”，观察阅读与日记。
4. 需要自主活动、监听或分享时，分别开启对应设置。

后台必须持续运行；关闭终端、电脑休眠或 Codex 额度不可用时不会继续活动。项目不会配置开机自启，也不会创建远程服务。

## 在 Codex 聊天中使用

后台已经通过官方 app-server 向专属会话注册工具，不依赖全局 MCP 注册。

如果还希望在普通 Codex 聊天中手动使用这些工具，可以执行：

```sh
node bin/dragon.mjs install
```

这条命令会调用官方 `codex mcp add`，修改你的 Codex 用户配置；其他启动和检查命令不修改它。刷新或重启 Codex 后可发现 `dragon_status`、`dragon_read`、`dragon_diary`、`dragon_reply`、`dragon_share`。

仓库同时包含标准 `plugin.json`、`mcp.json`、`skills/bili-dragon/SKILL.md` 和 Codex 兼容清单 `.codex-plugin/plugin.json`。支持本地插件的客户端可加载源码目录；请先 `npm ci`。手动 MCP 注册只安装工具，Skill 的说明见 [SKILL.md](skills/bili-dragon/SKILL.md)。

## 数据与权限

默认数据目录为项目下的 `data/`，已被 Git 与发布包排除。账号 Cookie、配置、双日记、任务、审核草稿、发送账本、缓存和媒体都在其中。可以用 `BILI_DRAGON_DATA` 指定独立的**绝对路径**。不要把数据目录放进公开仓库或共享给其他人。

Cookie 本地保存为文件，未做操作系统钥匙串加密；应使用受当前用户保护的本地目录。管理接口不返回 Cookie，模型只接收经过脱敏的工具结果。Codex 登录由官方客户端维护，本项目不复制 OAuth 凭据。

独立 Codex 进程禁用 Shell、浏览器、其他 MCP 和连接器等无关工具，并使用只读沙箱；所有 B 站发送由本项目的工具层执行。没有模型可调用的“批准草稿”工具。读取字幕、网页或消息不会获得修改设置或审核草稿的权限。

写通道开启后，主人消息可以自动回复。其他人只能形成草稿。私信还需满足上游的主人 UID 和互关检查。分享沿用评分门槛、日上限、同视频冷却和沉默衰减；这个版本额外保留永久的同视频分享账本，避免重启后重复分享。

## 检查与开发

```sh
npm test
npm run check
npm run doctor:protocol
npm run package
```

- 自动测试不发送真实评论、私信或弹幕，也不调用模型生成。
- `doctor:protocol` 读取官方登录状态并创建短暂的协议检查会话，不启动模型回合。
- `package` 生成不包含数据、凭据和依赖目录的 `.tgz` 源码包。GitHub 克隆使用 `npm ci`；npm 打包机制不包含 `package-lock.json`，解压 `.tgz` 后使用 `npm install`。
- GitHub Actions 在 Windows / Ubuntu、Node.js 22 / 24 上运行离线检查。

详细配置、故障处理和停止方式见 [使用说明](docs/usage.md)。实际验证范围和未验证项见 [验证记录](docs/verification.md)。

## 命名与致谢

“小白龙”借用了中文社区 GPT 白龙/龙娘二创的意象，不是 OpenAI 官方角色，也没有使用现成的角色图片。原作者的“大肥鱼”仍是这个项目最重要的来源。

原项目与本项目均采用 MIT License。上游版权声明保留在 [LICENSE](LICENSE) 和 [vendor/upstream/LICENSE](vendor/upstream/LICENSE)。
