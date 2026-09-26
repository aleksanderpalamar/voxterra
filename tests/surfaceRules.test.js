import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BlockType } from '../src/world/blockTypes.js';
import { Biome, MOUNTAIN_LINE } from '../src/world/biomes.js';
import { SNOW_LINE, snowLineAt, surfaceLayers, waterSurfaceBlock } from '../src/world/surfaceRules.js';
import { WORLD_HEIGHT } from '../src/world/chunkLayout.js';
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

test('montanhas são rochosas por baixo da neve', () => {
  assert.equal(surfaceLayers(Biome.MOUNTAINS, { temperature: 0.6, humidity: 0 }, 40).filler, BlockType.STONE);
  assert.equal(surfaceLayers(Biome.MOUNTAINS, { temperature: -0.4, humidity: 0 }, 40).filler, BlockType.STONE);
});

test('a linha de neve sobe com a temperatura', () => {
  assert.equal(snowLineAt(-0.6), MOUNTAIN_LINE);
  assert.equal(snowLineAt(SNOW_LINE.coldTemperature), MOUNTAIN_LINE);
  const lines = [-0.2, -0.1, 0, 0.1, 0.19].map(snowLineAt);
  lines.slice(1).forEach((line, index) => assert.ok(line > lines[index], `${line} <= ${lines[index]}`));
  assert.equal(snowLineAt(SNOW_LINE.warmTemperature), Infinity);
  assert.equal(snowLineAt(1), Infinity);
});

test('montanhas frias ficam nevadas desde a base', () => {
  assert.equal(surfaceLayers(Biome.MOUNTAINS, { temperature: -0.4, humidity: 0 }, MOUNTAIN_LINE).top, BlockType.SNOW);
});

test('montanhas amenas só ganham neve acima da linha de neve', () => {
  const mild = { temperature: 0.05, humidity: -0.3 };
  const line = snowLineAt(mild.temperature);
  assert.equal(surfaceLayers(Biome.MOUNTAINS, mild, 36).top, BlockType.STONE);
  assert.equal(surfaceLayers(Biome.MOUNTAINS, mild, line - 1).top, BlockType.STONE);
  assert.equal(surfaceLayers(Biome.MOUNTAINS, mild, line).top, BlockType.SNOW);
});

test('montanhas com clima de deserto nunca têm neve, nem no topo do mundo', () => {
  [SNOW_LINE.warmTemperature, 0.6, 1].forEach((temperature) => {
    [MOUNTAIN_LINE, 48, WORLD_HEIGHT - 1].forEach((surfaceY) => {
      assert.equal(surfaceLayers(Biome.MOUNTAINS, { temperature, humidity: -0.5 }, surfaceY).top, BlockType.STONE);
    });
  });
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
