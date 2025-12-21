import { resolve } from 'node:path';
import fg from 'fast-glob';
import { readFile } from 'node:fs/promises';
import pc from 'picocolors';
import { analyzeSecurityIssues } from '../analyzers/security.js';

/**
 * Run security vulnerability scan
 */
export default async function runSecurityScan(opts = {}) {
  const root = resolve(process.cwd(), opts.path || '.');
  
  console.log(pc.cyan('\n🔒 Security Vulnerability Scan\n'));
  
  // Find all files
  const files = await fg(
    [
      `${root}/**/*.js`,
      `${root}/**/*.mjs`,
      `${root}/**/*.cjs`,
      `${root}/**/*.ts`,
      `${root}/**/*.tsx`,
      `${root}/**/*.jsx`
    ],
    { ignore: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.git/**'], dot: false }
  );
  
  console.log(pc.gray(`Scanning ${files.length} files for security issues...\n`));
  
  const allIssues = [];
  
  // Scan each file
  for (const file of files) {
    const code = await readFile(file, 'utf8');
    const issues = analyzeSecurityIssues(code, file);
    allIssues.push(...issues);
  }
  
  // Group by severity
  const bySeverity = {
    error: allIssues.filter(i => i.severity === 'error'),
    warning: allIssues.filter(i => i.severity === 'warning'),
    info: allIssues.filter(i => i.severity === 'info'),
  };
  
  // Display results
  console.log(pc.bold('Security Issues Found\n'));
  
  if (allIssues.length === 0) {
    console.log(pc.green('  ✓ No security issues detected!'));
    console.log('');
    return;
  }
  
  // Show errors
  if (bySeverity.error.length > 0) {
    console.log(pc.red(`\n🔴 Critical Issues (${bySeverity.error.length})\n`));
    
    bySeverity.error.slice(0, 15).forEach(issue => {
      console.log(pc.red('  ✖'), issue.message);
      console.log(pc.gray(`    ${issue.file}${issue.line ? `:${issue.line}` : ''}`));
      if (issue.symbol) {
        console.log(pc.gray(`    Value: ${issue.symbol}`));
      }
      console.log('');
    });
    
    if (bySeverity.error.length > 15) {
      console.log(pc.gray(`  ... and ${bySeverity.error.length - 15} more critical issues\n`));
    }
  }
  
  // Show warnings
  if (bySeverity.warning.length > 0) {
    console.log(pc.yellow(`\n⚠️  Warnings (${bySeverity.warning.length})\n`));
    
    bySeverity.warning.slice(0, 10).forEach(issue => {
      console.log(pc.yellow('  ⚠'), issue.message);
      console.log(pc.gray(`    ${issue.file}${issue.line ? `:${issue.line}` : ''}`));
      console.log('');
    });
    
    if (bySeverity.warning.length > 10) {
      console.log(pc.gray(`  ... and ${bySeverity.warning.length - 10} more warnings\n`));
    }
  }
  
  // Summary
  console.log(pc.bold('\n📋 Summary\n'));
  console.log(pc.red(`  Critical Issues:  ${bySeverity.error.length}`));
  console.log(pc.yellow(`  Warnings:         ${bySeverity.warning.length}`));
  console.log(pc.gray(`  Total:            ${allIssues.length}`));
  console.log('');
  
  // Recommendations
  if (bySeverity.error.length > 0) {
    console.log(pc.bold('🔧 Recommendations\n'));
    console.log(pc.red('  ⚠ Critical issues should be fixed immediately'));
    console.log(pc.gray('  • Remove hardcoded secrets (use environment variables)'));
    console.log(pc.gray('  • Use parameterized queries for SQL'));
    console.log(pc.gray('  • Sanitize user input before rendering'));
    console.log(pc.gray('  • Use crypto.randomBytes() for security-sensitive random values'));
    console.log(pc.gray('  • Avoid eval() and Function constructor'));
    console.log('');
  }
}
