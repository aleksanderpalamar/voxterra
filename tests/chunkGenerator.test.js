import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChunkGenerator } from '../src/world/chunkGenerator.js';
import { ChunkedWorld } from '../src/world/chunkedWorld.js';
import { Chunk } from '../src/world/chunk.js';
import { BlockType, isLogBlock } from '../src/world/blockTypes.js';
import { CHUNK_SIZE, WORLD_HEIGHT } from '../src/world/chunkLayout.js';
import { plantsInArea } from '../src/world/floraPlanner.js';
import { placePlant } from '../src/world/treeShapes.js';
import { MAX_CROWN_REACH, SPECIES_TRAITS, Species } from '../src/world/vegetation.js';

function loadChunks(generator, coordinates) {
  const world = new ChunkedWorld(WORLD_HEIGHT);
  coordinates.forEach(([chunkX, chunkZ]) => world.loadChunk(generator.generate(chunkX, chunkZ)));
  return world;
}

function grid(min, max) {
  const coordinates = [];
  for (let chunkZ = min; chunkZ <= max; chunkZ++) {
    for (let chunkX = min; chunkX <= max; chunkX++) coordinates.push([chunkX, chunkZ]);
  }
  return coordinates;
}

test('generate é determinístico para a mesma seed e posição', () => {
  const a = new ChunkGenerator(77).generate(3, -2);
  const b = new ChunkGenerator(77).generate(3, -2);
  assert.deepEqual(a.blocks, b.blocks);
});

test('seeds diferentes geram chunks diferentes', () => {
  const a = new ChunkGenerator(1).generate(0, 0);
  const b = new ChunkGenerator(2).generate(0, 0);
  assert.notDeepEqual(a.blocks, b.blocks);
});

test('cada chunk independe da ordem em que os vizinhos são gerados', () => {
  const coordinates = grid(-1, 1);
  const forward = loadChunks(new ChunkGenerator(9), coordinates);
  const backward = loadChunks(new ChunkGenerator(9), [...coordinates].reverse());
  coordinates.forEach(([chunkX, chunkZ]) => {
    assert.deepEqual(forward.getChunk(chunkX, chunkZ).blocks, backward.getChunk(chunkX, chunkZ).blocks);
  });
});

test('colunas seguem a altura da superfície calculada pelo gerador', () => {
  const generator = new ChunkGenerator(4);
  const world = loadChunks(generator, [[0, 0]]);
  for (let z = 0; z < CHUNK_SIZE; z += 5) {
    for (let x = 0; x < CHUNK_SIZE; x += 5) {
      const surfaceY = generator.surfaceHeightAt(x, z);
      assert.notEqual(world.getBlock(x, surfaceY, z), BlockType.AIR);
      assert.equal(world.getBlock(x, 0, z), BlockType.STONE);
    }
  }
});

test('plantas que cruzam a borda entre chunks ficam contínuas', () => {
  const generator = new ChunkGenerator(2024);
  const world = loadChunks(generator, grid(-3, 3));
  const area = { minX: -CHUNK_SIZE, minZ: -CHUNK_SIZE, maxX: CHUNK_SIZE * 2 - 1, maxZ: CHUNK_SIZE * 2 - 1 };
  const crossing = plantsInArea(generator.seed, area, generator)
    .filter((plant) => [0, CHUNK_SIZE].some((border) => Math.abs(plant.x - border) <= MAX_CROWN_REACH));
  assert.ok(crossing.length > 0, 'nenhuma planta cruzando a borda para testar');
  crossing.forEach((plant) => {
    const alone = new ChunkedWorld(WORLD_HEIGHT);
    grid(-3, 3).forEach(([chunkX, chunkZ]) => alone.loadChunk(new Chunk(chunkX, chunkZ, WORLD_HEIGHT)));
    placePlant(alone, plant);
    const { stem } = SPECIES_TRAITS[plant.species];
    for (let y = plant.groundY + 1; y <= plant.groundY + plant.height; y++) {
      for (let dz = -MAX_CROWN_REACH; dz <= MAX_CROWN_REACH; dz++) {
        for (let dx = -MAX_CROWN_REACH; dx <= MAX_CROWN_REACH; dx++) {
          if (alone.getBlock(plant.x + dx, y, plant.z + dz) !== stem) continue;
          assert.equal(world.getBlock(plant.x + dx, y, plant.z + dz), stem, `${plant.species} em ${plant.x},${plant.z}`);
        }
      }
    }
  });
});

test('uma região gerada contém todos os tipos de bloco do terreno', () => {
  const world = loadChunks(new ChunkGenerator(2024), grid(0, 3));
  const found = new Set();
  for (let chunkZ = 0; chunkZ <= 3; chunkZ++) {
    for (let chunkX = 0; chunkX <= 3; chunkX++) world.getChunk(chunkX, chunkZ).blocks.forEach((type) => found.add(type));
  }
  [BlockType.GRASS, BlockType.DIRT, BlockType.STONE, BlockType.LEAVES].forEach((type) => {
    assert.ok(found.has(type), `bloco ${type} ausente`);
  });
  assert.ok([...found].some(isLogBlock), 'nenhum tronco gerado');
});

test('columnAt descreve altura, clima, bioma e camadas de superfície', () => {
  const generator = new ChunkGenerator(12);
  const column = generator.columnAt(40, -25);
  assert.equal(column.surfaceY, generator.surfaceHeightAt(40, -25));
  assert.ok(column.climate.temperature >= -1 && column.climate.temperature <= 1);
  assert.equal(typeof column.biome, 'string');
  assert.equal(typeof column.surface.top, 'number');
});

test('o bloco do topo de cada coluna gerada segue o bioma', () => {
  const generator = new ChunkGenerator(31);
  const world = loadChunks(generator, grid(-3, 3));
  let checked = 0;
  for (let z = -48; z < 64; z += 5) {
    for (let x = -48; x < 64; x += 5) {
      const column = generator.columnAt(x, z);
      const top = world.getBlock(x, column.surfaceY, z);
      if (isLogBlock(top) || top === BlockType.DIRT) continue;
      assert.equal(top, column.surface.top, `coluna ${x},${z} (${column.biome})`);
      checked += 1;
    }
  }
  assert.ok(checked > 400);
});

test('plantas só nascem em terra firme e no chão adequado', () => {
  const generator = new ChunkGenerator(31);
  const plants = plantsInArea(generator.seed, { minX: -300, minZ: -300, maxX: 300, maxZ: 300 }, generator);
  assert.ok(plants.length > 0);
  plants.forEach((plant) => {
    const column = generator.columnAt(plant.x, plant.z);
    assert.equal(column.surfaceY, plant.groundY);
    const ground = column.surface.top;
    assert.ok(plant.species === Species.CACTUS ? ground === BlockType.SAND : ground !== BlockType.SAND, plant.species);
  });
});
