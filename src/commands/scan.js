import fg from 'fast-glob';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { detectDeadFiles } from '../analyzers/dead-files.js';
import { detectStaleDeps } from '../analyzers/stale-deps.js';
import { detectUnusedTypeScriptImports } from '../analyzers/typescript.js';
import { startProgress, incrementProgress, stopProgress, showSpinner } from '../utils/progress.js';
import { getCache, setCache, getFileCacheKey } from '../utils/cache.js';
import { handleError, showSuccess, showWarning } from '../utils/errors.js';
import { getChangedFiles, getRepoInfo } from '../utils/git-integration.js';
import { saveMetrics } from '../utils/metrics.js';

export default async function runScan(opts = {}) {
  try {
    const root = resolve(process.cwd(), opts.path || '.');
    
    // Git integration: only scan changed files if --git-diff is enabled
    let gitFilteredFiles = null;
    if (opts.gitDiff) {
      const repoInfo = await getRepoInfo(root);
      if (repoInfo.isGitRepo) {
        console.log(pc.cyan('🔍 Git mode enabled'));
        console.log(pc.gray(`  Branch: ${repoInfo.branch}`));
        console.log(pc.gray(`  Changed files: ${repoInfo.changedFiles}`));
        gitFilteredFiles = await getChangedFiles(root, { since: opts.since || 'HEAD' });
        if (gitFilteredFiles && gitFilteredFiles.length === 0) {
          showSuccess('No changed files to scan');
          return;
        }
      } else {
        showWarning('Not a git repository, scanning all files');
      }
    }

  let files = await fg(
    [
      `${root}/**/*.js`,
      `${root}/**/*.mjs`,
      `${root}/**/*.cjs`,
      `${root}/**/*.ts`,
      `${root}/**/*.tsx`
    ],
    { ignore: ['**/node_modules/**','**/dist/**','**/coverage/**','**/.git/**'], dot: false }
  );
  
  // Filter to only changed files if git mode is enabled
  if (gitFilteredFiles && gitFilteredFiles.length > 0) {
    const gitFileSet = new Set(gitFilteredFiles);
    files = files.filter(file => gitFileSet.has(resolve(file)));
    console.log(pc.gray(`  Scanning ${files.length} changed files`));
  }

  const warnings = [];
  if (files.length === 0) {
    const msg = 'No files matched scan patterns (*.js, *.mjs, *.cjs). Check --path or ignore globs.';
    warnings.push(msg);
    console.warn('⚠️  ' + msg);
  }

  const issues = [];
  
  // Show progress for file scanning
  const useCache = !opts.noCache;
  startProgress(files.length, 'Scanning files');
  
  for (const file of files) {
    // Check cache first
    const cacheKey = useCache ? await getFileCacheKey(file, 'scan') : null;
    let fileIssues = useCache ? await getCache(cacheKey) : null;
    
    if (!fileIssues) {
      const src = await readFile(file, 'utf8');
      
      // Determine if TypeScript or JavaScript
      const isTypeScript = file.endsWith('.ts') || file.endsWith('.tsx');
      
      const unused = isTypeScript 
        ? detectUnusedTypeScriptImports(src)
        : detectUnusedImports(src);
      
      fileIssues = unused.map(sym => ({
        type: 'unused_import',
        file: relative(process.cwd(), file),
        symbol: sym,
        language: isTypeScript ? 'typescript' : 'javascript',
      }));
      
      // Cache results
      if (useCache && cacheKey) {
        await setCache(cacheKey, fileIssues);
      }
    }
    
    issues.push(...fileIssues);
    incrementProgress();
  }
  
  stopProgress();

  // Detect dead files with spinner
  const spinner = showSpinner('Analyzing file dependencies...');
  const deadFiles = await detectDeadFiles(files, root);
  spinner.stop('Dead file analysis complete');
  for (const file of deadFiles) {
    issues.push({
      type: 'dead_file',
      file,
      message: 'File is never imported by any other file',
    });
  }

  // Detect stale dependencies
  const staleDepsResult = await detectStaleDeps(root);
  for (const dep of staleDepsResult.stale) {
    issues.push({
      type: 'stale_dependency',
      name: dep.name,
      version: dep.version,
      reason: dep.reason,
      category: dep.type,
    });
  }

  const stats = {
    files_scanned: files.length,
    unused_imports: issues.filter(i => i.type === 'unused_import').length,
    duplicate_blocks: 0,
    dead_files: deadFiles.length,
    stale_dependencies: staleDepsResult.stale.length,
  };

  const report = {
    meta: { tool: 'SweepstacX', version: '0.4.0', scanned_at: new Date().toISOString(), root },
    warnings,
    stats,
    issues
  };

  await writeFile(resolve(process.cwd(), 'sweepstacx-report.json'), JSON.stringify(report, null, 2));
  await writeFile(resolve(process.cwd(), 'sweepstacx-report.md'), renderMarkdown(report), 'utf8');
  
  // Save metrics for trend analysis
  await saveMetrics(report, root);

  showSuccess(`Scan complete. files=${stats.files_scanned}, unused_imports=${stats.unused_imports}, dead_files=${stats.dead_files}, stale_deps=${stats.stale_dependencies}${warnings.length ? `, warnings=${warnings.length}` : ''}`);
  } catch (error) {
    stopProgress(); // Ensure progress bar is stopped
    handleError(error, 'scan');
  }
}

