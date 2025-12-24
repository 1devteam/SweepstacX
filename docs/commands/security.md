# security

The `security` command runs a static analysis scan specifically focused on detecting common security vulnerabilities in your codebase.

## Usage

\`\`\`bash
sweepstacx security [options]
\`\`\`

## Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `--path <path>` | Specify the root directory to scan. | `.` |

## Detected Vulnerabilities

The security analyzer checks for the following types of issues:

*   **Hardcoded Secrets:** API keys, passwords, and tokens found directly in the source code.
*   **SQL Injection:** Dynamic string concatenation used to build database queries.
*   **Cross-Site Scripting (XSS):** Unsafe use of dynamic content in HTML (e.g., `innerHTML`, `dangerouslySetInnerHTML`).
*   **Insecure Random:** Use of `Math.random()` in security-sensitive contexts.
*   **`eval()` Usage:** Use of `eval()` or the `Function` constructor, which can lead to code injection.
*   **Insecure HTTP:** Hardcoded `http://` URLs instead of `https://`.
*   **Weak Crypto:** Use of outdated or weak cryptographic algorithms (e.g., MD5, SHA1).
*   **Path Traversal:** File operations where the path is constructed from unsanitized user input.

## Credibility and False Positives

In v0.7.0, an internal ignore list was implemented to prevent the security analyzer from flagging its own code, ensuring high credibility and reducing false positives when dogfooding the tool.

## Example

\`\`\`bash
sweepstacx security --path ./src
\`\`\`
