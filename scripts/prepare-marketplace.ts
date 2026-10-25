import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareMarketplace } from './marketplace.ts';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
console.log(
  JSON.stringify(
    prepareMarketplace(path.join(root, 'dist/plugin'), path.join(root, 'dist/marketplace')),
    null,
    2,
  ),
);

const output = path.join(root, 'dist/marketplace');
fs.copyFileSync(path.join(root, 'dist/plugin/INSTALL.md'), path.join(output, 'INSTALL.md'));
fs.writeFileSync(
  path.join(output, 'README.md'),
  '# B 站小白龙\n\n在 Codex 里按兴趣逛 B 站、写日记、分享视频和回复消息。\n\n这是预构建插件市场，下载后无需编译。安装步骤见 [安装指南](INSTALL.md)。\n\n项目介绍、截图和使用说明见 [项目主页](https://github.com/Cansiny0320/codex-bili-dragon)。也可以下载 [Release 安装包](https://github.com/Cansiny0320/codex-bili-dragon/releases/latest)。\n',
);
