import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BlockType } from '../src/world/blockTypes.js';
import { Biome } from '../src/world/biomes.js';
import { SNOW_LINE, surfaceLayers } from '../src/world/surfaceRules.js';
import { SEA_LEVEL } from '../src/world/terrainShape.js';

const temperate = { temperature: 0.1, humidity: 0 };

test('biomas de grama têm grama sobre terra', () => {
  [Biome.PLAINS, Biome.FOREST, Biome.TAIGA, Biome.SAVANNA, Biome.RAINFOREST].forEach((biome) => {
    const layers = surfaceLayers(biome, temperate, 30);
    assert.equal(layers.top, BlockType.GRASS);
    assert.equal(layers.filler, BlockType.DIRT);
  });
});

test('deserto é coberto de areia e tundra de neve', () => {
  assert.equal(surfaceLayers(Biome.DESERT, temperate, 30).top, BlockType.SAND);
  assert.equal(surfaceLayers(Biome.DESERT, temperate, 30).filler, BlockType.SAND);
  assert.equal(surfaceLayers(Biome.TUNDRA, temperate, 30).top, BlockType.SNOW);
});

test('montanhas são rochosas e ganham neve quando frias ou muito altas', () => {
  assert.equal(surfaceLayers(Biome.MOUNTAINS, { temperature: 0.6, humidity: 0 }, 40).top, BlockType.STONE);
  assert.equal(surfaceLayers(Biome.MOUNTAINS, { temperature: -0.4, humidity: 0 }, 40).top, BlockType.SNOW);
  assert.equal(surfaceLayers(Biome.MOUNTAINS, { temperature: 0.6, humidity: 0 }, SNOW_LINE).top, BlockType.SNOW);
  assert.equal(surfaceLayers(Biome.MOUNTAINS, { temperature: 0.6, humidity: 0 }, 40).filler, BlockType.STONE);
});

test('oceanos e praias são de areia', () => {
  assert.equal(surfaceLayers(Biome.OCEAN, temperate, SEA_LEVEL - 8).top, BlockType.SAND);
  assert.equal(surfaceLayers(Biome.BEACH, temperate, SEA_LEVEL + 1).top, BlockType.SAND);
});

test('o fundo de lagos é de areia mesmo em biomas de grama', () => {
  const lakebed = surfaceLayers(Biome.FOREST, temperate, SEA_LEVEL - 3);
  assert.equal(lakebed.top, BlockType.SAND);
  assert.equal(surfaceLayers(Biome.FOREST, temperate, SEA_LEVEL).top, BlockType.GRASS);
});
