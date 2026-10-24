# 实施计划

依据同目录 ../specs/2026-10-25-codex-bili-dragon.md 的已批准设计。

1. 固定上游和隔离运行目录
   - vendor/upstream/{tools,LICENSE,NOTICE.md}、UPSTREAM.md、src/paths.mjs、src/store.mjs、src/config.mjs。
   - 统一上游路径为 BILI_DRAGON_DATA；不重设 HOME/USERPROFILE，不继承作者账号。
   - 验证：node --test test/storage.test.mjs；检查所有硬编码目录和凭据输出。
2. 工具与账号/权限
   - src/upstream.mjs、src/service.mjs、src/policy.mjs、server.mjs、skills/bili-dragon/SKILL.md、plugin.json、mcp.json、.codex-plugin/plugin.json。
   - 结构化工具读取素材与图片、写双日记、创建回复草稿；所有发送经开关、限额和幂等账本。真实发送默认禁用。
   - 验证：node --test test/service.test.mjs test/mcp.test.mjs，模拟 transport 检查参数与拒绝行为。
3. 自主作息和消息后台
   - src/schedule.mjs、src/queue.mjs、src/codex.mjs、src/daemon.mjs、src/listeners.mjs。
   - 持久计划、独占锁、任务去重、未知派发保留；官方 app-server 会话与动态工具；私信/评论/直播分别启停、失败退避。
   - 验证：node --test test/schedule.test.mjs test/queue.test.mjs test/codex.test.mjs test/listeners.test.mjs。离线 fake app-server 验证协议，不消耗账户模型额度。
4. 本地管理界面与启动
   - src/http.mjs、web/{index.html,app.js,style.css}、bin/dragon.mjs、scripts/{install,doctor,package}.mjs。
   - 配置表单、凭据隐藏输入、日记/草稿审核、手动运行、暂停与错误状态。CLI 提供 doctor/start/mcp/install；无自启。
   - 验证：node --test test/http.test.mjs；本机回环启动与 HTTP 请求；可用时后台浏览器截图验证，不操作桌面鼠标键盘。
5. 文档、打包与公开仓库
   - README.md、LICENSE、.gitignore、docs/usage.md、验证记录。
   - 完成 npm test 和 npm run check，检查无凭据/个人日记/环境绝对路径进入发布清单；创建 Cansiny0320/codex-bili-dragon 公开仓库并上传已验证源码。
   - 交付注明已验证项和需要本人 B 站登录才能实测的项。不要将匿名/模拟成功写成账号端到端成功。

命令副作用：依赖安装写 node_modules/lockfile；测试仅写 OS 临时目录；后台启动写 data/；doctor 默认本地检查，online 模式才请求账号；install 才注册本地 MCP。所有外部写验证使用模拟。无自动修复 lint，无开机任务。失败先定位本次改动相关根因；上游不相关基线失败记录，不顺手修复。
