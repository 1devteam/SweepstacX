/**
 * Parallel processing utility using worker threads
 * Distributes file processing across multiple CPU cores
 */

import { Worker } from 'node:worker_threads';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import pc from 'picocolors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WORKER_PATH = resolve(__dirname, '../workers/scan-worker.js');

/**
 * Process files in parallel using worker threads
 * @param {Array} files - Array of file paths to process
 * @param {Object} options - Options for parallel processing
 * @returns {Promise<Array>} - Results from processing
 */
export async function processFilesInParallel(files, options = {}) {
  const {
    maxWorkers = Math.max(1, cpus().length - 1),
    onProgress = null,
  } = options;
  
  // If files are few, don't use workers
  if (files.length < 10) {
    return processSequentially(files, onProgress);
  }
  
  const workerCount = Math.min(maxWorkers, files.length);
  const workers = [];
  const results = [];
  let processedCount = 0;
  
  // Create worker pool
  for (let i = 0; i < workerCount; i++) {
    workers.push(createWorker());
  }
  
  // Wait for all workers to be ready
  await Promise.all(workers.map(w => w.ready));
  
  // Distribute files to workers
  const fileQueue = [...files];
  const workerPromises = workers.map(async (worker) => {
    const workerResults = [];
    
    while (fileQueue.length > 0) {
      const file = fileQueue.shift();
      if (!file) break;
      
      const result = await processFileWithWorker(worker, file);
      workerResults.push(result);
      processedCount++;
      
      if (onProgress) {
        onProgress(processedCount, files.length);
      }
    }
    
    return workerResults;
  });
  
  // Wait for all workers to complete
  const allResults = await Promise.all(workerPromises);
  
  // Terminate workers
  workers.forEach(w => w.worker.terminate());
  
  // Flatten results
  return allResults.flat();
}

/**
 * Create a worker instance
 */
function createWorker() {
  const worker = new Worker(WORKER_PATH);
  
  return {
    worker,
    ready: new Promise((resolve) => {
      worker.once('message', (msg) => {
        if (msg.type === 'ready') {
          resolve();
        }
      });
    }),
  };
}

/**
 * Process a file using a worker
 */
function processFileWithWorker(workerObj, filePath) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Worker timeout processing ${filePath}`));
    }, 30000); // 30 second timeout
    
    workerObj.worker.once('message', (msg) => {
      clearTimeout(timeout);
      if (msg.type === 'result') {
        resolve(msg.result);
      }
    });
    
    workerObj.worker.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    
    workerObj.worker.postMessage({
      type: 'process',
      filePath,
    });
  });
}

/**
 * Process files sequentially (fallback)
 */
async function processSequentially(files, onProgress) {
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    // This would need to import and call the actual processing logic
    // For now, return placeholder
    results.push({
      file: files[i],
      issues: [],
      success: true,
    });
    
    if (onProgress) {
      onProgress(i + 1, files.length);
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

/**
 * Get optimal worker count based on CPU cores and file count
 */
export function getOptimalWorkerCount(fileCount) {
  const cpuCount = cpus().length;
  const maxWorkers = Math.max(1, cpuCount - 1); // Leave one core free
  
  if (fileCount < 10) return 1; // Too few files for parallelization
  if (fileCount < 50) return Math.min(2, maxWorkers);
  if (fileCount < 200) return Math.min(4, maxWorkers);
  
  return maxWorkers;
}
