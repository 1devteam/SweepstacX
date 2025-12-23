# Configuration

SweepstacX is configured via a `.sweeperc.json` file located in the root of your project.

## Auto-Detection (New in v0.7.0)

The `sweepstacx init` command now automatically detects your project's framework (React, Vue, Angular, Svelte) by checking your `package.json` dependencies. This ensures the correct file types (e.g., `.jsx`, `.vue`) are included in the scan by default.

## Example `.sweeperc.json`

\`\`\`json
{
  "$schema": "https://raw.githubusercontent.com/1devteam/SweepstacX/main/docs/config-schema.json",
  "files": [
    "**/*.js",
    "**/*.mjs",
    "**/*.cjs",
    "**/*.ts",
    "**/*.tsx",
    "**/*.jsx"
  ],
  "complexity": {
    "maxFunction": 15,
    "maxAverage": 10,
    "minMaintainability": 65
  },
  "ignore": [
    "node_modules/**",
    "dist/**",
    "build/**",
    "coverage/**",
    ".git/**",
    "*.min.js",
    "vendor/**"
  ],
  "typescript": {
    "enabled": true,
    "checkTypeImports": true
  },
  "framework": {
    "type": "react"
  },
  "cache": {
    "enabled": true,
    "maxAge": 3600000
  }
}
\`\`\`

## Key Configuration Sections

| Section | Description |
| :--- | :--- |
| `files` | **Glob patterns** to include in the scan. This is automatically configured by `init` based on your framework. |
| `ignore` | **Glob patterns** to exclude from the scan (e.g., build directories, vendor files). |
| `complexity` | Thresholds for **Cyclomatic Complexity** and **Maintainability Index**. |
| `typescript` | Settings for the **TypeScript analyzer**, including checking for unused type imports. |
| `framework` | Stores the **auto-detected framework type** (e.g., `react`, `vue`). |
| `cache` | Controls the **intelligent caching system** for faster subsequent scans. |

For a full list of options, refer to the [Configuration Schema](https://github.com/1devteam/SweepstacX/blob/main/docs/config-schema.json).
