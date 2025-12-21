/**
 * Svelte-specific code analyzer
 * Detects Svelte anti-patterns and best practice violations
 */

export function analyzeSvelteCode(code, filePath) {
  const issues = [];
  
  // Check for missing key in {#each} blocks
  const missingKeys = detectMissingKeys(code);
  missingKeys.forEach(line => {
    issues.push({
      type: 'svelte_missing_key',
      severity: 'warning',
      message: 'Missing key in {#each} block (performance issue)',
      file: filePath,
      line,
    });
  });
  
  // Check for reactive statement issues
  const reactiveIssues = detectReactiveIssues(code);
  reactiveIssues.forEach(issue => {
    issues.push({
      type: 'svelte_reactive_issue',
      severity: 'warning',
      message: issue.message,
      file: filePath,
      line: issue.line,
    });
  });
  
  // Check for store subscription leaks
  const storeLeaks = detectStoreLeaks(code);
  storeLeaks.forEach(store => {
    issues.push({
      type: 'svelte_store_leak',
      severity: 'error',
      message: `Store subscription leak: ${store} (use $store syntax or unsubscribe)`,
      file: filePath,
      symbol: store,
    });
  });
  
  // Check for improper event handlers
  const eventHandlerIssues = detectEventHandlerIssues(code);
  eventHandlerIssues.forEach(issue => {
    issues.push({
      type: 'svelte_event_handler',
      severity: 'warning',
      message: issue.message,
      file: filePath,
      line: issue.line,
    });
  });
  
  // Check for component prop mutations
  const propMutations = detectPropMutations(code);
  propMutations.forEach(prop => {
    issues.push({
      type: 'svelte_prop_mutation',
      severity: 'error',
      message: `Direct prop mutation: ${prop} (props are read-only)`,
      file: filePath,
      symbol: prop,
    });
  });
  
  // Check for unused exports
  const unusedExports = detectUnusedExports(code);
  unusedExports.forEach(exp => {
    issues.push({
      type: 'svelte_unused_export',
      severity: 'info',
      message: `Unused export: ${exp}`,
      file: filePath,
      symbol: exp,
    });
  });
  
  // Check for missing transitions
  const missingTransitions = detectMissingTransitions(code);
  missingTransitions.forEach(line => {
    issues.push({
      type: 'svelte_missing_transition',
      severity: 'info',
      message: 'Consider adding transition for better UX',
      file: filePath,
      line,
    });
  });
  
  // Check for accessibility issues
  const a11yIssues = detectA11yIssues(code);
  a11yIssues.forEach(issue => {
    issues.push({
      type: 'svelte_a11y',
      severity: 'warning',
      message: issue.message,
      file: filePath,
      line: issue.line,
    });
  });
  
  return issues;
}

function detectMissingKeys(code) {
  const lines = [];
  const codeLines = code.split('\n');
  
  codeLines.forEach((line, index) => {
    // Check for {#each} without key
    if (/\{#each\s+/.test(line) && !/\(.*,.*\)/.test(line)) {
      lines.push(index + 1);
    }
  });
  
  return lines;
}

function detectReactiveIssues(code) {
  const issues = [];
  const codeLines = code.split('\n');
  
  codeLines.forEach((line, index) => {
    // Check for $: without proper reactive declaration
    if (/^\s*\$:\s*\w+\s*=/.test(line)) {
      // Check if it depends on reactive variables
      if (!/\$\w+/.test(line) && !/\b(props|state)\b/.test(line)) {
        issues.push({
          line: index + 1,
          message: 'Reactive statement may not have dependencies',
        });
      }
    }
    
    // Check for multiple statements in reactive declaration
    if (/^\s*\$:/.test(line) && (line.match(/;/g) || []).length > 1) {
      issues.push({
        line: index + 1,
        message: 'Multiple statements in reactive declaration (use block)',
      });
    }
  });
  
  return issues;
}

function detectStoreLeaks(code) {
  const leaks = [];
  
  // Find store.subscribe() calls
  const subscribeRegex = /(\w+)\.subscribe\(/g;
  let match;
  
  const subscriptions = [];
  while ((match = subscribeRegex.exec(code)) !== null) {
    subscriptions.push(match[1]);
  }
  
  // Check if using $ syntax instead
  subscriptions.forEach(store => {
    // If not using $store syntax and not unsubscribing
    if (!code.includes(`$${store}`) && !code.includes('unsubscribe()')) {
      leaks.push(store);
    }
  });
  
  return leaks;
}

function detectEventHandlerIssues(code) {
  const issues = [];
  const codeLines = code.split('\n');
  
  codeLines.forEach((line, index) => {
    // Check for inline arrow functions in event handlers
    if (/on:\w+\s*=\s*\{[^}]*=>\s*[^}]*\}/.test(line)) {
      issues.push({
        line: index + 1,
        message: 'Inline arrow function in event handler (creates new function on each render)',
      });
    }
    
    // Check for missing event modifiers
    if (/on:submit\s*=/.test(line) && !/\|preventDefault/.test(line)) {
      issues.push({
        line: index + 1,
        message: 'Consider using |preventDefault modifier on submit',
      });
    }
  });
  
  return issues;
}

