<p align="center"><img src="assets/icon.png" width="76" alt="Bili Dragon"></p>
<h1 align="center">Codex Bili Dragon</h1>
<p align="center">A Bilibili companion that explores your interests and writes back to you.</p>
<p align="center">
  <a href="https://github.com/Cansiny0320/codex-bili-dragon/releases/latest"><img src="https://img.shields.io/github/v/release/Cansiny0320/codex-bili-dragon" alt="Latest release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
</p>
<p align="center">
  <a href="https://github.com/Cansiny0320/codex-bili-dragon/releases/latest">Download</a> ·
  <a href="https://github.com/Cansiny0320/codex-bili-dragon/tree/main">Marketplace</a> ·
  <a href="docs/usage.md">Usage guide</a> ·
  <a href="https://github.com/Cansiny0320/codex-bili-dragon/issues">Issues</a>
</p>
<p align="center"><a href="README.md">简体中文</a> · <a href="README.en.md">English</a></p>

Bili Dragon is a Bilibili companion inside Codex. Give it a personality, interests and a schedule. It finds videos, keeps a diary, and can share videos and reply to your messages.

![Bili Dragon dashboard with demo data](docs/images/dashboard.png)

## What can Bili Dragon do?

- **Find something interesting**: explore Bilibili, read subtitles and comments, sample video frames, and keep a history of what it finds.
- **Write back to you**: each exploration can produce a letter to you and a separate private diary.
- **Follow a daily routine**: choose when it goes out, send it exploring yourself, or let it rest.
- **Talk about what it finds**: with a separate Bilibili account, it can share videos and reply to your DMs and comments. Replies to other people wait for your review.

## Getting started

**1 · Install Bili Dragon.** Open the Codex desktop app and send:

> Install and start Bili Dragon from this marketplace: https://github.com/Cansiny0320/codex-bili-dragon/tree/main. Follow INSTALL.md and open the dashboard.

You can also [download the latest release](https://github.com/Cansiny0320/codex-bili-dragon/releases/latest), choose the file ending in `-plugin.zip`, and give it to Codex with “Install this plugin and open its dashboard.” See the [installation guide](INSTALL.md) for details.

**2 · Sign in to Bilibili.** Open **账号连接** (Account connection), scan the QR code with the Bilibili app, and confirm on your phone. Use your own account to explore and keep diaries. To receive messages, choose dual-account mode, sign Bili Dragon in with a separate account, and enter your own UID as the owner. The two accounts must follow each other for DMs.

**3 · Send it out to explore.** Set its personality and interests, then click **去逛一逛** on the home page. Read its diary and video history when it returns. For scheduled activity, set its active hours and click **叫醒小白龙**. The dashboard currently uses Chinese.

## Tips

- **You control its activity**: it starts paused after login. Comments, live messages and proactive sharing are off by default; enable them when wanted.
- **Call it back anytime**: ask Codex to open the dashboard, pause activity or stop the background service.
- **Keep your computer on**: Bili Dragon runs locally and uses your Codex allowance. Closing the dashboard leaves it running; sleep, shutdown or exhausted quota interrupts activity.
- **Add our marketplace first**: Bili Dragon becomes discoverable after adding its marketplace. It is not listed in OpenAI's public directory.

## Data and privacy

Account credentials, settings and diaries are stored locally and retained during updates and uninstalling. Video material is processed through Codex. Bilibili cookies are saved in local files without OS keychain encryption. See the [usage guide](docs/usage.md) for data locations and backups.

## Feedback

Found a problem or have an idea? [Open an issue](https://github.com/Cansiny0320/codex-bili-dragon/issues) with your operating system, plugin version and steps to reproduce it.

## Sponsorship

If you enjoy this project, you can support its development through WeChat Pay or Alipay.

![WeChat Pay and Alipay sponsorship codes](.github/sponsorship/sponsorship-cats.png)

## License and acknowledgements

Source code uses the [MIT License](LICENSE). The icon uses [ZipZipPipe’s GPT dragon-girl artwork](https://www.pixiv.net/artworks/148186519), a community fan character. The artwork requires attribution and non-commercial use and is excluded from the code license; see [asset credits](assets/NOTICE.md).

Inspired by [Alterssss/dsh-bili-whale](https://github.com/Alterssss/dsh-bili-whale).

## Related projects

- [bili-agent-kit](https://github.com/Cansiny0320/bili-agent-kit): Bilibili SDK, CLI and MCP tools for other AI assistants and applications.
- [dsh-bili-whale-dashboard](https://github.com/Cansiny0320/dsh-bili-whale-dashboard): a dashboard for the original DSH Bili Whale plugin, running separately from this project.
