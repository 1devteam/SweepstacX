import { loadMetrics, analyzeTrends, getMetricsSummary } from '../utils/metrics.js';
import { resolve } from 'node:path';
import pc from 'picocolors';

/**
 * Show code quality trends over time
 */
export default async function showTrends(opts = {}) {
  const root = resolve(process.cwd(), opts.path || '.');
  const history = await loadMetrics(root);
  
  if (history.length === 0) {
    console.log(pc.yellow('\n⚠ No metrics history found'));
    console.log(pc.gray('  Run "sweepstacx scan" to start tracking metrics\n'));
    return;
  }
  
  console.log(pc.cyan('\n📈 Code Quality Trends\n'));
  
  // Show summary
  const summary = getMetricsSummary(history);
  console.log(pc.bold('Summary'));
  console.log(pc.gray(`  Total scans: ${summary.scans}`));
  console.log(pc.gray(`  First scan: ${new Date(summary.firstScan).toLocaleDateString()}`));
  console.log(pc.gray(`  Last scan: ${new Date(summary.lastScan).toLocaleDateString()}`));
  console.log(pc.gray(`  Average issues: ${summary.average}`));
  console.log(pc.gray(`  Peak issues: ${summary.peak}`));
  console.log(pc.gray(`  Lowest issues: ${summary.lowest}`));
  console.log('');
  
  // Show trend analysis
  if (history.length >= 2) {
    const trends = analyzeTrends(history);
    
    console.log(pc.bold('Latest Trend'));
    const trendColor = trends.trend === 'improving' ? pc.green : 
                       trends.trend === 'degrading' ? pc.red : 
                       pc.yellow;
    console.log(trendColor(`  ${trends.message}`));
    
    if (trends.changes.totalIssues !== 0) {
      console.log(pc.gray('\n  Changes since last scan:'));
      if (trends.changes.unusedImports !== 0) {
        console.log(pc.gray(`    Unused imports: ${formatChange(trends.changes.unusedImports)}`));
      }
      if (trends.changes.deadFiles !== 0) {
        console.log(pc.gray(`    Dead files: ${formatChange(trends.changes.deadFiles)}`));
      }
      if (trends.changes.staleDeps !== 0) {
        console.log(pc.gray(`    Stale dependencies: ${formatChange(trends.changes.staleDeps)}`));
      }
    }
    console.log('');
  }
  
  // Show recent history
  if (opts.detailed && history.length > 5) {
    console.log(pc.bold('Recent History (last 10 scans)'));
    const recent = history.slice(-10);
    
    recent.forEach((scan, index) => {
      const date = new Date(scan.timestamp).toLocaleDateString();
      const issueColor = scan.issueCount === 0 ? pc.green :
                         scan.issueCount < 10 ? pc.yellow :
                         pc.red;
      console.log(pc.gray(`  ${date}: `) + issueColor(`${scan.issueCount} issues`));
    });
    console.log('');
  }
  
  // Show ASCII chart
  if (opts.chart && history.length >= 3) {
    console.log(pc.bold('Issue Trend Chart'));
    drawAsciiChart(history.slice(-20));
    console.log('');
  }
}

function formatChange(value) {
  if (value > 0) {
    return pc.red(`+${value}`);
  } else if (value < 0) {
    return pc.green(`${value}`);
  }
  return '0';
}

function drawAsciiChart(history) {
  const maxIssues = Math.max(...history.map(h => h.issueCount), 1);
  const height = 10;
  
  // Draw chart
  for (let row = height; row >= 0; row--) {
    const threshold = (maxIssues / height) * row;
    let line = `${Math.round(threshold).toString().padStart(4)} │ `;
    
    history.forEach(scan => {
      if (scan.issueCount >= threshold) {
        line += '█';
      } else {
        line += ' ';
      }
    });
    
    console.log(pc.gray(line));
  }
  
  // Draw x-axis
  console.log(pc.gray('     └' + '─'.repeat(history.length)));
  console.log(pc.gray('      ' + 'oldest'.padEnd(history.length - 6) + 'latest'));
}
