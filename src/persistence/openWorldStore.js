import { IndexedDbWorldStore } from './indexedDbWorldStore.js';
import { MemoryWorldStore } from './memoryWorldStore.js';

export const StorageMode = Object.freeze({
  PERSISTENT: 'persistent',
  MEMORY: 'memory',
});

export async function openWorldStore(indexedDB, onError) {
  if (indexedDB === undefined) return { store: new MemoryWorldStore(), mode: StorageMode.MEMORY };
  try {
    return { store: await IndexedDbWorldStore.open(indexedDB), mode: StorageMode.PERSISTENT };
  } catch (error) {
    onError(error);
    return { store: new MemoryWorldStore(), mode: StorageMode.MEMORY };
  }
}

export async function loadSavedWorld(store, parse, onError) {
  try {
    return parse(await store.loadMetadata());
  } catch (error) {
    onError(error);
    return null;
  }
}
