import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BlockType } from '../src/world/blockTypes.js';
import { ChunkedWorld } from '../src/world/chunkedWorld.js';
import { ChunkGenerator } from '../src/world/chunkGenerator.js';
import { CHUNK_SIZE, WORLD_HEIGHT } from '../src/world/chunkLayout.js';
import { findSpawnPoint, generateRegion } from '../src/world/worldGenerator.js';

const REGION = Object.freeze({ minChunkX: -1, maxChunkX: 1, minChunkZ: 0, maxChunkZ: 2 });

test('generateRegion carrega todos os chunks da região', () => {
  const world = new ChunkedWorld(WORLD_HEIGHT);
  generateRegion(world, new ChunkGenerator(5), REGION);
  for (let chunkZ = 0; chunkZ <= 2; chunkZ++) {
    for (let chunkX = -1; chunkX <= 1; chunkX++) assert.notEqual(world.getChunk(chunkX, chunkZ), null);
  }
  assert.equal(world.getChunk(2, 0), null);
});

test('findSpawnPoint posiciona o jogador sobre grama e fora de blocos', () => {
  const world = new ChunkedWorld(WORLD_HEIGHT);
  generateRegion(world, new ChunkGenerator(5), REGION);
  const spawn = findSpawnPoint(world, 0, CHUNK_SIZE * 1.5);
  const x = Math.floor(spawn.x);
  const z = Math.floor(spawn.z);
  assert.equal(world.getBlock(x, spawn.y - 1, z), BlockType.GRASS);
  assert.equal(world.getBlock(x, spawn.y, z), BlockType.AIR);
  assert.equal(world.getBlock(x, spawn.y + 1, z), BlockType.AIR);
});
