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
          
        case 'var_declaration':
          // Convert var to const/let
          code = code.replace(/\bvar\b/g, 'let');
          modified = true;
          break;
          
        case 'double_equals':
          // Convert == to ===
          code = code.replace(/([^=!])={2}([^=])/g, '$1===$2');
          code = code.replace(/([^=!])!={1}([^=])/g, '$1!==$2');
          modified = true;
          break;
          
        case 'semicolon_missing':
          // Add missing semicolons (simple cases)
          code = code.replace(/(\w+)\n/g, '$1;\n');
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
 * Fix Angular missing trackBy
 */
export async function fixAngularTrackBy(filePath) {
  try {
    let code = await readFile(filePath, 'utf8');
    
    // Find *ngFor without trackBy and add it
    code = code.replace(
      /(\*ngFor\s*=\s*"let\s+(\w+)\s+of\s+(\w+))"/g,
      (match, ngFor, item, collection) => {
        // Check if trackBy already exists
        if (/trackBy/.test(match)) {
          return match;
        }
        // Add trackBy function
        return `${ngFor}; trackBy: trackBy${collection.charAt(0).toUpperCase() + collection.slice(1)}"`;
      }
    );
    
    // Add trackBy function to component if not exists
    if (!code.includes('trackBy')) {
      // Find the last method in the class
      const classEndRegex = /(\n\s*})\s*$/;
      if (classEndRegex.test(code)) {
        const trackByFunction = `\n\n  trackByIndex(index: number): number {\n    return index;\n  }\n`;
        code = code.replace(classEndRegex, trackByFunction + '$1');
      }
    }
    
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
    angularTrackBy: false,
  };
  
  // Group issues by type
  const unusedImports = issues.filter(i => i.type === 'unused_import');
  const codeSmells = issues.filter(i => 
    ['console_log', 'debugger', 'trailing_whitespace', 'multiple_empty_lines', 'var_declaration', 'double_equals', 'semicolon_missing'].includes(i.type)
  );
  const reactIssues = issues.filter(i => i.type === 'react_missing_key');
  const vueIssues = issues.filter(i => i.type === 'vue_missing_key');
  const angularIssues = issues.filter(i => i.type === 'angular_missing_trackby');
  
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
  
  if (angularIssues.length > 0) {
    results.angularTrackBy = await fixAngularTrackBy(filePath);
  }
  
  return results;
}
