import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHUNK_SIZE,
  chunkBlockIndex,
  chunkCoordinate,
  chunkKey,
  chunkVolume,
} from '../src/world/chunkLayout.js';

test('chunkCoordinate converte blocos em chunks inclusive para negativos', () => {
  assert.equal(chunkCoordinate(0), 0);
  assert.equal(chunkCoordinate(CHUNK_SIZE - 1), 0);
  assert.equal(chunkCoordinate(CHUNK_SIZE), 1);
  assert.equal(chunkCoordinate(-1), -1);
  assert.equal(chunkCoordinate(-CHUNK_SIZE), -1);
  assert.equal(chunkCoordinate(-CHUNK_SIZE - 1), -2);
});

test('chunkKey é único para chunks vizinhos e negativos', () => {
  const keys = new Set();
  for (let chunkZ = -3; chunkZ <= 3; chunkZ++) {
    for (let chunkX = -3; chunkX <= 3; chunkX++) keys.add(chunkKey(chunkX, chunkZ));
  }
  assert.equal(keys.size, 49);
  assert.ok([...keys].every(Number.isSafeInteger));
});

test('chunkBlockIndex cobre todo o volume sem colisões', () => {
  const height = 4;
  const indices = new Set();
  for (let y = 0; y < height; y++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) indices.add(chunkBlockIndex(x, y, z));
    }
  }
  assert.equal(indices.size, chunkVolume(height));
  assert.equal(Math.max(...indices), chunkVolume(height) - 1);
});
