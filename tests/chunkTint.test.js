import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createChunkTint } from '../src/render/chunkTint.js';
import { NEUTRAL_TINT, TintKind, climateTint } from '../src/render/climateTint.js';
import { BlockType } from '../src/world/blockTypes.js';

const BOUNDS = { minX: 16, minY: 0, minZ: -32, maxX: 32, maxY: 64, maxZ: -16 };
const climateAt = (x, z) => ({ temperature: Math.sin(x * 0.1) * 0.7, humidity: Math.cos(z * 0.13) * 0.7 });

test('cada canto de bloco recebe a tonalidade do clima naquele ponto', () => {
  const tintAt = createChunkTint(climateAt, BOUNDS);
  [[16, -32], [20, -25], [32, -16]].forEach(([x, z]) => {
    assert.deepEqual(tintAt(BlockType.GRASS, x, z), climateTint(TintKind.GRASS, climateAt(x, z)));
    assert.deepEqual(tintAt(BlockType.ACACIA_LEAVES, x, z), climateTint(TintKind.FOLIAGE, climateAt(x, z)));
  });
});

test('o clima é amostrado uma vez por canto do chunk', () => {
  let samples = 0;
  const tintAt = createChunkTint((x, z) => {
    samples += 1;
    return climateAt(x, z);
  }, BOUNDS);
  for (let i = 0; i < 50; i++) tintAt(BlockType.GRASS, 18, -20);
  assert.equal(samples, 17 * 17);
});

test('blocos sem tonalidade ficam neutros e cantos fora do chunk continuam corretos', () => {
  const tintAt = createChunkTint(climateAt, BOUNDS);
  assert.equal(tintAt(BlockType.STONE, 20, -20), NEUTRAL_TINT);
  assert.deepEqual(tintAt(BlockType.GRASS, 40, -40), climateTint(TintKind.GRASS, climateAt(40, -40)));
});
