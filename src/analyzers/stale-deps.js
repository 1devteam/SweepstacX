import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Detect stale dependencies in package.json
 * @param {string} root - Project root directory
 * @returns {Promise<Object>} - Object with stale dependency information
 */
export async function detectStaleDeps(root) {
  const packageJsonPath = resolve(root, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return {
      stale: [],
      unused: [],
      outdated: [],
    };
  }

  try {
    const content = await readFile(packageJsonPath, 'utf8');
    const pkg = JSON.parse(content);

    const stale = [];

    // Check for deprecated or problematic dependencies
    const problematicDeps = [
      { name: 'request', reason: 'Deprecated - use node-fetch or axios' },
      { name: 'gulp', reason: 'Consider modern build tools like Vite or esbuild' },
      { name: 'bower', reason: 'Deprecated - use npm or yarn' },
      { name: 'grunt', reason: 'Consider modern build tools' },
      { name: 'moment', reason: 'Large bundle size - consider date-fns or dayjs' },
      { name: 'core-js', reason: 'Often over-included - check if needed' },
    ];

    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    for (const [name, version] of Object.entries(allDeps)) {
      // Check for problematic dependencies
      const problematic = problematicDeps.find(d => d.name === name);
      if (problematic) {
        stale.push({
          name,
          version,
          reason: problematic.reason,
          type: 'deprecated',
        });
      }

      // Check for wildcard or overly permissive versions
      if (version === '*' || version === 'latest') {
        stale.push({
          name,
          version,
          reason: 'Wildcard version - pin to specific version for stability',
          type: 'wildcard',
        });
      }

      // Check for very old version patterns (< 1.0.0 and not updated)
      if (version.match(/^[~^]?0\.\d+\.\d+$/)) {
        stale.push({
          name,
          version,
          reason: 'Pre-1.0 version - may be unstable or abandoned',
          type: 'pre-release',
        });
      }
    }

    return {
      stale,
      unused: [], // Will be populated by depcheck in the future
      outdated: [], // Will be populated by npm outdated in the future
    };
  } catch (err) {
    return {
      stale: [],
      unused: [],
      outdated: [],
      error: err.message,
    };
  }
}

/**
 * Check for unused dependencies using simple heuristics
 * @param {string} root - Project root
 * @param {string[]} files - All source files
 * @returns {Promise<string[]>} - List of potentially unused dependencies
 */
export async function detectUnusedDeps(root, files) {
  const packageJsonPath = resolve(root, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return [];
  }

  try {
    const content = await readFile(packageJsonPath, 'utf8');
    const pkg = JSON.parse(content);

    const deps = Object.keys(pkg.dependencies || {});
    const used = new Set();

    // Scan all files for require/import of each dependency
    for (const file of files) {
      try {
        const code = await readFile(file, 'utf8');

        for (const dep of deps) {
          // Check for various import patterns
          const patterns = [
            new RegExp(`require\\s*\\(\\s*['"\`]${escapeRegex(dep)}['"\`]\\s*\\)`),
            new RegExp(`from\\s+['"\`]${escapeRegex(dep)}['"\`]`),
            new RegExp(`import\\s+['"\`]${escapeRegex(dep)}['"\`]`),
          ];

          if (patterns.some(p => p.test(code))) {
            used.add(dep);
          }
        }
      } catch (_err) {
        // Skip files that can't be read
      }
    }

    // Return dependencies that weren't found in any file
    const unused = deps.filter(dep => !used.has(dep));
    return unused;
  } catch (_err) {
    return [];
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
