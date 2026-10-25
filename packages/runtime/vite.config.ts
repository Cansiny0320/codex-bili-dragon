import { defineConfig } from 'vite-plus';
export default defineConfig({
  pack: {
    entry: [
      'src/cli.ts',
      'src/mcp.ts',
      'src/worker.ts',
      'src/update-runner.ts',
      'src/policy.ts',
      'src/vendor-paths.ts',
    ],
    format: ['esm'],
    outDir: '../../dist/runtime',
    sourcemap: true,
    outExtensions: () => ({ js: '.js' }),
    deps: { alwaysBundle: [/./], onlyBundle: false, onlyImport: [] },
    dts: false,
  },
});
