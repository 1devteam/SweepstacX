# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Dead file detection via dependency graph analysis
- Stale dependency detection from package.json
- `--json` and `--md` output format flags for report command
- Comprehensive test coverage for all commands
- ESLint configuration and code quality checks
- CONTRIBUTING.md with contribution guidelines
- Configuration examples and documentation
- MIT LICENSE file
- This CHANGELOG

### Fixed
- Security vulnerabilities in dependencies
- Error handling and user experience improvements

### Changed
- Improved duplicate detection algorithm
- Enhanced CI integration with better threshold controls

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

[Unreleased]: https://github.com/1devteam/SweepstacX/compare/v0.1.7...HEAD
[0.1.7]: https://github.com/1devteam/SweepstacX/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/1devteam/SweepstacX/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/1devteam/SweepstacX/releases/tag/v0.1.5
