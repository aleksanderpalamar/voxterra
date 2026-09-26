import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChunkGenerator } from '../src/world/chunkGenerator.js';
import { Biome } from '../src/world/biomes.js';

const EXPECTED_SHARES = Object.freeze({
  [Biome.OCEAN]: [0.25, 0.5],
  [Biome.BEACH]: [0.03, 0.12],
});
const LAND_SHARE = [0.02, 0.25];

function measureShares(seed) {
  const generator = new ChunkGenerator(seed);
  const counts = new Map(Object.values(Biome).map((biome) => [biome, 0]));
  let total = 0;
  for (let z = -6000; z < 6000; z += 60) {
    for (let x = -6000; x < 6000; x += 60) {
      const { biome } = generator.columnAt(x, z);
      counts.set(biome, counts.get(biome) + 1);
      total += 1;
    }
  }
  return new Map([...counts].map(([biome, count]) => [biome, count / total]));
}

test('oceanos, praias e todos os biomas terrestres aparecem em proporções equilibradas', () => {
  measureShares(77).forEach((share, biome) => {
    const [min, max] = EXPECTED_SHARES[biome] ?? LAND_SHARE;
    assert.ok(share > min && share < max, `${biome}: ${(share * 100).toFixed(1)}%`);
  });
});
