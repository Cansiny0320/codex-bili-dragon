# 实施计划

1. 在 `test/storage.test.ts`、`test/codex.test.ts` 以及现有两套 UI 检查中加入回归场景：默认私信且保留明确关闭；首页展示登录身份且刷新不丢失；工具宿主可用；completed 但无日记被识别为失败。
2. 修改 `packages/runtime/src/config.ts`、`types.ts`、`service.ts`、`login.ts`、`api.ts`、`daemon.ts`：记录已验证身份，兼容迁移模式，单号同步主人，身份更换先暂停、作废待执行任务及草稿；发送路径阻止自身私信和单号分享，保留已有权限边界。增加单号、双号、迁移和切换回归。
3. 修改 `apps/dashboard/src/routes/index.tsx`、`account.tsx`、`components/bili-login.tsx`、`lib/state.tsx`、`styles.css`：首页展示头像与实际登录 UID；账号页用模式选择及必要字段表达关系；自动同步不覆盖无关的未保存设置，维持原布局。
4. 修改 `packages/runtime/src/codex.ts`：保持工具隔离，启用 Code Mode 编排宿主；收集回合最终说明并验证浏览产出。沿用现有错误和待核查界面呈现无产出失败。用真实 Codex、本地模拟素材验证一次完整动态工具链，再验证用户已请求的真实探索。
5. 运行 `pnpm typecheck`、`pnpm check`、`pnpm test`、`pnpm build`、`pnpm test:ui`、`pnpm test:package`。UI 和发送检查用替身、headless 浏览器，不占用桌面、不发送真实消息。确认无 Cookie 输出。
6. 更新版本、使用说明和验收记录，打包并通过既有安装器更新本机插件，保留数据。核实宿主载入与实际页面，交付结果。

风险：旧配置身份迁移、异步切换导致旧响应写入、后台回合只完成文字解释却未执行工具。通过身份校验、暂停/作废、迟到结果检查及真实动态工具验证覆盖。必要时回装旧包并还原升级前配置；不改远端状态。
