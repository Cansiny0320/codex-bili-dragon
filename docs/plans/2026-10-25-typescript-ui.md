# 实施计划

1. 固定现有 20 项行为回归，建立 pnpm workspace、严格 tsconfig 和 Vite+ 检查；将 src、bin、server、scripts、test 的自有实现转 TypeScript，保留第三方 JS。
2. 定义持久状态和服务类型，修正编译/运行边界；vp pack 输出 runtime，vendor 指向编译入口；配置和数据兼容。
3. 建立 apps/dashboard TanStack Start SSR、Router 和 oRPC；管理 API 继续鉴权，SSR 不输出私密状态。注册 shadcn base-nova 基础组件、Tailwind 和 Lucide。
4. 按 docs/design 八页实现真实状态、读取素材、双日记、审核、全部设置、凭据与运行控制。新增测试覆盖 oRPC 鉴权、设置保存、路由、移动布局、错误/空状态和重要交互。
5. 用 headless browser 截图逐页对照设计并修复，不运行真实桌面输入；保留图示风格，避免假功能或假成功。
6. 更新中英 README、赞助、使用文档与 CI；运行 pnpm check、pnpm test、pnpm build、doctor:protocol、MCP 握手、打包安装检查和依赖审计。检查无敏感数据后按已授权推送原 GitHub 公共仓库。

验证不触发真实 B 站写操作或模型生成。无关 baseline 失败只记录。回滚：恢复迁移前 Git commit 60ea685，保留 gitignored data。
