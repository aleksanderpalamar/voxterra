import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryWorldStore } from '../src/persistence/memoryWorldStore.js';

test('store devolve uma cópia dos blocos salvos', async () => {
  const store = new MemoryWorldStore();
  const blocks = new Uint8Array([1, 2, 3]);
  await store.saveChunk(-2, 7, blocks);
  blocks[0] = 9;
  assert.equal(store.hasChunk(-2, 7), true);
  assert.deepEqual(await store.loadChunk(-2, 7), new Uint8Array([1, 2, 3]));
});

test('store retorna null para chunks nunca salvos', async () => {
  const store = new MemoryWorldStore();
  assert.equal(store.hasChunk(0, 0), false);
  assert.equal(await store.loadChunk(0, 0), null);
});

test('metadados são guardados e devolvidos', async () => {
  const store = new MemoryWorldStore();
  assert.equal(await store.loadMetadata(), null);
  await store.saveMetadata({ seed: 5 });
  assert.deepEqual(await store.loadMetadata(), { seed: 5 });
});

test('clear apaga chunks e metadados', async () => {
  const store = new MemoryWorldStore();
  await store.saveChunk(0, 0, new Uint8Array(1));
  await store.saveMetadata({ seed: 5 });
  await store.clear();
  assert.equal(store.hasChunk(0, 0), false);
  assert.equal(await store.loadMetadata(), null);
});

test('chunkCoordinates lista as coordenadas dos chunks salvos', async () => {
  const store = new MemoryWorldStore();
  await store.saveChunk(-3, 5, new Uint8Array(1));
  await store.saveChunk(2, 0, new Uint8Array(1));
  const coordinates = store.chunkCoordinates().map(({ chunkX, chunkZ }) => [chunkX, chunkZ]).sort();
  assert.deepEqual(coordinates, [[-3, 5], [2, 0]]);
});
