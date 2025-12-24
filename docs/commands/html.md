# html

The `html` command generates a full, interactive HTML dashboard report from the last scan data. This provides a rich, visual way to explore your code quality metrics.

## Usage

\`\`\`bash
sweepstacx html [options]
\`\`\`

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--output <path>` | The path and filename for the generated HTML file. | `sweepstacx-report.html` |
| `--enhanced` | Generates an enhanced dashboard with interactive charts (using Chart.js) for issue distribution and trends. | `false` |

## Features

*   **Summary Overview:** High-level statistics on files scanned, issues found, and overall quality.
*   **Filterable Issue List:** Easily sort and filter issues by type, severity, and file path.
*   **Enhanced Dashboard (`--enhanced`):**
    *   Doughnut charts for issue type distribution.
    *   Bar charts for severity breakdown.
    *   Line charts for historical trend visualization (requires multiple scans).

## Example

Generate the enhanced HTML dashboard:

\`\`\`bash
sweepstacx html --enhanced
\`\`\`
