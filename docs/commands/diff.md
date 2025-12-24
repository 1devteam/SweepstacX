# diff

The `diff` command is a powerful tool for **trend analysis** and **quality gate enforcement**. It compares two existing scan reports (JSON files) to highlight changes in code quality between two points in time (e.g., between `main` and a feature branch).

## Usage

\`\`\`bash
sweepstacx diff [options]
\`\`\`

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--base <file>` | The path to the base report file (e.g., the report from the `main` branch). | `sweepstacx-report.json` |
| `--compare <file>` | The path to the report file to compare against (e.g., the report from the feature branch). | **Required** |

## Output

The command outputs a color-coded summary to the console, detailing:

*   **New Issues:** Issues present in the comparison report but not in the base report.
*   **Fixed Issues:** Issues present in the base report but not in the comparison report.
*   **Metric Changes:** Percentage and absolute changes in key metrics like complexity, dead code count, and duplication percentage.

## Example

Compare the current report against a report saved from the `main` branch:

\`\`\`bash
# Assuming you have a base report saved as 'main-report.json'
sweepstacx diff --base main-report.json --compare sweepstacx-report.json
\`\`\`
