# fuzz

The `fuzz` command is an advanced feature that uses fuzz testing to find potential runtime errors, crashes, or unexpected behavior in a target JavaScript file by feeding it a large volume of randomly generated inputs.

## Usage

\`\`\`bash
sweepstacx fuzz <file> [options]
\`\`\`

## Arguments

| Argument | Description |
| :--- | :--- |
| `<file>` | The path to the JavaScript file containing the function to be fuzzed. |

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--timeout <ms>` | The maximum time (in milliseconds) to spend on each fuzzed test case. | `5000` |

## Example

Fuzz test a file named `parser.js` with a 10-second timeout per case:

\`\`\`bash
sweepstacx fuzz src/utils/parser.js --timeout 10000
\`\`\`
