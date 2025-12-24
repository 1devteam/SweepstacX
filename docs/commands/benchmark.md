# benchmark

The `benchmark` command measures the performance of the SweepstacX scanner itself, providing metrics on scan speed, caching efficiency, and parallel processing gains.

## Usage

\`\`\`bash
sweepstacx benchmark [options]
\`\`\`

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--path <path>` | Specify the root directory to benchmark. | `.` |
| `--compare` | Include a comparison against estimated performance of popular competitor tools. | `false` |

## Metrics Measured

*   **Initial Scan Time:** Time taken for a full, uncached scan.
*   **Cached Scan Time:** Time taken for a scan with a warm cache (demonstrates the value of the caching system).
*   **Files/Second:** The processing throughput of the scanner.
*   **Parallel Processing Gain:** Measures the speedup achieved by using worker threads.

## Example

Run a full benchmark including competitor comparison:

\`\`\`bash
sweepstacx benchmark --compare
\`\`\`
