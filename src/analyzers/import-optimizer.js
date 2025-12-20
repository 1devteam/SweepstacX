import { readFile } from 'node:fs/promises';

/**
 * Analyze and optimize import statements
 * @param {string[]} files - Array of file paths
 * @returns {Promise<Object>} - Optimization suggestions
 */
export async function analyzeImports(files) {
  const suggestions = [];

  for (const file of files) {
    try {
      const content = await readFile(file, 'utf8');
      const fileSuggestions = analyzeFileImports(content, file);
      suggestions.push(...fileSuggestions);
    } catch (_err) {
      // Skip files that can't be read
    }
  }

  return {
    suggestions,
    stats: {
      total: suggestions.length,
      canOptimize: suggestions.filter(s => s.type === 'can_optimize').length,
      redundant: suggestions.filter(s => s.type === 'redundant').length,
    },
  };
}

/**
 * Analyze imports in a single file
 */
function analyzeFileImports(code, filePath) {
  const suggestions = [];
  const imports = extractImports(code);

  // Check for duplicate imports from same source
  const duplicates = findDuplicateImports(imports);
  for (const dup of duplicates) {
    suggestions.push({
      type: 'redundant',
      file: filePath,
      line: dup.line,
      source: dup.source,
      severity: 'medium',
      message: `Multiple imports from '${dup.source}' can be combined`,
      suggestion: dup.combined,
    });
  }

  // Check for barrel imports that could be optimized
  const barrelImports = findBarrelImports(imports);
  for (const barrel of barrelImports) {
    suggestions.push({
      type: 'can_optimize',
      file: filePath,
      line: barrel.line,
      source: barrel.source,
      severity: 'low',
      message: `Barrel import from '${barrel.source}' may increase bundle size`,
      suggestion: 'Consider importing directly from submodules',
    });
  }

  // Check for side-effect imports that might be unnecessary
  const sideEffects = findSideEffectImports(imports);
  for (const se of sideEffects) {
    suggestions.push({
      type: 'side_effect',
      file: filePath,
      line: se.line,
      source: se.source,
      severity: 'low',
      message: `Side-effect import from '${se.source}' - verify if necessary`,
    });
  }

  // Check import order (not following convention)
  const orderIssues = checkImportOrder(imports);
  for (const issue of orderIssues) {
    suggestions.push({
      type: 'order',
      file: filePath,
      line: issue.line,
      severity: 'low',
      message: issue.message,
      suggestion: 'Group imports: built-ins, external, internal, relative',
    });
  }

  return suggestions;
}

/**
 * Extract all imports from code
 */
function extractImports(code) {
  const imports = [];
  const lines = code.split('\n');

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // ES6 import
    const importMatch = trimmed.match(/^import\s+(.*?)\s+from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      imports.push({
        line: idx + 1,
        raw: trimmed,
        clause: importMatch[1],
        source: importMatch[2],
        type: 'es6',
      });
      return;
    }

    // Side-effect import
    const sideEffectMatch = trimmed.match(/^import\s+['"]([^'"]+)['"]/);
    if (sideEffectMatch) {
      imports.push({
        line: idx + 1,
        raw: trimmed,
        source: sideEffectMatch[1],
        type: 'side-effect',
      });
      return;
    }

    // CommonJS require
    const requireMatch = trimmed.match(/(?:const|let|var)\s+(.*?)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (requireMatch) {
      imports.push({
        line: idx + 1,
        raw: trimmed,
        clause: requireMatch[1],
        source: requireMatch[2],
        type: 'commonjs',
      });
    }
  });

  return imports;
}

/**
 * Find duplicate imports from the same source
 */
function findDuplicateImports(imports) {
  const duplicates = [];
  const sourceMap = new Map();

  for (const imp of imports) {
    if (imp.type === 'side-effect') continue;

    if (!sourceMap.has(imp.source)) {
      sourceMap.set(imp.source, []);
    }
    sourceMap.get(imp.source).push(imp);
  }

  for (const [source, imps] of sourceMap.entries()) {
    if (imps.length > 1) {
      // Combine all clauses
      const clauses = imps.map(i => i.clause).join(', ');
      duplicates.push({
        line: imps[0].line,
        source,
        count: imps.length,
        combined: `import ${clauses} from '${source}';`,
      });
    }
  }

  return duplicates;
}

/**
 * Find barrel imports (importing from index files)
 */
function findBarrelImports(imports) {
  const barrels = [];

  for (const imp of imports) {
    // Check for common barrel patterns
    if (
      imp.source.endsWith('/index') ||
      imp.source.match(/^(lodash|ramda|rxjs)$/) ||
      imp.source.match(/^@\w+\/\w+$/)
    ) {
      barrels.push({
        line: imp.line,
        source: imp.source,
      });
    }
  }

  return barrels;
}

/**
 * Find side-effect imports
 */
function findSideEffectImports(imports) {
  return imports
    .filter(imp => imp.type === 'side-effect')
    .map(imp => ({
      line: imp.line,
      source: imp.source,
    }));
}

/**
 * Check import order
 */
function checkImportOrder(imports) {
  const issues = [];
  let lastCategory = 0; // 0: none, 1: builtin, 2: external, 3: internal, 4: relative

  for (const imp of imports) {
    const category = categorizeImport(imp.source);

    if (category < lastCategory) {
      issues.push({
        line: imp.line,
        message: `Import order: ${getCategoryName(category)} imports should come before ${getCategoryName(lastCategory)}`,
      });
    }

    lastCategory = category;
  }

  return issues;
}

/**
 * Categorize import by source
 */
function categorizeImport(source) {
  if (source.startsWith('node:') || ['fs', 'path', 'http', 'https', 'util', 'stream'].includes(source)) {
    return 1; // builtin
  }
  if (source.startsWith('.')) {
    return 4; // relative
  }
  if (source.startsWith('@/') || source.startsWith('~/')) {
    return 3; // internal alias
  }
  return 2; // external
}

/**
 * Get category name
 */
function getCategoryName(category) {
  const names = ['', 'built-in', 'external', 'internal', 'relative'];
  return names[category] || 'unknown';
}
