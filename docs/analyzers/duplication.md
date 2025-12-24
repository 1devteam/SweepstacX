# Duplication Analyzer

The Duplication Analyzer, integrated into the `scan` command, detects identical code blocks across your project. High code duplication is a major source of technical debt, making code harder to maintain, test, and refactor.

## Technology

This analyzer leverages the power of **jscpd** (JavaScript Code Duplication Detector) to perform token-based analysis, which is more robust than simple line-by-line comparison.

## Metrics

The analyzer reports the following key metrics:

*   **Total Duplicated Lines:** The absolute number of lines of code that are part of a duplicated block.
*   **Duplication Percentage:** The percentage of your total codebase that is duplicated.
*   **Duplicated Blocks:** A list of all identified duplicate code blocks, including their file locations and line numbers.

## Configuration

You can configure the duplication thresholds in your `.sweeperc.json` file under the `duplication` section:

\`\`\`json
"duplication": {
  "maxLines": 10,
  "maxPercent": 8
}
\`\`\`

| Option | Description | Default |
| :--- | :--- | :--- |
| `maxLines` | The minimum number of lines a block must have to be considered a duplicate. | `10` |
| `maxPercent` | The maximum acceptable percentage of duplicated lines in the entire project. | `8` |

If the detected duplication percentage exceeds `maxPercent`, the `check` command will fail, making it an effective quality gate for CI/CD.
