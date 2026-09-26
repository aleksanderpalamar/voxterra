import { test } from 'node:test';
import assert from 'node:assert/strict';
import { byDistanceFrom, chunksOutsideRadius, chunksWithinRadius } from '../src/world/chunkStreaming.js';

const distance = (chunk, centerX, centerZ) => Math.hypot(chunk.chunkX - centerX, chunk.chunkZ - centerZ);

test('chunksWithinRadius retorna um disco de chunks em volta do centro', () => {
  assert.equal(chunksWithinRadius(3, -2, 0).length, 1);
  assert.equal(chunksWithinRadius(3, -2, 1).length, 5);
  assert.equal(chunksWithinRadius(3, -2, 2).length, 13);
  chunksWithinRadius(3, -2, 4).forEach((chunk) => assert.ok(distance(chunk, 3, -2) <= 4));
});

test('chunksWithinRadius ordena do mais próximo para o mais distante', () => {
  const distances = chunksWithinRadius(0, 0, 5).map((chunk) => distance(chunk, 0, 0));
  assert.deepEqual(distances, [...distances].sort((a, b) => a - b));
  assert.equal(distances[0], 0);
});

test('chunksOutsideRadius seleciona apenas os chunks além do raio', () => {
  const chunks = [{ chunkX: 0, chunkZ: 0 }, { chunkX: 3, chunkZ: 0 }, { chunkX: 2, chunkZ: 2 }, { chunkX: -5, chunkZ: 1 }];
  assert.deepEqual(chunksOutsideRadius(chunks, 0, 0, 3), [{ chunkX: -5, chunkZ: 1 }]);
});

test('byDistanceFrom ordena chunks pela distância a um centro', () => {
  const chunks = [{ chunkX: 5, chunkZ: 5 }, { chunkX: 1, chunkZ: 0 }, { chunkX: 3, chunkZ: 0 }];
  assert.deepEqual(chunks.sort(byDistanceFrom(0, 0)).map((chunk) => chunk.chunkX), [1, 3, 5]);
});
