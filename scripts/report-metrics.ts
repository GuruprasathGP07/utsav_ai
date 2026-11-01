import fs from 'node:fs';
import path from 'node:path';

/** @fileoverview Script to calculate and report codebase size, LOC, and bundle metrics. */

function countLines(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

function scanDir(dir: string, ext: string[]): { files: number; lines: number; bytes: number } {
  let files = 0;
  let lines = 0;
  let bytes = 0;

  if (!fs.existsSync(dir)) return { files, lines, bytes };

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== 'dist-server') {
        const sub = scanDir(full, ext);
        files += sub.files;
        lines += sub.lines;
        bytes += sub.bytes;
      }
    } else if (ext.some(e => entry.name.endsWith(e))) {
      files++;
      lines += countLines(full);
      bytes += fs.statSync(full).size;
    }
  }

  return { files, lines, bytes };
}

const root = process.cwd();
const srcStats = scanDir(path.join(root, 'src'), ['.ts', '.tsx', '.css']);
const serverStats = scanDir(path.join(root, 'server'), ['.ts']);
const testStats = scanDir(path.join(root, 'tests'), ['.ts', '.tsx']);

console.log('==================================================');
console.log('              UTSAVAI CODEBASE METRICS            ');
console.log('==================================================');
console.log(`Frontend (src/):    ${srcStats.files} files, ${srcStats.lines} lines, ${(srcStats.bytes / 1024).toFixed(1)} KB`);
console.log(`Backend (server/):  ${serverStats.files} files, ${serverStats.lines} lines, ${(serverStats.bytes / 1024).toFixed(1)} KB`);
console.log(`Tests (tests/):     ${testStats.files} files, ${testStats.lines} lines, ${(testStats.bytes / 1024).toFixed(1)} KB`);
console.log('--------------------------------------------------');
console.log(`Total:              ${srcStats.files + serverStats.files + testStats.files} files, ${srcStats.lines + serverStats.lines + testStats.lines} lines`);
console.log('==================================================');

