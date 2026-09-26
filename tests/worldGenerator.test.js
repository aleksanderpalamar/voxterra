import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BlockType } from '../src/world/blockTypes.js';
import { ChunkedWorld } from '../src/world/chunkedWorld.js';
import { ChunkGenerator } from '../src/world/chunkGenerator.js';
import { WORLD_HEIGHT } from '../src/world/chunkLayout.js';
import { findSpawnPoint } from '../src/world/worldGenerator.js';

function generatedWorld(seed) {
  const world = new ChunkedWorld(WORLD_HEIGHT);
  const generator = new ChunkGenerator(seed, WORLD_HEIGHT);
  for (let chunkZ = -1; chunkZ <= 1; chunkZ++) {
    for (let chunkX = -1; chunkX <= 1; chunkX++) world.loadChunk(generator.generate(chunkX, chunkZ));
  }
  return world;
}

test('findSpawnPoint posiciona o jogador sobre chão sólido e fora de blocos', () => {
  [5, 42, 2024].forEach((seed) => {
    const world = generatedWorld(seed);
    const spawn = findSpawnPoint(world, 0, 0);
    const x = Math.floor(spawn.x);
    const z = Math.floor(spawn.z);
    assert.notEqual(world.getBlock(x, spawn.y - 1, z), BlockType.AIR);
    assert.equal(world.getBlock(x, spawn.y, z), BlockType.AIR);
    assert.equal(world.getBlock(x, spawn.y + 1, z), BlockType.AIR);
  });
});

test('findSpawnPoint prefere grama quando existe por perto', () => {
  const world = generatedWorld(42);
  const spawn = findSpawnPoint(world, 0, 0);
  assert.equal(world.getBlock(Math.floor(spawn.x), spawn.y - 1, Math.floor(spawn.z)), BlockType.GRASS);
});

test('findSpawnPoint procura perto do centro informado', () => {
  const spawn = findSpawnPoint(generatedWorld(42), 0, 0);
  assert.ok(Math.abs(spawn.x) <= 13 && Math.abs(spawn.z) <= 13);
});
