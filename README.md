# SweeperstacX CLI (tooleval)

**SweeperstacX** (tooleval) is an adaptive code quality evaluation CLI that runs a suite of tools (linters, formatters, tests, and more) on your project and provides a summary of issues along with recommended next actions.

## Features
- **Adaptive Sweep Engine:** Dynamically determines which checks to run based on context (e.g., run only on changed files in pull requests, skip tests if none present, etc.) and in an optimal order (fast checks first).
- **Next-Action Prompter:** After running the suite of tools, the CLI can suggest a plan of next steps (e.g., "Run format, fix lint issues, address test failures") to guide you in addressing any issues found.
- **Integrated Tools:** Out of the box support for:
  - *Ruff* – ultra-fast Python linter (and formatter).
  - *Flake8* – style guide enforcement.
  - *Pylint* – comprehensive source analysis.
  - *Pytest* – running the project's tests.
  - *Black* – code formatter (optional via formatter toggle).
- **Formatter Toggle:** Easily switch between using Ruff's built-in formatter or Black for code formatting with `--migrate black` or `--migrate ruff-fmt`. This updates configuration files accordingly.
- **Plugin Support:** Define custom additional checks in a `sweeper_plugins.yaml` manifest (for example, static type checking with mypy, security scanning with bandit). Run them via `--plugins` or the `make plugins` command.

## Installation
Requires **Python 3.12+**. Install the CLI and its dependencies:
```bash
pip install .

