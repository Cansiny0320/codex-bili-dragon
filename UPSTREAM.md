# Upstream provenance

- Source: https://github.com/Alterssss/dsh-bili-whale
- Version: 0.4.6
- Commit: 3e11454a5961300aa7094df0f08e630bd39999dd
- License: MIT, copyright ALTERSSSS. Original license is retained.
- No third-party Codex port was used.

## Local changes

The original tools are vendored under vendor/upstream/tools. DSH host lifecycle, web UI, scheduler integration and session delivery were replaced with the Codex implementation in packages/runtime/src/ and apps/dashboard/.

- Tool state paths now resolve only inside BILI_DRAGON_DATA via dist/runtime/vendor-paths.js; no HOME, USERPROFILE or DSH_HOME reassignment.
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
