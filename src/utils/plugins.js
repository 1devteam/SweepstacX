/**
 * Plugin system for SweepstacX
 * Allows extending functionality with custom analyzers and fixers
 */

import { resolve, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const plugins = new Map();

/**
 * Plugin interface
 * {
 *   name: string,
 *   version: string,
 *   analyzer?: (code, filePath) => issues[],
 *   fixer?: (filePath, issues) => Promise<boolean>,
 *   hooks?: {
 *     beforeScan?: () => void,
 *     afterScan?: (report) => void,
 *   }
 * }
 */

/**
 * Register a plugin
 */
export function registerPlugin(plugin) {
  if (!plugin.name) {
    throw new Error('Plugin must have a name');
  }
  
  if (!plugin.version) {
    throw new Error('Plugin must have a version');
  }
  
  if (plugins.has(plugin.name)) {
    console.warn(`Plugin ${plugin.name} is already registered, overwriting...`);
  }
  
  plugins.set(plugin.name, plugin);
  console.log(`✓ Registered plugin: ${plugin.name} v${plugin.version}`);
}

/**
 * Load plugins from configuration
 */
export async function loadPlugins(config) {
  if (!config.plugins || config.plugins.length === 0) {
    return;
  }
  
  for (const pluginPath of config.plugins) {
    try {
      const fullPath = resolve(process.cwd(), pluginPath);
      
      if (!existsSync(fullPath)) {
        console.warn(`Plugin not found: ${pluginPath}`);
        continue;
      }
      
      // Dynamic import of plugin
      const plugin = await import(fullPath);
      const pluginModule = plugin.default || plugin;
      
      registerPlugin(pluginModule);
    } catch (error) {
      console.error(`Failed to load plugin ${pluginPath}:`, error.message);
    }
  }
}

/**
 * Get all registered plugins
 */
export function getPlugins() {
  return Array.from(plugins.values());
}

/**
 * Get plugin by name
 */
export function getPlugin(name) {
  return plugins.get(name);
}

/**
 * Run analyzer plugins on code
 */
export function runAnalyzerPlugins(code, filePath) {
  const allIssues = [];
  
  for (const plugin of plugins.values()) {
    if (plugin.analyzer && typeof plugin.analyzer === 'function') {
      try {
        const issues = plugin.analyzer(code, filePath);
        if (Array.isArray(issues)) {
          allIssues.push(...issues);
        }
      } catch (error) {
        console.error(`Plugin ${plugin.name} analyzer failed:`, error.message);
      }
    }
  }
  
  return allIssues;
}

/**
 * Run fixer plugins
 */
export async function runFixerPlugins(filePath, issues) {
  const results = {};
  
  for (const plugin of plugins.values()) {
    if (plugin.fixer && typeof plugin.fixer === 'function') {
      try {
        const fixed = await plugin.fixer(filePath, issues);
        results[plugin.name] = fixed;
      } catch (error) {
        console.error(`Plugin ${plugin.name} fixer failed:`, error.message);
        results[plugin.name] = false;
      }
    }
  }
  
  return results;
}

/**
 * Run beforeScan hooks
 */
export async function runBeforeScanHooks() {
  for (const plugin of plugins.values()) {
    if (plugin.hooks?.beforeScan) {
      try {
        await plugin.hooks.beforeScan();
      } catch (error) {
        console.error(`Plugin ${plugin.name} beforeScan hook failed:`, error.message);
      }
    }
  }
}

/**
 * Run afterScan hooks
 */
export async function runAfterScanHooks(report) {
  for (const plugin of plugins.values()) {
    if (plugin.hooks?.afterScan) {
      try {
        await plugin.hooks.afterScan(report);
      } catch (error) {
        console.error(`Plugin ${plugin.name} afterScan hook failed:`, error.message);
      }
    }
  }
}

/**
 * Clear all plugins
 */
export function clearPlugins() {
  plugins.clear();
}

/**
 * Example plugin template
 */
export const examplePlugin = {
  name: 'example-plugin',
  version: '1.0.0',
  
  analyzer(code, filePath) {
    const issues = [];
    
    // Example: detect TODO comments
    const todoRegex = /\/\/\s*TODO:?\s*(.+)/gi;
    let match;
    
    while ((match = todoRegex.exec(code)) !== null) {
      issues.push({
        type: 'todo_comment',
        severity: 'info',
        message: `TODO found: ${match[1]}`,
        file: filePath,
      });
    }
    
    return issues;
  },
  
  async fixer(filePath, issues) {
    // Example: remove TODO comments
    // Implementation here
    return false;
  },
  
  hooks: {
    beforeScan() {
      console.log('Example plugin: Starting scan...');
    },
    
    afterScan(report) {
      console.log(`Example plugin: Found ${report.issues.length} issues`);
    },
  },
};
