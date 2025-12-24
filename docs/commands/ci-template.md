# ci-template

The `ci-template` command generates ready-to-use CI/CD pipeline configuration files for various platforms, making it easy to integrate SweepstacX into your automated workflows.

## Usage

\`\`\`bash
sweepstacx ci-template <platform> [options]
\`\`\`

## Supported Platforms

| Platform | Argument | Output File |
| :--- | :--- | :--- |
| **GitHub Actions** | `github` | `.github/workflows/sweepstacx.yml` |
| **GitLab CI** | `gitlab` | `.gitlab-ci.yml` |
| **CircleCI** | `circleci` | `.circleci/config.yml` |
| **Jenkins** | `jenkins` | `Jenkinsfile` |
| **Azure Pipelines** | `azure` | `azure-pipelines.yml` |

## Example

Generate a GitHub Actions workflow file that runs `sweepstacx check` on every push:

\`\`\`bash
sweepstacx ci-template github
\`\`\`
