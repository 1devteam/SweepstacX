import { readFile } from 'node:fs/promises';

/**
 * Detect unused imports in TypeScript files
 * @param {string} code - TypeScript source code
 * @returns {string[]} - Array of unused import names
 */
export function detectUnusedTypeScriptImports(code) {
  const unused = [];
  
  // Match TypeScript imports including type imports
  const importRegex = /^\s*import\s+(?:type\s+)?(?!['"])([\s\S]*?)\s+from\s+['"][^'"]+['"]/gm;
  
  let match;
  while ((match = importRegex.exec(code))) {
    const clause = match[1].trim();
    const isTypeOnly = match[0].includes('import type');
    
    // Handle namespace imports: import * as ns from 'x'
    const nsMatch = clause.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
    if (nsMatch) {
      if (!isUsedInCode(code, nsMatch[1], match.index, match[0].length)) {
        unused.push(nsMatch[1]);
      }
      continue;
    }
    
    // Handle default and named imports
    let defaultName = null;
    let namedBlock = null;
    const firstComma = findTopLevelComma(clause);
    
    if (firstComma === -1) {
      if (clause.startsWith('{')) {
        namedBlock = clause;
      } else {
        defaultName = clause;
      }
    } else {
      defaultName = clause.slice(0, firstComma).trim();
      namedBlock = clause.slice(firstComma + 1).trim();
    }
    
    // Check default import
    if (defaultName && !defaultName.startsWith('{')) {
      if (!isUsedInCode(code, defaultName, match.index, match[0].length)) {
        unused.push(defaultName);
      }
    }
    
    // Check named imports
    if (namedBlock) {
      const inner = (namedBlock.match(/\{([^}]*)\}/) || [null, ''])[1];
      for (const raw of inner.split(',').map(s => s.trim()).filter(Boolean)) {
        // Handle: import { Foo as Bar } or import { type Foo }
        const typeMatch = raw.match(/^type\s+([A-Za-z_$][\w$]*)$/);
        const aliasMatch = raw.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/i);
        
        let name;
        if (typeMatch) {
          name = typeMatch[1];
        } else if (aliasMatch) {
          name = aliasMatch[2];
        } else {
          name = raw;
        }
        
        if (name && !isUsedInCode(code, name, match.index, match[0].length)) {
          unused.push(name);
        }
      }
    }
  }
  
  return unused;
}

/**
 * Check if an identifier is used in the code
 */
function isUsedInCode(code, identifier, importStart, importLength) {
  const before = code.slice(0, importStart);
  const after = code.slice(importStart + importLength);
  const body = before + '\n' + after;
  
  // Create regex to match the identifier as a whole word
  const regex = new RegExp(`\\b${escapeRegex(identifier)}\\b`, 'g');
  return regex.test(body);
}

/**
 * Find the index of the first top-level comma (not inside braces)
 */
function findTopLevelComma(str) {
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '{') depth++;
    else if (char === '}') depth--;
    else if (char === ',' && depth === 0) return i;
  }
  return -1;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Analyze TypeScript-specific issues
 * @param {string[]} files - Array of TypeScript file paths
 * @returns {Promise<Object[]>} - Array of TypeScript-specific issues
 */
export async function analyzeTypeScriptFiles(files) {
  const issues = [];
  
  for (const file of files) {
    try {
      const content = await readFile(file, 'utf8');
      
      // Detect unused imports
      const unusedImports = detectUnusedTypeScriptImports(content);
      for (const symbol of unusedImports) {
        issues.push({
          type: 'unused_import',
          file,
          symbol,
          language: 'typescript',
        });
      }
      
      // Detect unused type parameters
      const unusedTypeParams = detectUnusedTypeParameters(content);
      for (const param of unusedTypeParams) {
        issues.push({
          type: 'unused_type_parameter',
          file,
          symbol: param.name,
          line: param.line,
          language: 'typescript',
        });
      }
      
    } catch (_err) {
      // Skip files that can't be read
    }
  }
  
  return issues;
}

/**
 * Detect unused type parameters in generic functions/classes
 */
function detectUnusedTypeParameters(code) {
  const unused = [];
  const lines = code.split('\n');
  
  // Match generic type parameters: function foo<T, U>() or class Bar<T>
  const genericRegex = /<([A-Z][A-Za-z0-9,\s]*)>/g;
  
  lines.forEach((line, idx) => {
    let match;
    while ((match = genericRegex.exec(line))) {
      const params = match[1].split(',').map(p => p.trim());
      
      // Get the rest of the function/class body (simplified)
      const restOfCode = lines.slice(idx).join('\n');
      
      for (const param of params) {
        // Check if type parameter is used
        const usageRegex = new RegExp(`\\b${param}\\b`, 'g');
        const matches = restOfCode.match(usageRegex) || [];
        
        // If only appears once (in declaration), it's unused
        if (matches.length === 1) {
          unused.push({
            name: param,
            line: idx + 1,
          });
        }
      }
    }
  });
  
  return unused;
}
