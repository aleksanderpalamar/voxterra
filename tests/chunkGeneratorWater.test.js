import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChunkGenerator } from '../src/world/chunkGenerator.js';
import { ChunkedWorld } from '../src/world/chunkedWorld.js';
import { BlockType } from '../src/world/blockTypes.js';
import { WORLD_HEIGHT } from '../src/world/chunkLayout.js';
import { plantsInArea } from '../src/world/floraPlanner.js';
import { SEA_LEVEL } from '../src/world/terrainShape.js';

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

test('colunas abaixo do nível do mar ficam cobertas de água até o nível do mar', () => {
  const generator = new ChunkGenerator(42);
  const world = loadChunks(generator, grid(-4, 4));
  let underwater = 0;
  for (let z = -64; z < 80; z += 3) {
    for (let x = -64; x < 80; x += 3) {
      const { surfaceY } = generator.columnAt(x, z);
      if (surfaceY >= SEA_LEVEL) {
        assert.notEqual(world.getBlock(x, SEA_LEVEL + 1, z), BlockType.WATER);
        continue;
      }
      underwater += 1;
      const liquid = surfaceY + 1 === SEA_LEVEL ? [BlockType.WATER, BlockType.ICE] : [BlockType.WATER];
      assert.ok(liquid.includes(world.getBlock(x, surfaceY + 1, z)));
      assert.ok([BlockType.WATER, BlockType.ICE].includes(world.getBlock(x, SEA_LEVEL, z)));
      assert.equal(world.getBlock(x, SEA_LEVEL + 1, z), BlockType.AIR);
    }
  }
  assert.ok(underwater > 0, 'a região testada não tem água');
});

test('nenhuma planta nasce dentro da água', () => {
  const generator = new ChunkGenerator(42);
  const plants = plantsInArea(generator.seed, { minX: -400, minZ: -400, maxX: 400, maxZ: 400 }, generator);
  assert.ok(plants.length > 0);
  plants.forEach((plant) => assert.ok(plant.groundY >= SEA_LEVEL));
});

test('toda praia gerada tem água a poucos blocos', () => {
  const generator = new ChunkGenerator(7);
  let beaches = 0;
  for (let z = -600; z < 600; z += 9) {
    for (let x = -600; x < 600; x += 9) {
      if (generator.columnAt(x, z).biome !== 'beach') continue;
      beaches += 1;
      let nearest = Infinity;
      for (let dz = -4; dz <= 4; dz++) {
        for (let dx = -4; dx <= 4; dx++) {
          if (generator.surfaceHeightAt(x + dx, z + dz) < SEA_LEVEL) nearest = Math.min(nearest, Math.hypot(dx, dz));
        }
      }
      assert.ok(nearest <= 4.5, `praia sem água em ${x},${z}`);
    }
  }
  assert.ok(beaches > 0);
});

function scanLakes(seed, visit) {
  const generator = new ChunkGenerator(seed);
  for (let z = -1500; z < 1500; z += 7) {
    for (let x = -1500; x < 1500; x += 7) {
      const column = generator.columnAt(x, z);
      if (column.surfaceY >= SEA_LEVEL || column.biome === 'ocean' || column.biome === 'beach') continue;
      visit(column, x, z, generator);
    }
  }
}

test('lagos no interior têm fundo de terra e pedra, sem areia fora do deserto', () => {
  const beds = new Set();
  scanLakes(11, (column) => {
    if (column.biome === 'desert') return;
    beds.add(column.surface.top);
  });
  assert.deepEqual([...beds].sort(), [BlockType.DIRT, BlockType.STONE].sort());
});

test('lagos na tundra ficam congelados na superfície', () => {
  let frozen = 0;
  scanLakes(11, (column) => {
    if (column.biome !== 'tundra') return;
    assert.equal(column.waterSurface, BlockType.ICE);
    frozen += 1;
  });
  assert.ok(frozen > 0, 'nenhum lago de tundra encontrado na região');
});
