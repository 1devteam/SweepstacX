/**
 * SweepstacX Crystallized: Lodash Core Utilities
 * 
 * Design Philosophy: Zero-Entropy Utility Library
 * - Immutable-First: All utilities return new objects, never mutate input
 * - Pure Functions: No side effects, deterministic output
 * - Type Safety: Strict input validation, clear error messages
 * - Composability: Functions designed to work together seamlessly
 * - Performance: Optimized for modern JavaScript engines
 * 
 * This module replaces the monolithic Lodash with a crystallized,
 * modular utility library that prevents decay and ensures permanence.
 */

/**
 * Array Utilities: Zero-entropy array operations
 */
const ArrayUtils = {
  /**
   * Chunk: Split array into smaller arrays of specified size
   * @param {Array} array - Input array
   * @param {number} size - Chunk size
   * @returns {Array<Array>} Array of chunks
   */
  chunk(array, size = 1) {
    if (!Array.isArray(array)) throw new TypeError('First argument must be an array');
    if (size < 1) throw new RangeError('Chunk size must be at least 1');
    
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  },

  /**
   * Compact: Remove falsy values from array
   * @param {Array} array - Input array
   * @returns {Array} Array without falsy values
   */
  compact(array) {
    if (!Array.isArray(array)) throw new TypeError('Argument must be an array');
    return array.filter(Boolean);
  },

  /**
   * Flatten: Flatten nested arrays to specified depth
   * @param {Array} array - Input array
   * @param {number} depth - Depth to flatten
   * @returns {Array} Flattened array
   */
  flatten(array, depth = Infinity) {
    if (!Array.isArray(array)) throw new TypeError('First argument must be an array');
    if (depth < 0) throw new RangeError('Depth must be non-negative');
    
    return array.flat(depth);
  },

  /**
   * Unique: Remove duplicate values from array
   * @param {Array} array - Input array
   * @returns {Array} Array with unique values
   */
  unique(array) {
    if (!Array.isArray(array)) throw new TypeError('Argument must be an array');
    return [...new Set(array)];
  },

  /**
   * Intersection: Get common elements between arrays
   * @param {...Array} arrays - Arrays to compare
   * @returns {Array} Common elements
   */
  intersection(...arrays) {
    if (arrays.length === 0) return [];
    if (!arrays.every(Array.isArray)) throw new TypeError('All arguments must be arrays');
    
    const [first, ...rest] = arrays;
    const sets = rest.map(arr => new Set(arr));
    return first.filter(item => sets.every(set => set.has(item)));
  },

  /**
   * Difference: Get elements in first array not in others
   * @param {Array} array - Base array
   * @param {...Array} others - Arrays to exclude
   * @returns {Array} Difference
   */
  difference(array, ...others) {
    if (!Array.isArray(array)) throw new TypeError('First argument must be an array');
    if (!others.every(Array.isArray)) throw new TypeError('All other arguments must be arrays');
    
    const excludeSets = others.map(arr => new Set(arr));
    return array.filter(item => !excludeSets.some(set => set.has(item)));
  },
};

/**
 * Object Utilities: Zero-entropy object operations
 */
