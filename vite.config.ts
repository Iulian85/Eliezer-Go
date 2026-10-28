import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, '.') } },
  server: { proxy: { '/api': 'http://127.0.0.1:3000', '/tonconnect-manifest.json': 'http://127.0.0.1:3000' } },
});
