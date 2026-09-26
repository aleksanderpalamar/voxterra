import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Biome } from '../src/world/biomes.js';
import { BlockType } from '../src/world/blockTypes.js';
import { FLORA_GRID, SPECIES_JITTER, plantInCell, plantsInArea } from '../src/world/floraPlanner.js';
import { vegetationFor } from '../src/world/vegetation.js';

function siteOf(biome, groundBlock = BlockType.GRASS, groundY = 10, height = 64) {
  const calls = [];
  return {
    height,
    calls,
    floraSiteAt: (x, z, jitter) => {
      calls.push(jitter);
      return { groundY, groundBlock, biome };
    },
  };
}

function plantsOver(site, cells = 40) {
  const plants = [];
  for (let cellZ = 0; cellZ < cells; cellZ++) {
    for (let cellX = 0; cellX < cells; cellX++) {
      const plant = plantInCell(7, cellX, cellZ, site);
      if (plant !== null) plants.push(plant);
    }
  }
  return plants;
}

test('plantInCell é determinístico e planta no interior da célula', () => {
  const site = siteOf(Biome.FOREST);
  const plants = plantsOver(site);
  assert.ok(plants.length > 0);
  plants.forEach((plant) => {
    assert.deepEqual(plant, plantInCell(7, Math.floor(plant.x / FLORA_GRID.cellSize), Math.floor(plant.z / FLORA_GRID.cellSize), site));
    const offset = plant.x - Math.floor(plant.x / FLORA_GRID.cellSize) * FLORA_GRID.cellSize;
    assert.ok(offset >= FLORA_GRID.margin && offset <= FLORA_GRID.cellSize - 1 - FLORA_GRID.margin);
  });
});

test('as espécies plantadas pertencem ao perfil do bioma', () => {
  [Biome.FOREST, Biome.TAIGA, Biome.SAVANNA, Biome.RAINFOREST].forEach((biome) => {
    const allowed = vegetationFor(biome).species.map((entry) => entry.species);
    plantsOver(siteOf(biome)).forEach((plant) => assert.ok(allowed.includes(plant.species), `${biome}: ${plant.species}`));
  });
});

test('a quantidade de plantas acompanha a densidade do bioma', () => {
  const count = (biome) => plantsOver(siteOf(biome)).length;
  assert.equal(count(Biome.OCEAN), 0);
  assert.ok(count(Biome.RAINFOREST) > count(Biome.FOREST));
  assert.ok(count(Biome.FOREST) > count(Biome.PLAINS) * 5);
});

test('plantas só nascem no chão compatível com a espécie', () => {
  assert.equal(plantsOver(siteOf(Biome.DESERT, BlockType.GRASS)).length, 0);
  const cacti = plantsOver(siteOf(Biome.DESERT, BlockType.SAND));
  assert.ok(cacti.length > 0);
  assert.equal(plantsOver(siteOf(Biome.FOREST, BlockType.SAND)).length, 0);
});

test('plantas que ultrapassariam o teto do mundo não são geradas', () => {
  assert.equal(plantsOver(siteOf(Biome.RAINFOREST, BlockType.GRASS, 60, 64)).length, 0);
});

test('o desvio climático de cada planta fica dentro do limite', () => {
  const site = siteOf(Biome.FOREST);
  plantsOver(site, 20);
  assert.ok(site.calls.length > 0);
  site.calls.forEach((jitter) => {
    assert.ok(Math.abs(jitter.temperature) <= SPECIES_JITTER && Math.abs(jitter.humidity) <= SPECIES_JITTER);
  });
  assert.ok(site.calls.some((jitter) => jitter.temperature !== 0));
});

test('plantsInArea considera todas as células que tocam a área', () => {
  const site = siteOf(Biome.RAINFOREST);
  const area = { minX: -9, minZ: -9, maxX: 14, maxZ: 14 };
  const expected = [];
  const cellOf = (value) => Math.floor(value / FLORA_GRID.cellSize);
  for (let cellZ = cellOf(area.minZ); cellZ <= cellOf(area.maxZ); cellZ++) {
    for (let cellX = cellOf(area.minX); cellX <= cellOf(area.maxX); cellX++) {
      const plant = plantInCell(3, cellX, cellZ, site);
      if (plant !== null) expected.push(plant);
    }
  }
  assert.deepEqual(plantsInArea(3, area, site), expected);
});
