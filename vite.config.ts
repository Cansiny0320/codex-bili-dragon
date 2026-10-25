import { defineConfig } from 'vite-plus';
export default defineConfig({
  test: { include: ['test/**/*.test.ts'], testTimeout: 30000 },
  lint: {
    ignorePatterns: [
      'vendor/**',
      'plugins/**',
      'dist/**',
      'docs/design/**',
      'apps/dashboard/src/routeTree.gen.ts',
    ],
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    ignorePatterns: [
      'apps/dashboard/src/routeTree.gen.ts',
      'vendor/**',
      'plugins/**',
      'dist/**',
      'docs/design/**',
      'pnpm-lock.yaml',
    ],
    singleQuote: true,
  },
});
