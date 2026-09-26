import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Biome, MOUNTAIN_LINE, biomeName, resolveBiome, withinBeachBand } from '../src/world/biomes.js';
import { SEA_LEVEL } from '../src/world/terrainShape.js';

const lowland = MOUNTAIN_LINE - 5;
const inland = 0.6;

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
    assert.equal(resolveBiome({ ...climate, surfaceY: lowland, continentalness: inland }), expected, JSON.stringify(climate));
  });
});

test('terreno alto é montanha independentemente do clima', () => {
  [-0.9, 0, 0.9].forEach((temperature) => {
    assert.equal(resolveBiome({ temperature, humidity: 0, surfaceY: MOUNTAIN_LINE, continentalness: inland }), Biome.MOUNTAINS);
  });
});

test('todo o espaço climático resolve algum bioma conhecido', () => {
  const known = new Set(Object.values(Biome));
  for (let temperature = -1; temperature <= 1; temperature += 0.05) {
    for (let humidity = -1; humidity <= 1; humidity += 0.05) {
      assert.ok(known.has(resolveBiome({ temperature, humidity, surfaceY: lowland, continentalness: inland })));
    }
  }
  assert.ok(known.has(resolveBiome({ temperature: 1, humidity: 1, surfaceY: lowland, continentalness: inland })));
  assert.ok(known.has(resolveBiome({ temperature: -1, humidity: -1, surfaceY: lowland, continentalness: inland })));
});

test('todos os biomas têm nome de exibição', () => {
  Object.values(Biome).forEach((biome) => assert.match(biomeName(biome), /^[A-Z][a-z]+$/));
});

test('colunas submersas em região oceânica são oceano', () => {
  const climate = { temperature: 0.1, humidity: 0.2 };
  assert.equal(resolveBiome({ ...climate, surfaceY: SEA_LEVEL - 6, continentalness: -0.6 }), Biome.OCEAN);
});

test('terreno na altura do mar ao lado de água é praia', () => {
  const climate = { temperature: 0.1, humidity: 0.2 };
  [SEA_LEVEL - 1, SEA_LEVEL, SEA_LEVEL + 1].forEach((surfaceY) => {
    assert.equal(resolveBiome({ ...climate, surfaceY, continentalness: -0.03, besideWater: true }), Biome.BEACH);
  });
  assert.notEqual(resolveBiome({ ...climate, surfaceY: SEA_LEVEL + 6, continentalness: -0.03, besideWater: true }), Biome.BEACH);
});

test('terreno baixo sem água por perto não é praia', () => {
  const climate = { temperature: 0.1, humidity: -0.3 };
  assert.equal(resolveBiome({ ...climate, surfaceY: SEA_LEVEL + 1, continentalness: -0.01, besideWater: false }), Biome.PLAINS);
});

test('withinBeachBand delimita a faixa de altura das praias', () => {
  assert.equal(withinBeachBand(SEA_LEVEL - 1), true);
  assert.equal(withinBeachBand(SEA_LEVEL + 1), true);
  assert.equal(withinBeachBand(SEA_LEVEL + 2), false);
  assert.equal(withinBeachBand(SEA_LEVEL - 2), false);
});

test('lagos no interior mantêm o bioma do clima', () => {
  const lake = resolveBiome({ temperature: 0.1, humidity: 0.6, surfaceY: SEA_LEVEL - 4, continentalness: 0.7 });
  assert.equal(lake, Biome.FOREST);
});
