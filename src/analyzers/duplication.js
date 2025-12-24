import { jscpd } from 'jscpd';
import { resolve } from 'node:path';
import fg from 'fast-glob';

/**
 * Runs jscpd to detect duplicate code blocks across the project.
 * @param {string} root - The root directory to scan.
 * @param {string[]} files - List of files to scan.
 * @param {object} config - The duplication configuration from .sweeperc.json.
 * @returns {Promise<{issues: object[], stats: object}>}
 */
export async function detectDuplication(root, files, config) {
  const { maxLines, maxPercent } = config;
  
  // jscpd expects relative paths from the root, but we can pass the full list of files.
  // We need to filter the files based on the project's file globs, which are already
  // provided by the caller (the scan command).
  
  const jscpdConfig = {
    path: files, // Pass the list of files directly
    minLines: maxLines || 10,
    minTokens: 70, // Default token minimum for jscpd
    maxInFile: 0,
    maxInDirectory: 0,
    maxTotal: maxPercent || 8,
    verbose: false,
    silent: true,
    format: ['javascript', 'typescript', 'jsx', 'tsx', 'vue', 'svelte'],
    output: false, // Do not write output files
  };

  const report = await jscpd(jscpdConfig);
  
  const issues = [];
  let totalDuplicatedLines = 0;
  
  for (const clone of report.duplicates) {
    totalDuplicatedLines += clone.lines;
    
    // Create an issue for each clone block
    issues.push({
      type: 'duplication',
      severity: 'warning',
      message: `Duplicated block of ${clone.lines} lines (${clone.tokens} tokens) found.`,
      file: clone.firstFile.name,
      startLine: clone.firstFile.startLine,
      endLine: clone.firstFile.endLine,
      fragment: clone.firstFile.fragment,
      cloneFile: clone.secondFile.name,
      cloneStartLine: clone.secondFile.startLine,
    });
  }
  
  const stats = {
    totalDuplicatedLines,
    totalDuplicatedFiles: report.statistics.totalNumberOfDuplicatedFiles,
    percentage: report.statistics.percentage,
    totalFiles: report.statistics.totalNumberOfFiles,
  };
  
  return { issues, stats };
}
