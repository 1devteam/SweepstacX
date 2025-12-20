import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectDeadFiles } from '../src/analyzers/dead-files.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Dead Files Detection', () => {
  const testDir = resolve(process.cwd(), 'tests/fixtures/dead-files-test');

  beforeEach(() => {
    // Create test directory
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    rmSync(testDir, { recursive: true, force: true });
  });

  it('detects files that are never imported', async () => {
    // Create test files
    const entryFile = resolve(testDir, 'index.js');
    const usedFile = resolve(testDir, 'used.js');
    const deadFile = resolve(testDir, 'dead.js');

    writeFileSync(entryFile, 'import { foo } from \'./used.js\';\nconsole.log(foo);');
    writeFileSync(usedFile, 'export const foo = 42;');
    writeFileSync(deadFile, 'export const bar = 99;');

    const files = [entryFile, usedFile, deadFile];
    const deadFiles = await detectDeadFiles(files, testDir);

    expect(deadFiles).toContain('dead.js');
    expect(deadFiles).not.toContain('used.js');
    expect(deadFiles).not.toContain('index.js');
  });

  it('handles circular imports correctly', async () => {
    const fileA = resolve(testDir, 'a.js');
    const fileB = resolve(testDir, 'b.js');
    const fileC = resolve(testDir, 'index.js');

    writeFileSync(fileA, 'import { b } from \'./b.js\';\nexport const a = 1;');
    writeFileSync(fileB, 'import { a } from \'./a.js\';\nexport const b = 2;');
    writeFileSync(fileC, 'import { a } from \'./a.js\';');

    const files = [fileA, fileB, fileC];
    const deadFiles = await detectDeadFiles(files, testDir);

    // All files should be reachable from index.js
    expect(deadFiles.length).toBe(0);
  });

  it('identifies entry points correctly', async () => {
    const mainFile = resolve(testDir, 'main.js');
    const utilFile = resolve(testDir, 'util.js');

    writeFileSync(mainFile, 'import { util } from \'./util.js\';');
    writeFileSync(utilFile, 'export const util = () => {};');

    const files = [mainFile, utilFile];
    const deadFiles = await detectDeadFiles(files, testDir);

    expect(deadFiles.length).toBe(0);
  });
});
