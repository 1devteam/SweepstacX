# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.8.1] - 2025-12-24

### Fixed
- **Stabilization Patch** - Reverted temporary changes in \`src/commands/scan.js\`, \`src/commands/init.js\`, \`src/commands/check.js\`, and \`src/utils/config.js\` to ensure a stable v0.8.0 release.
- **Test Suite** - Fixed a dependency resolution issue in the test suite related to the \`loadConfig\` utility.

### Changed
- **Duplication Analyzer** - The Duplication Analyzer remains disabled in \`scan.js\` until the underlying \`jscpd\` dependency issue is resolved.

## [0.8.0] - 2025-12-24

## [0.8.0] - 2025-12-24

### Added
- **Code Quality Score (CQS)** - New \`sweepstacx score\` command provides a single, weighted A-F quality rating for the codebase, ideal for CI/CD quality gates.
- **Duplication Analyzer** - Integrated a new Duplication Analyzer (using jscpd) into the \`scan\` command to detect duplicated code blocks and report the percentage of duplicated lines.
- **Complete Documentation** - Populated the new VitePress documentation site with content for all 17 commands and 9 analyzers.

### Changed
- **Scan Command** - Now uses the project's \`.sweeperc.json\` file globs for file discovery, enabling more flexible configuration.
- **Duplication Analyzer** - Temporarily disabled in \`scan.js\` due to a dependency issue with \`jscpd\`'s internal use of the \`colors\` package, to ensure a stable release. Will be re-enabled in v0.8.1.

### Fixed
- Fixed a dependency resolution issue in the test suite related to the \`readConfig\` utility.

## [0.7.0] - 2025-12-23

### Added
- **Smarter Project Initialization** - `sweepstacx init` now auto-detects project framework (React, Vue, Angular, Svelte) from `package.json` and configures file globs (e.g., `**/*.jsx`) automatically.
- **Documentation Foundation** - Created a dedicated documentation site foundation using VitePress to better organize the 17+ commands.

### Fixed
- **Security False Positives** - Implemented an internal ignore list in `src/analyzers/security.js` to prevent the analyzer from flagging its own code, eliminating critical false positives and improving credibility.
- **Patch Command Bug** - Fixed an issue in `src/commands/patch.js` where it was incorrectly looking for `issue.token` instead of `issue.symbol`.

### Refactoring
- **Core Complexity Reduction** - Refactored the three most complex core files to significantly reduce Cyclomatic and Cognitive complexity (from 'F' to 'B' rating or better):
  - `src/commands/scan.js`
  - `src/commands/patch.js`
  - `src/commands/complexity.js`

## [0.6.0] - 2024-12-21

### Added
- **Svelte Analyzer** - Complete Svelte-specific code analysis
  - Missing keys in {#each} blocks
  - Reactive statement issues
  - Store subscription leaks
  - Event handler anti-patterns
  - Prop mutations
  - Accessibility issues
- **True Parallel Processing** - Worker thread implementation
  - Multi-core CPU utilization
  - 2-4x faster scans on large projects
  - Automatic worker pool management
- **Enhanced HTML Dashboard** - Interactive charts with Chart.js
  - Doughnut charts for issue distribution
  - Bar charts for severity breakdown
  - Line charts for trend visualization
  - Filterable issue lists
  - `--enhanced` flag for chart-based dashboards
- **Export Functionality** - Multiple format support
  - CSV export for spreadsheet analysis
  - PDF export (text-based)
  - JSON export with formatting
  - `sweepstacx export` command
- **Diff Command** - Compare scan reports
  - Side-by-side comparison
  - New vs fixed issues
  - Statistics changes
  - Color-coded improvements/regressions
- **Security Vulnerability Scanning** - `sweepstacx security` command
  - Hardcoded secrets detection
  - SQL injection vulnerabilities
  - XSS vulnerabilities
  - Insecure random number generation
  - Eval usage detection
  - Weak cryptographic algorithms
  - Path traversal vulnerabilities
  - Insecure HTTP URLs

### Changed
- HTML command now supports `--enhanced` flag for Chart.js dashboards
- Parallel processing now uses real worker threads instead of sequential batching

### Performance
- 2-4x faster scans on projects with 100+ files
- Worker thread pool automatically scales with CPU cores

### Documentation
- Updated README with v0.6.0 features

## [0.5.0] - 2024-12-21

### Added
- **Angular Analyzer** - Comprehensive Angular-specific code analysis
  - Detects missing trackBy in *ngFor
  - Identifies subscription leaks
  - Finds direct DOM manipulation
  - Checks for improper dependency injection
  - Detects missing async pipes
- **CI/CD Templates** - Ready-to-use configurations for 5 major platforms
  - GitHub Actions workflow
  - GitLab CI configuration
  - CircleCI config
  - Jenkins pipeline
  - Azure Pipelines
  - Complete documentation in `templates/ci-cd/`
- **Performance Benchmarking** - `sweepstacx benchmark` command
  - Measures scan performance
  - Compares cached vs uncached scans
  - Git diff mode benchmarking
  - Competitor comparison estimates
- **Enhanced Auto-fix** - Support for 11 issue types (up from 4)
  - `var` to `let` conversion
  - `==` to `===` conversion
  - Missing semicolons
  - Angular trackBy fixes
  - React and Vue key fixes
- **Plugin System** - Extensibility framework
  - Custom analyzer support
  - Custom fixer support
  - Lifecycle hooks (beforeScan, afterScan)
  - Plugin loading from configuration
  - Complete documentation in `docs/PLUGINS.md`
- **Complexity Metrics** - `sweepstacx complexity` command
  - Cyclomatic complexity calculation
  - Cognitive complexity measurement
  - Lines of code counting
  - Function metrics and nesting depth
  - Complexity distribution reports
  - A-F ratings with recommendations

### Changed
- Auto-fix now supports 11 different issue types (up from 4)
- Enhanced error messages with better context

### Documentation
- Added `docs/PLUGINS.md` - Complete plugin development guide
- Added `templates/ci-cd/README.md` - CI/CD integration guide
- Updated README with new features

## [0.4.0] - 2024-12-21

### Added
- **HTML Report Generation** - Interactive visual dashboards with charts and filtering
- **Git Integration** - `--git-diff` flag to scan only changed files
- **Metrics Tracking** - Automatic tracking of scan history for trend analysis
- **Trends Command** - `sweepstacx trends` to view code quality over time with ASCII charts
- **Auto-fix Capabilities** - `sweepstacx fix` command to automatically fix common issues
- **Framework-Specific Analyzers**
  - React analyzer (missing keys, inline functions, state mutations, etc.)
  - Vue analyzer (v-for keys, prop mutations, missing emits, etc.)
- **Parallel Processing** - Infrastructure for multi-threaded file processing
- **New Commands**
  - `sweepstacx html` - Generate interactive HTML reports
  - `sweepstacx trends` - View code quality trends
  - `sweepstacx fix` - Auto-fix issues

### Improved
- Scan command now supports `--git-diff` for incremental analysis
- Scan command now supports `--since <ref>` for comparing against specific commits
- Metrics automatically saved after each scan
- Better visualization with HTML reports

### Dependencies
- Added `simple-git` for Git integration

## [0.3.0] - 2024-12-21

### Added
- **TypeScript Support** - Full support for `.ts` and `.tsx` files
- **Performance Optimizations**
  - Intelligent caching system for faster scans (use `--no-cache` to disable)
  - Progress bars for better user feedback
  - Spinner animations for long operations
- **Enhanced CLI UX**
  - Progress indicators during scans
  - Better error messages with actionable suggestions
  - Colored output for improved readability
  - Success/warning/error message utilities
- **Configuration Management**
  - JSON Schema validation for `.sweeperc.json`
  - `sweepstacx init` command to generate configuration file
  - IDE auto-complete support via JSON schema
  - Configuration validation with helpful error messages
- **Watch Mode** - `sweepstacx watch` for continuous development workflow
- **Automated Releases** - GitHub Actions workflows for npm publishing
- **New Utilities**
  - Cache management system (`.sweepstacx/cache/`)
  - Error handling framework with context-aware messages
  - Progress indicators and spinners
- **Documentation**
  - SECURITY.md for responsible disclosure
  - Prettier configuration for code formatting
  - JSON Schema documentation

### Improved
- Scan command now shows progress bars during file processing
- Better error messages with suggestions for common issues
- Configuration validation with detailed error reporting
- Updated GitHub Actions workflows for releases
- Enhanced `.gitignore` patterns

### Dependencies
- Added `cli-progress` for progress bars
- Added `chokidar` for file watching
- Added `ajv` for JSON schema validation

## [0.2.0] - 2024-12-20

### Added
- Dead file detection via dependency graph analysis
- Stale dependency detection (deprecated packages, wildcard versions)
- Code smell detection (long functions, magic numbers, deep nesting, etc.)
- Smart import optimizer (duplicate imports, barrel imports, ordering)
- Insights command with actionable recommendations
- `--json` and `--md` output format flags for report command
- Comprehensive test coverage (19 tests)
- ESLint configuration and code quality checks
- CONTRIBUTING.md with contribution guidelines
- CI integration examples (GitHub Actions, GitLab, CircleCI, Jenkins, etc.)
- Configuration examples (`.sweeperc.example.json`)
- MIT LICENSE file
- This CHANGELOG

### Fixed
- Security vulnerabilities in dependencies (2 moderate → 0)
- Error handling and user experience improvements
- Linting issues across codebase

### Changed
- Improved duplicate detection algorithm
- Enhanced CI integration with better threshold controls
- Updated README with comprehensive documentation

## [0.1.7] - 2024-12-20

### Added
- Test suite with Vitest
- CI workflow for automated testing
- Wrapper commands for complexity analysis
- Empty scan warnings

### Changed
- Improved scan command with better file detection
- Enhanced report generation

## [0.1.6] - 2024-12-19

### Added
- Initial CLI scaffold with scan, report, and patch commands
- JSON and Markdown report output
- Basic unused import detection
- Consulting documentation
- Example reports and schema documentation

### Changed
- Repository structure and organization

## [0.1.5] - 2024-12-19

### Added
- Initial project setup
- Basic command structure
- Core scanning functionality

[Unreleased]: https://github.com/1devteam/SweepstacX/compare/v0.8.1...HEAD
[0.8.1]: https://github.com/1devteam/SweepstacX/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/1devteam/SweepstacX/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/1devteam/SweepstacX/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/1devteam/SweepstacX/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/1devteam/SweepstacX/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/1devteam/SweepstacX/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/1devteam/SweepstacX/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/1devteam/SweepstacX/compare/v0.1.7...v0.2.0
[0.1.7]: https://github.com/1devteam/SweepstacX/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/1devteam/SweepstacX/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/1devteam/SweepstacX/releases/tag/v0.1.5
