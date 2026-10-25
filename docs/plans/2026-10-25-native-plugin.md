# 原生插件实施计划

依据：[已批准设计](../specs/2026-10-25-native-plugin.md)。在当前目录执行，保留已修改的双语 README，不创建 worktree。

## 1. 共享后台与持久化目录

文件：`packages/runtime/src/paths.ts`、`runtime.ts`、`worker.ts`、`http.ts`、`cli.ts`、`service.ts`。

把默认数据移到用户应用数据目录，保留 `BILI_DRAGON_DATA`。使用现有服务和队列锁提供受认证的后台连接、重复启动复用、状态和停止。CLI 增加后台启动和停止，旧浏览器入口继续可用。迁移只复制用户明确指定的旧目录，不删除原数据。

验证：新增 `test/runtime.test.ts` 和路径/迁移回归，覆盖并发启动、停止、旧进程记录、重复迁移、升级保留数据；沿用队列和发送幂等测试。测试使用隔离临时目录、模拟会话，不访问 B 站。

## 2. MCP App 与权限边界

文件：`packages/runtime/src/mcp.ts`、新增 MCP 注册模块；`apps/dashboard/src/lib/client.ts`、`state.tsx`、`routes/__root.tsx`、新增 `mcp-app.tsx` 和构建配置。

为原有页面添加嵌入式渲染和 MCP 工具桥接，提供 global/thread 两个入口和自包含 HTML 资源。原有模型工具经共享后台执行；管理操作声明为 App 可见，审核工具不进入自主会话。复用现有 actions 和校验，不重新设计页面。

验证：扩展 `test/mcp.test.ts`，覆盖资源、入口元数据、空参数打开、App 工具校验、凭据脱敏；扩展 headless UI 验证覆盖真实 MCP 桥接、八页导航和保存，不发送桌面鼠标键盘输入。

## 3. 可直接安装的发布包

文件：`scripts/package.ts`、新增安装器和安装测试；`plugin.json`、`.codex-plugin/plugin.json`、`mcp.json`、`skills/setup/SKILL.md`、`skills/bili-dragon/SKILL.md`、插件图标和构建配置。

生成预构建插件 ZIP 与独立插件源。安装器复制到用户持久目录、固定 Node 路径，通过实际 Codex CLI 注册并安装；重复安装复用身份。封装依赖，移除 npm pack 交付路径。不得修改其他插件条目或写入凭据。安装说明包含一句话入口和诚实的运行环境要求。

验证：检查包文件清单和秘密排除；把包放在仓库之外，在无源码依赖的目录执行 MCP、后台和安装检查；最后安装到当前 Codex，检查插件发现和宿主侧边栏能力。若宿主无法验证，明确记录具体限制，不把模拟测试写成实机通过。

## 4. 文档、集成验证和交付

文件：双语 README、`docs/usage.md`、`docs/verification.md`、CI 配置。

推荐安装入口改为 Codex 插件，保留开发指令和网页兼容入口；记录后台生命周期、数据目录、更新/卸载及来源致谢。

命令：`pnpm build`（生成产物）、`pnpm test`（临时测试数据）、`pnpm check`（只读检查）、`pnpm test:ui`（headless 浏览器）、`pnpm package`（生成 ZIP）。需要格式化时单独执行并检查差异。检查通过后不无理由重复扩大测试。

## 风险和回滚

- 不同 Codex 版本的插件 CLI 与 Extensions 支持不同：安装时检测命令，实际宿主验证入口；保留网页管理方式。
- 插件缓存会随更新变化：持久数据与缓存分离；旧目录迁移幂等且不删除源。
- 多聊天/升级产生多进程：沿用单实例锁和发送账本；未知结果进入人工核查。
- 可停止后台、卸载本项目插件并移除本项目插件源；数据保留。代码回滚仅恢复本次文件，不覆盖原有 README 修改或其他工作。
- 外部发布不在本地实现中自动执行；本地完成后提供可审阅包和验证结果。
