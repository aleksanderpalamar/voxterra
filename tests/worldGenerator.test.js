import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BlockType } from '../src/world/blockTypes.js';
import { ChunkedWorld } from '../src/world/chunkedWorld.js';
import { ChunkGenerator } from '../src/world/chunkGenerator.js';
import { WORLD_HEIGHT } from '../src/world/chunkLayout.js';
import { findLandCenter, findSpawnPoint } from '../src/world/worldGenerator.js';
import { SEA_LEVEL } from '../src/world/terrainShape.js';

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

const column = (surfaceY, top = BlockType.GRASS) => ({ surfaceY, surface: { top } });

test('findLandCenter mantém a origem quando ela já é terra firme', () => {
  const center = findLandCenter(() => column(SEA_LEVEL + 5), { x: 0, z: 0 });
  assert.deepEqual(center, { x: 0, z: 0 });
});

test('findLandCenter procura a terra mais próxima quando a origem é oceano', () => {
  const columnAt = (x, z) => (Math.max(Math.abs(x), Math.abs(z)) >= 96 ? column(SEA_LEVEL + 3) : column(SEA_LEVEL - 10, BlockType.SAND));
  const center = findLandCenter(columnAt, { x: 0, z: 0 });
  const distance = Math.max(Math.abs(center.x), Math.abs(center.z));
  assert.ok(distance >= 96 && distance < 96 + 32, JSON.stringify(center));
});

test('findLandCenter ignora praias e cai na origem se não encontrar terra', () => {
  const beachOnly = () => column(SEA_LEVEL + 1, BlockType.SAND);
  assert.deepEqual(findLandCenter(beachOnly, { x: 5, z: -5 }, 64), { x: 5, z: -5 });
});

test('com o gerador real a terra encontrada fica acima do nível do mar', () => {
  [1, 42, 2024].forEach((seed) => {
    const generator = new ChunkGenerator(seed, WORLD_HEIGHT);
    const center = findLandCenter((x, z) => generator.columnAt(x, z), { x: 0, z: 0 });
    const land = generator.columnAt(center.x, center.z);
    assert.ok(land.surfaceY > SEA_LEVEL);
    assert.equal(land.surface.top, BlockType.GRASS);
  });
});
