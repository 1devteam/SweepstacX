# SweepstacX

[![npm version](https://img.shields.io/npm/v/sweepstacx.svg)](https://www.npmjs.com/package/sweepstacx)
[![CI](https://github.com/1devteam/SweepstacX/actions/workflows/ci.yml/badge.svg)](https://github.com/1devteam/SweepstacX/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-19%20passing-brightgreen.svg)]()

**Repo sweeper for modern dev stacks.**  

Scan, report, and patch dead code, unused imports, duplicate logic, and stale dependencies — keep your repos lean and production-ready.

---

## ✨ Features

- **🔍 Dead Code Detection** - Find files that are never imported
- **📦 Unused Import Analysis** - Detect and remove unused imports
- **⚠️ Stale Dependency Detection** - Identify deprecated or problematic packages
- **📊 Multiple Output Formats** - JSON, Markdown, or stdout
- **🔧 Auto-patching** - Generate and apply fixes automatically
- **⚡ Fast & Lightweight** - Built on modern Node.js with minimal dependencies
- **🎯 CI/CD Ready** - Easy integration with GitHub Actions, GitLab CI, and more

## 🚀 Quick Start

### Installation

```bash
npm install -g sweepstacx
```

### Basic Usage

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

### CI Mode

```bash
# Get stats-only output (perfect for CI)
sweepstacx check --path . | jq .stats

# Output JSON to stdout
sweepstacx report --json

# Output Markdown to stdout
sweepstacx report --md
```

## 📖 Commands

### `scan`

Scan your codebase for issues.

```bash
sweepstacx scan [options]

Options:
  --path <path>      Path to scan (default: ".")
  --lang <lang>      Language hint: js, ts (default: "js")
  --config <file>    Config file (.sweeperc.json)
```

**Example:**
```bash
sweepstacx scan --path ./src
```

### `report`

Generate or display scan reports.

```bash
sweepstacx report [options]

Options:
  --out <base>       Basename for outputs (default: "sweepstacx-report")
  --json             Output JSON to stdout
  --md               Output Markdown to stdout
```

**Examples:**
```bash
# Generate files
sweepstacx report --out my-report

# Pipe JSON to other tools
sweepstacx report --json | jq '.issues | length'

# View Markdown in terminal
sweepstacx report --md | less
```

### `patch`

Generate and optionally apply patches.

```bash
sweepstacx patch [options]

Options:
  --apply            Apply generated patches with git apply
```

**Example:**
```bash
sweepstacx patch --apply
```

### `check`

CI-friendly stats-only mode with quality gates.

```bash
sweepstacx check [options]

Options:
  --path <path>      Path to scan (default: ".")
  --config <file>    Config file (.sweeperc.json)
```

**Example:**
```bash
sweepstacx check --path . | jq .stats
```

### Additional Commands

- `lint` - Run ESLint on your code
- `deps` - Analyze dependencies with depcheck
- `dupes` - Find duplicate code blocks
- `complexity` - Analyze code complexity
- `fuzz` - Fuzz test JavaScript files

## ⚙️ Configuration

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

See [examples/.sweeperc.example.json](examples/.sweeperc.example.json) for a complete example.

## 🔗 CI/CD Integration

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

See [examples/ci-integration.md](examples/ci-integration.md) for more CI/CD examples.

## 📊 Sample Output

```
✓ Scan complete. files=31, unused_imports=5, dead_files=2, stale_deps=1

# SweepstacX — Scan Report

**Scanned at:** 2024-12-20T22:45:33.593Z

## Summary
- Files scanned: **31**
- Dead files: **2**
- Unused imports: **5**
- Stale dependencies: **1**

## Issues

### Unused Imports
- `join` in `src/utils.js`
- `React` in `components/Button.js`

### Dead Files
- `src/legacy/old-helper.js` - File is never imported

### Stale Dependencies
- `moment@^2.29.0` - Large bundle size - consider date-fns or dayjs
```

## 🎯 Use Cases

- **Pre-commit hooks** - Catch issues before they're committed
- **CI/CD pipelines** - Enforce code quality standards
- **Codebase cleanup** - Identify and remove technical debt
- **Refactoring** - Find safe-to-delete code during refactors
- **Dependency audits** - Keep dependencies modern and secure

## 🛠️ Development

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

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📝 License

MIT © [1devteam](https://github.com/1devteam)

## 🗺️ Roadmap

See [docs/roadmap.md](docs/roadmap.md) for planned features and milestones.

## 💼 Consulting

Need help integrating SweepstacX into your workflow or custom analysis features? See [docs/consulting.md](docs/consulting.md).

## 🙏 Acknowledgments

Built with:
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [fast-glob](https://github.com/mrmlnc/fast-glob) - Fast file globbing
- [Vitest](https://vitest.dev) - Testing framework

---

**Made with ❤️ by the 1devteam**

[Report Issues](https://github.com/1devteam/SweepstacX/issues) | [Request Features](https://github.com/1devteam/SweepstacX/issues/new) | [Discussions](https://github.com/1devteam/SweepstacX/discussions)
