import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @fileoverview Vitest config — three projects: unit, server, a11y. */
export default defineConfig({
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
  test: {
    exclude: ['frontend/**', 'backend/**', 'node_modules/**', 'dist/**', 'dist-server/**'],
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/engine/**', 'tests/schemas/**', 'tests/hygiene/**'],
          environment: 'node',
          coverage: {
            provider: 'v8',
            include: ['src/engine/**', 'src/schemas/**'],
            thresholds: { lines: 100, functions: 100, statements: 100, branches: 98 },
          },
        },
      },
      {
        test: {
          name: 'server',
          include: ['tests/server/**'],
          environment: 'node',
          setupFiles: ['tests/server/setup.ts'],
        },
      },
      {
        test: {
          name: 'ui',
          include: ['tests/ui/**'],
          environment: 'jsdom',
          setupFiles: ['tests/ui/setup.ts'],
          globals: true,
        },
      },
      {
        test: {
          name: 'a11y',
          include: ['tests/ui/a11y.test.tsx'],
          environment: 'jsdom',
          setupFiles: ['tests/ui/setup.ts'],
          globals: true,
        },
      },
    ],
  },
});