const ObjectUtils = {
  /**
   * Pick: Create object with only specified keys
   * @param {Object} obj - Source object
   * @param {Array<string>} keys - Keys to pick
   * @returns {Object} New object with picked keys
   */
  pick(obj, keys) {
    if (typeof obj !== 'object' || obj === null) throw new TypeError('First argument must be an object');
    if (!Array.isArray(keys)) throw new TypeError('Second argument must be an array');
    
    const result = {};
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  },

  /**
   * Omit: Create object without specified keys
   * @param {Object} obj - Source object
   * @param {Array<string>} keys - Keys to omit
   * @returns {Object} New object without omitted keys
   */
  omit(obj, keys) {
    if (typeof obj !== 'object' || obj === null) throw new TypeError('First argument must be an object');
    if (!Array.isArray(keys)) throw new TypeError('Second argument must be an array');
    
    const keySet = new Set(keys);
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!keySet.has(key)) {
        result[key] = value;
      }
    }
    return result;
  },

  /**
   * Merge: Deep merge objects (immutable)
   * @param {...Object} objects - Objects to merge
   * @returns {Object} Merged object
   */
  merge(...objects) {
    if (!objects.every(obj => typeof obj === 'object' && obj !== null)) {
      throw new TypeError('All arguments must be objects');
    }

    const result = {};
    for (const obj of objects) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          result[key] = ObjectUtils.merge(result[key] || {}, value);
        } else {
          result[key] = value;
        }
      }
    }
    return result;
  },

  /**
   * Keys: Get object keys (safe version)
   * @param {Object} obj - Source object
   * @returns {Array<string>} Object keys
   */
  keys(obj) {
    if (typeof obj !== 'object' || obj === null) throw new TypeError('Argument must be an object');
    return Object.keys(obj);
  },

  /**
   * Values: Get object values (safe version)
   * @param {Object} obj - Source object
   * @returns {Array} Object values
   */
  values(obj) {
    if (typeof obj !== 'object' || obj === null) throw new TypeError('Argument must be an object');
    return Object.values(obj);
  },

  /**
   * Entries: Get object entries (safe version)
   * @param {Object} obj - Source object
   * @returns {Array<Array>} Object entries
   */
  entries(obj) {
    if (typeof obj !== 'object' || obj === null) throw new TypeError('Argument must be an object');
    return Object.entries(obj);
  },
};

/**
 * String Utilities: Zero-entropy string operations
 */
const StringUtils = {
  /**
   * Capitalize: Capitalize first character
   * @param {string} str - Input string
   * @returns {string} Capitalized string
   */
  capitalize(str) {
    if (typeof str !== 'string') throw new TypeError('Argument must be a string');
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Lowercase: Convert to lowercase
   * @param {string} str - Input string
   * @returns {string} Lowercase string
   */
  lowercase(str) {
    if (typeof str !== 'string') throw new TypeError('Argument must be a string');
    return str.toLowerCase();
  },

  /**
   * Uppercase: Convert to uppercase
   * @param {string} str - Input string
   * @returns {string} Uppercase string
   */
  uppercase(str) {
    if (typeof str !== 'string') throw new TypeError('Argument must be a string');
    return str.toUpperCase();
  },

  /**
   * Trim: Remove leading and trailing whitespace
   * @param {string} str - Input string
   * @returns {string} Trimmed string
   */
  trim(str) {
    if (typeof str !== 'string') throw new TypeError('Argument must be a string');
    return str.trim();
  },

  /**
   * Split: Split string by delimiter
   * @param {string} str - Input string
   * @param {string} delimiter - Delimiter
   * @returns {Array<string>} Split strings
   */
  split(str, delimiter = '') {
    if (typeof str !== 'string') throw new TypeError('First argument must be a string');
    if (typeof delimiter !== 'string') throw new TypeError('Second argument must be a string');
    return str.split(delimiter);
  },

  /**
   * Join: Join array of strings
   * @param {Array<string>} arr - Array of strings
   * @param {string} separator - Separator
   * @returns {string} Joined string
   */
  join(arr, separator = '') {
    if (!Array.isArray(arr)) throw new TypeError('First argument must be an array');
    if (typeof separator !== 'string') throw new TypeError('Second argument must be a string');
    return arr.join(separator);
  },

  /**
   * Replace: Replace all occurrences of substring
   * @param {string} str - Input string
   * @param {string} search - Search string
   * @param {string} replacement - Replacement string
   * @returns {string} Replaced string
   */
  replaceAll(str, search, replacement) {
    if (typeof str !== 'string') throw new TypeError('First argument must be a string');
    if (typeof search !== 'string') throw new TypeError('Second argument must be a string');
    if (typeof replacement !== 'string') throw new TypeError('Third argument must be a string');
    return str.split(search).join(replacement);
  },
};

/**
 * Type Utilities: Zero-entropy type checking
 */
const TypeUtils = {
  /**
   * IsArray: Check if value is array
   * @param {*} value - Value to check
   * @returns {boolean} True if array
   */
  isArray(value) {
    return Array.isArray(value);
  },

  /**
   * IsObject: Check if value is object
   * @param {*} value - Value to check
   * @returns {boolean} True if object
   */
  isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  },

  /**
   * IsString: Check if value is string
   * @param {*} value - Value to check
   * @returns {boolean} True if string
   */
  isString(value) {
    return typeof value === 'string';
  },

  /**
   * IsNumber: Check if value is number
   * @param {*} value - Value to check
   * @returns {boolean} True if number
   */
  isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
  },

  /**
   * IsBoolean: Check if value is boolean
   * @param {*} value - Value to check
   * @returns {boolean} True if boolean
   */
  isBoolean(value) {
    return typeof value === 'boolean';
  },

  /**
   * IsNull: Check if value is null
   * @param {*} value - Value to check
   * @returns {boolean} True if null
   */
  isNull(value) {
    return value === null;
  },

  /**
   * IsUndefined: Check if value is undefined
   * @param {*} value - Value to check
   * @returns {boolean} True if undefined
   */
  isUndefined(value) {
    return value === undefined;
  },

  /**
   * IsEmpty: Check if value is empty
   * @param {*} value - Value to check
   * @returns {boolean} True if empty
   */
  isEmpty(value) {
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length === 0;
    if (typeof value === 'string') return value.length === 0;
    return false;
  },
};

