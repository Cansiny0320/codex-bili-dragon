<h1 align="center">Codex Bili Dragon</h1>
<p align="center">A local Bilibili companion that explores your interests and keeps a diary.</p>
<p align="center">
  <a href="https://github.com/Cansiny0320/codex-bili-dragon/actions"><img src="https://github.com/Cansiny0320/codex-bili-dragon/actions/workflows/ci.yml/badge.svg" alt="Checks"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6" alt="Strict TypeScript">
</p>
<p align="center"><a href="docs/usage.md">Usage guide</a> · <a href="https://github.com/Cansiny0320/codex-bili-dragon/issues">Issues</a></p>
<p align="center"><a href="README.md">简体中文</a> · <a href="README.en.md">English</a></p>

Codex Bili Dragon runs locally and uses the official Codex client to explore Bilibili videos, write letters to you and private reflections, and respond to messages within your schedule and permissions. It is a direct port of [Alterssss/dsh-bili-whale](https://github.com/Alterssss/dsh-bili-whale) v0.4.6 and does not require DSH.

![Dashboard with demo data](docs/images/dashboard.png)

## What can it do?

- **Explore your interests**: search videos and read subtitles, comments and briefs; sample frames when ffmpeg is available.
- **Record what it finds**: letters to you and private reflections are saved separately, alongside a history of the video material it has read.
- **Set activity times**: choose a time zone and schedule, including overnight activity, or start an exploration yourself.
- **Review interactions**: owner replies follow your permissions; replies to other people require review. Comments, DMs, live messages and sharing are off by default. If a send result is unclear, it keeps a record for you to check.

## Getting started

Requires **Node.js 24.11+ within 24.x or 22.18+ within 22.x**, **pnpm 12.15.0**, and a signed-in official Codex client. Node.js 26+ also meets the toolchain requirements.

```sh
git clone https://github.com/Cansiny0320/codex-bili-dragon.git
cd codex-bili-dragon
pnpm install --frozen-lockfile
pnpm build
pnpm doctor:protocol
pnpm start
```

Open the local URL printed in the terminal. Save your Bilibili cookies under Account connection, verify the session and enter the owner's UID. Adjust interests and activity times, then start one exploration. Enter credentials only in the local dashboard, never in an AI chat. The dashboard currently uses Chinese.

The background process must stay running. Closing the terminal, suspending the computer or running out of Codex quota stops activity. App-server dynamic tools remain experimental; use `pnpm doctor:protocol` to check your installed client.

## Data and permissions

Settings, credentials, diaries and jobs stay in the local `data/` directory, excluded from Git and packages. Set `BILI_DRAGON_DATA` to use another absolute path. Cookies are stored in local files without OS keychain encryption. Management responses do not return saved secrets; the official client manages Codex authentication.

Both diaries stay local. Approving a draft performs a real Bilibili action after checking that sending is enabled and the reply has not already been sent. DMs target only the configured owner and require mutual following. See the [usage guide](docs/usage.md) for details.

## Development and documentation

Built with TypeScript, with a dashboard based on React and TanStack Start. The pinned upstream JavaScript tools retain their provenance and license.

```sh
pnpm check
pnpm test
pnpm test:ui
pnpm package
```

Browser checks run in headless Chromium. Windows checks find Edge automatically; elsewhere, run `pnpm exec playwright install chromium`. Tests do not send real messages, invoke model generation or control desktop input.

[Usage and troubleshooting](docs/usage.md) · [Verification](docs/verification.md) · [Upstream provenance](UPSTREAM.md) · [Skill](skills/bili-dragon/SKILL.md)

## Sponsorship

If this project is useful to you, you can support its development through WeChat Pay or Alipay. Thank you!

![WeChat Pay and Alipay sponsorship codes](.github/sponsorship/sponsorship-cats.png)

## License and acknowledgements

Released under the [MIT License](LICENSE), with ALTERSSSS's upstream copyright retained. The white dragon name draws on community GPT fan art; it is not an official OpenAI character, and no existing character artwork is used.

## Related projects

- [bili-agent-kit](https://github.com/Cansiny0320/bili-agent-kit): Bilibili SDK, CLI and MCP tools for other AI assistants and applications.
- [dsh-bili-whale-dashboard](https://github.com/Cansiny0320/dsh-bili-whale-dashboard): a dashboard for the original DSH Bili Whale plugin, running separately from this project.
