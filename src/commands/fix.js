import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import pc from 'picocolors';
import { applyAllFixes } from '../utils/autofix.js';

/**
 * Auto-fix issues from scan report
 */
export default async function runFix(opts = {}) {
  const reportPath = resolve(process.cwd(), 'sweepstacx-report.json');
  
  if (!existsSync(reportPath)) {
    console.error(pc.red('✖ Error:'), 'No scan report found. Run "sweepstacx scan" first.');
    return;
  }
  
  console.log(pc.cyan('\n🔧 Auto-fixing issues...\n'));
  
  // Load report
  const reportData = JSON.parse(await readFile(reportPath, 'utf8'));
  const issues = reportData.issues || [];
  
  if (issues.length === 0) {
    console.log(pc.green('✓ No issues to fix!'));
    return;
  }
  
  // Group issues by file
  const issuesByFile = {};
  issues.forEach(issue => {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = [];
    }
    issuesByFile[issue.file].push(issue);
  });
  
  // Apply fixes
  let filesFixed = 0;
  let totalFixes = 0;
  
  for (const [file, fileIssues] of Object.entries(issuesByFile)) {
    // Skip if file doesn't exist
    if (!existsSync(file)) {
      console.log(pc.yellow(`⚠ Skipping ${file} (not found)`));
      continue;
    }
    
    // Check if any issues are fixable
    const fixableTypes = [
      'unused_import',
      'console_log',
      'debugger',
      'trailing_whitespace',
      'multiple_empty_lines',
      'react_missing_key',
      'vue_missing_key',
    ];
    
    const fixableIssues = fileIssues.filter(i => fixableTypes.includes(i.type));
    
    if (fixableIssues.length === 0) {
      continue;
    }
    
    // Apply fixes
    console.log(pc.gray(`Fixing ${file}...`));
    const results = await applyAllFixes(file, fixableIssues);
    
    const fixCount = Object.values(results).filter(Boolean).length;
    if (fixCount > 0) {
      filesFixed++;
      totalFixes += fixCount;
      console.log(pc.green(`  ✓ Applied ${fixCount} fix(es)`));
    }
  }
  
  console.log('');
  console.log(pc.green(`✓ Fixed ${totalFixes} issue(s) in ${filesFixed} file(s)`));
  
  if (opts.verify) {
    console.log(pc.gray('\nRun "sweepstacx scan" to verify fixes'));
  }
}
