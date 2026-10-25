import { defineConfig } from 'vite-plus';
export default defineConfig({
  test: { include: ['scripts/package-smoke.test.ts'], testTimeout: 30000 },
});
