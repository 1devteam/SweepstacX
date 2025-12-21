# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | :white_check_mark: |
| 0.1.x   | :x:                |
| < 0.1   | :x:                |

## Reporting a Vulnerability

We take the security of SweepstacX seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:

- Open a public GitHub issue
- Discuss the vulnerability in public forums or social media

### Please DO:

1. **Email us directly** at security@1devteam.com (or create a private security advisory on GitHub)
2. **Provide detailed information** including:
   - Type of vulnerability
   - Full paths of source file(s) related to the vulnerability
   - Location of the affected source code (tag/branch/commit or direct URL)
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the issue, including how an attacker might exploit it

### What to expect:

- **Acknowledgment**: We will acknowledge your email within 48 hours
- **Updates**: We will send you regular updates about our progress
- **Timeline**: We aim to patch critical vulnerabilities within 7 days
- **Credit**: We will credit you in the security advisory (unless you prefer to remain anonymous)

### Security Update Process

1. Vulnerability is reported and confirmed
2. A fix is prepared in a private repository
3. A security advisory is drafted
4. The fix is released and the advisory is published
5. Users are notified via GitHub releases and npm

## Security Best Practices for Users

When using SweepstacX:

- Always use the latest version
- Review the CHANGELOG for security updates
- Run `npm audit` regularly in your projects
- Use SweepstacX in CI/CD with read-only permissions
- Do not run SweepstacX with elevated privileges unless necessary

## Known Security Considerations

SweepstacX analyzes your source code locally and does not send any data to external services. However:

- SweepstacX executes external tools (eslint, depcheck, etc.) via `npx`
- Ensure you trust the packages in your `node_modules`
- Review generated patches before applying them with `--apply`

## Security Hall of Fame

We appreciate the security researchers who help keep SweepstacX safe:

<!-- Names will be added here as vulnerabilities are reported and fixed -->

---

Thank you for helping keep SweepstacX and our users safe!
