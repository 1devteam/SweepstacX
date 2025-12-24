# plugins

The `plugins` command is used to manage and inspect the extensible plugin system of SweepstacX. The plugin system allows users to create custom analyzers and fixers to tailor the tool to their specific needs.

## Usage

\`\`\`bash
sweepstacx plugins [options]
\`\`\`

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--list` | List all currently installed and active plugins. | `false` |
| `--install <name>` | Install a plugin from npm. | |
| `--uninstall <name>` | Uninstall a plugin. | |

## Plugin System Overview

Plugins can hook into various stages of the SweepstacX lifecycle:

*   **`beforeScan`**: Run custom logic before file scanning begins.
*   **`analyzeFile`**: Add custom analysis for individual files.
*   **`afterScan`**: Process the final report before it is saved.
*   **`fixIssue`**: Provide custom auto-fixing logic for specific issue types.

## Example

List all active plugins:

\`\`\`bash
sweepstacx plugins --list
\`\`\`
