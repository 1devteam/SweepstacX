# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/1devteam/SweepstacX/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/1devteam/SweepstacX/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/1devteam/SweepstacX/compare/v0.1.7...v0.2.0
[0.1.7]: https://github.com/1devteam/SweepstacX/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/1devteam/SweepstacX/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/1devteam/SweepstacX/releases/tag/v0.1.5
