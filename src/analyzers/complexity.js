/**
 * Code complexity metrics analyzer
 * Calculates cyclomatic complexity, cognitive complexity, and other metrics
 */

export function analyzeComplexity(code, filePath) {
  const metrics = {
    cyclomaticComplexity: calculateCyclomaticComplexity(code),
    cognitiveComplexity: calculateCognitiveComplexity(code),
    linesOfCode: countLinesOfCode(code),
    commentLines: countCommentLines(code),
    functionCount: countFunctions(code),
    maxNestingDepth: calculateMaxNestingDepth(code),
    averageFunctionLength: calculateAverageFunctionLength(code),
  };
  
  const issues = [];
  
  // Check for high cyclomatic complexity
  if (metrics.cyclomaticComplexity > 20) {
    issues.push({
      type: 'high_cyclomatic_complexity',
      severity: 'warning',
      message: `High cyclomatic complexity: ${metrics.cyclomaticComplexity} (threshold: 20)`,
      file: filePath,
    });
  }
  
  // Check for high cognitive complexity
  if (metrics.cognitiveComplexity > 15) {
    issues.push({
      type: 'high_cognitive_complexity',
      severity: 'warning',
      message: `High cognitive complexity: ${metrics.cognitiveComplexity} (threshold: 15)`,
      file: filePath,
    });
  }
  
  // Check for deep nesting
  if (metrics.maxNestingDepth > 4) {
    issues.push({
      type: 'deep_nesting',
      severity: 'warning',
      message: `Deep nesting detected: ${metrics.maxNestingDepth} levels (threshold: 4)`,
      file: filePath,
    });
  }
  
  // Check for long functions
  if (metrics.averageFunctionLength > 50) {
    issues.push({
      type: 'long_functions',
      severity: 'info',
      message: `Average function length: ${metrics.averageFunctionLength} lines (threshold: 50)`,
      file: filePath,
    });
  }
  
  return { metrics, issues };
}

/**
 * Calculate cyclomatic complexity
 * Counts decision points (if, for, while, case, &&, ||, etc.)
 */
function calculateCyclomaticComplexity(code) {
  let complexity = 1; // Base complexity
  
  // Decision keywords
  const decisionPatterns = [
    /\bif\s*\(/g,
    /\belse\s+if\s*\(/g,
    /\bfor\s*\(/g,
    /\bwhile\s*\(/g,
    /\bcase\s+/g,
    /\bcatch\s*\(/g,
    /\?\s*[^:]+:/g, // Ternary operator
    /&&/g,
    /\|\|/g,
  ];
  
  decisionPatterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  });
  
  return complexity;
}

/**
 * Calculate cognitive complexity
 * Measures how difficult code is to understand
 */
function calculateCognitiveComplexity(code) {
  let complexity = 0;
  let nestingLevel = 0;
  const lines = code.split('\n');
  
  lines.forEach(line => {
    // Increase nesting on opening braces
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    
    // Check for complexity-increasing structures
    if (/\b(if|for|while|switch)\s*\(/.test(line)) {
      complexity += 1 + nestingLevel;
    }
    
    if (/\belse\s+(if\s*\()?/.test(line)) {
      complexity += 1;
    }
    
    if (/\bcatch\s*\(/.test(line)) {
      complexity += 1 + nestingLevel;
    }
    
    // Logical operators add complexity
    const logicalOps = (line.match(/&&|\|\|/g) || []).length;
    complexity += logicalOps;
    
    // Update nesting level
    nestingLevel += openBraces - closeBraces;
    if (nestingLevel < 0) nestingLevel = 0;
  });
  
  return complexity;
}

/**
 * Count lines of code (excluding comments and blank lines)
 */
function countLinesOfCode(code) {
  const lines = code.split('\n');
  let loc = 0;
  let inBlockComment = false;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (trimmed.length === 0) return;
    
    // Handle block comments
    if (trimmed.startsWith('/*')) {
      inBlockComment = true;
    }
    if (trimmed.endsWith('*/')) {
      inBlockComment = false;
      return;
    }
    if (inBlockComment) return;
    
    // Skip single-line comments
    if (trimmed.startsWith('//')) return;
    
    loc++;
  });
  
  return loc;
}

/**
 * Count comment lines
 */
function countCommentLines(code) {
  const lines = code.split('\n');
  let comments = 0;
  let inBlockComment = false;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('/*')) {
      inBlockComment = true;
      comments++;
      return;
    }
    
    if (inBlockComment) {
      comments++;
      if (trimmed.endsWith('*/')) {
        inBlockComment = false;
      }
      return;
    }
    
    if (trimmed.startsWith('//')) {
      comments++;
    }
  });
  
  return comments;
}

/**
 * Count functions
 */
function countFunctions(code) {
  const functionPatterns = [
    /function\s+\w+\s*\(/g,
    /\w+\s*:\s*function\s*\(/g,
    /\w+\s*=\s*function\s*\(/g,
    /\w+\s*=\s*\([^)]*\)\s*=>/g,
    /\w+\s*\([^)]*\)\s*\{/g, // Method definitions
  ];
  
  let count = 0;
  functionPatterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) {
      count += matches.length;
    }
  });
  
  return count;
}

/**
 * Calculate maximum nesting depth
 */
function calculateMaxNestingDepth(code) {
  let maxDepth = 0;
  let currentDepth = 0;
  
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '{') {
      currentDepth++;
      if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
      }
    } else if (code[i] === '}') {
      currentDepth--;
    }
  }
  
  return maxDepth;
}

/**
 * Calculate average function length
 */
function calculateAverageFunctionLength(code) {
  const functions = extractFunctions(code);
  
  if (functions.length === 0) return 0;
  
  const totalLines = functions.reduce((sum, fn) => {
    return sum + fn.split('\n').length;
  }, 0);
  
  return Math.round(totalLines / functions.length);
}

/**
 * Extract function bodies from code
 */
function extractFunctions(code) {
  const functions = [];
  const functionRegex = /function\s+\w+\s*\([^)]*\)\s*\{/g;
  let match;
  
  while ((match = functionRegex.exec(code)) !== null) {
    const startIndex = match.index;
    let braceCount = 0;
    let endIndex = startIndex;
    
    // Find matching closing brace
    for (let i = startIndex; i < code.length; i++) {
      if (code[i] === '{') braceCount++;
      if (code[i] === '}') braceCount--;
      
      if (braceCount === 0 && i > startIndex) {
        endIndex = i;
        break;
      }
    }
    
    if (endIndex > startIndex) {
      functions.push(code.substring(startIndex, endIndex + 1));
    }
  }
  
  return functions;
}

/**
 * Get complexity rating
 */
export function getComplexityRating(complexity) {
  if (complexity <= 5) return { rating: 'A', color: 'green', label: 'Simple' };
  if (complexity <= 10) return { rating: 'B', color: 'cyan', label: 'Moderate' };
  if (complexity <= 20) return { rating: 'C', color: 'yellow', label: 'Complex' };
  if (complexity <= 30) return { rating: 'D', color: 'orange', label: 'Very Complex' };
  return { rating: 'F', color: 'red', label: 'Extremely Complex' };
}
