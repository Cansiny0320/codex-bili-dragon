# 在 Codex 中安装 B 站小白龙

这是交给 Codex 执行的安装指南。用户可以说：

> 帮我安装并启动 B 站小白龙：https://github.com/Cansiny0320/codex-bili-dragon 。按仓库的 INSTALL.md 完成安装，并打开管理页。

也可以把预构建的 `codex-bili-dragon-*-plugin.zip` 提供给 Codex，说「帮我安装这个插件并打开管理页」。

## 给安装助手的步骤

1. 使用本次用户指定的预构建 ZIP；没有指定时，从本仓库 GitHub Releases 获取最新的 `*-plugin.zip` 和对应 `.sha256`，核对 SHA-256 后解压到临时目录。没有可用 Release 时明确说明，不把源码包当成即装即用包。
2. 查找可用的 Node 22.18+（22.x）、24.11+（24.x）或 26+。在 Codex 内可先使用宿主提供的 workspace dependencies 工具获取 Node；也可使用 PATH 中已安装的 Node。使用查到的真实绝对路径，不硬编码开发者机器路径，不修改全局 PATH。若环境确实没有 Node，说明缺少的运行环境，不进行未经授权的系统软件安装。
3. 在解压目录执行 `node dist/runtime/cli.js install`。使用第 2 步的实际 Node 可执行文件替代 `node`。安装器会先检查 FFmpeg；没有可用版本时自动下载对应平台的固定构建、校验 SHA-256 并验证可执行，再校验插件文件、将插件复制到持久目录、仅为该插件设置 Node 搜索路径，并通过 Codex 官方 CLI 注册和安装插件。若 Codex 不在 PATH，安装器会查找桌面应用的可用版本；也可设置 `BILI_DRAGON_CODEX` 为实际路径。不要覆写 HOME、USERPROFILE 或 CODEX_HOME。
4. 检查安装结果和 `codex plugin list --marketplace bili-dragon --json`。必须确认安装路径和启用状态，不把目录复制当作安装完成。
5. 从安装结果的 `installedPath` 执行 `node dist/runtime/cli.js start`，再运行 `status`。启动仅启动本地服务，首次安装自动活动、主动分享、评论与弹幕权限关闭；私信权限默认开启，但仍须配置双号与互关后才能发送。
6. 工具加载后调用 `dragon_open`，让管理页在 Codex 对话右侧打开；也可从 Codex 全局侧边栏的「B 站小白龙」进入。不要把一个普通浏览器标签页称作原生侧边栏。
7. 如当前聊天尚未刷新插件工具，引导用户在插件详情页「管理 → 重新加载」，再打开管理页；这是当前客户端已验证的更新方式，无需重启 Codex。也可使用「立即试用」后请求打开管理页，不自动创建新聊天。先完成可验证的后台与插件检查。
8. 执行插件自带的 setup 引导。让用户在管理页「账号连接」使用 B 站 App 扫码并在手机确认；手动 Cookie 保留在高级选项。不要要求用户把凭据贴进聊天，不读取或显示凭据文件。已有旧版 `data` 目录时，先核查其位置；使用 `migrate-data <绝对路径>` 迁移到空目标，保留源文件，不覆盖现有数据。

## 更新与卸载

- 更新：先通过 `dragon_control` 的 `stop` 或 CLI `stop` 停止后台，下载并验证新 ZIP，再执行安装流程。日记、账号和设置独立于插件缓存保存。
- 卸载：先停止后台，再执行 `codex plugin remove codex-bili-dragon@bili-dragon`。需要移除插件源时再执行 `codex plugin marketplace remove bili-dragon`。这些操作保留个人数据；清除数据需要用户另行明确要求。
- 安装器不创建开机启动项或系统服务。关闭管理页后已启动的后台会继续运行；电脑休眠或关机会中断活动，恢复后需检查状态。

## 本地开发验证

开发者先执行 `pnpm build` 和 `pnpm package`，从 `dist/plugin` 执行安装命令。普通用户使用预构建 ZIP，无需 pnpm、npm install 或编译。
