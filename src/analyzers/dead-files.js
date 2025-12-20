import { readFile } from 'node:fs/promises';
import { relative, dirname, resolve, extname } from 'node:path';

/**
 * Detect dead files (files that are never imported by any other file)
 * @param {string[]} files - Array of absolute file paths to analyze
 * @param {string} root - Project root directory
 * @returns {Promise<string[]>} - Array of relative paths to dead files
 */
export async function detectDeadFiles(files, root) {
  const importGraph = new Map(); // file -> Set of files it imports
  const importedBy = new Map();  // file -> Set of files that import it

  // Initialize maps
  for (const file of files) {
    importGraph.set(file, new Set());
    importedBy.set(file, new Set());
  }

  // Build import graph
  for (const file of files) {
    try {
      const content = await readFile(file, 'utf8');
      const imports = extractImports(content, file, files);

      for (const importedFile of imports) {
        importGraph.get(file).add(importedFile);
        if (!importedBy.has(importedFile)) {
          importedBy.set(importedFile, new Set());
        }
        importedBy.get(importedFile).add(file);
      }
    } catch (_err) {
      // Skip files that can't be read
      continue;
    }
  }

  // Find entry points (files that are likely entry points)
  const entryPoints = findEntryPoints(files, root);

  // Mark entry points as used
  const used = new Set(entryPoints);

  // BFS from entry points to mark all reachable files
  const queue = [...entryPoints];
  while (queue.length > 0) {
    const current = queue.shift();
    const imports = importGraph.get(current) || new Set();

    for (const imported of imports) {
      if (!used.has(imported)) {
        used.add(imported);
        queue.push(imported);
      }
    }
  }

  // Dead files are those not reachable from entry points
  const deadFiles = [];
  for (const file of files) {
    if (!used.has(file)) {
      deadFiles.push(relative(root, file));
    }
  }

  return deadFiles;
}

/**
 * Extract import statements from source code
 * @param {string} code - Source code
 * @param {string} currentFile - Path to the current file
 * @param {string[]} allFiles - All files in the project
 * @returns {string[]} - Array of absolute paths to imported files
 */
function extractImports(code, currentFile, allFiles) {
  const imports = [];
  const currentDir = dirname(currentFile);

  // Match ES6 imports and require statements
  const importRegex = /(?:import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;

  let match;
  while ((match = importRegex.exec(code))) {
    const importPath = match[1] || match[2];

    // Skip external packages (not starting with . or /)
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      continue;
    }

    // Resolve the import path
    const resolvedPath = resolveImportPath(importPath, currentDir, allFiles);
    if (resolvedPath) {
      imports.push(resolvedPath);
    }
  }

  return imports;
}

/**
 * Resolve an import path to an absolute file path
 * @param {string} importPath - The import path from the source
 * @param {string} currentDir - Directory of the importing file
 * @param {string[]} allFiles - All files in the project
 * @returns {string|null} - Resolved absolute path or null
 */
function resolveImportPath(importPath, currentDir, allFiles) {
  const candidates = [];

  // Resolve relative to current directory
  let basePath = resolve(currentDir, importPath);

  // If it has an extension, try exact match
  if (extname(importPath)) {
    candidates.push(basePath);
  } else {
    // Try common extensions
    candidates.push(basePath + '.js');
    candidates.push(basePath + '.mjs');
    candidates.push(basePath + '.cjs');
    candidates.push(basePath + '.ts');
    candidates.push(basePath + '.tsx');
    candidates.push(basePath + '.jsx');
    // Try index files
    candidates.push(resolve(basePath, 'index.js'));
    candidates.push(resolve(basePath, 'index.mjs'));
    candidates.push(resolve(basePath, 'index.cjs'));
    candidates.push(resolve(basePath, 'index.ts'));
  }

  // Find first matching file
  for (const candidate of candidates) {
    if (allFiles.includes(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Identify likely entry points in the project
 * @param {string[]} files - All files in the project
 * @param {string} root - Project root
 * @returns {string[]} - Array of entry point file paths
 */
function findEntryPoints(files, root) {
  const entryPoints = [];

  for (const file of files) {
    const rel = relative(root, file);
    const parts = rel.split('/');
    const filename = parts[parts.length - 1];

    // Common entry point patterns
    if (
      filename === 'index.js' ||
      filename === 'index.mjs' ||
      filename === 'index.cjs' ||
      filename === 'main.js' ||
      filename === 'app.js' ||
      filename === 'server.js' ||
      rel.startsWith('bin/') ||
      parts.includes('bin') ||
      parts.includes('cli') ||
      filename.endsWith('.test.js') ||
      filename.endsWith('.spec.js') ||
      filename.endsWith('.test.mjs') ||
      filename.endsWith('.spec.mjs')
    ) {
      entryPoints.push(file);
    }
  }

  // If no entry points found, consider all files as potential entries
  // (conservative approach to avoid false positives)
  if (entryPoints.length === 0) {
    return [...files];
  }

  return entryPoints;
}
