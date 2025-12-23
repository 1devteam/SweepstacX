# init

The `init` command creates a default `.sweeperc.json` configuration file in your project root.

## Usage

\`\`\`bash
sweepstacx init [options]
\`\`\`

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--force` | Overwrite an existing `.sweeperc.json` file. | `false` |

## Auto-Detection (New in v0.7.0)

The `init` command now intelligently inspects your `package.json` to detect the project's framework (React, Vue, Angular, Svelte, or plain JavaScript/TypeScript).

Based on the detection, it automatically configures the `files` glob patterns in `.sweeperc.json` to ensure all relevant files (e.g., `.jsx`, `.vue`) are included in the scan, addressing a common configuration pain point.

## Example

\`\`\`bash
# Create a new config, auto-detecting the framework
sweepstacx init

# Force overwrite an existing config
sweepstacx init --force
\`\`\`
