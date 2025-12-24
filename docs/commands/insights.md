# insights

The `insights` command goes beyond simple issue reporting by providing advanced analysis and actionable recommendations based on the overall state of your codebase.

## Usage

\`\`\`bash
sweepstacx insights [options]
\`\`\`

## Features

The command synthesizes data from all analyzers to provide:

*   **Top 5 Technical Debt Hotspots:** Identifies the files with the highest concentration of issues (complexity, security, duplication).
*   **Refactoring Recommendations:** Suggests specific refactoring tasks (e.g., "Extract function from `src/commands/scan.js` to reduce complexity from 59 to below 20").
*   **Best Practice Adherence:** Reports on how well the codebase adheres to modern best practices (e.g., "95% of React components use functional components and hooks").
*   **Estimated Effort:** Provides a rough estimate of the effort required to fix the most critical issues.

## Example

\`\`\`bash
sweepstacx insights
\`\`\`
