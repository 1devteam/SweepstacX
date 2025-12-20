# CI Integration Examples

This document provides examples of integrating SweepstacX into various CI/CD platforms.

## GitHub Actions

### Basic Scan on Pull Requests

```yaml
name: Code Quality Check

on:
  pull_request:
  push:
    branches: [main]

jobs:
  sweepstacx:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      
      - name: Install SweepstacX
        run: npm install -g sweepstacx
      
      - name: Run scan
        run: sweepstacx scan --path .
      
      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: sweepstacx-report
          path: |
            sweepstacx-report.json
            sweepstacx-report.md
```

### Strict Quality Gate

```yaml
name: Quality Gate

on:
  pull_request:

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install SweepstacX
        run: npm install -g sweepstacx
      
      - name: Run quality check
        run: sweepstacx check --path . | jq .stats
      
      - name: Fail if quality thresholds exceeded
        run: |
          STATS=$(sweepstacx check --path . | jq .stats)
          UNUSED=$(echo $STATS | jq .unused_imports)
          DEAD=$(echo $STATS | jq .dead_files)
          
          if [ "$UNUSED" -gt 0 ] || [ "$DEAD" -gt 5 ]; then
            echo "Quality gate failed!"
            exit 1
          fi
```

## GitLab CI

```yaml
# .gitlab-ci.yml

stages:
  - quality

code-quality:
  stage: quality
  image: node:20
  script:
    - npm install -g sweepstacx
    - sweepstacx scan --path .
    - sweepstacx report --json > quality-report.json
  artifacts:
    reports:
      codequality: quality-report.json
    paths:
      - sweepstacx-report.md
      - sweepstacx-report.json
  only:
    - merge_requests
    - main
```

## CircleCI

```yaml
# .circleci/config.yml

version: 2.1

jobs:
  quality-check:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run:
          name: Install SweepstacX
          command: npm install -g sweepstacx
      - run:
          name: Run scan
          command: sweepstacx scan --path .
      - store_artifacts:
          path: sweepstacx-report.json
      - store_artifacts:
          path: sweepstacx-report.md

workflows:
  version: 2
  quality:
    jobs:
      - quality-check
```

## Jenkins

```groovy
// Jenkinsfile

pipeline {
    agent any
    
    stages {
        stage('Install') {
            steps {
                sh 'npm install -g sweepstacx'
            }
        }
        
        stage('Quality Scan') {
            steps {
                sh 'sweepstacx scan --path .'
            }
        }
        
        stage('Generate Report') {
            steps {
                sh 'sweepstacx report --out build/sweepstacx-report'
                archiveArtifacts artifacts: 'build/sweepstacx-report.*'
            }
        }
        
        stage('Quality Gate') {
            steps {
                script {
                    def stats = sh(
                        script: 'sweepstacx check --path . | jq .stats',
                        returnStdout: true
                    ).trim()
                    
                    def json = readJSON text: stats
                    
                    if (json.unused_imports > 0 || json.dead_files > 10) {
                        error("Quality gate failed: Too many issues detected")
                    }
                }
            }
        }
    }
}
```

## Travis CI

```yaml
# .travis.yml

language: node_js
node_js:
  - "20"

before_script:
  - npm install -g sweepstacx

script:
  - sweepstacx scan --path .
  - sweepstacx check --path .

after_success:
  - sweepstacx report --out reports/sweepstacx-report
```

## Azure Pipelines

```yaml
# azure-pipelines.yml

trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '20.x'
  displayName: 'Install Node.js'

- script: npm install -g sweepstacx
  displayName: 'Install SweepstacX'

- script: sweepstacx scan --path .
  displayName: 'Run code quality scan'

- script: sweepstacx report --out $(Build.ArtifactStagingDirectory)/sweepstacx-report
  displayName: 'Generate report'

- task: PublishBuildArtifacts@1
  inputs:
    pathToPublish: '$(Build.ArtifactStagingDirectory)'
    artifactName: 'quality-reports'
```

## Pre-commit Hook

For local development, add SweepstacX to your pre-commit hooks:

```bash
# .git/hooks/pre-commit

#!/bin/sh

echo "Running SweepstacX scan..."
sweepstacx scan --path . > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "⚠️  Code quality issues detected. Run 'sweepstacx report' for details."
    # Uncomment to block commits:
    # exit 1
fi
```

## Custom Configuration

Create a `.sweeperc.json` in your project root:

```json
{
  "complexity": {
    "maxFunction": 15,
    "maxAverage": 10
  },
  "deps": {
    "unused": 0,
    "missing": 0
  },
  "ignore": [
    "node_modules/**",
    "dist/**",
    "coverage/**"
  ]
}
```

Then use it in CI:

```bash
sweepstacx check --path . --config .sweeperc.json
```

## Tips for CI Integration

1. **Cache dependencies**: Cache `node_modules` to speed up builds
2. **Run on PRs**: Catch issues before they reach main branch
3. **Set thresholds**: Use `sweepstacx check` with custom config for quality gates
4. **Archive reports**: Save reports as artifacts for historical tracking
5. **Fail fast**: Exit early if critical issues are found
6. **Incremental scans**: For large repos, scan only changed files

## Troubleshooting

### CI fails with "No files matched scan patterns"

Make sure you're running the scan from the project root:

```bash
sweepstacx scan --path .
```

### High false positive rate for dead files

Adjust your entry points or add files to ignore list in `.sweeperc.json`.

### CI timeout on large repositories

Consider scanning only specific directories or using parallel jobs.
