import { readJSON } from '../utils/fs.js';
import pc from 'picocolors';

const CACHE_FILE = '.sweepstacx/scan.json';

/**
 * Calculates a single, weighted Code Quality Score (A-F) based on the last scan report.
 * This provides an enterprise-grade, actionable metric for CI/CD.
 * 
 * Score is based on:
 * 1. Complexity (40%)
 * 2. Dead Code (30%)
 * 3. Security (20%)
 * 4. Duplication (10%)
 * 
 * Each metric is normalized to a 0-100 scale (100 being perfect).
 */
function calculateScore(report) {
  const stats = report.stats;
  const issues = report.issues;
  
  // --- 1. Complexity Score (40%) ---
  // Based on the complexity analysis run separately (or integrated into scan in a future version)
  // For now, we'll use a proxy based on the number of files and a hardcoded target.
  // A proper implementation would require running the complexity command and reading its output.
  // Since we don't have the complexity report here, we'll use a simple proxy:
  const totalFiles = stats.files_scanned || 1;
  const complexityIssueCount = issues.filter(i => i.type === 'complexity_issue').length;
  // Assume a target of 0.05 complexity issues per file is acceptable (95% score)
  const complexityTarget = totalFiles * 0.05;
  const complexityPenalty = Math.min(1, complexityIssueCount / complexityTarget);
  const complexityScore = 100 * (1 - complexityPenalty * 0.4); // Max 40% penalty
  
  // --- 2. Dead Code Score (30%) ---
  const deadCodeIssues = stats.unused_imports + stats.dead_files;
  // Assume 1 dead code issue per 10 files is acceptable (90% score)
  const deadCodeTarget = totalFiles / 10;
  const deadCodePenalty = Math.min(1, deadCodeIssues / deadCodeTarget);
  const deadCodeScore = 100 * (1 - deadCodePenalty * 0.3); // Max 30% penalty
  
  // --- 3. Security Score (20%) ---
  const securityIssues = issues.filter(i => i.type.startsWith('security_')).length;
  // Assume 0 security issues is perfect. 10 issues = 0% score.
  const securityPenalty = Math.min(1, securityIssues / 10);
  const securityScore = 100 * (1 - securityPenalty * 0.2); // Max 20% penalty
  
  // --- 4. Duplication Score (10%) ---
  const duplicationPercentage = stats.duplicate_percentage || 0;
  // Assume 5% duplication is acceptable (90% score). 10% duplication = 0% score.
  const duplicationPenalty = Math.min(1, duplicationPercentage / 10);
  const duplicationScore = 100 * (1 - duplicationPenalty * 0.1); // Max 10% penalty
  
  // --- Final Weighted Score ---
  const finalScore = (
    complexityScore * 0.4 +
    deadCodeScore * 0.3 +
    securityScore * 0.2 +
    duplicationScore * 0.1
  );
  
  return {
    finalScore: Math.max(0, Math.min(100, finalScore)),
    complexityScore: Math.max(0, Math.min(100, complexityScore)),
    deadCodeScore: Math.max(0, Math.min(100, deadCodeScore)),
    securityScore: Math.max(0, Math.min(100, securityScore)),
    duplicationScore: Math.max(0, Math.min(100, duplicationScore)),
  };
}

/**
 * Converts a 0-100 score to an A-F rating.
 */
function getRating(score) {
  if (score >= 90) return { rating: 'A', color: 'green' };
  if (score >= 80) return { rating: 'B', color: 'cyan' };
  if (score >= 70) return { rating: 'C', color: 'yellow' };
  if (score >= 60) return { rating: 'D', color: 'magenta' };
  return { rating: 'F', color: 'red' };
}

export default async function runScore() {
  try {
    const report = await readJSON(CACHE_FILE);
    if (!report) {
      console.log(pc.yellow('⚠️  No scan report found. Run `sweepstacx scan` first.'));
      return;
    }

    const scores = calculateScore(report);
    const finalRating = getRating(scores.finalScore);

    console.log(pc.cyan('\n⭐ Code Quality Score\n'));
    
    console.log(pc.bold(`  Overall Quality Rating: ${pc[finalRating.color](finalRating.rating)} (${scores.finalScore.toFixed(2)}/100)`));
    console.log(pc.gray('  --------------------------------------------------'));
    
    const metrics = [
      { name: 'Complexity', score: scores.complexityScore, weight: 40 },
      { name: 'Dead Code', score: scores.deadCodeScore, weight: 30 },
      { name: 'Security', score: scores.securityScore, weight: 20 },
      { name: 'Duplication', score: scores.duplicationScore, weight: 10 },
    ];

    metrics.forEach(m => {
      const rating = getRating(m.score);
      console.log(`  ${m.name.padEnd(12)}: ${pc[rating.color](rating.rating)} (${m.score.toFixed(2)}/100) - Weight: ${m.weight}%`);
    });

    console.log(pc.gray('  --------------------------------------------------'));
    console.log(pc.gray(`  Based on last scan: ${report.meta.scanned_at}`));
    console.log('');

  } catch (error) {
    console.error(pc.red('❌ An error occurred while calculating the score:'), error.message);
  }
}
