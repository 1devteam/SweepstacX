# SweepstacX Plugin System

The SweepstacX plugin system allows you to extend functionality with custom analyzers and fixers.

## Plugin Structure

A SweepstacX plugin is a JavaScript module that exports an object with the following structure:

```javascript
export default {
  name: 'my-plugin',
  version: '1.0.0',
  
  // Optional: Custom analyzer
  analyzer(code, filePath) {
    // Return array of issues
    return [];
  },
  
  // Optional: Custom fixer
  async fixer(filePath, issues) {
    // Fix issues and return true/false
    return false;
  },
  
  // Optional: Lifecycle hooks
  hooks: {
    beforeScan() {
      // Called before scan starts
    },
    afterScan(report) {
      // Called after scan completes
    },
  },
};
```

## Creating a Plugin

### 1. Basic Plugin Template

Create a file `my-plugin.js`:

```javascript
export default {
  name: 'my-custom-analyzer',
  version: '1.0.0',
  
  analyzer(code, filePath) {
    const issues = [];
    
    // Your analysis logic here
    if (code.includes('FIXME')) {
      issues.push({
        type: 'fixme_comment',
        severity: 'warning',
        message: 'FIXME comment found',
        file: filePath,
      });
    }
    
    return issues;
  },
};
```

### 2. Register Plugin in Config

Add to `.sweeperc.json`:

```json
{
  "plugins": [
    "./plugins/my-plugin.js"
  ]
}
```

### 3. Run Scan

```bash
sweepstacx scan
```

Your plugin will automatically be loaded and executed!

## Plugin API

### Analyzer Function

```javascript
analyzer(code, filePath) {
  // code: string - File content
  // filePath: string - Absolute path to file
  
  // Return array of issue objects
  return [{
    type: 'issue_type',        // Required: Issue type identifier
    severity: 'error',          // Required: 'error', 'warning', or 'info'
    message: 'Description',     // Required: Human-readable message
    file: filePath,             // Required: File path
    line: 42,                   // Optional: Line number
    symbol: 'variableName',     // Optional: Symbol/identifier
  }];
}
```

### Fixer Function

```javascript
async fixer(filePath, issues) {
  // filePath: string - File to fix
  // issues: array - Issues found in this file
  
  // Read file
  const code = await readFile(filePath, 'utf8');
  
  // Apply fixes
  let fixed = code.replace(/FIXME/g, 'TODO');
  
  // Write file
  await writeFile(filePath, fixed, 'utf8');
  
  // Return true if fixed, false otherwise
  return true;
}
```

### Lifecycle Hooks

```javascript
hooks: {
  beforeScan() {
    // Called once before scanning starts
    // Use for initialization, logging, etc.
  },
  
  afterScan(report) {
    // Called once after scanning completes
    // report: { meta, stats, issues, warnings }
    // Use for post-processing, reporting, etc.
  },
}
```

## Example Plugins

### 1. TODO Comment Detector

```javascript
export default {
  name: 'todo-detector',
  version: '1.0.0',
  
  analyzer(code, filePath) {
    const issues = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      if (/\/\/\s*TODO:/i.test(line)) {
        issues.push({
          type: 'todo_comment',
          severity: 'info',
          message: 'TODO comment found',
          file: filePath,
          line: index + 1,
        });
      }
    });
    
    return issues;
  },
};
```

### 2. Copyright Header Checker

```javascript
export default {
  name: 'copyright-checker',
  version: '1.0.0',
  
  analyzer(code, filePath) {
    const issues = [];
    
    if (!code.includes('Copyright')) {
      issues.push({
        type: 'missing_copyright',
        severity: 'warning',
        message: 'Missing copyright header',
        file: filePath,
      });
    }
    
    return issues;
  },
  
  async fixer(filePath, issues) {
    const hasCopyrightIssue = issues.some(i => i.type === 'missing_copyright');
    
    if (hasCopyrightIssue) {
      const code = await readFile(filePath, 'utf8');
      const header = `/**\n * Copyright (c) ${new Date().getFullYear()} Your Company\n */\n\n`;
      await writeFile(filePath, header + code, 'utf8');
      return true;
    }
    
    return false;
  },
};
```