/**
 * Unused import detector (indent + multi-line; skips side-effect imports)
 */
function detectUnusedImports(code) {
  const unused = [];
  const re = /^\s*import\s+(?!['"])([\s\S]*?)\s+from\s+['"][^'"]+['"]/gm;

  let m;
  while ((m = re.exec(code))) {
    const clause = m[1].trim();

    // namespace: import * as ns from 'x'
    const nsMatch = clause.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
    if (nsMatch) {
      if (!isUsed(code, nsMatch[1], m.index, m[0].length)) unused.push(nsMatch[1]);
      continue;
    }

    // default + named
    let defaultName = null;
    let namedBlock = null;
    const firstComma = topLevelCommaIndex(clause);

    if (firstComma === -1) {
      if (clause.startsWith('{')) namedBlock = clause;
      else defaultName = clause;
    } else {
      defaultName = clause.slice(0, firstComma).trim();
      namedBlock  = clause.slice(firstComma + 1).trim();
    }

    if (defaultName && !defaultName.startsWith('{')) {
      if (!isUsed(code, defaultName, m.index, m[0].length)) unused.push(defaultName);
    }

    if (namedBlock) {
      const inner = (namedBlock.match(/\{([^}]*)\}/) || [null, ''])[1];
      for (const raw of inner.split(',').map(s => s.trim()).filter(Boolean)) {
        const alias = raw.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/i);
        const name = alias ? alias[2] : raw;
        if (name && !isUsed(code, name, m.index, m[0].length)) unused.push(name);
      }
    }
  }

  return unused;
}

function topLevelCommaIndex(s) {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (ch === ',' && depth === 0) return i;
  }
  return -1;
}

function isUsed(code, ident, importStart, importLen) {
  const before = code.slice(0, importStart);
  const after  = code.slice(importStart + importLen);
  const body   = before + '\n' + after;
  const reWord = new RegExp(`\\b${escapeRegExp(ident)}\\b`, 'g');
  return reWord.test(body);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderMarkdown(report) {
  const s = report.stats;
  const lines = [
    '# SweepstacX — Scan Report',
    '',
    `**Scanned at:** ${report.meta.scanned_at}`,
    ''
  ];

  if (report.warnings && report.warnings.length) {
    lines.push('## Warnings');
    for (const w of report.warnings) lines.push(`- ${w}`);
    lines.push('');
  }

  lines.push(
    '## Summary',
    `- Files scanned: **${s.files_scanned}**`,
    `- Dead files: **${s.dead_files}**`,
    `- Unused imports: **${s.unused_imports}**`,
    `- Duplicate blocks: **${s.duplicate_blocks}**`,
    `- Stale dependencies: **${s.stale_dependencies || 0}**`,
    '',
    '## Issues'
  );

  // Unused imports
  const unusedImports = report.issues.filter(i => i.type === 'unused_import');
  if (unusedImports.length > 0) {
    lines.push('', '### Unused Imports');
    for (const i of unusedImports) {
      lines.push(`- \`${i.symbol}\` in \`${i.file}\``);
    }
  }

  // Dead files
  const deadFiles = report.issues.filter(i => i.type === 'dead_file');
  if (deadFiles.length > 0) {
    lines.push('', '### Dead Files');
    for (const i of deadFiles) {
      lines.push(`- \`${i.file}\` - ${i.message}`);
    }
  }

  // Stale dependencies
  const staleDeps = report.issues.filter(i => i.type === 'stale_dependency');
  if (staleDeps.length > 0) {
    lines.push('', '### Stale Dependencies');
    for (const i of staleDeps) {
      lines.push(`- \`${i.name}@${i.version}\` - ${i.reason}`);
    }
  }

  if (unusedImports.length === 0 && deadFiles.length === 0 && staleDeps.length === 0) {
    lines.push('', '_No issues detected. Your codebase looks clean! 🎉_');
  }

  lines.push('', `_Generated by SweepstacX v${report.meta.version}_`, '');
  return lines.join('\n');
}
