import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import pc from 'picocolors';

/**
 * Generate an enhanced interactive HTML report with charts
 */
export default async function generateEnhancedHtmlReport(opts = {}) {
  const reportPath = resolve(process.cwd(), 'sweepstacx-report.json');
  
  if (!existsSync(reportPath)) {
    console.error(pc.red('✖ Error:'), 'No scan report found. Run "sweepstacx scan" first.');
    return;
  }
  
  const reportData = JSON.parse(await readFile(reportPath, 'utf8'));
  
  // Load metrics history if available
  let metricsHistory = [];
  const metricsPath = resolve(process.cwd(), '.sweepstacx/metrics.json');
  if (existsSync(metricsPath)) {
    const metricsData = JSON.parse(await readFile(metricsPath, 'utf8'));
    metricsHistory = metricsData.history || [];
  }
  
  const html = generateEnhancedHtml(reportData, metricsHistory);
  
  const outputPath = opts.output || 'sweepstacx-dashboard.html';
  await writeFile(outputPath, html, 'utf8');
  
  console.log(pc.green('✓'), `Enhanced HTML dashboard generated: ${outputPath}`);
  console.log(pc.gray('  Open in browser to view interactive charts and trends'));
}

/**
 * Generate enhanced HTML with Chart.js
 */
function generateEnhancedHtml(data, metricsHistory) {
  const stats = data.stats || {};
  const issues = data.issues || [];
  const meta = data.meta || {};
  
  // Group issues by type and severity
  const issuesByType = {};
  const issuesBySeverity = { error: 0, warning: 0, info: 0 };
  
  issues.forEach(issue => {
    if (!issuesByType[issue.type]) {
      issuesByType[issue.type] = [];
    }
    issuesByType[issue.type].push(issue);
    
    if (issue.severity) {
      issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;
    }
  });
  
  // Prepare chart data
  const chartData = prepareChartData(stats, issuesByType, issuesBySeverity, metricsHistory);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SweepstacX Dashboard - ${meta.scanned_at || 'Unknown'}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .header {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .header h1 {
      font-size: 32px;
      color: #1a202c;
      margin-bottom: 10px;
    }
    
    .header .meta {
      color: #718096;
      font-size: 14px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
    }
    
    .stat-card:hover {
      transform: translateY(-4px);
    }
    
    .stat-card .label {
      font-size: 14px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .stat-card .value {
      font-size: 36px;
      font-weight: bold;
      color: #1a202c;
    }
    
    .stat-card.error .value { color: #f56565; }
    .stat-card.warning .value { color: #ed8936; }
    .stat-card.success .value { color: #48bb78; }
    .stat-card.info .value { color: #4299e1; }
    
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .chart-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .chart-card h3 {
      font-size: 18px;
      color: #1a202c;
      margin-bottom: 20px;
    }
    
    .chart-container {
      position: relative;
      height: 300px;
    }
    
    .issues-section {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .issues-section h2 {
      font-size: 24px;
      color: #1a202c;
      margin-bottom: 20px;
    }
    
    .filters {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    
    .filter-btn {
      padding: 8px 16px;
      border: 2px solid #e2e8f0;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    .filter-btn:hover {
      border-color: #667eea;
    }
    
    .filter-btn.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }
    
    .issue-item {
      border-left: 4px solid #e2e8f0;
      padding: 16px;
      margin-bottom: 12px;
      background: #f7fafc;
      border-radius: 6px;
      transition: all 0.2s;
    }
    
    .issue-item:hover {
      background: #edf2f7;
    }
    
    .issue-item.error { border-left-color: #f56565; }
    .issue-item.warning { border-left-color: #ed8936; }
    .issue-item.info { border-left-color: #4299e1; }
    
    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .issue-type {
      font-weight: 600;
      color: #1a202c;
    }
    
    .issue-severity {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .issue-severity.error {
      background: #fed7d7;
      color: #c53030;
    }
    
    .issue-severity.warning {
      background: #feebc8;
      color: #c05621;
    }
    
    .issue-severity.info {
      background: #bee3f8;
      color: #2c5282;
    }
    
    .issue-message {
      color: #4a5568;
      margin-bottom: 8px;
    }
    
    .issue-file {
      font-size: 12px;
      color: #718096;
      font-family: 'Courier New', monospace;
    }
    
    @media (max-width: 768px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>📊 SweepstacX Dashboard</h1>
      <div class="meta">
        <strong>Scanned:</strong> ${meta.scanned_at || 'Unknown'} | 
        <strong>Path:</strong> ${meta.path || '.'} | 
        <strong>Files:</strong> ${stats.totalFiles || 0}
      </div>
    </div>
    
    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card error">
        <div class="label">Total Issues</div>
        <div class="value">${issues.length}</div>
      </div>
      <div class="stat-card warning">
        <div class="label">Unused Imports</div>
        <div class="value">${stats.unusedImports || 0}</div>
      </div>
      <div class="stat-card info">
        <div class="label">Dead Files</div>
        <div class="value">${stats.deadFiles || 0}</div>
      </div>
      <div class="stat-card warning">
        <div class="label">Code Smells</div>
        <div class="value">${stats.codeSmells || 0}</div>
      </div>
      <div class="stat-card error">
        <div class="label">Stale Dependencies</div>
        <div class="value">${stats.staleDeps || 0}</div>
      </div>
      <div class="stat-card success">
        <div class="label">Files Scanned</div>
        <div class="value">${stats.totalFiles || 0}</div>
      </div>
    </div>
    
    <!-- Charts Grid -->
    <div class="charts-grid">
      <div class="chart-card">
        <h3>Issues by Type</h3>
        <div class="chart-container">
          <canvas id="issuesByTypeChart"></canvas>
        </div>
      </div>
      
      <div class="chart-card">
        <h3>Issues by Severity</h3>
        <div class="chart-container">
          <canvas id="issuesBySeverityChart"></canvas>
        </div>
      </div>
      
      ${metricsHistory.length > 1 ? `
      <div class="chart-card">
        <h3>Trend Over Time</h3>
        <div class="chart-container">
          <canvas id="trendChart"></canvas>
        </div>
      </div>
      ` : ''}
    </div>
    
    <!-- Issues Section -->
    <div class="issues-section">
      <h2>Issues (${issues.length})</h2>
      
      <div class="filters">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="error">Errors</button>
        <button class="filter-btn" data-filter="warning">Warnings</button>
        <button class="filter-btn" data-filter="info">Info</button>
      </div>
      
      <div id="issuesList">
        ${issues.map(issue => `
          <div class="issue-item ${issue.severity || 'info'}" data-severity="${issue.severity || 'info'}">
            <div class="issue-header">
              <span class="issue-type">${issue.type || 'unknown'}</span>
              <span class="issue-severity ${issue.severity || 'info'}">${issue.severity || 'info'}</span>
            </div>
            <div class="issue-message">${issue.message || 'No message'}</div>
            <div class="issue-file">${issue.file || 'Unknown file'}${issue.line ? `:${issue.line}` : ''}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
  
  <script>
    // Chart data
    const chartData = ${JSON.stringify(chartData)};
    
    // Issues by Type Chart
    new Chart(document.getElementById('issuesByTypeChart'), {
      type: 'doughnut',
      data: {
        labels: chartData.typeLabels,
        datasets: [{
          data: chartData.typeValues,
          backgroundColor: [
            '#f56565', '#ed8936', '#ecc94b', '#48bb78', '#4299e1',
            '#9f7aea', '#ed64a6', '#667eea', '#38b2ac', '#f6ad55'
          ],
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
          }
        }
      }
    });
    
    // Issues by Severity Chart
    new Chart(document.getElementById('issuesBySeverityChart'), {
      type: 'bar',
      data: {
        labels: ['Errors', 'Warnings', 'Info'],
        datasets: [{
          label: 'Count',
          data: [chartData.severityValues.error, chartData.severityValues.warning, chartData.severityValues.info],
          backgroundColor: ['#f56565', '#ed8936', '#4299e1'],
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
    
    // Trend Chart (if history available)
    ${metricsHistory.length > 1 ? `
    new Chart(document.getElementById('trendChart'), {
      type: 'line',
      data: {
        labels: chartData.trendLabels,
        datasets: [{
          label: 'Total Issues',
          data: chartData.trendValues,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
          }
        }
      }
    });
    ` : ''}
    
    // Filter functionality
    const filterBtns = document.querySelectorAll('.filter-btn');
    const issueItems = document.querySelectorAll('.issue-item');
    
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        
        // Update active button
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Filter issues
        issueItems.forEach(item => {
          if (filter === 'all' || item.dataset.severity === filter) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Prepare data for charts
 */
function prepareChartData(stats, issuesByType, issuesBySeverity, metricsHistory) {
  // Issues by type
  const typeLabels = Object.keys(issuesByType);
  const typeValues = Object.values(issuesByType).map(arr => arr.length);
  
  // Trend data
  const trendLabels = metricsHistory.slice(-10).map(m => {
    const date = new Date(m.timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const trendValues = metricsHistory.slice(-10).map(m => m.totalIssues || 0);
  
  return {
    typeLabels,
    typeValues,
    severityValues: issuesBySeverity,
    trendLabels,
    trendValues,
  };
}
