export const DATABASE_NAME = 'voxterra';
export const LEGACY_DATABASE_NAME = 'minecraft-web-demo';
const DATABASE_VERSION = 1;
const METADATA_KEY = 'world';
const BLOCKED_MESSAGE = 'O banco de dados está bloqueado por outra aba do jogo';

const ObjectStore = Object.freeze({
  CHUNKS: 'chunks',
  META: 'meta',
});

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error));
  });
}

function openDatabase(indexedDB, name) {
  const request = indexedDB.open(name, DATABASE_VERSION);
  request.addEventListener('upgradeneeded', () => {
    const database = request.result;
    Object.values(ObjectStore)
      .filter((name) => !database.objectStoreNames.contains(name))
      .forEach((name) => database.createObjectStore(name));
  });
  const blocked = new Promise((_resolve, reject) => {
    request.addEventListener('blocked', () => reject(new Error(BLOCKED_MESSAGE)));
  });
  return Promise.race([requestResult(request), blocked]);
}

function openIfExists(indexedDB, name) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name);
    let missing = false;
    request.addEventListener('upgradeneeded', (event) => {
      if (event.oldVersion !== 0) return;
      missing = true;
      request.transaction.abort();
    });
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', (event) => {
      if (!missing) {
        reject(request.error);
        return;
      }
      event.preventDefault();
      resolve(null);
    });
    request.addEventListener('blocked', () => reject(new Error(BLOCKED_MESSAGE)));
  });
}

export function deleteDatabase(indexedDB, name) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.addEventListener('success', () => resolve());
    request.addEventListener('error', () => reject(request.error));
    request.addEventListener('blocked', () => reject(new Error(BLOCKED_MESSAGE)));
  });
}

function chunkStorageKey(chunkX, chunkZ) {
  return `${chunkX},${chunkZ}`;
}

function parseChunkStorageKey(key) {
  const [chunkX, chunkZ] = key.split(',').map(Number);
  return { chunkX, chunkZ };
}

export class IndexedDbWorldStore {
  static async open(indexedDB, name = DATABASE_NAME) {
    return IndexedDbWorldStore.fromDatabase(await openDatabase(indexedDB, name));
  }

  static async openExisting(indexedDB, name) {
    const database = await openIfExists(indexedDB, name);
    if (database === null) return null;
    return IndexedDbWorldStore.fromDatabase(database);
  }

  static async fromDatabase(database) {
    const chunks = database.transaction(ObjectStore.CHUNKS).objectStore(ObjectStore.CHUNKS);
    return new IndexedDbWorldStore(database, new Set(await requestResult(chunks.getAllKeys())));
  }

  constructor(database, chunkKeys) {
    this.database = database;
    this.chunkKeys = chunkKeys;
  }

  hasChunk(chunkX, chunkZ) {
    return this.chunkKeys.has(chunkStorageKey(chunkX, chunkZ));
  }

  chunkCoordinates() {
    return [...this.chunkKeys].map(parseChunkStorageKey);
  }

  close() {
    this.database.close();
  }

  async loadChunk(chunkX, chunkZ) {
    const blocks = await this.read(ObjectStore.CHUNKS, chunkStorageKey(chunkX, chunkZ));
    return blocks instanceof Uint8Array ? blocks : null;
  }

  saveChunk(chunkX, chunkZ, blocks) {
    const key = chunkStorageKey(chunkX, chunkZ);
    this.chunkKeys.add(key);
    return this.write([ObjectStore.CHUNKS], (transaction) => transaction.objectStore(ObjectStore.CHUNKS).put(blocks, key));
  }

  loadMetadata() {
    return this.read(ObjectStore.META, METADATA_KEY);
  }

  saveMetadata(metadata) {
    return this.write([ObjectStore.META], (transaction) => transaction.objectStore(ObjectStore.META).put(metadata, METADATA_KEY));
  }

  clear() {
    this.chunkKeys.clear();
    const stores = Object.values(ObjectStore);
    return this.write(stores, (transaction) => stores.forEach((name) => transaction.objectStore(name).clear()));
  }

  async read(storeName, key) {
    const value = await requestResult(this.database.transaction(storeName).objectStore(storeName).get(key));
    return value ?? null;
  }

  write(storeNames, operation) {
    return new Promise((resolve, reject) => {
      const transaction = this.database.transaction(storeNames, 'readwrite');
      transaction.addEventListener('complete', () => resolve());
      transaction.addEventListener('error', () => reject(transaction.error));
      transaction.addEventListener('abort', () => reject(transaction.error));
      operation(transaction);
    });
  }
}
