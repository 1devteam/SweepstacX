# lint

The `lint` command provides a dedicated interface for running the integrated linter (ESLint) and managing code style issues.

## Usage

\`\`\`bash
sweepstacx lint [options]
\`\`\`

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--path <path>` | Specify the root directory to lint. | `.` |
| `--fix` | Automatically fix fixable linting issues. | `false` |

## Integration

The `lint` command is integrated with the project's ESLint configuration. It is primarily used to ensure code style consistency and catch simple programming errors.

For a comprehensive quality check that includes linting results, use the `sweepstacx check` command in your CI/CD pipeline.

## Example

Run the linter and automatically fix any issues it finds:

\`\`\`bash
sweepstacx lint --fix
\`\`\`
