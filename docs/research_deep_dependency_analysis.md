# Research Findings: Deep Dependency Analysis for SweepstacX v0.9.0

The goal for v0.9.0 is to implement Deep Dependency Analysis, covering license compliance, security vulnerabilities, and dependency graph visualization.

## Proposed Tools

Based on the research, the following tools are the most suitable for programmatic integration into SweepstacX:

### 1. Dependency Graph Generation: `snyk-nodejs-lockfile-parser`

This package is ideal for generating a structured dependency graph from various lockfiles, including `package-lock.json`, `yarn.lock`, and crucially, `pnpm-lock.yaml` (which SweepstacX uses).

*   **Functionality:** Parses lock files and returns a dependency tree or graph object.
*   **Key Method:** `buildDepTree(manifestFile, lockFile, options.dev, lockFileType, strictOutOfSync, defaultManifestFileName)`
*   **Supported Lockfiles:** `package-lock.json` (v2/v3), `yarn.lock`, `pnpm-lock.yaml` (v5.x, 6.x, 9.x).
*   **Output:** A structured object representing the dependency tree/graph, which can be traversed to analyze relationships.

### 2. License Compliance: `license-checker-rseidelsohn`

This is an enhanced and maintained fork of the original `license-checker` package, providing reliable license information for all dependencies.

*   **Functionality:** Audits all NPM dependencies and their transitive dependencies for license information.
*   **Programmatic Usage:** The package can be used programmatically to get a JSON output, which is necessary for integration.
*   **Output:** A JSON object mapping package names to their license, repository, and other metadata.

### 3. Security Vulnerability Analysis: `npm audit` / `snyk` CLI

While Snyk offers a programmatic parser, the most reliable and up-to-date vulnerability data comes from the official `npm audit` or the `snyk` CLI tool.

*   **Strategy:** Instead of integrating a third-party library, the most effective approach is to execute `npm audit --json` or `snyk test --json` via a shell command and parse the resulting JSON output. This ensures the use of the latest vulnerability database.
*   **Integration:** The `shell` tool will be used to execute the audit command, and the output will be captured and parsed within the new analyzer.

## v0.9.0 Implementation Plan

The new feature will be implemented as a new command, likely `sweepstacx deps`, and a new analyzer, `src/analyzers/deep-deps.js`.

1.  **Install Dependencies:** Install `snyk-nodejs-lockfile-parser` and `license-checker-rseidelsohn`.
2.  **Create Analyzer:** Develop `src/analyzers/deep-deps.js` to:
    *   Use `snyk-nodejs-lockfile-parser` to build the dependency graph.
    *   Use `license-checker-rseidelsohn` to gather license data.
    *   Use `shell` to run `npm audit --json` for vulnerability data.
3.  **Create Command:** Develop `src/commands/deps.js` to orchestrate the analysis and present a comprehensive report, including:
    *   A list of all dependencies and their licenses.
    *   A list of all vulnerabilities (critical, high, medium).
    *   Visualization of the dependency graph (e.g., a simple text-based tree or a link to an external visualization tool).

This plan leverages existing, well-maintained tools to quickly deliver a high-impact feature, directly addressing the goal of becoming a serious competitor.
