# TypeScript 与管理页迁移

用户已批准：自有源码严格 TypeScript、pnpm workspace、Vite+；React 19、TanStack Start/Router、Tailwind CSS v4、shadcn/ui base-nova、Lucide、oRPC。原版固定版本第三方 JS 保留来源，不迁入通用工具库。仍只在本机运行。

## 验收合同

- packages/runtime 承载已有调度、队列、Codex app-server、MCP、B 站策略和存储；apps/dashboard 承载 SSR 管理页。保持原 data 文件格式和默认关闭的权限，不迁移或暴露凭据。
- 使用 docs/design 中八张 imagegen 设计图，分别实现首页、观看记录、日记、待我审核、个性与兴趣、活动时间、操作权限、账号连接。保持图示排版、配色、间距和组件风格；只显示真实数据和实际支持功能，示例素材不写入用户数据。所有入口可以操作，空状态/错误状态可用，移动屏幕无横向溢出。
- oRPC 统一管理接口，维持 loopback、Host、Origin、token 检查；模型目录不能批准草稿或改权限。原 REST 接口兼容一版供既有测试/调用。
- 查看已探索素材使用已保存的读取结果，不为渲染页面隐式请求 B 站。可选视频元信息随既有读取捕获；旧数据无封面时正确降级。
- README 参考 Nexlet，中文 README.md 与 English README.en.md 简明互链；复用实际赞助图。

## 边界

不注册远程资源、不部署网站、不导入真实凭据、不发送 B 站消息、不改全局 Codex 配置。两个新项目由各自会话负责，不能改其目录。原版 JS 是有许可证的 vendored 第三方代码，自有实现不使用 ts-ignore/nocheck 绕过严格检查。

## 风险与回滚

app-server 动态工具是实验接口，继续用真实已安装版本做无生成协议探测。TypeScript/构建路径可能影响插件启动和 vendor imports，必须做打包入口和实际 MCP 握手。保留数据格式，回滚代码至 60ea685 即可使用原版数据。
