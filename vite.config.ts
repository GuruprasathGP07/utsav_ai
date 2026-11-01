import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @fileoverview Vite config — proxies /api to Express in dev, builds to dist/ for production. */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@engine':     path.resolve(__dirname, 'src/engine'),
      '@schemas':    path.resolve(__dirname, 'src/schemas'),
      '@state':      path.resolve(__dirname, 'src/state'),
      '@lib':        path.resolve(__dirname, 'src/lib'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@locales':    path.resolve(__dirname, 'src/locales'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react:    ['react', 'react-dom', 'react-router-dom'],
          framer:   ['framer-motion'],
          recharts: ['recharts'],
          i18n:     ['i18next', 'react-i18next'],
        },
      },
    },
  },
});
