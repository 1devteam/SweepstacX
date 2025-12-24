# trends

The `trends` command visualizes the historical evolution of your code quality metrics, allowing you to track progress and identify regressions over time.

## Usage

\`\`\`bash
sweepstacx trends [options]
\`\`\`

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--path <path>` | Specify the root directory where metrics are stored. | `.` |
| `--detailed` | Show a detailed history of all recorded metrics. | `false` |
| `--chart` | Show an ASCII chart visualization of the primary metric (e.g., total issues). | `false` |

## Data Source

The `trends` command relies on the metrics data automatically saved after every `sweepstacx scan` in the `.sweepstacx/metrics` directory.

## Example

Show a visual trend of the total number of issues over the last 10 scans:

\`\`\`bash
sweepstacx trends --chart
\`\`\`
