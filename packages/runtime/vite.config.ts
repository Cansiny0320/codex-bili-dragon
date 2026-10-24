import { defineConfig } from 'vite-plus';
export default defineConfig({
  pack: {
    entry: ['src/cli.ts', 'src/mcp.ts', 'src/policy.ts', 'src/vendor-paths.ts'],
    format: ['esm'],
    outDir: '../../dist/runtime',
    sourcemap: true,
    outExtensions: () => ({ js: '.js' }),
    unbundle: true,
    dts: false,
  },
});
