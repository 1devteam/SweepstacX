# check

The `check` command is designed for use in **Continuous Integration (CI)** environments. It runs a scan and then verifies the results against the quality gates defined in your `.sweeperc.json` configuration.

If any quality gate is violated (e.g., complexity is too high, or duplication exceeds the threshold), the command will exit with a non-zero status code, causing the CI build to fail.

## Usage

\`\`\`bash
sweepstacx check [options]
\`\`\`

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--path <path>` | Specify the root directory to scan. | `.` |
| `--config <file>` | Specify an alternative configuration file. | `.sweeperc.json` |

## Quality Gates

The `check` command verifies the following sections of your configuration:

*   **`complexity`**: Checks if average complexity or individual function complexity exceeds limits.
*   **`duplication`**: Checks if the percentage of duplicated lines exceeds `maxPercent`.
*   **`lint`**: Checks if the number of linting errors or warnings per KLOC exceeds limits.
*   **`deps`**: Checks for a high number of unused or missing dependencies.

## Example: CI/CD Integration

The `check` command is typically run after a successful build step in a CI pipeline:

\`\`\`yaml
# Example GitHub Actions step
- name: Run SweepstacX Quality Check
  run: |
    npm install -g sweepstacx
    sweepstacx check
\`\`\`
