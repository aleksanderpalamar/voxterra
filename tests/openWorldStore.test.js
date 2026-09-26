import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StorageMode, loadSavedWorld, openWorldStore } from '../src/persistence/openWorldStore.js';
import { MemoryWorldStore } from '../src/persistence/memoryWorldStore.js';
import { parseWorldMetadata } from '../src/persistence/worldMetadata.js';

test('sem IndexedDB o jogo usa armazenamento em memória', async () => {
  const { store, mode } = await openWorldStore(undefined, () => assert.fail('não é erro'));
  assert.ok(store instanceof MemoryWorldStore);
  assert.equal(mode, StorageMode.MEMORY);
});

test('falha ao abrir o IndexedDB é reportada e cai para memória', async () => {
  const errors = [];
  const brokenIndexedDB = { open: () => { throw new Error('acesso negado'); } };
  const { mode } = await openWorldStore(brokenIndexedDB, (error) => errors.push(error));
  assert.equal(mode, StorageMode.MEMORY);
  assert.equal(errors.length, 1);
});

test('loadSavedWorld devolve null e reporta quando a leitura falha', async () => {
  const errors = [];
  const store = { loadMetadata: async () => { throw new Error('ilegível'); } };
  assert.equal(await loadSavedWorld(store, parseWorldMetadata, (error) => errors.push(error)), null);
  assert.equal(errors.length, 1);
});

test('loadSavedWorld valida os metadados salvos', async () => {
  const store = new MemoryWorldStore();
  await store.saveMetadata({ version: 999 });
  assert.equal(await loadSavedWorld(store, parseWorldMetadata, () => {}), null);
});
