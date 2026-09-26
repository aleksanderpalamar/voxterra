import { WorkerPool } from './workerPool.js';
import { InlineExecutor } from './inlineExecutor.js';
import { createChunkJobHandler } from './chunkJobHandler.js';

const MAX_WORKERS = 4;

function workerCount(navigator) {
  return Math.max(1, Math.min(MAX_WORKERS, (navigator.hardwareConcurrency ?? 2) - 1));
}

export function createExecutor(navigator, onError) {
  if (typeof Worker === 'undefined') return new InlineExecutor(createChunkJobHandler());
  try {
    const url = new URL('./chunkWorker.js', import.meta.url);
    return new WorkerPool(() => new Worker(url, { type: 'module' }), workerCount(navigator));
  } catch (error) {
    onError(error);
    return new InlineExecutor(createChunkJobHandler());
  }
}
