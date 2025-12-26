import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { readJSON } from '../utils/fs.js';
import pc from 'picocolors';

/**
 * Initialize a new SweepstacX configuration file
 */

async function detectFramework(packageJsonPath) {
  if (!existsSync(packageJsonPath)) return 'javascript';

  try {
    const pkg = await readJSON(packageJsonPath);
    const deps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.optionalDependencies,
    };

    if (deps['react'] || deps['react-dom']) return 'react';
    if (deps['vue']) return 'vue';
    if (deps['@angular/core']) return 'angular';
    if (deps['svelte']) return 'svelte';

    if (deps['typescript']) return 'typescript';

    return 'javascript';
  } catch (e) {
    console.error(pc.red(`Error reading package.json: ${e.message}`));
    return 'javascript';
  }
}



export default async function runInit(opts = {}) {
  const configPath = resolve(process.cwd(), '.sweeperc.json');
  const packageJsonPath = resolve(process.cwd(), 'package.json');
  
  if (existsSync(configPath) && !opts.force) {
    console.log(pc.yellow('⚠️  Configuration file already exists: .sweeperc.json'));
    console.log(pc.gray('   Use --force to overwrite'));
    return;
  }
  
  const detectedFramework = await detectFramework(packageJsonPath);
  const fileGlobs = getFrameworkGlobs(detectedFramework);
  
  console.log(pc.cyan('\n🔧 Creating SweepstacX configuration...\n'));
  console.log(pc.gray(`  Detected project type: ${detectedFramework.toUpperCase()}`));
  
  const config = {
    "$schema": "https://raw.githubusercontent.com/1devteam/SweepstacX/main/docs/config-schema.json",
    "complexity": {
      "maxFunction": 15,
      "maxAverage": 10,
      "minMaintainability": 65
    },
    "ignore": [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      ".git/**",
      "*.min.js",
      "vendor/**"
    ],
    "typescript": {
      "enabled": true,
      "checkTypeImports": true
    },
    "framework": {
      "type": detectedFramework
    },
    "cache": {
      "enabled": true,
      "maxAge": 3600000
    }
  };
  
  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
  
  console.log(pc.green('✓'), 'Created .sweeperc.json');
  console.log(pc.gray(`  File globs configured: ${fileGlobs.join(', ')}`));
  console.log(pc.gray('\n  Next steps:'));
  console.log(pc.gray('    1. Review and customize the configuration'));
  console.log(pc.gray('    2. Run: sweepstacx scan'));
  console.log(pc.gray('    3. Check: sweepstacx check\n'));
}
