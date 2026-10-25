import { defineConfig, type Plugin } from 'vite-plus';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

function appHtml(): Plugin {
  return {
    name: 'mcp-app-html',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const scripts: string[] = [],
        styles: string[] = [];
      for (const [name, output] of Object.entries(bundle)) {
        if (output.type === 'chunk') scripts.push(output.code);
        else if (name.endsWith('.css')) styles.push(String(output.source));
        delete bundle[name];
      }
      this.emitFile({
        type: 'asset',
        fileName: 'index.html',
        source:
          '<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>B 站小白龙</title><style>' +
          styles.join('\n').replaceAll('</style', '<\\/style') +
          '</style></head><body><div id="root">正在连接小白龙…</div><script>' +
          scripts.join('\n').replaceAll('</script', '<\\/script') +
          '</script></body></html>',
      });
    },
  };
}
export default defineConfig({
  plugins: [tailwind(), react(), appHtml()],
  build: {
    outDir: '../../dist/mcp-app',
    emptyOutDir: true,
    lib: { entry: 'src/mcp-app.tsx', name: 'BiliDragonApp', formats: ['iife'], fileName: 'app' },
    cssCodeSplit: false,
  },
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  resolve: { tsconfigPaths: true },
});
