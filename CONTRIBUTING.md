# 开发与发布

项目使用 TypeScript、pnpm 和 Vite+。管理页基于 React、TanStack Start，组件使用 shadcn/ui base-nova，状态管理使用 Zustand。组件配置位于 `apps/dashboard/components.json`；沿用现有页面结构和蓝色主题，只添加用到的组件。

## 本地验证

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm test:ui
pnpm package
pnpm test:package
pnpm package:marketplace
```

`check` 不自动修复文件。`build`、`package` 会生成 `dist/` 内容；`package:marketplace` 更新仓库中的市场清单和 `plugins/codex-bili-dragon/`；需要格式化时单独运行 `pnpm format`。

浏览器测试使用 headless Chromium，Windows 自动查找 Edge；其他环境先运行 `pnpm exec playwright install chromium`。测试使用独立数据与外部服务替身，不发送真实 B 站消息、不调用模型、不操作桌面鼠标键盘。

## 组件与状态

- base-nova 组件来自官方 registry，使用现有 Base UI、Lucide 和 `cn`。Tabs 的方向选择器匹配当前 Base UI 的 `data-orientation`，不要恢复成不存在的 `data-horizontal` 属性。
- DashboardProvider 为每个页面实例创建 Zustand store，Context 只传递实例。后台快照与设置草稿分开管理，SSR 不共享用户状态，不持久化客户端或认证令牌到 store。
- 新功能优先复用现有类型与 helper；异步行为需要覆盖竞态、失败和清理。低影响文案改动不增加重复实现的测试。

## 分发

源码和市场都放在 `main`，运行 `pnpm package:marketplace` 更新成品。市场目录中的 `plugins/codex-bili-dragon` 必须包含完整运行文件，不能指向未构建源码。

发布顺序：

1. 同步根目录、workspace 包和插件清单的版本，更新安装说明与验证记录。
2. 完成上面的检查，确认生成 ZIP 和 SHA-256，检查包内没有个人数据。
3. 将源码、市场清单和 `plugins/codex-bili-dragon/` 一起提交并推送 `main`，等待 GitHub Actions 通过。
4. 在该提交上创建版本 tag，发布 GitHub Release，上传 `*-plugin.zip` 和 `.sha256`。
5. 回读公开市场、Release 附件与远程 refs；安装包校验值必须一致。

市场产物随 `main` 提交，不再维护独立发布分支。`scripts/marketplace.ts` 校验安装包后只复制清单中的文件，并清除旧版本遗留的插件文件。

回滚采用新的市场提交恢复上一已验证版本，不删除或重置用户数据。详细验收范围见 [验证记录](docs/verification.md)。
