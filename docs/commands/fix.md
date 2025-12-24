# fix

The `fix` command is a convenience wrapper that runs all available auto-fixers and optimizers on your codebase. It is designed to quickly resolve common, low-risk issues like unused imports, formatting inconsistencies, and simple code style violations.

## Usage

\`\`\`bash
sweepstacx fix [options]
\`\`\`

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--verify` | Suggests running `sweepstacx scan` after fixes are applied to confirm all issues are resolved. | `false` |

## Fixers Included

The `fix` command currently orchestrates the following auto-fix capabilities:

*   **Unused Import Removal:** (via `patch` command logic)
*   **Code Style Fixes:** (via internal linting/formatting logic)
*   **Framework-Specific Fixes:** (e.g., adding missing keys in React/Vue components)

## Warning

While `fix` is designed to be safe, it is always recommended to run it on a clean Git branch and review the changes before committing.

## Example

\`\`\`bash
sweepstacx fix --verify
\`\`\`
