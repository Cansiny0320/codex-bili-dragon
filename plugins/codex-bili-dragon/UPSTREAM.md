# Third-party code notices

- Version: 0.4.6
- Commit: 3e11454a5961300aa7094df0f08e630bd39999dd
- License: MIT, copyright ALTERSSSS. Original license is retained.

## Local changes

Third-party Bilibili utilities are retained under vendor/upstream/tools with their original MIT license. The application runtime and dashboard are maintained in packages/runtime/src/ and apps/dashboard/.

- Tool state paths now resolve only inside BILI_DRAGON_DATA via dist/runtime/vendor-paths.js; no HOME, USERPROFILE or DSH_HOME reassignment.
- Successful exits in video metadata, comments, DM and comment commands return normally so Windows network handles and stdout can close without a forced-exit crash.
- video-content.mjs adds a metadata-only branch with BV, aid, title, cover, author and duration; dashboard backfill and share target validation no longer depend on comments or subtitles.
- FFmpeg lookup prefers a validated plugin-managed binary; explicit FFMPEG and PATH installations remain supported.
- The comments JSON response includes title, cover, author and duration from the already-fetched video metadata; it adds no new request.
- guardedFetch enforces our live channel switch and endpoint allowlist for every write.
- Live-listener handoff persists a pending JSON event before advancing its cursor and replays it until our durable queue acknowledges it. Poll sleep respects the requested deadline.
- Existing upstream comments and historical names remain where useful for auditing. Only the structured tool catalog is exposed to models; not every upstream CLI command is exposed.

Modified upstream files:

- tools/commands/bili-watch.mjs
- tools/commands/comment-await.mjs
- tools/commands/comment-del.mjs
- tools/commands/comment-digest.mjs
- tools/commands/comment.mjs
- tools/commands/comments.mjs
- tools/commands/danmaku-await.mjs
- tools/commands/danmaku.mjs
- tools/commands/debrief.mjs
- tools/commands/deps.mjs
- tools/commands/diary.mjs
- tools/commands/dm-await.mjs
- tools/commands/dm.mjs
- tools/commands/dynamic-image.mjs
- tools/commands/dynamic.mjs
- tools/commands/edit-dynamic.mjs
- tools/commands/fav.mjs
- tools/commands/feed.mjs
- tools/commands/likes.mjs
- tools/commands/quota.mjs
- tools/commands/reply-draft.mjs
- tools/commands/search.mjs
- tools/commands/selftest.mjs
- tools/commands/subtitles.mjs
- tools/commands/traffic.mjs
- tools/commands/video-content.mjs
- tools/diagnostics/fetch-covers.mjs
- tools/diagnostics/whois.mjs
- tools/lib/ai-share.mjs
- tools/lib/bili-api.mjs
- tools/lib/config.mjs
- tools/lib/ffmpeg.mjs
- tools/lib/night-config.mjs
- tools/lib/paths.mjs
- tools/lib/runtime.mjs
- tools/lib/traffic.mjs
- tools/verify/comment-exists.mjs
- tools/verify/session.mjs

The new integration is also MIT licensed.

## GPT 龙娘图标

`assets/icon.png` 是 ZipZipPipe 的 GPT 龙娘现成立绘的头像裁切，来源、技术处理与作者署名/非商业使用条件见 [assets/NOTICE.md](assets/NOTICE.md)。图片不适用项目代码的 MIT 许可，也不将 DeepSeek 角色的 CC 许可套用于 GPT 角色。

## Automatically downloaded FFmpeg

FFmpeg is downloaded into the user data directory, not included in the plugin ZIP. Fixed assets, SHA-256 values and source-build links are recorded in `packages/runtime/src/ffmpeg-assets.json`. Windows/Linux builds come from BtbN LGPL shared builds; macOS builds come from dfloresc/ffmpeg-macos-builds LGPL builds. License, build information and libraries included in each distribution are preserved. FFmpeg is not covered by this project’s MIT license.
