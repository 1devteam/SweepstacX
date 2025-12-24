# score

The `score` command calculates a single, weighted **Code Quality Score (CQS)** for your project, providing an immediate, actionable metric for overall codebase health. This is an enterprise-grade feature designed for quick quality gate checks in CI/CD pipelines.

The score is calculated based on the results of the last `sweepstacx scan` and is normalized to a 0-100 scale, with a corresponding A-F letter grade.

## Usage

\`\`\`bash
sweepstacx score
\`\`\`

## Code Quality Score (CQS) Weighting

The CQS is a weighted average of four key quality metrics:

| Metric | Weight | Description |
| :--- | :--- | :--- |
| **Complexity** | 40% | Based on the number of files exceeding complexity thresholds. |
| **Dead Code** | 30% | Based on the count of unused imports and dead files. |
| **Security** | 20% | Based on the count of security vulnerabilities found. |
| **Duplication** | 10% | Based on the percentage of duplicated lines of code. |

## Example Output

\`\`\`
⭐ Code Quality Score

  Overall Quality Rating: [36mB[39m (82.50/100)
  --------------------------------------------------
  Complexity  : [36mB[39m (85.00/100) - Weight: 40%
  Dead Code   : [32mA[39m (90.00/100) - Weight: 30%
  Security    : [33mC[39m (75.00/100) - Weight: 20%
  Duplication : [32mA[39m (95.00/100) - Weight: 10%
  --------------------------------------------------
  Based on last scan: 2025-12-23T10:00:00.000Z
\`\`\`