function detectPropMutations(code) {
  const mutations = [];
  
  // Find export let declarations (props)
  const propRegex = /export\s+let\s+(\w+)/g;
  let match;
  
  const props = [];
  while ((match = propRegex.exec(code)) !== null) {
    props.push(match[1]);
  }
  
  // Check for direct mutations
  props.forEach(prop => {
    const mutationRegex = new RegExp(`${prop}\\s*=`, 'g');
    const matches = code.match(mutationRegex);
    
    // If assigned more than once (declaration + mutation)
    if (matches && matches.length > 1) {
      mutations.push(prop);
    }
  });
  
  return mutations;
}

function detectUnusedExports(code) {
  const unused = [];
  
  // Find all exports
  const exportRegex = /export\s+(?:let|const|function)\s+(\w+)/g;
  let match;
  
  const exports = [];
  while ((match = exportRegex.exec(code)) !== null) {
    exports.push(match[1]);
  }
  
  // Check usage (excluding declaration)
  exports.forEach(exp => {
    const usageCount = (code.match(new RegExp(`\\b${exp}\\b`, 'g')) || []).length;
    // If only used once (the declaration itself)
    if (usageCount <= 1) {
      unused.push(exp);
    }
  });
  
  return unused;
}

function detectMissingTransitions(code) {
  const lines = [];
  const codeLines = code.split('\n');
  
  codeLines.forEach((line, index) => {
    // Check for {#if} blocks without transitions
    if (/\{#if\s+/.test(line)) {
      // Look ahead for transition
      const nextLines = codeLines.slice(index, index + 5).join('\n');
      if (!/transition:/.test(nextLines) && !/in:|out:/.test(nextLines)) {
        lines.push(index + 1);
      }
    }
  });
  
  return lines;
}

function detectA11yIssues(code) {
  const issues = [];
  const codeLines = code.split('\n');
  
  codeLines.forEach((line, index) => {
    // Check for missing alt text on images
    if (/<img\s/.test(line) && !/alt\s*=/.test(line)) {
      issues.push({
        line: index + 1,
        message: 'Image missing alt attribute (accessibility)',
      });
    }
    
    // Check for click handlers without keyboard handlers
    if (/on:click/.test(line) && !/on:keydown|on:keyup|on:keypress/.test(line)) {
      // Check if it's not a button or link
      if (!/<button|<a\s/.test(line)) {
        issues.push({
          line: index + 1,
          message: 'Click handler without keyboard handler (accessibility)',
        });
      }
    }
    
    // Check for missing labels on inputs
    if (/<input\s/.test(line)) {
      const nextLines = codeLines.slice(Math.max(0, index - 2), index + 3).join('\n');
      if (!/<label/.test(nextLines) && !/aria-label/.test(line)) {
        issues.push({
          line: index + 1,
          message: 'Input missing label or aria-label (accessibility)',
        });
      }
    }
  });
  
  return issues;
}

/**
 * Check if file is a Svelte component
 */
export function isSvelteFile(code, filePath) {
  return (
    filePath.endsWith('.svelte') ||
    /<script/.test(code) && /<\/script>/.test(code) && (/<style/.test(code) || /{#/.test(code))
  );
}

/**
 * Extract script content from Svelte file
 */
export function extractSvelteScript(code) {
  const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  return scriptMatch ? scriptMatch[1] : '';
}

/**
 * Extract template content from Svelte file
 */
export function extractSvelteTemplate(code) {
  // Remove script and style tags
  let template = code.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');
  template = template.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
  return template.trim();
}
