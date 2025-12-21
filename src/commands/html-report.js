import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import pc from 'picocolors';

/**
 * Generate an interactive HTML report
 */
export default async function generateHtmlReport(opts = {}) {
  const reportPath = resolve(process.cwd(), 'sweepstacx-report.json');
  
  if (!existsSync(reportPath)) {
    console.error(pc.red('✖ Error:'), 'No scan report found. Run "sweepstacx scan" first.');
    return;
  }
  
  const reportData = JSON.parse(await readFile(reportPath, 'utf8'));
  const html = generateHtml(reportData);
  
  const outputPath = opts.output || 'sweepstacx-report.html';
  await writeFile(outputPath, html, 'utf8');
  
  console.log(pc.green('✓'), `HTML report generated: ${outputPath}`);
  console.log(pc.gray('  Open in browser to view interactive dashboard'));
}

/**
 * Generate HTML content
 */
function generateHtml(data) {
  const stats = data.stats || {};
  const issues = data.issues || [];
  const meta = data.meta || {};
  
  // Group issues by type
  const issuesByType = {};
  issues.forEach(issue => {
    if (!issuesByType[issue.type]) {
      issuesByType[issue.type] = [];
    }
    issuesByType[issue.type].push(issue);
  });
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SweepstacX Report - ${meta.scanned_at || 'Unknown'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f7fa;
      color: #2d3748;
      line-height: 1.6;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .meta { opacity: 0.9; font-size: 0.9rem; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-left: 4px solid #667eea;
    }
    .stat-value {
      font-size: 2.5rem;
      font-weight: bold;
      color: #667eea;
    }
    .stat-label {
      color: #718096;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .section {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .section-title {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #2d3748;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.5rem;
    }
    .issue-group {
      margin-bottom: 2rem;
    }
    .issue-type {
      font-size: 1.25rem;
      font-weight: 600;
      color: #4a5568;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-error { background: #fed7d7; color: #c53030; }
    .badge-warning { background: #feebc8; color: #c05621; }
    .badge-info { background: #bee3f8; color: #2c5282; }
    .issue-list {
      list-style: none;
    }
    .issue-item {
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      background: #f7fafc;
      border-left: 3px solid #cbd5e0;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.875rem;
    }
    .issue-file {
      color: #4a5568;
      font-weight: 600;
    }
    .issue-detail {
      color: #718096;
      margin-left: 1rem;
    }
    .filter-bar {
      margin-bottom: 1rem;
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .filter-btn {
      padding: 0.5rem 1rem;
      border: 2px solid #e2e8f0;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-btn:hover {
      border-color: #667eea;
      color: #667eea;
    }
    .filter-btn.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }
    .no-issues {
      text-align: center;
      padding: 3rem;
      color: #48bb78;
      font-size: 1.25rem;
    }
    .chart-container {
      height: 300px;
      margin: 2rem 0;
    }
    footer {
      text-align: center;
      color: #718096;
      margin-top: 3rem;
      padding: 2rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🔍 SweepstacX Report</h1>
      <div class="meta">
        Generated: ${new Date(meta.scanned_at).toLocaleString()} | 
        Tool: ${meta.tool} v${meta.version} | 
        Path: ${meta.root || '.'}
      </div>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.files_scanned || 0}</div>
        <div class="stat-label">Files Scanned</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.unused_imports || 0}</div>
        <div class="stat-label">Unused Imports</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.dead_files || 0}</div>
        <div class="stat-label">Dead Files</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.stale_dependencies || 0}</div>
        <div class="stat-label">Stale Dependencies</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${issues.length}</div>
        <div class="stat-label">Total Issues</div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">📊 Issues Overview</h2>
      
      ${issues.length === 0 ? `
        <div class="no-issues">
          🎉 No issues detected! Your codebase looks clean.
        </div>
      ` : `
        <div class="filter-bar">
          <button class="filter-btn active" onclick="filterIssues('all')">All (${issues.length})</button>
          ${Object.keys(issuesByType).map(type => `
            <button class="filter-btn" onclick="filterIssues('${type}')">
              ${formatIssueType(type)} (${issuesByType[type].length})
            </button>
          `).join('')}
        </div>

        <div id="issues-container">
          ${Object.entries(issuesByType).map(([type, typeIssues]) => `
            <div class="issue-group" data-type="${type}">
              <div class="issue-type">
                ${formatIssueType(type)}
                <span class="badge ${getBadgeClass(type)}">${typeIssues.length}</span>
              </div>
              <ul class="issue-list">
                ${typeIssues.map(issue => `
                  <li class="issue-item">
                    <span class="issue-file">${issue.file}</span>
                    ${issue.symbol ? `<span class="issue-detail">→ ${issue.symbol}</span>` : ''}
                    ${issue.message ? `<span class="issue-detail">→ ${issue.message}</span>` : ''}
                    ${issue.language ? `<span class="issue-detail">[${issue.language}]</span>` : ''}
                  </li>
                `).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <footer>
      Generated by <strong>SweepstacX</strong> v${meta.version} | 
      <a href="https://github.com/1devteam/SweepstacX" target="_blank">GitHub</a>
    </footer>
  </div>

  <script>
    function filterIssues(type) {
      const groups = document.querySelectorAll('.issue-group');
      const buttons = document.querySelectorAll('.filter-btn');
      
      buttons.forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      
      groups.forEach(group => {
        if (type === 'all' || group.dataset.type === type) {
          group.style.display = 'block';
        } else {
          group.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;
}

function formatIssueType(type) {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getBadgeClass(type) {
  if (type.includes('error') || type.includes('dead')) return 'badge-error';
  if (type.includes('warning') || type.includes('unused')) return 'badge-warning';
  return 'badge-info';
}
