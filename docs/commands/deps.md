# deps

The `deps` command analyzes your project's dependencies to identify issues such as stale, unused, or missing packages.

## Usage

\`\`\`bash
sweepstacx deps [options]
\`\`\`

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--path <path>` | Specify the root directory to analyze. | `.` |

## Detected Issues

*   **Unused Dependencies:** Packages listed in `package.json` that are not imported or required anywhere in the source code.
*   **Missing Dependencies:** Packages used in the source code that are not listed in `package.json`.
*   **Stale Dependencies:** Packages that are deprecated, have known security vulnerabilities, or use problematic version ranges (e.g., wildcards).

## Example

\`\`\`bash
sweepstacx deps
\`\`\`
