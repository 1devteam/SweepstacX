/**
 * Vue-specific code analyzer
 * Detects Vue anti-patterns and best practice violations
 */

export function analyzeVueCode(code, filePath) {
  const issues = [];
  
  // Check for missing v-bind:key in v-for
  const missingKeys = detectMissingVForKeys(code);
  missingKeys.forEach(line => {
    issues.push({
      type: 'vue_missing_key',
      severity: 'error',
      message: 'Missing :key in v-for directive',
      file: filePath,
      line,
    });
  });
  
  // Check for direct mutation of props
  const propMutations = detectPropMutation(code);
  propMutations.forEach(prop => {
    issues.push({
      type: 'vue_prop_mutation',
      severity: 'error',
      message: `Direct prop mutation detected: ${prop}`,
      file: filePath,
      symbol: prop,
    });
  });
  
  // Check for missing emits declaration (Vue 3)
  if (isVue3(code)) {
    const missingEmits = detectMissingEmits(code);
    if (missingEmits.length > 0) {
      issues.push({
        type: 'vue_missing_emits',
        severity: 'warning',
        message: 'Component emits events without emits declaration',
        file: filePath,
      });
    }
  }
  
  // Check for unused reactive properties
  const unusedReactive = detectUnusedReactive(code);
  unusedReactive.forEach(prop => {
    issues.push({
      type: 'vue_unused_reactive',
      severity: 'info',
      message: `Unused reactive property: ${prop}`,
      file: filePath,
      symbol: prop,
    });
  });
  
  // Check for watch without deep option on objects
  const shallowWatches = detectShallowWatch(code);
  shallowWatches.forEach(watch => {
    issues.push({
      type: 'vue_shallow_watch',
      severity: 'warning',
      message: `Watch on object without deep:true may not trigger: ${watch}`,
      file: filePath,
      symbol: watch,
    });
  });
  
  return issues;
}

function detectMissingVForKeys(code) {
  const lines = [];
  const codeLines = code.split('\n');
  
  codeLines.forEach((line, index) => {
    // Check for v-for without :key
    if (/v-for\s*=/.test(line) && !/:key\s*=/.test(line) && !/v-bind:key\s*=/.test(line)) {
      lines.push(index + 1);
    }
  });
  
  return lines;
}

function detectPropMutation(code) {
  const mutations = [];
  
  // Look for props definition
  const propsMatch = code.match(/props:\s*\{([^}]+)\}/);
  if (!propsMatch) return mutations;
  
  const propNames = propsMatch[1]
    .split(',')
    .map(p => p.trim().split(':')[0].trim())
    .filter(Boolean);
  
  // Check if any props are being assigned to
  propNames.forEach(prop => {
    const mutationRegex = new RegExp(`this\\.${prop}\\s*=`, 'g');
    if (mutationRegex.test(code)) {
      mutations.push(prop);
    }
  });
  
  return mutations;
}

function isVue3(code) {
  return (
    /import\s+\{[^}]*defineComponent[^}]*\}/.test(code) ||
    /import\s+\{[^}]*ref[^}]*\}/.test(code) ||
    /import\s+\{[^}]*reactive[^}]*\}/.test(code) ||
    /<script\s+setup>/.test(code)
  );
}

function detectMissingEmits(code) {
  const emits = [];
  
  // Find $emit calls
  const emitRegex = /\$emit\s*\(\s*['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = emitRegex.exec(code)) !== null) {
    emits.push(match[1]);
  }
  
  // Check if emits is declared
  const hasEmitsDeclaration = /emits:\s*\[/.test(code) || /defineEmits\s*\(/.test(code);
  
  return hasEmitsDeclaration ? [] : emits;
}

function detectUnusedReactive(code) {
  const unused = [];
  
  // Find reactive/ref declarations
  const reactiveRegex = /(?:const|let)\s+(\w+)\s*=\s*(?:reactive|ref)\s*\(/g;
  let match;
  
  const declared = [];
  while ((match = reactiveRegex.exec(code)) !== null) {
    declared.push(match[1]);
  }
  
  // Check if each is used elsewhere in the code
  declared.forEach(varName => {
    // Count occurrences (should be more than just declaration)
    const occurrences = (code.match(new RegExp(`\\b${varName}\\b`, 'g')) || []).length;
    if (occurrences <= 2) { // Declaration + one other mention
      unused.push(varName);
    }
  });
  
  return unused;
}

function detectShallowWatch(code) {
  const shallow = [];
  
  // Find watch statements on objects without deep:true
  const watchRegex = /watch\s*\(\s*(\w+)\s*,/g;
  let match;
  
  while ((match = watchRegex.exec(code)) !== null) {
    const watchVar = match[1];
    const watchBlock = code.substring(match.index, match.index + 200);
    
    // Check if it's watching an object/array and doesn't have deep:true
    if (!/deep:\s*true/.test(watchBlock)) {
      // Simple heuristic: if the variable is reactive/ref, it might be an object
      if (/reactive\s*\(/.test(code) || /ref\s*\(\s*\{/.test(code)) {
        shallow.push(watchVar);
      }
    }
  }
  
  return shallow;
}

/**
 * Check if file is a Vue component
 */
export function isVueFile(code, filePath) {
  return (
    filePath.endsWith('.vue') ||
    /<template>/.test(code) ||
    /export\s+default\s+\{[\s\S]*name:/.test(code) ||
    /defineComponent\s*\(/.test(code)
  );
}
