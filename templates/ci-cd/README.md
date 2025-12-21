# SweepstacX CI/CD Templates

Ready-to-use CI/CD configurations for integrating SweepstacX into your continuous integration pipeline.

## Available Templates

### 1. GitHub Actions
**File:** `github-actions.yml`  
**Location:** Copy to `.github/workflows/sweepstacx.yml`

**Features:**
- Scans only changed files in pull requests
- Generates HTML and JSON reports
- Uploads reports as artifacts
- Comments on PRs with quality metrics
- Configurable quality thresholds

**Usage:**
```bash
mkdir -p .github/workflows
cp templates/ci-cd/github-actions.yml .github/workflows/sweepstacx.yml
git add .github/workflows/sweepstacx.yml
git commit -m "Add SweepstacX CI workflow"
```

---

### 2. GitLab CI
**File:** `gitlab-ci.yml`  
**Location:** Merge into `.gitlab-ci.yml`

**Features:**
- Merge request scanning
- Scheduled weekly scans
- Artifact publishing
- Cache support for faster builds

**Usage:**
```bash
cat templates/ci-cd/gitlab-ci.yml >> .gitlab-ci.yml
git add .gitlab-ci.yml
git commit -m "Add SweepstacX to GitLab CI"
```

---

### 3. CircleCI
**File:** `circleci-config.yml`  
**Location:** Copy to `.circleci/config.yml`

**Features:**
- Docker-based execution
- Artifact storage
- Test result publishing
- Branch filtering

**Usage:**
```bash
mkdir -p .circleci
cp templates/ci-cd/circleci-config.yml .circleci/config.yml
git add .circleci/config.yml
git commit -m "Add SweepstacX CircleCI config"
```

---

### 4. Jenkins
**File:** `Jenkinsfile`  
**Location:** Copy to repository root as `Jenkinsfile`

**Features:**
- Pipeline as code
- Docker agent support
- HTML report publishing
- Quality gate enforcement

**Usage:**
```bash
cp templates/ci-cd/Jenkinsfile ./Jenkinsfile
git add Jenkinsfile
git commit -m "Add SweepstacX Jenkins pipeline"
```

---

### 5. Azure Pipelines
**File:** `azure-pipelines.yml`  
**Location:** Copy to `azure-pipelines.yml`

**Features:**
- Multi-branch support
- Pull request integration
- Test result publishing
- Build artifact management

**Usage:**
```bash
cp templates/ci-cd/azure-pipelines.yml ./azure-pipelines.yml
git add azure-pipelines.yml
git commit -m "Add SweepstacX Azure Pipeline"
```

---

## Configuration Options

### Quality Thresholds

All templates support configurable quality thresholds. Adjust these values based on your project:

```yaml
# Example: Fail build if more than 50 issues
SWEEPSTACX_THRESHOLD: 50
```

**Recommended thresholds:**
- **New projects:** 0-10 issues
- **Active projects:** 20-50 issues
- **Legacy projects:** 50-100 issues

---

### Git Integration Modes

#### Full Scan (Default)
```bash
sweepstacx scan
```

#### Incremental Scan (Pull Requests)
```bash
sweepstacx scan --git-diff --since origin/main
```

#### No Cache (Fresh Scan)
```bash
sweepstacx scan --no-cache
```

---

## Report Artifacts

All templates generate and preserve these artifacts:

1. **HTML Report** (`sweepstacx-report.html`)
   - Interactive dashboard
   - Visual statistics
   - Filterable issue list

2. **JSON Report** (`sweepstacx-report.json`)
   - Machine-readable format
   - API integration ready
   - Programmatic analysis

3. **Markdown Report** (`sweepstacx-report.md`)
   - Human-readable text
   - Git-friendly format
   - Easy to review in PRs

---

## Advanced Features

### Trend Analysis

Add trend tracking to your pipeline:

```yaml
- script: sweepstacx trends --chart --detailed
```

### Auto-fix

Automatically fix issues before committing:

```yaml
- script: |
    sweepstacx scan
    sweepstacx fix
    git add .
    git commit -m "Auto-fix code quality issues"
```

### Custom Configuration

Use project-specific configuration:

```yaml
- script: sweepstacx scan --config .sweeperc.json
```

---

## Platform-Specific Notes

### GitHub Actions
- Uses `actions/upload-artifact@v4` for reports
- Supports PR comments via `github-script`
- Caches npm packages automatically

### GitLab CI
- Artifacts expire after 30 days (configurable)
- Supports scheduled pipelines
- Cache directory: `.sweepstacx/cache/`

### CircleCI
- Uses CircleCI orbs for Node.js
- Stores artifacts in `reports/` directory
- Test results integration available

### Jenkins
- Requires HTML Publisher plugin
- Docker agent recommended
- Groovy script for quality gates

### Azure Pipelines
- Native test result publishing
- Build artifact management
- Multi-stage pipeline support

---

## Troubleshooting

### Issue: "sweepstacx: command not found"

**Solution:** Ensure SweepstacX is installed globally:
```bash
npm install -g sweepstacx
```

### Issue: "No files matched scan patterns"

**Solution:** Check your ignore patterns in `.sweeperc.json`:
```json
{
  "ignore": [
    "**/node_modules/**",
    "**/dist/**"
  ]
}
```

### Issue: "Quality threshold exceeded"

**Solution:** Either fix the issues or adjust the threshold:
```yaml
SWEEPSTACX_THRESHOLD: 100  # Increase threshold
```

---

## Best Practices

1. **Start with warnings only** - Don't fail builds initially
2. **Use incremental scanning** - Faster PR checks
3. **Enable caching** - Reuse analysis results
4. **Track trends** - Monitor improvement over time
5. **Auto-fix safe issues** - Reduce manual work
6. **Review HTML reports** - Better visualization
7. **Set realistic thresholds** - Based on project size

---

## Example Workflow

### 1. Initial Setup
```bash
# Install SweepstacX
npm install -g sweepstacx

# Generate config
sweepstacx init

# Choose CI template
cp templates/ci-cd/github-actions.yml .github/workflows/sweepstacx.yml
```

### 2. First Scan
```bash
# Run baseline scan
sweepstacx scan

# Review HTML report
sweepstacx html
open sweepstacx-report.html
```

### 3. Set Threshold
```yaml
# In your CI config
SWEEPSTACX_THRESHOLD: 50  # Based on baseline
```

### 4. Commit and Push
```bash
git add .
git commit -m "Add SweepstacX quality checks"
git push
```

### 5. Monitor Trends
```bash
# After several scans
sweepstacx trends --chart
```

---

## Support

For issues or questions:
- **GitHub Issues:** https://github.com/1devteam/SweepstacX/issues
- **Documentation:** https://github.com/1devteam/SweepstacX
- **Examples:** See `examples/` directory

---

## License

These templates are provided under the MIT License as part of SweepstacX.
