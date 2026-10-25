<p align="center"><img src="assets/icon.png" width="76" alt="B 站小白龙"></p>
<h1 align="center">Codex Bili Dragon</h1>
<p align="center">让小白龙去逛 B 站，把见闻写给你。</p>
<p align="center">
  <a href="https://github.com/Cansiny0320/codex-bili-dragon/releases/latest"><img src="https://img.shields.io/github/v/release/Cansiny0320/codex-bili-dragon" alt="Latest release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
</p>
<p align="center">
  <a href="https://github.com/Cansiny0320/codex-bili-dragon/releases/latest">下载</a> ·
  <a href="https://github.com/Cansiny0320/codex-bili-dragon/tree/marketplace">插件市场</a> ·
  <a href="docs/usage.md">使用说明</a> ·
  <a href="https://github.com/Cansiny0320/codex-bili-dragon/issues">问题反馈</a>
</p>
<p align="center"><a href="README.md">简体中文</a> · <a href="README.en.md">English</a></p>

B 站小白龙是一个运行在 Codex 里的 B 站伙伴。给它设定性格、兴趣和作息，它会去找感兴趣的视频，把见闻写成日记，也能给主人分享视频、回复消息。

![小白龙管理页，内容为演示数据](docs/images/dashboard.png)

## 小白龙能帮你做什么？

- **找点感兴趣的内容**：按你的设置逛 B 站，读字幕、看视频画面和评论，留下值得回看的视频。
- **把见闻写给你**：每次闲逛后写下给你的信，也保留一份自己的内心日记。
- **按自己的作息活动**：设置每天出门的时间，也可以随时叫它去逛一逛，或者让它休息。
- **和你聊聊看到的东西**：用小号登录后，可以给主人分享视频、回复私信和评论。给陌生人的回复先交给你审核。

## 快速开始

**1 · 安装小白龙。** 打开 Codex 桌面应用，把这句话发给它：

> 帮我从这个插件市场安装并启动 B 站小白龙：https://github.com/Cansiny0320/codex-bili-dragon/tree/marketplace 。按 INSTALL.md 完成安装，并打开管理页。

也可以从 [最新版本](https://github.com/Cansiny0320/codex-bili-dragon/releases/latest) 下载以 `-plugin.zip` 结尾的安装包，交给 Codex，说「帮我安装这个插件并打开管理页」。具体步骤见 [安装指南](INSTALL.md)。

**2 · 扫码登录。** 在「账号连接」用 B 站 App 扫码。只想逛视频、写日记，登录自己的账号即可；想让小白龙给你发消息，就用双号模式，让它登录小号，再填你的主人 UID。私信需要两个账号互关。

**3 · 出去逛一逛。** 设置好性格和兴趣，回到首页点「去逛一逛」。等它回来，就能翻看视频记录和日记。想让它按作息自动活动，先设置活动时间，再点「叫醒小白龙」。

## 使用提示

- **活动和互动由你决定**：刚登录时小白龙默认休息，评论、弹幕和主动分享默认关闭，需要时再到权限页开启。
- **随时叫它回来**：可以对 Codex 说「打开小白龙管理页」「暂停小白龙」或「停止小白龙后台」。
- **需要电脑开着**：小白龙在本机运行，使用你的 Codex 额度。关闭管理页不会停止后台，电脑休眠、关机或额度用完会中断活动。
- **从自己的市场安装**：添加市场后才能在 Codex 中找到小白龙，目前没有上架 OpenAI 官方公共目录。

## 数据与隐私

账号登录信息、设置和日记保存在本机，升级和卸载会保留这些数据。阅读到的素材会交给 Codex 处理；账号 Cookie 保存在本地文件中，没有使用系统钥匙串加密。数据位置和备份方式见 [使用说明](docs/usage.md)。

## 反馈

遇到问题或有建议，欢迎提交 [Issue](https://github.com/Cansiny0320/codex-bili-dragon/issues)，附上系统、插件版本和复现步骤。

## 赞助

如果你喜欢这个项目，可以通过微信或支付宝支持后续开发。

![微信与支付宝赞助二维码](.github/sponsorship/sponsorship-cats.png)

## 许可证与致谢

项目代码使用 [MIT License](LICENSE)。插件图标采用 [ZipZipPipe 的 GPT 龙娘形象](https://www.pixiv.net/artworks/148186519)，属于非官方同人；图片须署名、不可商用，不适用代码的 MIT 许可，详见 [图标来源](assets/NOTICE.md)。

灵感来源于 [Alterssss/dsh-bili-whale](https://github.com/Alterssss/dsh-bili-whale)。

## 相关项目

- [bili-agent-kit](https://github.com/Cansiny0320/bili-agent-kit)：B 站 SDK、CLI 和 MCP 工具，适合接入其他 AI 助手或自己的程序。
- [dsh-bili-whale-dashboard](https://github.com/Cansiny0320/dsh-bili-whale-dashboard)：给 DSH 原版养鱼插件配套的管理后台，与本项目分别运行。
