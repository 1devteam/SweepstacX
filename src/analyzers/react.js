/**
 * React-specific code analyzer
 * Detects React anti-patterns and best practice violations
 */

export function analyzeReactCode(code, filePath) {
  const issues = [];
  
  // Check for missing React import (pre-React 17)
  if (usesJSX(code) && !hasReactImport(code)) {
    issues.push({
      type: 'react_missing_import',
      severity: 'warning',
      message: 'JSX used without React import (may be okay in React 17+)',
      file: filePath,
    });
  }
  
  // Check for missing key prop in lists
  const missingKeys = detectMissingKeys(code);
  missingKeys.forEach(line => {
    issues.push({
      type: 'react_missing_key',
      severity: 'error',
      message: 'Missing key prop in list rendering',
      file: filePath,
      line,
    });
  });
  
  // Check for inline function definitions in JSX
  const inlineFunctions = detectInlineFunctions(code);
  if (inlineFunctions.length > 3) {
    issues.push({
      type: 'react_inline_functions',
      severity: 'warning',
      message: `${inlineFunctions.length} inline functions in JSX (may cause re-renders)`,
      file: filePath,
    });
  }
  
  // Check for useState with objects (should use multiple states)
  const complexStates = detectComplexState(code);
  complexStates.forEach(match => {
    issues.push({
      type: 'react_complex_state',
      severity: 'info',
      message: 'Consider splitting complex state into multiple useState calls',
      file: filePath,
      symbol: match,
    });
  });
  
  // Check for missing dependency arrays in useEffect
  const missingDeps = detectMissingDependencies(code);
  missingDeps.forEach(line => {
    issues.push({
      type: 'react_missing_deps',
      severity: 'warning',
      message: 'useEffect missing dependency array',
      file: filePath,
      line,
    });
  });
  
  // Check for direct state mutation
  const mutations = detectStateMutation(code);
  mutations.forEach(line => {
    issues.push({
      type: 'react_state_mutation',
      severity: 'error',
      message: 'Direct state mutation detected (use setState instead)',
      file: filePath,
      line,
    });
  });
  
  return issues;
}

function usesJSX(code) {
  // Simple check for JSX syntax
  return /<[A-Z][a-zA-Z0-9]*/.test(code) || /<[a-z]+\s/.test(code);
}

function hasReactImport(code) {
  return /import\s+React/.test(code) || /import\s+\{[^}]*React[^}]*\}/.test(code);
}

function detectMissingKeys(code) {
  const lines = [];
  const mapRegex = /\.map\s*\(\s*\([^)]*\)\s*=>\s*<[^>]*>/g;
  const keyRegex = /key\s*=/;
  
  let match;
  let lineNum = 1;
  const codeLines = code.split('\n');
  
  codeLines.forEach((line, index) => {
    if (mapRegex.test(line) && !keyRegex.test(line)) {
      lines.push(index + 1);
    }
  });
  
  return lines;
}

function detectInlineFunctions(code) {
  const matches = [];
  // Match onClick={() => ...} or onChange={(e) => ...}
  const regex = /on[A-Z][a-zA-Z]*\s*=\s*\{[^}]*=>/g;
  let match;
  
  while ((match = regex.exec(code)) !== null) {
    matches.push(match[0]);
  }
  
  return matches;
}

function detectComplexState(code) {
  const matches = [];
  // Match useState({ ... }) with object literals
  const regex = /useState\s*\(\s*\{[^}]+\}\s*\)/g;
  let match;
  
  while ((match = regex.exec(code)) !== null) {
    matches.push(match[0]);
  }
  
  return matches;
}

function detectMissingDependencies(code) {
  const lines = [];
  const codeLines = code.split('\n');
  
  codeLines.forEach((line, index) => {
    // Check for useEffect without second argument
    if (/useEffect\s*\(\s*\([^)]*\)\s*=>\s*\{/.test(line)) {
      // Look ahead to see if dependency array exists
      const nextLines = codeLines.slice(index, index + 5).join('\n');
      if (!/\}\s*,\s*\[/.test(nextLines)) {
        lines.push(index + 1);
      }
    }
  });
  
  return lines;
}

function detectStateMutation(code) {
  const lines = [];
  const codeLines = code.split('\n');
  
  codeLines.forEach((line, index) => {
    // Check for patterns like state.property = value
    if (/\w+\s*\.\s*\w+\s*=/.test(line) && /useState|state/.test(line)) {
      lines.push(index + 1);
    }
  });
  
  return lines;
}

/**
 * Check if file is a React component
 */
export function isReactFile(code) {
  return (
    /import.*from\s+['"]react['"]/.test(code) ||
    /import\s+React/.test(code) ||
    /export\s+(default\s+)?function\s+[A-Z]/.test(code) ||
    /export\s+(default\s+)?class\s+[A-Z].*extends\s+.*Component/.test(code)
  );
}
