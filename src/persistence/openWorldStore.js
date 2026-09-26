import { IndexedDbWorldStore, LEGACY_DATABASE_NAME, deleteDatabase } from './indexedDbWorldStore.js';
import { MemoryWorldStore } from './memoryWorldStore.js';
import { migrateLegacyWorld } from './worldMigration.js';

export const StorageMode = Object.freeze({
  PERSISTENT: 'persistent',
  MEMORY: 'memory',
});

async function migrateLegacySave(indexedDB, target, onError) {
  try {
    await migrateLegacyWorld({
      target,
      openLegacy: () => IndexedDbWorldStore.openExisting(indexedDB, LEGACY_DATABASE_NAME),
      deleteLegacy: (legacy) => {
        legacy.close();
        return deleteDatabase(indexedDB, LEGACY_DATABASE_NAME);
      },
    });
  } catch (error) {
    onError(error);
  }
}

export async function openWorldStore(indexedDB, onError) {
  if (indexedDB === undefined) return { store: new MemoryWorldStore(), mode: StorageMode.MEMORY };
  try {
    const store = await IndexedDbWorldStore.open(indexedDB);
    await migrateLegacySave(indexedDB, store, onError);
    return { store, mode: StorageMode.PERSISTENT };
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
