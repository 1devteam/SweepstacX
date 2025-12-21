## [0.3.0] - 2024-12-21

### Added
- **TypeScript Support** - Full support for `.ts` and `.tsx` files
- **Performance Optimizations**
  - Intelligent caching system for faster scans
  - Progress bars for better user feedback
  - Parallel processing preparation
- **Enhanced CLI UX**
  - Progress indicators during scans
  - Better error messages with suggestions
  - Colored output for improved readability
- **Configuration Management**
  - JSON Schema validation for `.sweeperc.json`
  - `sweepstacx init` command to generate config
  - IDE auto-complete support via schema
- **Watch Mode** - `sweepstacx watch` for development workflow
- **Automated Releases** - GitHub Actions for npm publishing
- **New Utilities**
  - Cache management system
  - Error handling framework
  - Progress indicators

### Improved
- Scan command now shows progress bars
- Better error messages with actionable suggestions
- Configuration validation with helpful errors
- Updated GitHub Actions workflows

### Dependencies
- Added `cli-progress` for progress bars
- Added `chokidar` for file watching
- Added `ajv` for JSON schema validation

