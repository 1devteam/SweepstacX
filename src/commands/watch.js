import chokidar from 'chokidar';
import { resolve } from 'node:path';
import pc from 'picocolors';
import runScan from './scan.js';

let isScanning = false;
let scanQueued = false;

/**
 * Watch mode - continuously monitor files and re-scan on changes
 */
export default async function runWatch(opts = {}) {
  const root = resolve(process.cwd(), opts.path || '.');
  
  console.log(pc.cyan('\n👀 SweepstacX Watch Mode\n'));
  console.log(pc.gray(`Watching: ${root}`));
  console.log(pc.gray('Press Ctrl+C to stop\n'));
  
  // Initial scan
  console.log(pc.yellow('Running initial scan...\n'));
  await performScan(opts);
  
  // Watch for changes
  const patterns = [
    `${root}/**/*.js`,
    `${root}/**/*.mjs`,
    `${root}/**/*.cjs`,
    `${root}/**/*.ts`,
    `${root}/**/*.tsx`,
  ];
  
  const watcher = chokidar.watch(patterns, {
    ignored: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.git/**',
      '**/sweepstacx-report.*',
    ],
    persistent: true,
    ignoreInitial: true,
  });
  
  watcher.on('change', async (path) => {
    console.log(pc.gray(`\n📝 File changed: ${path}`));
    await debouncedScan(opts);
  });
  
  watcher.on('add', async (path) => {
    console.log(pc.gray(`\n➕ File added: ${path}`));
    await debouncedScan(opts);
  });
  
  watcher.on('unlink', async (path) => {
    console.log(pc.gray(`\n➖ File removed: ${path}`));
    await debouncedScan(opts);
  });
  
  watcher.on('error', (error) => {
    console.error(pc.red('\n✖ Watcher error:'), error.message);
  });
  
  // Keep process alive
  process.on('SIGINT', () => {
    console.log(pc.cyan('\n\n👋 Stopping watch mode...'));
    watcher.close();
    process.exit(0);
  });
}

/**
 * Perform a scan with error handling
 */
async function performScan(opts) {
  try {
    await runScan(opts);
  } catch (error) {
    console.error(pc.red('\n✖ Scan error:'), error.message);
  }
}

/**
 * Debounced scan to avoid multiple scans in quick succession
 */
async function debouncedScan(opts) {
  if (isScanning) {
    scanQueued = true;
    return;
  }
  
  isScanning = true;
  
  // Small delay to batch rapid changes
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log(pc.yellow('\n🔄 Re-scanning...\n'));
  await performScan(opts);
  
  isScanning = false;
  
  // If another scan was queued, run it now
  if (scanQueued) {
    scanQueued = false;
    await debouncedScan(opts);
  }
}
