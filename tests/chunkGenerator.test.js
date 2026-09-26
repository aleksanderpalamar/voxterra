import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChunkGenerator } from '../src/world/chunkGenerator.js';
import { ChunkedWorld } from '../src/world/chunkedWorld.js';
import { BlockType } from '../src/world/blockTypes.js';
import { CHUNK_SIZE, WORLD_HEIGHT } from '../src/world/chunkLayout.js';
import { TREE_SETTINGS, treesInArea } from '../src/world/treeGenerator.js';

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

test('árvores que cruzam a borda entre chunks ficam contínuas', () => {
  const generator = new ChunkGenerator(2024);
  const world = loadChunks(generator, grid(-2, 2));
  const area = { minX: -CHUNK_SIZE, minZ: -CHUNK_SIZE, maxX: CHUNK_SIZE * 2 - 1, maxZ: CHUNK_SIZE * 2 - 1 };
  const trees = treesInArea(generator.seed, area, generator);
  const crossing = trees.filter((tree) => [0, CHUNK_SIZE].some((border) => Math.abs(tree.x - border) <= 2));
  assert.ok(crossing.length > 0, 'nenhuma árvore cruzando a borda para testar');
  crossing.forEach((tree) => {
    const topY = tree.groundY + tree.trunkHeight;
    for (let y = tree.groundY + 1; y <= topY; y++) assert.equal(world.getBlock(tree.x, y, tree.z), BlockType.WOOD);
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        assert.notEqual(world.getBlock(tree.x + dx, topY - 1, tree.z + dz), BlockType.AIR);
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
  [BlockType.GRASS, BlockType.DIRT, BlockType.STONE, BlockType.WOOD, BlockType.LEAVES].forEach((type) => {
    assert.ok(found.has(type), `bloco ${type} ausente`);
  });
});

test('árvores respeitam o espaçamento das células', () => {
  const generator = new ChunkGenerator(5);
  const area = { minX: -40, minZ: -40, maxX: 40, maxZ: 40 };
  treesInArea(generator.seed, area, generator).forEach((tree) => {
    const offsetX = tree.x - Math.floor(tree.x / TREE_SETTINGS.cellSize) * TREE_SETTINGS.cellSize;
    assert.ok(offsetX >= TREE_SETTINGS.margin && offsetX <= TREE_SETTINGS.cellSize - 1 - TREE_SETTINGS.margin);
  });
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
      if (top === BlockType.WOOD || top === BlockType.DIRT) continue;
      assert.equal(top, column.surface.top, `coluna ${x},${z} (${column.biome})`);
      checked += 1;
    }
  }
  assert.ok(checked > 400);
});

test('árvores só nascem onde o terreno permite plantar', () => {
  const generator = new ChunkGenerator(31);
  const area = { minX: -200, minZ: -200, maxX: 200, maxZ: 200 };
  const trees = treesInArea(generator.seed, area, generator);
  assert.ok(trees.length > 0);
  trees.forEach((tree) => assert.equal(generator.columnAt(tree.x, tree.z).surface.top, BlockType.GRASS));
});
