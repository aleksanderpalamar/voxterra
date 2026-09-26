import { createChunkJobHandler } from './chunkJobHandler.js';

const handle = createChunkJobHandler();

self.addEventListener('message', (event) => {
  const { id, request } = event.data;
  try {
    const { result, transfer } = handle(request);
    self.postMessage({ id, result }, transfer);
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
});
