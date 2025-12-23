# patch

The `patch` command is used to generate or apply patches to automatically fix issues detected by the `scan` command. Currently, it focuses on removing unused imports.

## Usage

\`\`\`bash
sweepstacx patch [options]
\`\`\`

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--dry-run` | Generate patch files but do not apply them to the source code. | `false` |
| `--apply` | Apply the generated patches directly to the source code. **Use with caution and ensure your code is committed.** | `false` |

## Workflow

1.  **Scan:** Run `sweepstacx scan` to generate the report and cache the issues.
2.  **Generate Patches (Dry Run):** Run `sweepstacx patch --dry-run` to see which files would be affected and to generate `.diff` files in the `./patches` directory.
3.  **Apply Patches:** Run `sweepstacx patch --apply` to modify the source files.

## Example

Generate and apply patches for all detected unused imports:

\`\`\`bash
sweepstacx patch --apply
\`\`\`
