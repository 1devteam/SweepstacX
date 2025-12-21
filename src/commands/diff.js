import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import pc from 'picocolors';

/**
 * Compare two scan reports and show differences
 */
export default async function diffReports(opts = {}) {
  const baseReport = opts.base || 'sweepstacx-report.json';
  const compareReport = opts.compare;
  
  if (!compareReport) {
    console.error(pc.red('✖ Error:'), 'Missing --compare argument');
    console.log(pc.gray('  Usage: sweepstacx diff --compare <report-file>'));
    return;
  }
  
  const basePath = resolve(process.cwd(), baseReport);
  const comparePath = resolve(process.cwd(), compareReport);
  
  if (!existsSync(basePath)) {
    console.error(pc.red('✖ Error:'), `Base report not found: ${baseReport}`);
    return;
  }
  
  if (!existsSync(comparePath)) {
    console.error(pc.red('✖ Error:'), `Compare report not found: ${compareReport}`);
    return;
  }
  
  const baseData = JSON.parse(await readFile(basePath, 'utf8'));
  const compareData = JSON.parse(await readFile(comparePath, 'utf8'));
  
  const diff = calculateDiff(baseData, compareData);
  displayDiff(diff, baseData, compareData);
}

/**
 * Calculate differences between two reports
 */
function calculateDiff(baseData, compareData) {
  const baseStats = baseData.stats || {};
  const compareStats = compareData.stats || {};
  
  const baseIssues = baseData.issues || [];
  const compareIssues = compareData.issues || [];
  
  // Calculate stat changes
  const statsDiff = {
    totalIssues: (compareIssues.length) - (baseIssues.length),
    unusedImports: (compareStats.unusedImports || 0) - (baseStats.unusedImports || 0),
    deadFiles: (compareStats.deadFiles || 0) - (baseStats.deadFiles || 0),
    codeSmells: (compareStats.codeSmells || 0) - (baseStats.codeSmells || 0),
    staleDeps: (compareStats.staleDeps || 0) - (baseStats.staleDeps || 0),
  };
  
  // Find new issues
  const baseIssueKeys = new Set(baseIssues.map(i => issueKey(i)));
  const newIssues = compareIssues.filter(i => !baseIssueKeys.has(issueKey(i)));
  
  // Find fixed issues
  const compareIssueKeys = new Set(compareIssues.map(i => issueKey(i)));
  const fixedIssues = baseIssues.filter(i => !compareIssueKeys.has(issueKey(i)));
  
  return {
    statsDiff,
    newIssues,
    fixedIssues,
  };
}

/**
 * Create a unique key for an issue
 */
function issueKey(issue) {
  return `${issue.type}:${issue.file}:${issue.line || ''}:${issue.message}`;
}

/**
 * Display diff results
 */
function displayDiff(diff, baseData, compareData) {
  console.log(pc.cyan('\n📊 Scan Report Comparison\n'));
  
  // Show metadata
  console.log(pc.bold('Base Report:'), baseData.meta?.scanned_at || 'Unknown');
  console.log(pc.bold('Compare Report:'), compareData.meta?.scanned_at || 'Unknown');
  console.log('');
  
  // Show stats changes
  console.log(pc.bold('📈 Statistics Changes\n'));
  
  const { statsDiff } = diff;
  
  displayStatChange('Total Issues', statsDiff.totalIssues);
  displayStatChange('Unused Imports', statsDiff.unusedImports);
  displayStatChange('Dead Files', statsDiff.deadFiles);
  displayStatChange('Code Smells', statsDiff.codeSmells);
  displayStatChange('Stale Dependencies', statsDiff.staleDeps);
  
  console.log('');
  
  // Show new issues
  if (diff.newIssues.length > 0) {
    console.log(pc.red(`\n❌ New Issues (${diff.newIssues.length})\n`));
    
    diff.newIssues.slice(0, 10).forEach(issue => {
      console.log(pc.red('  +'), `${issue.type}: ${issue.message}`);
      console.log(pc.gray(`    ${issue.file}${issue.line ? `:${issue.line}` : ''}`));
    });
    
    if (diff.newIssues.length > 10) {
      console.log(pc.gray(`\n  ... and ${diff.newIssues.length - 10} more new issues`));
    }
  }
  
  // Show fixed issues
  if (diff.fixedIssues.length > 0) {
    console.log(pc.green(`\n✅ Fixed Issues (${diff.fixedIssues.length})\n`));
    
    diff.fixedIssues.slice(0, 10).forEach(issue => {
      console.log(pc.green('  -'), `${issue.type}: ${issue.message}`);
      console.log(pc.gray(`    ${issue.file}${issue.line ? `:${issue.line}` : ''}`));
    });
    
    if (diff.fixedIssues.length > 10) {
      console.log(pc.gray(`\n  ... and ${diff.fixedIssues.length - 10} more fixed issues`));
    }
  }
  
  // Summary
  console.log(pc.bold('\n📋 Summary\n'));
  
  const netChange = diff.newIssues.length - diff.fixedIssues.length;
  
  if (netChange > 0) {
    console.log(pc.red(`  Code quality decreased: +${netChange} issues`));
  } else if (netChange < 0) {
    console.log(pc.green(`  Code quality improved: ${netChange} issues`));
  } else {
    console.log(pc.cyan('  Code quality unchanged'));
  }
  
  console.log('');
}

/**
 * Display a stat change with color coding
 */
function displayStatChange(label, change) {
  const prefix = change > 0 ? '+' : '';
  const value = `${prefix}${change}`;
  
  let coloredValue;
  if (change > 0) {
    coloredValue = pc.red(value);
  } else if (change < 0) {
    coloredValue = pc.green(value);
  } else {
    coloredValue = pc.gray(value);
  }
  
  console.log(`  ${label.padEnd(20)} ${coloredValue}`);
}
