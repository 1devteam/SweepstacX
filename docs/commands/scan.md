# scan

The `scan` command is the core of SweepstacX. It performs a comprehensive analysis of your codebase to detect dead code, unused imports, stale dependencies, and other quality issues.

## Usage

\`\`\`bash
sweepstacx scan [options]
\`\`\`

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--path <path>` | Specify the root directory to scan. | `.` |
| `--no-cache` | Disable the intelligent caching system for a fresh scan. | `false` |
| `--git-diff` | Only scan files changed since the last commit (or specified commit). | `false` |
| `--since <ref>` | Used with `--git-diff`, specifies the reference to compare against. | `HEAD` |

## Example

Run a full scan, only on files changed since the main branch:

\`\`\`bash
sweepstacx scan --git-diff --since main
\`\`\`
