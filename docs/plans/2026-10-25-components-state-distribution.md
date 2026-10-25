# 实施计划

对应 spec：../specs/2026-10-25-components-state-distribution.md。

1. 状态管理：新增 apps/dashboard/src/lib/dashboard-store.ts、settings-store.ts，改造 state.tsx 和消费者为 selector；新增 test/dashboard-store.test.ts。先证明实例隔离、重复提交、旧响应、草稿保护、保存失败/取消和生命周期清理，再实现。运行 pnpm test。
2. 组件：添加 apps/dashboard/components.json 与所用 ui 组件，更新 common.tsx、shell.tsx、routes 和 styles.css，使用现有 Base UI、Lucide、cn；补齐主题 token。验证表单、Tabs、Checkbox、Collapsible 与原有八页操作，保留布局。
3. 分发：在 scripts 添加市场产物生成逻辑和对应测试，产物位于 dist/marketplace；添加 .agents/plugins/marketplace.json，指向完整包目录。源码清单仅作为生成模板，文档中的添加命令固定使用 marketplace 分支。更新 setup/INSTALL 说明 Node 要求与初始化，不改变用户全局环境。
4. 文档和版本：更新 README/README.en.md、版本清单、发布说明和验证记录。中文按用户直接、具体的表达写，安装步骤优先，技术细节后置。
5. 验证：pnpm check（只读）、pnpm test、pnpm build（生成 dist）、pnpm test:ui（隔离数据/headless）、pnpm package（生成 ZIP）、pnpm test:package（临时目录服务，无真实外部发送）；检查生成市场的清单、包校验及兼容 Node 环境。人工查看测试截图，必要时修复相关回归。
6. 发布：核对 Git diff 与产物，提交并推送 main；核实 CI。使用独立临时目录准备 marketplace 发布提交，保留分支历史，无 worktree/强推；推送市场分支。创建 v0.7.0 tag 和 GitHub Release，上传 ZIP 与 sha256；回读 Release、公开市场和远程 refs，确认用户能取得安装包。

不运行真实 B 站发送测试，不操作桌面鼠标键盘，不改个人账号/权限。状态与安装回滚按 spec 执行；发现新的重大设计决策才暂停相关部分。
