import { readFile, writeFile } from 'node:fs/promises';

/**
 * Auto-fix unused imports in a file
 */
export async function fixUnusedImports(filePath, unusedSymbols) {
  try {
    const code = await readFile(filePath, 'utf8');
    let fixed = code;
    
    unusedSymbols.forEach(symbol => {
      // Remove named imports
      const namedImportRegex = new RegExp(
        `import\\s*\\{([^}]*)\\b${symbol}\\b([^}]*)\\}\\s*from\\s*['"][^'"]+['"];?`,
        'g'
      );
      
      fixed = fixed.replace(namedImportRegex, (match, before, after) => {
        const remaining = (before + ',' + after)
          .split(',')
          .map(s => s.trim())
          .filter(s => s && s !== symbol)
          .join(', ');
        
        if (remaining) {
          return match.replace(`{${before}${symbol}${after}}`, `{${remaining}}`);
        }
        return ''; // Remove entire import if no symbols left
      });
      
      // Remove default imports
      const defaultImportRegex = new RegExp(
        `import\\s+${symbol}\\s+from\\s+['"][^'"]+['"];?`,
        'g'
      );
      fixed = fixed.replace(defaultImportRegex, '');
    });
    
    // Clean up empty lines
    fixed = fixed.replace(/\n\n\n+/g, '\n\n');
    
    await writeFile(filePath, fixed, 'utf8');
    return true;
  } catch (error) {
    console.error(`Failed to fix ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Auto-fix common code smells
 */
export async function fixCodeSmells(filePath, issues) {
  try {
    let code = await readFile(filePath, 'utf8');
    let modified = false;
    
    issues.forEach(issue => {
      switch (issue.type) {
        case 'console_log':
          // Remove console.log statements
          code = code.replace(/console\.log\([^)]*\);?\n?/g, '');
          modified = true;
          break;
          
        case 'debugger':
          // Remove debugger statements
          code = code.replace(/debugger;?\n?/g, '');
          modified = true;
          break;
          
        case 'trailing_whitespace':
          // Remove trailing whitespace
          code = code.replace(/[ \t]+$/gm, '');
          modified = true;
          break;
          
        case 'multiple_empty_lines':
          // Reduce multiple empty lines to single
          code = code.replace(/\n\n\n+/g, '\n\n');
          modified = true;
          break;
      }
    });
    
    if (modified) {
      await writeFile(filePath, code, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Failed to fix ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Add missing React keys
 */
export async function fixReactKeys(filePath) {
  try {
    let code = await readFile(filePath, 'utf8');
    
    // Find .map() calls without keys and add them
    code = code.replace(
      /(\.map\s*\(\s*\(([^,)]+)[^)]*\)\s*=>\s*<)([^>]+)(>)/g,
      (match, before, itemVar, tag, after) => {
        // Check if key already exists
        if (/key\s*=/.test(tag)) {
          return match;
        }
        // Add key prop
        return `${before}${tag} key={${itemVar}.id || ${itemVar}}${after}`;
      }
    );
    
    await writeFile(filePath, code, 'utf8');
    return true;
  } catch (error) {
    console.error(`Failed to fix ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Fix Vue v-for keys
 */
export async function fixVueKeys(filePath) {
  try {
    let code = await readFile(filePath, 'utf8');
    
    // Find v-for without :key and add it
    code = code.replace(
      /(v-for\s*=\s*"([^"]+)"\s*)([^>]*>)/g,
      (match, vfor, expression, rest) => {
        // Check if key already exists
        if (/:key\s*=|v-bind:key\s*=/.test(rest)) {
          return match;
        }
        // Extract item variable from v-for
        const itemMatch = expression.match(/^\s*(\w+)/);
        const itemVar = itemMatch ? itemMatch[1] : 'item';
        // Add :key
        return `${vfor}:key="${itemVar}.id || ${itemVar}" ${rest}`;
      }
    );
    
    await writeFile(filePath, code, 'utf8');
    return true;
  } catch (error) {
    console.error(`Failed to fix ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Apply all applicable fixes to a file
 */
export async function applyAllFixes(filePath, issues) {
  const results = {
    unusedImports: false,
    codeSmells: false,
    reactKeys: false,
    vueKeys: false,
  };
  
  // Group issues by type
  const unusedImports = issues.filter(i => i.type === 'unused_import');
  const codeSmells = issues.filter(i => 
    ['console_log', 'debugger', 'trailing_whitespace', 'multiple_empty_lines'].includes(i.type)
  );
  const reactIssues = issues.filter(i => i.type === 'react_missing_key');
  const vueIssues = issues.filter(i => i.type === 'vue_missing_key');
  
  // Apply fixes
  if (unusedImports.length > 0) {
    const symbols = unusedImports.map(i => i.symbol).filter(Boolean);
    results.unusedImports = await fixUnusedImports(filePath, symbols);
  }
  
  if (codeSmells.length > 0) {
    results.codeSmells = await fixCodeSmells(filePath, codeSmells);
  }
  
  if (reactIssues.length > 0) {
    results.reactKeys = await fixReactKeys(filePath);
  }
  
  if (vueIssues.length > 0) {
    results.vueKeys = await fixVueKeys(filePath);
  }
  
  return results;
}
