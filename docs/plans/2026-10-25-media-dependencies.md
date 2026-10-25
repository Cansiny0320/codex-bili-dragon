# 实施计划

1. 在 test/service.test.ts 用真实字幕文本复现标题、封面缺失；修改 service.ts 与 vendor 的 video-content.mjs，使素材成功后补取元数据；worker.ts 启动时补全历史。验证失败不丢素材、缓存复用和旧时间不变。
2. 新增 packages/runtime/src/ffmpeg.ts 及固定平台清单。复用现有 fflate，支持校验下载、私有目录解包、可执行验证、缓存复用、失败回滚。新增离线测试覆盖摘要错误、无网络缓存、路径逃逸及平台选择。
3. cli.ts 在 install / start / serve 准备依赖；upstream.ts 在真实抽帧路径准备依赖；vendor-paths.ts 与 vendor FFmpeg 查找统一私有依赖路径。更新使用文档、第三方来源及 0.6.0 版本。
4. 运行 pnpm test、pnpm check、pnpm build、pnpm test:ui、pnpm package、pnpm test:package 及 git diff --check。所有自动化测试使用隔离数据与模拟网络，不控制真实桌面输入。
5. 使用新的插件安装命令实际下载并验证 Windows FFmpeg，升级本机插件。在真实管理页核对封面、标题、双号身份，按用户授权和提供的目标完成正常流程测试，检查日记、操作账本与远端结果。记录实测和未测边界，恢复测试临时配置，交付安装包及报告。
