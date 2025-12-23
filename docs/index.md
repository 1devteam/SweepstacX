---
layout: home

hero:
  name: SweepstacX
  text: Enterprise-Grade Code Quality CLI
  tagline: Scan, Report, Patch. The comprehensive tool for dead code detection, complexity analysis, and security scanning.
  actions:
    - theme: brand
      text: Get Started
      link: /installation
    - theme: alt
      text: View on GitHub
      link: https://github.com/1devteam/SweepstacX

features:
  - icon: ⚡️
    title: Blazing Fast Analysis
    details: Utilizes intelligent caching and true parallel processing with worker threads for 5-10x faster scans.
  - icon: 🛠️
    title: 17 Powerful Commands
    details: From `scan` and `report` to `patch` (auto-fix) and `security`, manage your codebase health with a single CLI.
  - icon: 🧩
    title: Pluggable Architecture
    details: Easily extend functionality with custom analyzers and framework support (React, Vue, Angular, Svelte).
  - icon: 📈
    title: Trend Tracking & Metrics
    details: Track code quality metrics over time, generate HTML reports, and export data to CSV/PDF.
---

## Introduction

SweepstacX is designed to be a serious competitor in the code quality field, offering a suite of tools to help development teams maintain a clean, efficient, and secure codebase. This documentation will guide you through its features, configuration, and best practices.

### Key Features

*   **Dead Code Detection:** Finds unused imports, dead files, and stale dependencies.
*   **Complexity Analysis:** Calculates Cyclomatic and Cognitive complexity for maintainability.
*   **Security Scanning:** Detects common vulnerabilities like hardcoded secrets and XSS risks.
*   **Auto-Fix (`patch`):** Automatically removes unused imports to keep your code clean.
*   **Framework Support:** Dedicated analyzers for React, Vue, Angular, and Svelte.