/**
 * Functional Utilities: Zero-entropy functional programming
 */
const FunctionalUtils = {
  /**
   * Compose: Compose functions right-to-left
   * @param {...Function} functions - Functions to compose
   * @returns {Function} Composed function
   */
  compose(...functions) {
    if (!functions.every(f => typeof f === 'function')) {
      throw new TypeError('All arguments must be functions');
    }
    return (value) => functions.reduceRight((acc, fn) => fn(acc), value);
  },

  /**
   * Pipe: Pipe functions left-to-right
   * @param {...Function} functions - Functions to pipe
   * @returns {Function} Piped function
   */
  pipe(...functions) {
    if (!functions.every(f => typeof f === 'function')) {
      throw new TypeError('All arguments must be functions');
    }
    return (value) => functions.reduce((acc, fn) => fn(acc), value);
  },

  /**
   * Memoize: Cache function results
   * @param {Function} fn - Function to memoize
   * @returns {Function} Memoized function
   */
  memoize(fn) {
    if (typeof fn !== 'function') throw new TypeError('Argument must be a function');
    const cache = new Map();
    return (...args) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
  },

  /**
   * Debounce: Delay function execution
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(fn, delay = 0) {
    if (typeof fn !== 'function') throw new TypeError('First argument must be a function');
    if (typeof delay !== 'number' || delay < 0) throw new TypeError('Second argument must be a non-negative number');
    
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  },

  /**
   * Throttle: Limit function execution frequency
   * @param {Function} fn - Function to throttle
   * @param {number} interval - Interval in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(fn, interval = 0) {
    if (typeof fn !== 'function') throw new TypeError('First argument must be a function');
    if (typeof interval !== 'number' || interval < 0) throw new TypeError('Second argument must be a non-negative number');
    
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= interval) {
        lastCall = now;
        fn(...args);
      }
    };
  },
};

/**
 * Export all utilities
 */
module.exports = {
  ArrayUtils,
  ObjectUtils,
  StringUtils,
  TypeUtils,
  FunctionalUtils,
  
  // Convenience exports
  ...ArrayUtils,
  ...ObjectUtils,
  ...StringUtils,
  ...TypeUtils,
  ...FunctionalUtils,
};
