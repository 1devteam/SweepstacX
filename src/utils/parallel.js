import { Worker } from 'node:worker_threads';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Process files in parallel using worker threads
 * @param {Array} files - Array of file paths to process
 * @param {Function} processFn - Function to process each file
 * @param {Object} options - Options for parallel processing
 * @returns {Promise<Array>} - Results from processing
 */
export async function processInParallel(files, processFn, options = {}) {
  const {
    maxWorkers = Math.max(1, cpus().length - 1),
    chunkSize = Math.ceil(files.length / maxWorkers),
  } = options;
  
  // If files are few, process sequentially
  if (files.length < maxWorkers * 2) {
    const results = [];
    for (const file of files) {
      results.push(await processFn(file));
    }
    return results;
  }
  
  // Split files into chunks
  const chunks = [];
  for (let i = 0; i < files.length; i += chunkSize) {
    chunks.push(files.slice(i, i + chunkSize));
  }
  
  // Process chunks in parallel
  const workerPromises = chunks.map((chunk, index) => {
    return processChunk(chunk, processFn, index);
  });
  
  const chunkResults = await Promise.all(workerPromises);
  return chunkResults.flat();
}

/**
 * Process a chunk of files (placeholder for worker implementation)
 */
async function processChunk(files, processFn, workerId) {
  // For now, process sequentially within chunk
  // In future, this can be moved to actual worker threads
  const results = [];
  for (const file of files) {
    try {
      const result = await processFn(file);
      results.push(result);
    } catch (error) {
      results.push({ file, error: error.message });
    }
  }
  return results;
}

/**
 * Batch process items with concurrency limit
 * @param {Array} items - Items to process
 * @param {Function} processFn - Async function to process each item
 * @param {number} concurrency - Max concurrent operations
 * @returns {Promise<Array>} - Results
 */
export async function batchProcess(items, processFn, concurrency = 5) {
  const results = [];
  const executing = [];
  
  for (const item of items) {
    const promise = Promise.resolve().then(() => processFn(item));
    results.push(promise);
    
    if (concurrency <= items.length) {
      const e = promise.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      
      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
  }
  
  return Promise.all(results);
}

/**
 * Process items in batches sequentially
 * @param {Array} items - Items to process
 * @param {Function} processFn - Function to process batch
 * @param {number} batchSize - Size of each batch
 * @returns {Promise<Array>} - Results
 */
export async function processBatches(items, processFn, batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processFn(batch);
    results.push(...batchResults);
  }
  
  return results;
}
