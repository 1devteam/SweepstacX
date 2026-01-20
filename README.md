# SweepstacX

[![npm version](https://img.shields.io/npm/v/sweepstacx.svg)](https://www.npmjs.com/package/sweepstacx)
[![CI](https://github.com/1devteam/SweepstacX/actions/workflows/ci.yml/badge.svg)](https://github.com/1devteam/SweepstacX/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Code quality scanning tool for JavaScript/TypeScript projects. Detects dead code, unused imports, stale dependencies, and duplicate logic.

## Installation

```bash
npm install -g sweepstacx
```

## Basic Usage

```bash
# Scan your project
sweepstacx scan

# View the report
sweepstacx report

# Generate patches for issues
sweepstacx patch

# Apply patches automatically
sweepstacx patch --apply
```

## Commands

### scan

Scan your codebase for issues.

```bash
sweepstacx scan [options]

Options:
  --path <path>      Path to scan (default: ".")
  --lang <lang>      Language hint: js, ts (default: "js")
  --config <file>    Config file (.sweeperc.json)
```

### report

Generate or display scan reports.

```bash
sweepstacx report [options]

Options:
  --out <base>       Basename for outputs (default: "sweepstacx-report")
  --json             Output JSON to stdout
  --md               Output Markdown to stdout
```

### patch

Generate and optionally apply patches.

```bash
sweepstacx patch [options]

Options:
  --apply            Apply generated patches with git apply
```

### check

CI-friendly stats-only mode.

```bash
sweepstacx check [options]

Options:
  --path <path>      Path to scan (default: ".")
  --config <file>    Config file (.sweeperc.json)
```

### Additional Commands

- `lint` - Run ESLint on your code
- `deps` - Analyze dependencies with depcheck
- `dupes` - Find duplicate code blocks
- `complexity` - Analyze code complexity
- `fuzz` - Fuzz test JavaScript files

## Configuration

Create a `.sweeperc.json` in your project root:

```json
{
  "complexity": {
    "maxFunction": 15,
    "maxAverage": 10,
    "minMaintainability": 65
  },
  "duplication": {
    "maxLines": 10,
    "maxPercent": 8
  },
  "deps": {
    "unused": 0,
    "missing": 0
  },
  "ignore": [
    "node_modules/**",
    "dist/**",
    "coverage/**",
    ".git/**"
  ]
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Code Quality

on: [pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      - run: npm install -g sweepstacx
      - run: sweepstacx scan
      - run: sweepstacx check
```

## Development

### Prerequisites

- Node.js >= 18.17
- npm or pnpm

### Setup

```bash
git clone https://github.com/1devteam/SweepstacX.git
cd SweepstacX
npm install
npm test
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run lint          # Run linter
```

## License

MIT © [1devteam](https://github.com/1devteam)
