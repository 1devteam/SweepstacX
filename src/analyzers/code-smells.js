import { readFile } from 'node:fs/promises';

/**
 * Detect common code smells using heuristics
 * @param {string[]} files - Array of file paths
 * @returns {Promise<Object[]>} - Array of detected code smells
 */
export async function detectCodeSmells(files) {
  const smells = [];

  for (const file of files) {
    try {
      const content = await readFile(file, 'utf8');
      const fileSmells = analyzeFile(content, file);
      smells.push(...fileSmells);
    } catch (_err) {
      // Skip files that can't be read
    }
  }

  return smells;
}

/**
 * Analyze a single file for code smells
 * @param {string} code - File content
 * @param {string} filePath - File path
 * @returns {Object[]} - Detected smells
 */
function analyzeFile(code, filePath) {
  const smells = [];
  const lines = code.split('\n');

  // Long function detection
  const functions = extractFunctions(code);
  for (const func of functions) {
    if (func.lines > 50) {
      smells.push({
        type: 'long_function',
        file: filePath,
        line: func.startLine,
        name: func.name,
        lines: func.lines,
        severity: func.lines > 100 ? 'high' : 'medium',
        message: `Function '${func.name}' is ${func.lines} lines long (consider splitting)`,
      });
    }
  }

  // Long parameter list
  for (const func of functions) {
    if (func.params > 5) {
      smells.push({
        type: 'long_parameter_list',
        file: filePath,
        line: func.startLine,
        name: func.name,
        params: func.params,
        severity: 'medium',
        message: `Function '${func.name}' has ${func.params} parameters (consider object parameter)`,
      });
    }
  }

  // Magic numbers
  const magicNumbers = detectMagicNumbers(code, filePath);
  smells.push(...magicNumbers);

  // Commented-out code
  const commentedCode = detectCommentedCode(lines, filePath);
  smells.push(...commentedCode);

  // Deep nesting
  const deepNesting = detectDeepNesting(lines, filePath);
  smells.push(...deepNesting);

  // TODO/FIXME comments
  const todos = detectTodos(lines, filePath);
  smells.push(...todos);

  // Console.log in production code
  const consoleLogs = detectConsoleLogs(lines, filePath);
  smells.push(...consoleLogs);

  return smells;
}

/**
 * Extract function information from code
 */
function extractFunctions(code) {
  const functions = [];
  const lines = code.split('\n');

  // Match function declarations and arrow functions
  const funcRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(\w+)\s*\([^)]*\)\s*\{)/g;
  const paramRegex = /\(([^)]*)\)/;

  let match;
  while ((match = funcRegex.exec(code))) {
    const name = match[1] || match[2] || match[3] || 'anonymous';
    const startLine = code.substring(0, match.index).split('\n').length;

    // Count parameters
    const paramMatch = code.substring(match.index).match(paramRegex);
    const params = paramMatch
      ? paramMatch[1].split(',').filter(p => p.trim()).length
      : 0;

    // Estimate function length (simple heuristic)
    const funcLines = estimateFunctionLength(lines, startLine - 1);

    functions.push({
      name,
      startLine,
      params,
      lines: funcLines,
    });
  }

  return functions;
}

/**
 * Estimate function length by counting lines until closing brace
 */
function estimateFunctionLength(lines, startLine) {
  let braceCount = 0;
  let length = 0;
  let started = false;

  for (let i = startLine; i < lines.length && i < startLine + 200; i++) {
    const line = lines[i];
    length++;

    for (const char of line) {
      if (char === '{') {
        braceCount++;
        started = true;
      } else if (char === '}') {
        braceCount--;
        if (started && braceCount === 0) {
          return length;
        }
      }
    }
  }

  return length;
}

/**
 * Detect magic numbers (hardcoded numeric literals)
 */
function detectMagicNumbers(code, filePath) {
  const smells = [];
  const lines = code.split('\n');

  // Skip common acceptable numbers: 0, 1, -1, 2, 10, 100, 1000
  const acceptableNumbers = new Set([0, 1, -1, 2, 10, 100, 1000]);

  lines.forEach((line, idx) => {
    // Skip comments and strings
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

    // Find numeric literals
    const numberRegex = /\b(\d+\.?\d*)\b/g;
    let match;

    while ((match = numberRegex.exec(line))) {
      const num = parseFloat(match[1]);

      if (!acceptableNumbers.has(num) && num > 1) {
        smells.push({
          type: 'magic_number',
          file: filePath,
          line: idx + 1,
          value: num,
          severity: 'low',
          message: `Magic number ${num} should be a named constant`,
        });
      }
    }
  });

  return smells;
}

/**
 * Detect commented-out code
 */
function detectCommentedCode(lines, filePath) {
  const smells = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Check if line is a comment that looks like code
    if (trimmed.startsWith('//')) {
      const commentContent = trimmed.substring(2).trim();

      // Heuristics for commented code
      const codePatterns = [
        /^(const|let|var|function|class|import|export|if|for|while)\s/,
        /[{};()]/,
        /=\s*[^=]/,
      ];

      if (codePatterns.some(pattern => pattern.test(commentContent))) {
        smells.push({
          type: 'commented_code',
          file: filePath,
          line: idx + 1,
          severity: 'low',
          message: 'Commented-out code should be removed (use version control)',
        });
      }
    }
  });

  return smells;
}

/**
 * Detect deep nesting (> 4 levels)
 */
function detectDeepNesting(lines, filePath) {
  const smells = [];
  let currentNesting = 0;

  lines.forEach((line, idx) => {
    // Count braces
    for (const char of line) {
      if (char === '{') {
        currentNesting++;
      } else if (char === '}') {
        currentNesting--;
      }
    }

    if (currentNesting > 4) {
      smells.push({
        type: 'deep_nesting',
        file: filePath,
        line: idx + 1,
        depth: currentNesting,
        severity: 'medium',
        message: `Nesting level ${currentNesting} is too deep (consider extracting functions)`,
      });
    }
  });

  return smells;
}

/**
 * Detect TODO/FIXME comments
 */
function detectTodos(lines, filePath) {
  const smells = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (/\/\/\s*(TODO|FIXME|XXX|HACK)/i.test(trimmed)) {
      const match = trimmed.match(/\/\/\s*(TODO|FIXME|XXX|HACK):?\s*(.*)/i);
      const type = match ? match[1].toUpperCase() : 'TODO';
      const message = match && match[2] ? match[2] : 'No description';

      smells.push({
        type: 'todo_comment',
        file: filePath,
        line: idx + 1,
        category: type,
        severity: type === 'FIXME' ? 'medium' : 'low',
        message: `${type}: ${message}`,
      });
    }
  });

  return smells;
}

/**
 * Detect console.log statements (potential debug code)
 */
function detectConsoleLogs(lines, filePath) {
  const smells = [];

  lines.forEach((line, idx) => {
    if (/console\.(log|debug|info|warn|error)/.test(line)) {
      smells.push({
        type: 'console_log',
        file: filePath,
        line: idx + 1,
        severity: 'low',
        message: 'Console statement should be removed or replaced with proper logging',
      });
    }
  });

  return smells;
}
