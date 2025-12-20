import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';

describe('Report Command', () => {
  beforeEach(() => {
    // Create a mock scan report
    const mockReport = {
      meta: {
        tool: 'SweepstacX',
        version: '0.1.7',
        scanned_at: new Date().toISOString(),
        root: process.cwd()
      },
      warnings: [],
      stats: {
        files_scanned: 10,
        unused_imports: 2,
        dead_files: 1,
        duplicate_blocks: 0,
        stale_dependencies: 1
      },
      issues: [
        { type: 'unused_import', file: 'test.js', symbol: 'unused' },
        { type: 'dead_file', file: 'dead.js', message: 'Never imported' },
        { type: 'stale_dependency', name: 'old-pkg', version: '0.1.0', reason: 'Pre-1.0', category: 'pre-release' }
      ]
    };

    writeFileSync('sweepstacx-report.json', JSON.stringify(mockReport, null, 2));
  });

  afterEach(() => {
    // Clean up
    if (existsSync('sweepstacx-report.json')) rmSync('sweepstacx-report.json');
    if (existsSync('test-report.json')) rmSync('test-report.json');
    if (existsSync('test-report.md')) rmSync('test-report.md');
  });

  it('generates JSON and MD files by default', () => {
    execSync('node bin/sweepstacx report --out test-report', { stdio: 'inherit' });

    expect(existsSync('test-report.json')).toBe(true);
    expect(existsSync('test-report.md')).toBe(true);

    const json = JSON.parse(readFileSync('test-report.json', 'utf8'));
    expect(json.stats).toBeDefined();
    expect(json.stats.files_scanned).toBeGreaterThan(0);
  });

  it('outputs JSON to stdout with --json flag', () => {
    const output = execSync('node bin/sweepstacx report --json', { encoding: 'utf8' });
    const json = JSON.parse(output);

    expect(json.stats.files_scanned).toBeGreaterThan(0);
    expect(json.stats.unused_imports).toBeGreaterThanOrEqual(0);
  });

  it('outputs Markdown to stdout with --md flag', () => {
    const output = execSync('node bin/sweepstacx report --md', { encoding: 'utf8' });

    expect(output).toContain('# SweepstacX — Scan Report');
    expect(output).toContain('Files scanned:');
    expect(output).toContain('Unused Imports');
    expect(output).toContain('Dead Files');
  });

  it('includes all issue types in markdown output', () => {
    const output = execSync('node bin/sweepstacx report --md', { encoding: 'utf8' });

    expect(output).toContain('### Unused Imports');
    expect(output).toContain('### Dead Files');
    expect(output).toContain('### Stale Dependencies');
    expect(output).toContain('old-pkg@0.1.0');
  });
});
