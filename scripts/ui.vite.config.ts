import { defineConfig } from 'vite-plus';
export default defineConfig({
  test: { include: ['scripts/*ui-check.test.ts'], testTimeout: 120000 },
});
