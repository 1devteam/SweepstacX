import { resolve } from 'node:path';
import { deepDependencyAnalysis } from '../analyzers/deep-deps.js';
import { handleError, showSuccess } from '../utils/errors.js';
import pc from 'picocolors';

export default async function runDeps(opts = {}) {
  try {
    const root = resolve(process.cwd(), opts.path || '.');
    
    console.log(pc.cyan(`\n🔍 Starting Deep Dependency Analysis in ${root}`));

    const { issues, stats, graph } = await deepDependencyAnalysis(root);

    console.log(pc.cyan('\n--- Deep Dependency Analysis Report ---'));
    
    // Summary
    console.log(pc.bold('Summary:'));
    console.log(`  Total Dependencies: ${stats.totalDependencies}`);
    console.log(`  Unique Licenses: ${stats.uniqueLicenses}`);
    console.log(pc.bold('  Vulnerabilities:'));
    console.log(`    Critical: ${pc.red(stats.vulnerabilities.critical)}`);
    console.log(`    High:     ${pc.yellow(stats.vulnerabilities.high)}`);
    console.log(`    Medium:   ${pc.blue(stats.vulnerabilities.medium)}`);
    console.log(`    Low:      ${pc.green(stats.vulnerabilities.low)}`);

    // Issues
    if (issues.length > 0) {
      console.log(pc.bold('\nIssues Found:'));
      for (const issue of issues) {
        let color = pc.gray;
        if (issue.severity === 'critical') color = pc.red;
        else if (issue.severity === 'high') color = pc.yellow;
        else if (issue.severity === 'medium') color = pc.blue;
        
        console.log(color(`  [${issue.type.toUpperCase()}] ${issue.message}`));
        if (issue.url) console.log(pc.gray(`    More info: ${issue.url}`));
      }
    } else {
      console.log(pc.green('\n✓ No critical issues found in dependencies.'));
    }

    // Graph info (simple)
    if (graph) {
      console.log(pc.bold('\nDependency Graph Info:'));
      console.log(`  Root package: ${graph.name}@${graph.version}`);
      console.log(`  Direct dependencies: ${graph.dependencies.length}`);
    }

    showSuccess('Deep Dependency Analysis complete.');
  } catch (error) {
    handleError(error, 'deps');
  }
}
