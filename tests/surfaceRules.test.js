import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BlockType } from '../src/world/blockTypes.js';
import { Biome } from '../src/world/biomes.js';
import { SNOW_LINE, surfaceLayers, waterSurfaceBlock } from '../src/world/surfaceRules.js';
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

test('o fundo de lagos no interior mistura terra e pedra conforme a variação', () => {
  [Biome.FOREST, Biome.PLAINS, Biome.TAIGA, Biome.TUNDRA, Biome.SAVANNA].forEach((biome) => {
    assert.equal(surfaceLayers(biome, temperate, SEA_LEVEL - 3, -0.5).top, BlockType.DIRT);
    assert.equal(surfaceLayers(biome, temperate, SEA_LEVEL - 3, 0.8).top, BlockType.STONE);
  });
  assert.equal(surfaceLayers(Biome.FOREST, temperate, SEA_LEVEL, 0.8).top, BlockType.GRASS);
});

test('oceanos continuam de areia e lagos no deserto viram oásis de areia', () => {
  assert.equal(surfaceLayers(Biome.OCEAN, temperate, SEA_LEVEL - 8, 0.8).top, BlockType.SAND);
  assert.equal(surfaceLayers(Biome.DESERT, temperate, SEA_LEVEL - 2, 0.8).top, BlockType.SAND);
});

test('a água congela na superfície apenas na tundra', () => {
  assert.equal(waterSurfaceBlock(Biome.TUNDRA), BlockType.ICE);
  [Biome.FOREST, Biome.TAIGA, Biome.OCEAN, Biome.DESERT].forEach((biome) => {
    assert.equal(waterSurfaceBlock(biome), BlockType.WATER);
  });
});
