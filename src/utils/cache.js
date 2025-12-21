import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const CACHE_DIR = '.sweepstacx/cache';
const CACHE_VERSION = '1';

/**
 * Get cache file path for a given key
 */
function getCachePath(key) {
  const hash = createHash('md5').update(key).digest('hex');
  return resolve(process.cwd(), CACHE_DIR, `${hash}.json`);
}

/**
 * Ensure cache directory exists
 */
async function ensureCacheDir() {
  const cacheDir = resolve(process.cwd(), CACHE_DIR);
  if (!existsSync(cacheDir)) {
    await mkdir(cacheDir, { recursive: true });
  }
}

/**
 * Get cached data if valid
 * @param {string} key - Cache key
 * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
 * @returns {Promise<any|null>} - Cached data or null
 */
export async function getCache(key, maxAge = 3600000) {
  try {
    const cachePath = getCachePath(key);
    
    if (!existsSync(cachePath)) {
      return null;
    }
    
    const content = await readFile(cachePath, 'utf8');
    const cache = JSON.parse(content);
    
    // Check version
    if (cache.version !== CACHE_VERSION) {
      return null;
    }
    
    // Check age
    const age = Date.now() - cache.timestamp;
    if (age > maxAge) {
      return null;
    }
    
    return cache.data;
  } catch (_err) {
    return null;
  }
}

/**
 * Set cache data
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export async function setCache(key, data) {
  try {
    await ensureCacheDir();
    
    const cachePath = getCachePath(key);
    const cache = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      data,
    };
    
    await writeFile(cachePath, JSON.stringify(cache, null, 2));
  } catch (_err) {
    // Silently fail if caching doesn't work
  }
}

/**
 * Get file hash for cache invalidation
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} - File hash
 */
export async function getFileHash(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    return createHash('md5').update(content).digest('hex');
  } catch (_err) {
    return '';
  }
}

/**
 * Get cache key for a file
 * @param {string} filePath - Path to file
 * @param {string} operation - Operation name (e.g., 'scan', 'analyze')
 * @returns {Promise<string>} - Cache key
 */
export async function getFileCacheKey(filePath, operation) {
  const hash = await getFileHash(filePath);
  return `${operation}:${filePath}:${hash}`;
}

/**
 * Clear all cache
 */
export async function clearCache() {
  try {
    const cacheDir = resolve(process.cwd(), CACHE_DIR);
    if (existsSync(cacheDir)) {
      const { rm } = await import('node:fs/promises');
      await rm(cacheDir, { recursive: true, force: true });
    }
  } catch (_err) {
    // Silently fail
  }
}
