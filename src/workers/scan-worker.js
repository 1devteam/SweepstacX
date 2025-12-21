/**
 * Worker thread for parallel file scanning
 * Processes files independently to maximize CPU utilization
 */

import { parentPort, workerData } from 'node:worker_threads';
import { readFile } from 'node:fs/promises';

// Import analyzers
import { detectUnusedImports } from '../analyzers/imports.js';
import { analyzeComplexity } from '../analyzers/complexity.js';
import { detectCodeSmells } from '../analyzers/code-smells.js';
import { analyzeReactCode, isReactFile } from '../analyzers/react.js';
import { analyzeVueCode, isVueFile } from '../analyzers/vue.js';
import { analyzeAngularCode, isAngularFile } from '../analyzers/angular.js';
import { analyzeSvelteCode, isSvelteFile } from '../analyzers/svelte.js';

/**
 * Process a single file
 */
async function processFile(filePath) {
  try {
    const code = await readFile(filePath, 'utf8');
    const issues = [];
    
    // Run all applicable analyzers
    
    // 1. Unused imports
    const unusedImports = detectUnusedImports(code, filePath);
    issues.push(...unusedImports);
    
    // 2. Code smells
    const codeSmells = detectCodeSmells(code, filePath);
    issues.push(...codeSmells);
    
    // 3. Complexity (get metrics and issues)
    const { metrics, issues: complexityIssues } = analyzeComplexity(code, filePath);
    issues.push(...complexityIssues);
    
    // 4. Framework-specific analysis
    if (isReactFile(code, filePath)) {
      const reactIssues = analyzeReactCode(code, filePath);
      issues.push(...reactIssues);
    }
    
    if (isVueFile(code, filePath)) {
      const vueIssues = analyzeVueCode(code, filePath);
      issues.push(...vueIssues);
    }
    
    if (isAngularFile(code, filePath)) {
      const angularIssues = analyzeAngularCode(code, filePath);
      issues.push(...angularIssues);
    }
    
    if (isSvelteFile(code, filePath)) {
      const svelteIssues = analyzeSvelteCode(code, filePath);
      issues.push(...svelteIssues);
    }
    
    return {
      file: filePath,
      issues,
      metrics,
      success: true,
    };
  } catch (error) {
    return {
      file: filePath,
      error: error.message,
      success: false,
    };
  }
}

/**
 * Worker main logic
 */
if (parentPort) {
  parentPort.on('message', async (message) => {
    if (message.type === 'process') {
      const result = await processFile(message.filePath);
      parentPort.postMessage({
        type: 'result',
        result,
      });
    }
  });
  
  // Signal ready
  parentPort.postMessage({ type: 'ready' });
}
