import pc from 'picocolors';

/**
 * Display a user-friendly error message
 * @param {string} message - Error message
 * @param {Error} error - Original error object
 * @param {Object} suggestions - Suggestions for fixing the error
 */
export function showError(message, error = null, suggestions = []) {
  console.error('\n' + pc.red('✖ Error:'), message);
  
  if (error && error.message) {
    console.error(pc.gray('  Details:'), error.message);
  }
  
  if (suggestions.length > 0) {
    console.error('\n' + pc.yellow('💡 Suggestions:'));
    suggestions.forEach(suggestion => {
      console.error(pc.gray('  •'), suggestion);
    });
  }
  
  console.error(''); // Empty line
}

/**
 * Display a warning message
 * @param {string} message - Warning message
 */
export function showWarning(message) {
  console.warn(pc.yellow('⚠ Warning:'), message);
}

/**
 * Display a success message
 * @param {string} message - Success message
 */
export function showSuccess(message) {
  console.log(pc.green('✓'), message);
}

/**
 * Display an info message
 * @param {string} message - Info message
 */
export function showInfo(message) {
  console.log(pc.cyan('ℹ'), message);
}

/**
 * Handle common errors with helpful messages
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 */
export function handleError(error, context = 'operation') {
  if (error.code === 'ENOENT') {
    showError(
      `File or directory not found during ${context}`,
      error,
      [
        'Check that the path exists',
        'Verify you have read permissions',
        'Try using an absolute path',
      ]
    );
  } else if (error.code === 'EACCES') {
    showError(
      `Permission denied during ${context}`,
      error,
      [
        'Check file/directory permissions',
        'Try running with appropriate permissions',
        'Verify you own the files',
      ]
    );
  } else if (error.code === 'EISDIR') {
    showError(
      `Expected a file but found a directory during ${context}`,
      error,
      [
        'Check the path points to a file, not a directory',
        'Use --path to specify the correct directory',
      ]
    );
  } else if (error instanceof SyntaxError) {
    showError(
      `Invalid JSON or syntax error during ${context}`,
      error,
      [
        'Check for syntax errors in configuration files',
        'Validate JSON with a linter',
        'Remove trailing commas in JSON',
      ]
    );
  } else {
    showError(
      `An unexpected error occurred during ${context}`,
      error,
      [
        'Try running the command again',
        'Check the GitHub issues for similar problems',
        'Report this issue if it persists',
      ]
    );
  }
  
  process.exit(1);
}

/**
 * Wrap an async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {string} context - Context description
 * @returns {Function} - Wrapped function
 */
export function withErrorHandling(fn, context) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context);
    }
  };
}
