# watch

The `watch` command is a powerful feature for developers, enabling continuous, real-time code quality feedback. It monitors your project files for changes and automatically triggers a re-scan when a file is saved.

## Usage

\`\`\`bash
sweepstacx watch [options]
\`\`\`

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--path <path>` | Specify the root directory to watch. | `.` |
| `--no-cache` | Disable caching for a fresh scan on every change. | `false` |

## Features

*   **Instant Feedback:** Get immediate notifications about new issues (e.g., unused imports, complexity spikes) as soon as you save a file.
*   **Intelligent Caching:** By default, the watch mode uses the intelligent caching system to ensure re-scans are extremely fast, only processing files that have actually changed.
*   **Non-Blocking:** The process runs in the background, allowing you to continue coding while it monitors for changes.

## Example

Start continuous monitoring of your project:

\`\`\`bash
sweepstacx watch
\`\`\`
