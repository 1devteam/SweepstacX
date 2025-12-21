/**
 * Angular-specific code analyzer
 * Detects Angular anti-patterns and best practice violations
 */

export function analyzeAngularCode(code, filePath) {
  const issues = [];
  
  // Check for missing trackBy in *ngFor
  const missingTrackBy = detectMissingTrackBy(code);
  missingTrackBy.forEach(line => {
    issues.push({
      type: 'angular_missing_trackby',
      severity: 'warning',
      message: 'Missing trackBy function in *ngFor (performance issue)',
      file: filePath,
      line,
    });
  });
  
  // Check for subscription leaks (missing unsubscribe)
  const subscriptionLeaks = detectSubscriptionLeaks(code);
  subscriptionLeaks.forEach(subscription => {
    issues.push({
      type: 'angular_subscription_leak',
      severity: 'error',
      message: `Potential subscription leak: ${subscription}`,
      file: filePath,
      symbol: subscription,
    });
  });
  
  // Check for direct DOM manipulation (should use Renderer2)
  const domManipulation = detectDirectDomManipulation(code);
  domManipulation.forEach(line => {
    issues.push({
      type: 'angular_direct_dom',
      severity: 'warning',
      message: 'Direct DOM manipulation detected (use Renderer2 instead)',
      file: filePath,
      line,
    });
  });
  
  // Check for missing OnDestroy implementation
  if (hasSubscriptions(code) && !hasOnDestroy(code)) {
    issues.push({
      type: 'angular_missing_ondestroy',
      severity: 'error',
      message: 'Component has subscriptions but no OnDestroy implementation',
      file: filePath,
    });
  }
  
  // Check for improper dependency injection
  const improperDI = detectImproperDI(code);
  improperDI.forEach(service => {
    issues.push({
      type: 'angular_improper_di',
      severity: 'warning',
      message: `Service should be injected via constructor: ${service}`,
      file: filePath,
      symbol: service,
    });
  });
  
  // Check for missing async pipe with observables
  const missingAsyncPipe = detectMissingAsyncPipe(code);
  missingAsyncPipe.forEach(observable => {
    issues.push({
      type: 'angular_missing_async_pipe',
      severity: 'info',
      message: `Observable used in template without async pipe: ${observable}`,
      file: filePath,
      symbol: observable,
    });
  });
  
  // Check for change detection issues
  const changeDetectionIssues = detectChangeDetectionIssues(code);
  changeDetectionIssues.forEach(issue => {
    issues.push({
      type: 'angular_change_detection',
      severity: 'warning',
      message: issue.message,
      file: filePath,
      line: issue.line,
    });
  });
  
  // Check for unused ViewChild/ContentChild
  const unusedQueries = detectUnusedQueries(code);
  unusedQueries.forEach(query => {
    issues.push({
      type: 'angular_unused_query',
      severity: 'info',
      message: `Unused query decorator: ${query}`,
      file: filePath,
      symbol: query,
    });
  });
  
  return issues;
}

function detectMissingTrackBy(code) {
  const lines = [];
  const codeLines = code.split('\n');
  
  codeLines.forEach((line, index) => {
    // Check for *ngFor without trackBy
    if (/\*ngFor\s*=/.test(line) && !/trackBy/.test(line)) {
      lines.push(index + 1);
    }
  });
  
  return lines;
}

function detectSubscriptionLeaks(code) {
  const leaks = [];
  
  // Find subscribe() calls
  const subscribeRegex = /(\w+)\s*=\s*[^;]*\.subscribe\(/g;
  let match;
  
  const subscriptions = [];
  while ((match = subscribeRegex.exec(code)) !== null) {
    subscriptions.push(match[1]);
  }
  
  // Check if each subscription is unsubscribed
  subscriptions.forEach(sub => {
    const unsubRegex = new RegExp(`${sub}\\.unsubscribe\\(\\)`, 'g');
    if (!unsubRegex.test(code)) {
      leaks.push(sub);
    }
  });
  
  return leaks;
}

function detectDirectDomManipulation(code) {
  const lines = [];
  const codeLines = code.split('\n');
  
  const domMethods = [
    'document.getElementById',
    'document.querySelector',
    'document.createElement',
    'element.innerHTML',
    'element.style',
    'nativeElement.style',
    'nativeElement.innerHTML',
  ];
  
  codeLines.forEach((line, index) => {
    domMethods.forEach(method => {
      if (line.includes(method) && !line.includes('Renderer2')) {
        lines.push(index + 1);
      }
    });
  });
  
  return lines;
}

function hasSubscriptions(code) {
  return /\.subscribe\(/.test(code);
}

function hasOnDestroy(code) {
  return /ngOnDestroy\s*\(/.test(code) || /implements\s+OnDestroy/.test(code);
}

function detectImproperDI(code) {
  const improper = [];
  
  // Look for service instantiation with 'new'
  const newServiceRegex = /new\s+(\w+Service)\s*\(/g;
  let match;
  
  while ((match = newServiceRegex.exec(code)) !== null) {
    improper.push(match[1]);
  }
  
  return improper;
}

function detectMissingAsyncPipe(code) {
  const missing = [];
  
  // Find Observable properties
  const observableRegex = /(\w+)\$?\s*:\s*Observable/g;
  let match;
  
  const observables = [];
  while ((match = observableRegex.exec(code)) !== null) {
    observables.push(match[1]);
  }
  
  // Check if used in template without async pipe
  observables.forEach(obs => {
    // Look for template usage
    const templateUsageRegex = new RegExp(`\\{\\{\\s*${obs}[^}]*\\}\\}`, 'g');
    if (templateUsageRegex.test(code) && !/\|\s*async/.test(code)) {
      missing.push(obs);
    }
  });
  
  return missing;
}

function detectChangeDetectionIssues(code) {
  const issues = [];
  const codeLines = code.split('\n');
  
  codeLines.forEach((line, index) => {
    // Check for function calls in templates
    if (/\{\{[^}]*\(\s*\)[^}]*\}\}/.test(line)) {
      issues.push({
        line: index + 1,
        message: 'Function call in template (triggers on every change detection)',
      });
    }
  });
  
  return issues;
}

function detectUnusedQueries(code) {
  const unused = [];
  
  // Find ViewChild/ContentChild declarations
  const queryRegex = /@(?:ViewChild|ContentChild)\s*\([^)]+\)\s+(\w+)/g;
  let match;
  
  const queries = [];
  while ((match = queryRegex.exec(code)) !== null) {
    queries.push(match[1]);
  }
  
  // Check if each query is used
  queries.forEach(query => {
    // Count occurrences (should be more than just declaration)
    const occurrences = (code.match(new RegExp(`\\b${query}\\b`, 'g')) || []).length;
    if (occurrences <= 2) { // Declaration + type annotation
      unused.push(query);
    }
  });
  
  return unused;
}

/**
 * Check if file is an Angular component/service
 */
export function isAngularFile(code, filePath) {
  return (
    /@Component\s*\(/.test(code) ||
    /@Injectable\s*\(/.test(code) ||
    /@Directive\s*\(/.test(code) ||
    /@Pipe\s*\(/.test(code) ||
    /@NgModule\s*\(/.test(code) ||
    /from\s+['"]@angular\//.test(code) ||
    filePath.endsWith('.component.ts') ||
    filePath.endsWith('.service.ts') ||
    filePath.endsWith('.directive.ts') ||
    filePath.endsWith('.pipe.ts')
  );
}
