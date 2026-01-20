# SweepstacX Black-Box Lab Harness

Runs all four realistic scenarios in isolation. Does NOT touch the SweepstacX engine—pure CLI orchestration. Produces clean artifact tree and metrics dashboard.

## The Four Scenarios

### Scenario 1: Baseline Scan
**What it tests:** Full analysis of a repo  
**Command:** `sweepstacx scan --path <repo>`  
**Output:** Complete scan results  
**Use case:** Establish baseline metrics

### Scenario 2: PR Simulation (Git-Diff)
**What it tests:** Incremental scanning (only changed files)  
**Command:** `sweepstacx scan --path <repo> --git-diff --since HEAD~1`  
**Output:** Findings in changed files only  
**Use case:** Simulate PR review workflow

### Scenario 3: AI Fix + Rescan + Regression Check
**What it tests:** Auto-fix capability and regression detection  
**Steps:**
1. Baseline scan
2. Apply fixes: `sweepstacx fix`
3. Capture diff: `git diff`
4. Rescan: `sweepstacx scan --path <repo>`
5. Compare: baseline vs. rescan for regressions

**Use case:** Prove fixes don't introduce new issues

### Scenario 4: Custom Rules Scan
**What it tests:** Scanning with custom rule configuration  
**Command:** `sweepstacx scan --path <repo> --config .sweeperc.json`  
**Output:** Findings filtered by custom rules  
**Use case:** Show rule flexibility and customization

## Quick Start

### 1. Install dependencies

```bash
pip install pyyaml
```

### 2. Run the lab

```bash
python3 lab/lab.py --config lab/config.yml
```

### 3. View results

```bash
ls -la .lab/artifacts/
```

## Output Structure

```
.lab/artifacts/
└── 2026-01-20T16-18-30Z/
    ├── dashboard.json                    # Metrics summary
    ├── DASHBOARD.md                      # Markdown summary
    ├── scenario_1_baseline/
    │   ├── requests/
    │   │   ├── stdout.txt
    │   │   ├── stderr.txt
    │   │   └── command.txt
    │   ├── rich/
    │   │   └── ...
    │   └── click/
    │       └── ...
    ├── scenario_2_pr_simulation/
    │   ├── requests/
    │   │   └── ...
    │   └── ...
    ├── scenario_3_ai_fix_rescan/
    │   ├── requests/
    │   │   ├── phase_1_baseline_stdout.txt
    │   │   ├── phase_2_fix_stdout.txt
    │   │   ├── phase_3_diff.patch
    │   │   ├── phase_4_rescan_stdout.txt
    │   │   └── ...
    │   └── ...
    └── scenario_4_custom_rules/
        ├── requests/
        │   └── ...
        └── ...
```

## Dashboard Output

The `dashboard.json` contains:

```json
{
  "run_id": "2026-01-20T16-18-30Z",
  "timestamp": "2026-01-20T16-18-30Z",
  "scenarios": [
    {
      "scenario_id": "1",
      "scenario_name": "Baseline Scan",
      "repo_name": "requests",
      "status": "ok",
      "duration_seconds": 12.5,
      "findings_count": 47
    },
    ...
  ],
  "summary": {
    "total_scenarios": 12,
    "passed": 12,
    "failed": 0,
    "total_duration_seconds": 156.3
  }
}
```

## Customizing the Lab

### Add more repos

Edit `lab/config.yml`:

```yaml
repos:
  - name: "my-repo"
    url: "https://github.com/user/my-repo.git"
    ref: "main"
```

### Change test repos

```yaml
repos:
  - name: "django"
    url: "https://github.com/django/django.git"
    ref: "main"
  
  - name: "fastapi"
    url: "https://github.com/tiangolo/fastapi.git"
    ref: "main"
```

### Keep workspace for inspection

```bash
python3 lab/lab.py --config lab/config.yml --keep-workspace
```

Repos will be in `.lab/workspace/` for manual inspection.

## Interpreting Results

### Scenario 1: Baseline Scan
- **Status: ok** → Scan completed successfully
- **Duration** → Scan performance
- **Findings** → Baseline issue count

### Scenario 2: PR Simulation
- **Status: ok** → Git-diff mode works
- **Duration** → Incremental scan is faster than baseline
- **Findings** → Issues in changed files only

### Scenario 3: AI Fix + Rescan
- **Regression: false** → Fixes don't introduce new issues ✅
- **Regression: true** → Fixes caused regressions ❌
- **Phases** → Detailed timing for each phase

### Scenario 4: Custom Rules
- **Status: ok** → Custom config works
- **Findings** → Filtered by rules

## Publishing Results

Extract metrics for marketing/sales:

```bash
# Get summary
cat .lab/artifacts/*/dashboard.json | jq '.summary'

# Get per-repo metrics
cat .lab/artifacts/*/dashboard.json | jq '.scenarios[] | {repo: .repo_name, status: .status, duration: .duration_seconds}'
```

Example output:

```
Coverage: 3 repos tested
Performance: 156s total, 52s average per repo
Success rate: 100% (12/12 scenarios passed)
Regression detection: 0 regressions across all fixes
```

## Troubleshooting

### "sweepstacx: command not found"

Install SweepstacX globally:

```bash
npm install -g sweepstacx
```

Or link locally:

```bash
cd /path/to/SweepstacX
npm link
```

### Git clone failures

Check network and repo URLs in `lab/config.yml`.

### Python import errors

Install dependencies:

```bash
pip install pyyaml
```

## Next Steps

1. **Run baseline** - `python3 lab/lab.py --config lab/config.yml`
2. **Review dashboard** - `cat .lab/artifacts/*/DASHBOARD.md`
3. **Extract metrics** - Use for marketing/sales
4. **Add more repos** - Expand coverage
5. **Publish results** - Show effectiveness

---

**Goal:** Turn SweepstacX from a tool into a **proven, benchmarked solution** with real-world evidence.
