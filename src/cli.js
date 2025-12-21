import { Command } from 'commander';
import runScan from './commands/scan.js';
import runReport from './commands/report.js';
import runPatch from './commands/patch.js';

import runCheck from './commands/check.js';
import runLint from './commands/lint.js';
import runDeps from './commands/deps.js';
import runDupes from './commands/dupes.js';
import runComplexity from './commands/complexity.js';
import runFuzz from './commands/fuzz.js';
import runInsights from './commands/insights.js';
import runInit from './commands/init.js';
import runWatch from './commands/watch.js';
import generateHtmlReport from './commands/html-report.js';
import showTrends from './commands/trends.js';
import runFix from './commands/fix.js';

const program = new Command();
program
  .name('sweepstacx')
  .description('Repo sweeper for modern dev stacks: scan, report, patch.')
  .version('0.4.0');

program
  .command('scan')
  .option('--path <path>', 'path to scan', '.')
  .option('--lang <lang>', 'language hint (js, ts)', 'js')
  .option('--config <file>', 'config file (.sweeperc.json)')
  .option('--no-cache', 'disable caching for fresh scan')
  .option('--git-diff', 'only scan files changed in git')
  .option('--since <ref>', 'git ref to compare against (default: HEAD)', 'HEAD')
  .action(async (opts) => { await runScan(opts); });

program
  .command('report')
  .option('--out <base>', 'basename for outputs (json/md)', 'sweepstacx-report')
  .option('--json', 'output JSON to stdout', false)
  .option('--md', 'output Markdown to stdout', false)
  .action(async (opts) => { await runReport(opts); });

program
  .command('patch')
  .option('--apply', 'apply generated patches with git apply', false)
  .action(async (opts) => { await runPatch(opts); });

program
  .command('check')
  .description('stats-only CI mode')
  .option('--path <path>', 'path to scan', '.')
  .option('--config <file>', 'config file (.sweeperc.json)')
  .action(async (opts) => { await runCheck(opts); });

program
  .command('lint')
  .option('--path <path>', 'path to lint', '.')
  .option('--fix', 'apply eslint --fix', false)
  .action(async (opts) => { await runLint(opts); });

program
  .command('deps')
  .option('--path <path>', 'path to analyze', '.')
  .action(async (opts) => { await runDeps(opts); });

program
  .command('dupes')
  .option('--path <path>', 'path to analyze', '.')
  .option('--min-lines <n>', 'minimum duplicate block lines', '5')
  .action(async (opts) => { await runDupes(opts); });

program
  .command('complexity')
  .option('--path <path>', 'path to analyze', '.')
  .action(async (opts) => { await runComplexity(opts); });

program
  .command('fuzz')
  .argument('<file>', 'target JS file to fuzz')
  .option('--timeout <ms>', 'timeout per case (ms)', '5000')
  .action(async (file, opts) => { await runFuzz(file, opts); });

program
  .command('insights')
  .description('Advanced code analysis with actionable recommendations')
  .option('--path <path>', 'path to analyze', '.')
  .action(async (opts) => { await runInsights(opts); });

program
  .command('init')
  .description('Create a .sweeperc.json configuration file')
  .option('--force', 'overwrite existing configuration')
  .action(async (opts) => { await runInit(opts); });

program
  .command('watch')
  .description('Watch files and re-scan on changes (development mode)')
  .option('--path <path>', 'path to watch', '.')
  .option('--no-cache', 'disable caching')
  .action(async (opts) => { await runWatch(opts); });

program
  .command('html')
  .description('Generate interactive HTML report from scan results')
  .option('--output <file>', 'output HTML file', 'sweepstacx-report.html')
  .action(async (opts) => { await generateHtmlReport(opts); });

program
  .command('trends')
  .description('Show code quality trends over time')
  .option('--path <path>', 'path to analyze', '.')
  .option('--detailed', 'show detailed history')
  .option('--chart', 'show ASCII chart')
  .action(async (opts) => { await showTrends(opts); });

program
  .command('fix')
  .description('Auto-fix issues from scan report')
  .option('--verify', 'suggest running scan after fixes')
  .action(async (opts) => { await runFix(opts); });

program.parseAsync(process.argv);
