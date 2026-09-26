import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryChunkStore } from '../src/world/memoryChunkStore.js';

test('store devolve os blocos salvos para o mesmo chunk', () => {
  const store = new MemoryChunkStore();
  const blocks = new Uint8Array([1, 2, 3]);
  store.save(-2, 7, blocks);
  assert.equal(store.load(-2, 7), blocks);
});

test('store retorna null para chunks nunca salvos', () => {
  assert.equal(new MemoryChunkStore().load(0, 0), null);
});
