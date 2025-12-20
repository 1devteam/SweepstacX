import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, defaultConfig } from '../src/utils/config.js';
import { writeFileSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Config Utility', () => {
  const testConfigPath = resolve(process.cwd(), '.sweeperc.json');

  afterEach(() => {
    if (existsSync(testConfigPath)) {
      rmSync(testConfigPath);
    }
  });

  it('returns default config when no config file exists', async () => {
    const config = await loadConfig();

    expect(config).toEqual(defaultConfig);
    expect(config.complexity.maxFunction).toBe(10);
    expect(config.deps.unused).toBe(0);
  });

  it('merges user config with defaults', async () => {
    const userConfig = {
      complexity: {
        maxFunction: 20
      },
      deps: {
        unused: 5
      }
    };

    writeFileSync(testConfigPath, JSON.stringify(userConfig, null, 2));

    const config = await loadConfig();

    expect(config.complexity.maxFunction).toBe(20);
    expect(config.complexity.maxAverage).toBe(8); // from default
    expect(config.deps.unused).toBe(5);
    expect(config.deps.missing).toBe(0); // from default
  });

  it('loads config from custom path', async () => {
    const customPath = resolve(process.cwd(), 'custom-config.json');
    const userConfig = {
      complexity: {
        maxFunction: 15
      }
    };

    writeFileSync(customPath, JSON.stringify(userConfig, null, 2));

    const config = await loadConfig('.', customPath);

    expect(config.complexity.maxFunction).toBe(15);

    rmSync(customPath);
  });

  it('handles invalid JSON gracefully', async () => {
    writeFileSync(testConfigPath, 'invalid json {{{');

    const config = await loadConfig();

    expect(config).toEqual(defaultConfig);
  });
});
