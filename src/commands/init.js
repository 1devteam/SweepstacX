import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import pc from 'picocolors';

/**
 * Initialize a new SweepstacX configuration file
 */
export default async function runInit(opts = {}) {
  const configPath = resolve(process.cwd(), '.sweeperc.json');
  
  if (existsSync(configPath) && !opts.force) {
    console.log(pc.yellow('⚠️  Configuration file already exists: .sweeperc.json'));
    console.log(pc.gray('   Use --force to overwrite'));
    return;
  }
  
  console.log(pc.cyan('\n🔧 Creating SweepstacX configuration...\n'));
  
  const config = {
    "$schema": "https://raw.githubusercontent.com/1devteam/SweepstacX/main/docs/config-schema.json",
    "complexity": {
      "maxFunction": 15,
      "maxAverage": 10,
      "minMaintainability": 65
    },
    "duplication": {
      "maxLines": 10,
      "maxPercent": 8
    },
    "lint": {
      "maxErrors": 0,
      "maxWarningsPerKLOC": 10
    },
    "deps": {
      "unused": 0,
      "missing": 0
    },
    "fuzz": {
      "timeout": 5000,
      "crashes": 0
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
    "cache": {
      "enabled": true,
      "maxAge": 3600000
    }
  };
  
  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
  
  console.log(pc.green('✓'), 'Created .sweeperc.json');
  console.log(pc.gray('\n  Next steps:'));
  console.log(pc.gray('    1. Review and customize the configuration'));
  console.log(pc.gray('    2. Run: sweepstacx scan'));
  console.log(pc.gray('    3. Check: sweepstacx check\n'));
}
