import { resolve } from 'node:path';
import fg from 'fast-glob';
import { readFile } from 'node:fs/promises';
import pc from 'picocolors';
import { analyzeComplexity, getComplexityRating } from '../analyzers/complexity.js';

/**
 * Analyze code complexity metrics
 */
export default async function runComplexity(opts = {}) {
  const root = resolve(process.cwd(), opts.path || '.');
  
  console.log(pc.cyan('\n📊 Code Complexity Analysis\n'));
  
  const { results, totalComplexity, totalCognitive, totalLOC, files } = await analyzeAllFiles(root);
  
  // Sort by complexity
  results.sort((a, b) => b.metrics.cyclomaticComplexity - a.metrics.cyclomaticComplexity);
  
  displayTopFiles(results, root);
  displaySummaryStats(files.length, totalLOC, totalComplexity, totalCognitive);
  const distribution = calculateDistribution(results, files.length);
  displayDistribution(distribution, files.length);
  displayRecommendations(distribution, totalComplexity, files.length);
  displayIssues(opts.issues, results, root);
}

/**
 * Helper to find files and run analysis
 */
async function analyzeAllFiles(root) {
  // Find all files
  const files = await fg(
    [
      `${root}/**/*.js`,
      `${root}/**/*.mjs`,
      `${root}/**/*.cjs`,
      `${root}/**/*.ts`,
      `${root}/**/*.tsx`
    ],
    { ignore: ['**/node_modules/**','**/dist/**','**/coverage/**','**/.git/**'], dot: false }
  );
  
  console.log(pc.gray(`Analyzing ${files.length} files...\n`));
  
  const results = [];
  let totalComplexity = 0;
  let totalCognitive = 0;
  let totalLOC = 0;
  
  // Analyze each file
  for (const file of files) {
    const code = await readFile(file, 'utf8');
    const { metrics, issues } = analyzeComplexity(code, file);
    
    results.push({
      file,
      metrics,
      issues,
    });
    
    totalComplexity += metrics.cyclomaticComplexity;
    totalCognitive += metrics.cognitiveComplexity;
    totalLOC += metrics.linesOfCode;
  }
  
  return { results, totalComplexity, totalCognitive, totalLOC, files };
}

/**
 * Display the top 10 most complex files
 */
function displayTopFiles(results, root) {
  console.log(pc.bold('Most Complex Files (Top 10)'));
  console.log('');
  
  const topFiles = results.slice(0, 10);
  topFiles.forEach((result, index) => {
    const rating = getComplexityRating(result.metrics.cyclomaticComplexity);
    const fileName = result.file.replace(root + '/', '');
    
    console.log(pc.gray(`${(index + 1).toString().padStart(2)}. ${fileName}`));
    console.log(pc.gray(`    Cyclomatic: ${result.metrics.cyclomaticComplexity} | Cognitive: ${result.metrics.cognitiveComplexity} | LOC: ${result.metrics.linesOfCode}`));
    console.log(pc[rating.color](`    Rating: ${rating.rating} (${rating.label})`));
    console.log('');
  });
}

/**
 * Display summary statistics
 */
function displaySummaryStats(fileCount, totalLOC, totalComplexity, totalCognitive) {
  console.log(pc.bold('Summary Statistics'));
  console.log('');
  console.log(pc.gray(`Total Files:              ${fileCount}`));
  console.log(pc.gray(`Total Lines of Code:      ${totalLOC.toLocaleString()}`));
  console.log(pc.gray(`Average Cyclomatic:       ${(totalComplexity / fileCount).toFixed(2)}`));
  console.log(pc.gray(`Average Cognitive:        ${(totalCognitive / fileCount).toFixed(2)}`));
  console.log(pc.gray(`Average LOC per File:     ${Math.round(totalLOC / fileCount)}`));
  console.log('');
}

/**
 * Calculate complexity distribution
 */
function calculateDistribution(results, fileCount) {
  const distribution = {
    simple: 0,      // <= 5
    moderate: 0,    // 6-10
    complex: 0,     // 11-20
    veryComplex: 0, // 21-30
    extreme: 0,     // > 30
  };
  
  results.forEach(result => {
    const cc = result.metrics.cyclomaticComplexity;
    if (cc <= 5) distribution.simple++;
    else if (cc <= 10) distribution.moderate++;
    else if (cc <= 20) distribution.complex++;
    else if (cc <= 30) distribution.veryComplex++;
    else distribution.extreme++;
  });
  return distribution;
}

/**
 * Display complexity distribution
 */
function displayDistribution(distribution, total) {
  console.log(pc.bold('Complexity Distribution'));
  console.log('');
  
  console.log(pc.green(`  Simple (A):       ${distribution.simple.toString().padStart(4)} (${((distribution.simple / total) * 100).toFixed(1)}%)`));
  console.log(pc.cyan(`  Moderate (B):     ${distribution.moderate.toString().padStart(4)} (${((distribution.moderate / total) * 100).toFixed(1)}%)`));
  console.log(pc.yellow(`  Complex (C):      ${distribution.complex.toString().padStart(4)} (${((distribution.complex / total) * 100).toFixed(1)}%)`));
  console.log(pc.red(`  Very Complex (D): ${distribution.veryComplex.toString().padStart(4)} (${((distribution.veryComplex / total) * 100).toFixed(1)}%)`));
  console.log(pc.red(`  Extreme (F):      ${distribution.extreme.toString().padStart(4)} (${((distribution.extreme / total) * 100).toFixed(1)}%)`));
  console.log('');
}

/**
 * Display recommendations based on complexity
 */
function displayRecommendations(distribution, totalComplexity, fileCount) {
  console.log(pc.bold('Recommendations'));
  console.log('');
  
  if (distribution.extreme > 0) {
    console.log(pc.red(`  ⚠ ${distribution.extreme} file(s) have extreme complexity - consider refactoring`));
  }
  
  if (distribution.veryComplex > fileCount * 0.2) {
    console.log(pc.yellow('  ⚠ More than 20% of files are very complex'));
  }
  
  if (distribution.simple > fileCount * 0.6) {
    console.log(pc.green('  ✓ Most files have low complexity - good job!'));
  }
  
  const avgComplexity = totalComplexity / fileCount;
  if (avgComplexity < 10) {
    console.log(pc.green('  ✓ Average complexity is low - code is maintainable'));
  } else if (avgComplexity > 20) {
    console.log(pc.yellow('  ⚠ Average complexity is high - consider simplifying'));
  }
  
  console.log('');
}

/**
 * Display detailed issues if requested
 */
function displayIssues(showIssues, results, root) {
  if (showIssues) {
    const allIssues = results.flatMap(r => r.issues);
    
    if (allIssues.length > 0) {
      console.log(pc.bold(`Complexity Issues (${allIssues.length})`));
      console.log('');
      
      allIssues.slice(0, 20).forEach(issue => {
        const fileName = issue.file.replace(root + '/', '');
        console.log(pc.yellow(`  ⚠ ${fileName}`));
        console.log(pc.gray(`    ${issue.message}`));
      });
      
      if (allIssues.length > 20) {
        console.log(pc.gray(`\n  ... and ${allIssues.length - 20} more issues`));
      }
      
      console.log('');
    }
  }
}
