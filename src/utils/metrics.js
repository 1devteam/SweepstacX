import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const METRICS_DIR = '.sweepstacx/metrics';
const METRICS_FILE = 'history.json';

/**
 * Save scan metrics for trend analysis
 */
export async function saveMetrics(scanData, basePath = '.') {
  try {
    const metricsDir = resolve(basePath, METRICS_DIR);
    const metricsPath = resolve(metricsDir, METRICS_FILE);
    
    // Ensure metrics directory exists
    if (!existsSync(metricsDir)) {
      await mkdir(metricsDir, { recursive: true });
    }
    
    // Load existing metrics
    let history = [];
    if (existsSync(metricsPath)) {
      const content = await readFile(metricsPath, 'utf8');
      history = JSON.parse(content);
    }
    
    // Add new metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      stats: scanData.stats,
      issueCount: scanData.issues?.length || 0,
      issuesByType: groupIssuesByType(scanData.issues || []),
    };
    
    history.push(metrics);
    
    // Keep only last 100 scans
    if (history.length > 100) {
      history = history.slice(-100);
    }
    
    // Save updated history
    await writeFile(metricsPath, JSON.stringify(history, null, 2));
    
    return metrics;
  } catch (error) {
    // Non-fatal, just log
    console.warn('Failed to save metrics:', error.message);
    return null;
  }
}

/**
 * Load metrics history
 */
export async function loadMetrics(basePath = '.') {
  try {
    const metricsPath = resolve(basePath, METRICS_DIR, METRICS_FILE);
    
    if (!existsSync(metricsPath)) {
      return [];
    }
    
    const content = await readFile(metricsPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return [];
  }
}

/**
 * Get trend analysis from metrics history
 */
export function analyzeTrends(history) {
  if (history.length < 2) {
    return {
      trend: 'insufficient_data',
      message: 'Need at least 2 scans for trend analysis',
    };
  }
  
  const latest = history[history.length - 1];
  const previous = history[history.length - 2];
  
  const changes = {
    files: latest.stats.files_scanned - previous.stats.files_scanned,
    unusedImports: latest.stats.unused_imports - previous.stats.unused_imports,
    deadFiles: latest.stats.dead_files - previous.stats.dead_files,
    staleDeps: latest.stats.stale_dependencies - previous.stats.stale_dependencies,
    totalIssues: latest.issueCount - previous.issueCount,
  };
  
  const improving = changes.totalIssues < 0;
  const degrading = changes.totalIssues > 0;
  
  return {
    trend: improving ? 'improving' : degrading ? 'degrading' : 'stable',
    changes,
    latest,
    previous,
    message: getTrendMessage(changes),
  };
}

function getTrendMessage(changes) {
  if (changes.totalIssues === 0) {
    return '✓ Code quality stable';
  } else if (changes.totalIssues < 0) {
    return `✓ Code quality improving (${Math.abs(changes.totalIssues)} fewer issues)`;
  } else {
    return `⚠ Code quality degrading (${changes.totalIssues} more issues)`;
  }
}

function groupIssuesByType(issues) {
  const grouped = {};
  
  issues.forEach(issue => {
    const type = issue.type || 'unknown';
    grouped[type] = (grouped[type] || 0) + 1;
  });
  
  return grouped;
}

/**
 * Get metrics summary
 */
export function getMetricsSummary(history) {
  if (history.length === 0) {
    return null;
  }
  
  const latest = history[history.length - 1];
  const oldest = history[0];
  
  // Calculate averages
  const avgIssues = history.reduce((sum, m) => sum + m.issueCount, 0) / history.length;
  const avgFiles = history.reduce((sum, m) => sum + (m.stats.files_scanned || 0), 0) / history.length;
  
  // Find peak and lowest
  const peakIssues = Math.max(...history.map(m => m.issueCount));
  const lowestIssues = Math.min(...history.map(m => m.issueCount));
  
  return {
    scans: history.length,
    latest: latest.issueCount,
    average: Math.round(avgIssues),
    peak: peakIssues,
    lowest: lowestIssues,
    avgFiles: Math.round(avgFiles),
    firstScan: oldest.timestamp,
    lastScan: latest.timestamp,
  };
}
