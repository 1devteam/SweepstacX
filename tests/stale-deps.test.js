import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectStaleDeps, detectUnusedDeps } from '../src/analyzers/stale-deps.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Stale Dependencies Detection', () => {
  const testDir = resolve(process.cwd(), 'tests/fixtures/stale-deps-test');

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('detects deprecated dependencies', async () => {
    const pkgJson = {
      dependencies: {
        'request': '^2.88.0',
        'express': '^4.18.0'
      }
    };

    writeFileSync(resolve(testDir, 'package.json'), JSON.stringify(pkgJson, null, 2));

    const result = await detectStaleDeps(testDir);

    expect(result.stale.length).toBeGreaterThan(0);
    const requestDep = result.stale.find(d => d.name === 'request');
    expect(requestDep).toBeDefined();
    expect(requestDep.type).toBe('deprecated');
  });

  it('detects wildcard versions', async () => {
    const pkgJson = {
      dependencies: {
        'lodash': '*',
        'express': '^4.18.0'
      }
    };

    writeFileSync(resolve(testDir, 'package.json'), JSON.stringify(pkgJson, null, 2));

    const result = await detectStaleDeps(testDir);

    const wildcardDep = result.stale.find(d => d.name === 'lodash');
    expect(wildcardDep).toBeDefined();
    expect(wildcardDep.type).toBe('wildcard');
  });

  it('detects pre-1.0 versions', async () => {
    const pkgJson = {
      dependencies: {
        'some-lib': '^0.5.2',
        'stable-lib': '^2.0.0'
      }
    };

    writeFileSync(resolve(testDir, 'package.json'), JSON.stringify(pkgJson, null, 2));

    const result = await detectStaleDeps(testDir);

    const preReleaseDep = result.stale.find(d => d.name === 'some-lib');
    expect(preReleaseDep).toBeDefined();
    expect(preReleaseDep.type).toBe('pre-release');
  });

  it('handles missing package.json gracefully', async () => {
    const result = await detectStaleDeps(testDir);

    expect(result.stale).toEqual([]);
    expect(result.unused).toEqual([]);
  });
});

describe('Unused Dependencies Detection', () => {
  const testDir = resolve(process.cwd(), 'tests/fixtures/unused-deps-test');

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('detects unused dependencies', async () => {
    const pkgJson = {
      dependencies: {
        'lodash': '^4.17.21',
        'unused-package': '^1.0.0'
      }
    };

    const indexFile = resolve(testDir, 'index.js');
    writeFileSync(resolve(testDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
    writeFileSync(indexFile, 'import _ from \'lodash\';\nconsole.log(_);');

    const unused = await detectUnusedDeps(testDir, [indexFile]);

    expect(unused).toContain('unused-package');
    expect(unused).not.toContain('lodash');
  });
});
