import { defineConfig } from 'vite-plus';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
export default defineConfig({
  plugins: [tailwind(), tanstackStart(), react()],
  ssr: { noExternal: true },
  build: { outDir: '../../dist/dashboard', emptyOutDir: true },
  server: { host: '127.0.0.1', port: 18842 },
  resolve: { tsconfigPaths: true },
});
