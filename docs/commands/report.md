# report

The `report` command processes the data from the last `sweepstacx scan` and presents it in various formats, including Markdown and JSON, directly to the console or to a file.

## Usage

\`\`\`bash
sweepstacx report [options]
\`\`\`

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--out <base>` | Basename for output files (e.g., `my-report` will generate `my-report.json` and `my-report.md`). | `sweepstacx-report` |
| `--json` | Output the JSON report directly to `stdout`. | `false` |
| `--md` | Output the Markdown report directly to `stdout`. | `false` |

## Output Formats

By default, running `sweepstacx report` generates two files in your current working directory:

1.  **`sweepstacx-report.json`**: A machine-readable file containing all raw issues, statistics, and metadata. This file is used by other commands like `patch`, `html`, and `score`.
2.  **`sweepstacx-report.md`**: A human-readable summary of the scan results, including a summary table and a list of all detected issues.

## Example

Generate the report files and also output the Markdown summary to the console:

\`\`\`bash
sweepstacx report --md
\`\`\`
