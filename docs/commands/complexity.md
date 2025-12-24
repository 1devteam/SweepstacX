# complexity

The `complexity` command analyzes your codebase to calculate and report on various code complexity metrics, helping you identify areas that are difficult to maintain and test.

## Usage

\`\`\`bash
sweepstacx complexity [options]
\`\`\`

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--path <path>` | Specify the root directory to analyze. | `.` |
| `--issues` | Display a detailed list of all complexity issues found (e.g., functions exceeding max complexity). | `false` |

## Metrics

The command reports on the following key metrics:

*   **Cyclomatic Complexity (CC):** Measures the number of linearly independent paths through a program's source code. A high CC indicates complex control flow.
*   **Cognitive Complexity (CogC):** Measures how difficult a unit of code is to understand. It penalizes structures that make code harder to read, such as nested control flow.
*   **Lines of Code (LOC):** The total number of lines in the analyzed files.
*   **Maintainability Index (MI):** A score from 0 to 100 that represents the relative ease of maintaining the code.

## Complexity Rating

The command provides an A-F rating for individual files and an average rating for the entire project, based on the Cyclomatic Complexity thresholds defined in `.sweeperc.json`.

| Rating | Cyclomatic Complexity | Recommendation |
| :--- | :--- | :--- |
| **A** | 1-5 | Simple, highly maintainable. |
| **B** | 6-10 | Moderate, good maintainability. |
| **C** | 11-20 | Complex, consider refactoring. |
| **D** | 21-30 | Very Complex, high risk of bugs. |
| **F** | 31+ | Extreme, must be refactored. |

## Example

Analyze complexity and show a detailed list of functions that exceed the configured complexity threshold:

\`\`\`bash
sweepstacx complexity --issues
\`\`\`