### 3. Custom Naming Convention

```javascript
export default {
  name: 'naming-convention',
  version: '1.0.0',
  
  analyzer(code, filePath) {
    const issues = [];
    
    // Check for snake_case variables (should be camelCase)
    const snakeCaseRegex = /\b([a-z]+_[a-z_]+)\b/g;
    let match;
    
    while ((match = snakeCaseRegex.exec(code)) !== null) {
      issues.push({
        type: 'snake_case_variable',
        severity: 'warning',
        message: `Variable uses snake_case: ${match[1]}`,
        file: filePath,
        symbol: match[1],
      });
    }
    
    return issues;
  },
};
```

### 4. Metrics Reporter

```javascript
export default {
  name: 'metrics-reporter',
  version: '1.0.0',
  
  hooks: {
    afterScan(report) {
      console.log('\n📊 Custom Metrics Report');
      console.log(`Total files: ${report.stats.files_scanned}`);
      console.log(`Total issues: ${report.issues.length}`);
      
      // Group by severity
      const bySeverity = report.issues.reduce((acc, issue) => {
        acc[issue.severity] = (acc[issue.severity] || 0) + 1;
        return acc;
      }, {});
      
      console.log('By severity:', bySeverity);
    },
  },
};
```

## Advanced Features

### Accessing Configuration

```javascript
export default {
  name: 'my-plugin',
  version: '1.0.0',
  
  // Plugin can accept config
  init(config) {
    this.config = config;
  },
  
  analyzer(code, filePath) {
    // Use this.config if needed
    return [];
  },
};
```

### File Type Filtering

```javascript
export default {
  name: 'jsx-specific',
  version: '1.0.0',
  
  analyzer(code, filePath) {
    // Only analyze JSX files
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.tsx')) {
      return [];
    }
    
    // JSX-specific analysis
    return [];
  },
};
```

### Using External Libraries

```javascript
import someLibrary from 'some-library';

export default {
  name: 'advanced-plugin',
  version: '1.0.0',
  
  analyzer(code, filePath) {
    // Use external libraries
    const result = someLibrary.analyze(code);
    
    return result.issues.map(issue => ({
      type: 'external_issue',
      severity: 'warning',
      message: issue.message,
      file: filePath,
    }));
  },
};
```

## Best Practices

1. **Keep analyzers fast** - They run on every file
2. **Use specific issue types** - Makes filtering easier
3. **Provide clear messages** - Help users understand issues
4. **Test thoroughly** - Edge cases matter
5. **Document your plugin** - Help others use it
6. **Version properly** - Semantic versioning recommended

## Plugin Distribution

### NPM Package

Create a package:

```json
{
  "name": "sweepstacx-plugin-myfeature",
  "version": "1.0.0",
  "main": "index.js",
  "peerDependencies": {
    "sweepstacx": "^0.5.0"
  }
}
```

Install and use:

```bash
npm install sweepstacx-plugin-myfeature
```

```json
{
  "plugins": [
    "node_modules/sweepstacx-plugin-myfeature/index.js"
  ]
}
```

## Troubleshooting

### Plugin not loading

- Check file path in `.sweeperc.json`
- Ensure plugin exports default object
- Check for syntax errors

### Analyzer not running

- Verify `analyzer` function exists
- Check return value is an array
- Look for console errors

### Fixer not working

- Ensure `fixer` is async function
- Check file permissions
- Verify return value is boolean

## Future Enhancements

Coming in future versions:

- Plugin marketplace
- Plugin CLI generator
- Plugin testing utilities
- Hot reload during development
- Plugin dependency management

## Contributing

Share your plugins with the community!

1. Create a GitHub repository
2. Add `sweepstacx-plugin` topic
3. Submit to awesome-sweepstacx list

---

**Need help?** Open an issue on GitHub!
