# SweepstacX Scenario Runner

Deterministic benchmarking harness for SweepstacX. Runs scans across multiple real-world repositories, produces reproducible artifacts, and generates metrics to validate effectiveness.

## Purpose

Instead of one-off demos, build a **credible portfolio** by:

- Scanning multiple repos (requests, rich, click, etc.)
- Running full scans, incremental scans, and custom rule scans
- Capturing before/after metrics
- Detecting regressions
- Publishing evidence of effectiveness

## Quick Start

### 1. Set up Python environment

```bash
make sim-venv
```

### 2. Run scenarios

```bash
make sim-run
```

### 3. View results

```bash
ls -la .sim/artifacts/
```

Each run produces:
- `summary.json` - Overall metrics and status
- `repos/*/initial_scan/result.json` - Full scan output
- `repos/*/incremental_scan/result.json` - Git diff scan output
- `repos/*/custom_rules/result.json` - Custom rules scan output

## Scenario Configuration

Edit `sim/scenarios/default.yml`:

```yaml
version: 1

workspace: ".sim/workspace"  # Where repos are cloned
artifacts: ".sim/artifacts"  # Where outputs go

repos:
  - name: "requests"
    url: "https://github.com/psf/requests.git"
    ref: "master"

tasks:
  - id: "initial_scan"
    type: "scan_full"
    args:
      format: "json"

  - id: "incremental_scan"
    type: "scan_git_diff"
    args:
      base_ref: "HEAD~1"
      format: "json"

  - id: "custom_rules"
    type: "custom_rules_scan"
    args:
      rules_path: "rules/custom"
      format: "json"
```

## Task Types

### scan_full

Full analysis of the repo.

```yaml
- id: "initial_scan"
  type: "scan_full"
  args:
    format: "json"
```

### scan_git_diff

Incremental scan (only changed files). Simulates PR analysis.

```yaml
- id: "incremental_scan"
  type: "scan_git_diff"
  args:
    base_ref: "HEAD~1"  # Compare against previous commit
    format: "json"
```

### custom_rules_scan

Scan with custom rules from `rules/custom/`.

```yaml
- id: "custom_rules"
  type: "custom_rules_scan"
  args:
    rules_path: "rules/custom"
    format: "json"
```

## Output Structure

```
.sim/artifacts/
└── 2026-01-20T16-18-30Z/
    ├── scenario.yml              # Scenario config used
    ├── summary.json              # Overall metrics
    └── repos/
        ├── requests/
        │   ├── initial_scan/
        │   │   └── result.json
        │   ├── incremental_scan/
        │   │   └── result.json
        │   └── custom_rules/
        │       └── result.json
        ├── rich/
        │   ├── initial_scan/
        │   │   └── result.json
        │   └── ...
        └── click/
            └── ...
```

## Metrics to Publish

From the artifacts, extract:

- **Coverage**: Number of repos, languages, total LOC
- **Signal**: Findings per 1k LOC, severity distribution
- **Consistency**: Findings across different repo types
- **Performance**: Scan time per repo, throughput

Example:

```json
{
  "coverage": {
    "repos": 3,
    "total_loc": 125000,
    "languages": ["python"]
  },
  "signal": {
    "total_findings": 247,
    "findings_per_1k_loc": 1.98,
    "severity": {
      "critical": 5,
      "high": 23,
      "medium": 89,
      "low": 130
    }
  },
  "performance": {
    "total_seconds": 45.3,
    "avg_per_repo": 15.1
  }
}
```

## Custom Rules

Place custom rule files in `rules/custom/`:

```
rules/
└── custom/
    ├── no-console-in-production.js
    ├── require-error-handling.js
    └── ...
```

Then reference in scenario:

```yaml
- id: "custom_rules"
  type: "custom_rules_scan"
  args:
    rules_path: "rules/custom"
    format: "json"
```

## Cleaning Up

Remove all simulation artifacts:

```bash
make sim-clean
```

Or manually:

```bash
rm -rf .sim/
```

## Troubleshooting

### "sweepstacx: command not found"

Install SweepstacX globally:

```bash
npm install -g sweepstacx
```

Or use the local version:

```bash
npm install
npm link
```

### Python venv issues

Recreate the venv:

```bash
rm -rf .sim/venv
make sim-venv
```

### Git clone failures

Check network connectivity and repo URLs in `sim/scenarios/default.yml`.

## Next Steps

1. Run `make sim-run` to generate baseline metrics
2. Publish results to show effectiveness
3. Add more repos to expand coverage
4. Create custom rules to show differentiation
5. Use metrics in marketing/sales materials

---

**Goal**: Turn SweepstacX from a tool into a **proven, benchmarked solution**.
