# export

The `export` command allows you to convert the last scan report into various formats suitable for external reporting, auditing, or spreadsheet analysis.

## Usage

\`\`\`bash
sweepstacx export [options]
\`\`\`

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--format <format>` | The desired output format. Supported: `csv`, `pdf`, `json`. | `csv` |
| `--output <path>` | The path and filename for the exported file. | Varies by format |

## Supported Formats

*   **CSV (Comma Separated Values):** Ideal for importing into spreadsheet software (Excel, Google Sheets) for custom analysis and filtering.
*   **PDF (Portable Document Format):** Generates a clean, print-ready summary of the report.
*   **JSON:** Outputs the raw report data, useful for piping into other tools or systems.

## Example

Export the report to a PDF file named `audit-report.pdf`:

\`\`\`bash
sweepstacx export --format pdf --output audit-report.pdf
\`\`\`
