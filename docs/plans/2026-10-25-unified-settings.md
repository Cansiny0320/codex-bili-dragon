# 操作权限统一设置实施计划

依据：`docs/specs/2026-10-25-unified-settings.md`，已批准，在当前工作目录执行。

## 1. 配置与默认值

文件：`packages/runtime/src/config.ts`、`prompts.ts`、相关 `test/*.test.ts`。

先添加默认值、旧自定义值保留、超出旧分享上限与非法输入测试，再调整配置。新增默认空白的 reasoningEffort；默认兴趣留空，删除人设固定题材偏好。保留单号模式和发送配额行为。

## 2. 模型目录与调用

文件：新增 `packages/runtime/src/models.ts`，修改 `codex.ts`、`service.ts`、`api.ts`、`http.ts`、`mcp-server.ts` 及 MCP App 客户端适配。

复用现有 Codex RPC，按已安装版本生成的协议核实 model/list、config/read 和 turn/start 的 model/effort 字段。完成分页、默认值解析、支持深度检查及短期缓存；查询连接及时关闭。实际模型选择在任务开始应用并明确处理恢复默认，运行中配置变更不打断当前任务。通过 Fake RPC 验证，不启动真实生成回合。

## 3. 设置页整合

文件：`apps/dashboard/src/routes/permissions.tsx`、`schedule.tsx`、`account.tsx`，按需新增模型选择组件。

移动原有监听和更新控件，保留渐进展开；移除分享输入 min/max；模型与深度下拉框使用后端目录，加载失败只在对应区域展示。已有兴趣编辑仍保留在个性与兴趣页面（无额外重复入口），仅取消其预设值。

## 4. 验证与交付

更新 `scripts/ui-check.test.ts` 和 MCP UI 测试：覆盖位置、模型联动、超过旧限值的保存重载，以及桌面/窄屏。模型目录使用替身避免真实账户或生成调用。按实际改动更新 README/INSTALL。

命令（先检查脚本副作用）：

- `node node_modules/vite-plus/bin/vp test run <相关测试>`：隔离临时数据，先红后绿。
- `node node_modules/vite-plus/bin/vp run build`：生成忽略的 dist 产物与兼容性 manifest。
- `node node_modules/vite-plus/bin/vp run check`：执行项目格式、lint、类型、插件检查，先确认自动修复行为。
- `node node_modules/vite-plus/bin/vp test run`：全套本地单元测试。
- `node node_modules/vite-plus/bin/vp test run --config scripts/ui.vite.config.ts`：真实 Web/MCP UI，外部操作替身，生成 work 截图并查看。
- 必要时 `node scripts/package.ts` 和 package smoke：产物只保存在忽略目录，不发布。
- 当前安装配置修改前读取并备份非凭据配置，经现有 API 写入后重新读取核验；不改变活动总开关。

风险：配置/API 合同变化不允许旧 MCP 桥接静默兼容；目录失败不能破坏默认模式；恢复默认必须清除持久会话旧覆盖。回滚：仅恢复本次源文件/新增文件和配置备份，不删除用户数据或任务记录。已存在的无关验证失败只记录，不顺带修改。

## 执行记录

- 实施前工作目录干净。
- 已验证当前安装的 MCP 初始化后关闭 stdin 会正常退出（退出码 0，整个探测约 224 ms），没有复现输入关闭后进程常驻。
- 本地版本准备为 0.10.0，已完成全部设置与模型功能；发布目录 `plugins/codex-bili-dragon` 保持已发布版本，未提交或发布。
- 新增配置、模型分页/默认值/缓存、运行中切换与恢复默认的回归测试，先确认失败再实现；实际配额读取验证了 12 次设置。
- 初次全量测试暴露旧 dist 尚未重建及旧测试依赖默认评论分享；已重建并显式设置测试通道。启动后台的测试显式关闭自动更新，避免测试访问 GitHub。
- 初次 UI 测试发现模型下拉框的精确可访问名称不匹配，已补上明确标签；截图复核发现窄屏选项过窄，已仅调整模型区域为整行显示。
- 最终 Node 24.19.0：26 个测试文件、89 个单元/集成测试全部通过；Web 和 MCP App 两套 UI 测试通过；独立 ZIP 无 node_modules 冒烟测试通过；build、check（格式/lint/type/插件入口）、git diff --check 均通过。
- 隔离 0.10.0 后台通过真实 MCP 目录接口读取 9 个模型；实际默认为 gpt-6-astra / high，首次查询 532 ms、缓存查询 17 ms。未启动真实模型生成回合，探测结束后关闭临时后台和连接。
- 当前安装已核对兴趣为空、私信监听/分享/更新开启、活动暂停；其默认人设中的固定题材偏好已通过现有 API 移除，原配置备份在 `work/settings-before-1792934257694.json`。其余字段保持最新值。
- 本地 ZIP：`dist/codex-bili-dragon-0.10.0-plugin.zip`；SHA-256 为 `f1b177805101e97e585b6a16d4f47dffa7a19921f6fba65579819097eb8e1dd1`。新界面和模型选择尚未替换已安装插件。
