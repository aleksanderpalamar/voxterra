import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChunkGenerator } from '../src/world/chunkGenerator.js';
import { Biome } from '../src/world/biomes.js';

test('todos os biomas aparecem em proporções equilibradas numa região grande', () => {
  const generator = new ChunkGenerator(77);
  const counts = new Map(Object.values(Biome).map((biome) => [biome, 0]));
  let total = 0;
  for (let z = -6000; z < 6000; z += 60) {
    for (let x = -6000; x < 6000; x += 60) {
      const { biome } = generator.columnAt(x, z);
      counts.set(biome, counts.get(biome) + 1);
      total += 1;
    }
  }
  counts.forEach((count, biome) => {
    const share = count / total;
    assert.ok(share > 0.03 && share < 0.3, `${biome}: ${(share * 100).toFixed(1)}%`);
  });
});
