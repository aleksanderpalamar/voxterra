import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Biome, MOUNTAIN_LINE, biomeName, resolveBiome } from '../src/world/biomes.js';

const lowland = MOUNTAIN_LINE - 10;

test('cada combinação climática típica resolve o bioma esperado', () => {
  const cases = [
    [{ temperature: -0.9, humidity: 0 }, Biome.TUNDRA],
    [{ temperature: -0.35, humidity: -0.8 }, Biome.TUNDRA],
    [{ temperature: -0.35, humidity: 0.4 }, Biome.TAIGA],
    [{ temperature: 0.05, humidity: -0.4 }, Biome.PLAINS],
    [{ temperature: 0.05, humidity: 0.6 }, Biome.FOREST],
    [{ temperature: 0.8, humidity: -0.8 }, Biome.DESERT],
    [{ temperature: 0.8, humidity: 0 }, Biome.SAVANNA],
    [{ temperature: 0.8, humidity: 0.8 }, Biome.RAINFOREST],
  ];
  cases.forEach(([climate, expected]) => {
    assert.equal(resolveBiome({ ...climate, surfaceY: lowland }), expected, JSON.stringify(climate));
  });
});

test('terreno alto é montanha independentemente do clima', () => {
  [-0.9, 0, 0.9].forEach((temperature) => {
    assert.equal(resolveBiome({ temperature, humidity: 0, surfaceY: MOUNTAIN_LINE }), Biome.MOUNTAINS);
  });
});

test('todo o espaço climático resolve algum bioma conhecido', () => {
  const known = new Set(Object.values(Biome));
  for (let temperature = -1; temperature <= 1; temperature += 0.05) {
    for (let humidity = -1; humidity <= 1; humidity += 0.05) {
      assert.ok(known.has(resolveBiome({ temperature, humidity, surfaceY: lowland })));
    }
  }
  assert.ok(known.has(resolveBiome({ temperature: 1, humidity: 1, surfaceY: lowland })));
  assert.ok(known.has(resolveBiome({ temperature: -1, humidity: -1, surfaceY: lowland })));
});

test('todos os biomas têm nome de exibição', () => {
  Object.values(Biome).forEach((biome) => assert.match(biomeName(biome), /^[A-Z][a-z]+$/));
});
