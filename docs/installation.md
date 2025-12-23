# Installation

SweepstacX is a command-line tool distributed via npm.

## Prerequisites

*   Node.js (version 18.17 or higher)
*   npm or pnpm

## Global Installation

For general use across multiple projects, install SweepstacX globally:

\`\`\`bash
npm install -g sweepstacx
# or
pnpm install -g sweepstacx
\`\`\`

## Project-Local Installation

For project-specific use, install it as a development dependency:

\`\`\`bash
npm install --save-dev sweepstacx
# or
pnpm install --save-dev sweepstacx
\`\`\`

You can then run the commands using `npx sweepstacx <command>` or by adding scripts to your `package.json`.

## First Steps

1.  **Initialize Configuration:** Run the `init` command to create a `.sweeperc.json` file. This command will now attempt to auto-detect your project's framework (React, Vue, etc.) and configure file globs accordingly.

    \`\`\`bash
    sweepstacx init
    \`\`\`

2.  **Run a Scan:** Perform a full analysis of your codebase.

    \`\`\`bash
    sweepstacx scan
    \`\`\`

3.  **View Report:** Check the generated report to see the issues found.

    \`\`\`bash
    sweepstacx report
    \`\`\`
