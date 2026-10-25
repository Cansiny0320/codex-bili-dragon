import { defineConfig } from 'vite-plus';
export default defineConfig({
  test: { include: ['scripts/behavior-check.test.ts'], testTimeout: 900000 },
});
