import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('codebase hygiene', () => {
  const engineDir = path.resolve(__dirname, '../../src/engine');
  const serverDir = path.resolve(__dirname, '../../server');

  function getFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getFiles(fullPath));
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  it('no console.log or console.warn in src/engine', () => {
    const engineFiles = getFiles(engineDir);
    for (const file of engineFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/\bconsole\.(log|warn|info|debug)\b/);
    }
  });

  it('no TODO or FIXME or STUB comments in src/engine or server', () => {
    const files = [...getFiles(engineDir), ...getFiles(serverDir)];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/\b(TODO|FIXME|STUB)\b/i);
    }
  });
});

