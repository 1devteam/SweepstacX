import fg from 'fast-glob';
import { resolve } from 'node:path';
import { detectCodeSmells } from '../analyzers/code-smells.js';
import { analyzeImports } from '../analyzers/import-optimizer.js';
import pc from 'picocolors';

/**
 * Advanced insights command - provides actionable recommendations
 */
export default async function runInsights(opts = {}) {
  const root = resolve(process.cwd(), opts.path || '.');

  console.log(pc.cyan('\n🔍 SweepstacX Insights - Deep Code Analysis\n'));

  const files = await fg(
    [`${root}/**/*.js`, `${root}/**/*.mjs`, `${root}/**/*.cjs`],
    { ignore: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.git/**'], dot: false }
  );

  if (files.length === 0) {
    console.log(pc.yellow('⚠️  No files found to analyze.'));
    return;
  }

  console.log(pc.gray(`Analyzing ${files.length} files...\n`));

  // Run all analyzers
  const [codeSmells, importAnalysis] = await Promise.all([
    detectCodeSmells(files),
    analyzeImports(files),
  ]);

  // Display results
  displayCodeSmells(codeSmells);
  displayImportInsights(importAnalysis);
  displaySummary(codeSmells, importAnalysis);

  // Generate recommendations
  displayRecommendations(codeSmells, importAnalysis);
}

function displayCodeSmells(smells) {
  if (smells.length === 0) {
    console.log(pc.green('✓ No code smells detected!\n'));
    return;
  }

  console.log(pc.bold('📊 Code Smells Detected:\n'));

  // Group by type
  const byType = groupBy(smells, 'type');

  for (const [type, items] of Object.entries(byType)) {
    const severity = items[0].severity;
    const icon = getSeverityIcon(severity);
    const color = getSeverityColor(severity);

    console.log(color(`${icon} ${formatSmellType(type)} (${items.length})`));

    // Show top 5 examples
    items.slice(0, 5).forEach(smell => {
      console.log(pc.gray(`   ${smell.file}:${smell.line} - ${smell.message}`));
    });

    if (items.length > 5) {
      console.log(pc.gray(`   ... and ${items.length - 5} more\n`));
    } else {
      console.log('');
    }
  }
}

function displayImportInsights(analysis) {
  console.log(pc.bold('📦 Import Analysis:\n'));

  if (analysis.suggestions.length === 0) {
    console.log(pc.green('✓ Imports are well-organized!\n'));
    return;
  }

  console.log(pc.yellow(`⚡ ${analysis.stats.canOptimize} imports can be optimized`));
  console.log(pc.yellow(`🔄 ${analysis.stats.redundant} redundant imports found\n`));

  // Show examples
  const examples = analysis.suggestions.slice(0, 5);
  examples.forEach(sugg => {
    console.log(pc.gray(`   ${sugg.file}:${sugg.line}`));
    console.log(pc.gray(`   ${sugg.message}`));
    if (sugg.suggestion) {
      console.log(pc.cyan(`   💡 ${sugg.suggestion}`));
    }
    console.log('');
  });

  if (analysis.suggestions.length > 5) {
    console.log(pc.gray(`   ... and ${analysis.suggestions.length - 5} more suggestions\n`));
  }
}

function displaySummary(smells, importAnalysis) {
  console.log(pc.bold('📈 Summary:\n'));

  const highSeverity = smells.filter(s => s.severity === 'high').length;
  const mediumSeverity = smells.filter(s => s.severity === 'medium').length;
  const lowSeverity = smells.filter(s => s.severity === 'low').length;

  console.log(`   ${pc.red('High priority:')} ${highSeverity} issues`);
  console.log(`   ${pc.yellow('Medium priority:')} ${mediumSeverity} issues`);
  console.log(`   ${pc.gray('Low priority:')} ${lowSeverity} issues`);
  console.log(`   ${pc.cyan('Import optimizations:')} ${importAnalysis.stats.total} suggestions\n`);
}

function displayRecommendations(smells, importAnalysis) {
  console.log(pc.bold('💡 Recommendations:\n'));

  const recommendations = [];

  // High priority items
  const longFunctions = smells.filter(s => s.type === 'long_function' && s.severity === 'high');
  if (longFunctions.length > 0) {
    recommendations.push({
      priority: 'high',
      action: `Refactor ${longFunctions.length} long functions (>100 lines)`,
      impact: 'Improves maintainability and testability',
    });
  }

  // Deep nesting
  const deepNesting = smells.filter(s => s.type === 'deep_nesting');
  if (deepNesting.length > 0) {
    recommendations.push({
      priority: 'medium',
      action: `Reduce nesting in ${deepNesting.length} locations`,
      impact: 'Makes code easier to understand and debug',
    });
  }

  // Import optimization
  if (importAnalysis.stats.redundant > 0) {
    recommendations.push({
      priority: 'medium',
      action: `Combine ${importAnalysis.stats.redundant} redundant imports`,
      impact: 'Cleaner code and potentially smaller bundles',
    });
  }

  // TODOs
  const todos = smells.filter(s => s.type === 'todo_comment');
  if (todos.length > 0) {
    recommendations.push({
      priority: 'low',
      action: `Address ${todos.length} TODO/FIXME comments`,
      impact: 'Reduces technical debt',
    });
  }

  // Console logs
  const consoleLogs = smells.filter(s => s.type === 'console_log');
  if (consoleLogs.length > 0) {
    recommendations.push({
      priority: 'low',
      action: `Remove ${consoleLogs.length} console statements`,
      impact: 'Production-ready code',
    });
  }

  if (recommendations.length === 0) {
    console.log(pc.green('   🎉 Your code looks great! No major recommendations.\n'));
    return;
  }

  recommendations.forEach((rec) => {
    const icon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🔵';
    console.log(`   ${icon} ${rec.action}`);
    console.log(pc.gray(`      Impact: ${rec.impact}\n`));
  });

  console.log(pc.cyan('Run `sweepstacx scan` for detailed issue locations.\n'));
}

// Helper functions

function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
}

function getSeverityIcon(severity) {
  const icons = {
    high: '🔴',
    medium: '🟡',
    low: '🔵',
  };
  return icons[severity] || '⚪';
}

function getSeverityColor(severity) {
  const colors = {
    high: pc.red,
    medium: pc.yellow,
    low: pc.gray,
  };
  return colors[severity] || pc.white;
}

function formatSmellType(type) {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
