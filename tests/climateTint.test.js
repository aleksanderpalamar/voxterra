import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NEUTRAL_TINT, TintKind, climateTint, tintKindOf } from '../src/render/climateTint.js';
import { BlockType } from '../src/world/blockTypes.js';

const TEMPERATE = { temperature: 0, humidity: 0 };
const HOT_DRY = { temperature: 0.8, humidity: -0.8 };
const HOT_WET = { temperature: 0.8, humidity: 0.8 };
const COLD = { temperature: -0.8, humidity: 0.2 };

test('só grama e folhas recebem tonalidade do clima', () => {
  assert.equal(tintKindOf(BlockType.GRASS), TintKind.GRASS);
  [BlockType.OAK_LEAVES, BlockType.SPRUCE_LEAVES, BlockType.ACACIA_LEAVES, BlockType.JUNGLE_LEAVES, BlockType.PERSISTENT_LEAVES]
    .forEach((type) => assert.equal(tintKindOf(type), TintKind.FOLIAGE));
  [BlockType.DIRT, BlockType.STONE, BlockType.SAND, BlockType.SNOW, BlockType.CACTUS, BlockType.OAK_WOOD, BlockType.WATER]
    .forEach((type) => assert.equal(tintKindOf(type), TintKind.NONE));
});

test('clima temperado mantém as cores originais e blocos sem tonalidade ficam neutros', () => {
  assert.deepEqual(climateTint(TintKind.GRASS, TEMPERATE), NEUTRAL_TINT);
  assert.deepEqual(climateTint(TintKind.FOLIAGE, TEMPERATE), NEUTRAL_TINT);
  assert.deepEqual(climateTint(TintKind.NONE, HOT_DRY), NEUTRAL_TINT);
});

test('calor seco amarela, calor úmido aviva o verde e frio puxa para o azulado', () => {
  const [dryRed, dryGreen, dryBlue] = climateTint(TintKind.GRASS, HOT_DRY);
  assert.ok(dryRed > 1.2 && dryBlue < 0.6 && dryRed > dryGreen);
  const [wetRed, wetGreen, wetBlue] = climateTint(TintKind.GRASS, HOT_WET);
  assert.ok(wetGreen > 1.1 && wetGreen > wetRed && wetGreen > wetBlue);
  const [coldRed, , coldBlue] = climateTint(TintKind.GRASS, COLD);
  assert.ok(coldRed < 0.7 && coldBlue > coldRed);
});

test('a tonalidade das folhas é mais suave que a da grama', () => {
  [HOT_DRY, HOT_WET, COLD].forEach((climate) => {
    const grass = climateTint(TintKind.GRASS, climate);
    const foliage = climateTint(TintKind.FOLIAGE, climate);
    const distance = (tint) => tint.reduce((sum, channel) => sum + Math.abs(channel - 1), 0);
    foliage.forEach((channel, index) => assert.ok(Math.abs(channel - 1) <= Math.abs(grass[index] - 1)));
    assert.ok(distance(foliage) < distance(grass));
  });
});

test('a tonalidade muda aos poucos, sem saltos entre climas vizinhos', () => {
  const STEP = 0.01;
  for (let temperature = -1; temperature < 1; temperature += STEP) {
    for (let humidity = -1; humidity < 1; humidity += 0.1) {
      const here = climateTint(TintKind.GRASS, { temperature, humidity });
      const warmer = climateTint(TintKind.GRASS, { temperature: temperature + STEP, humidity });
      const wetter = climateTint(TintKind.GRASS, { temperature, humidity: humidity + STEP });
      here.forEach((channel, index) => {
        assert.ok(Math.abs(warmer[index] - channel) < 0.06, `temperatura ${temperature.toFixed(2)}`);
        assert.ok(Math.abs(wetter[index] - channel) < 0.06, `umidade ${humidity.toFixed(2)}`);
      });
    }
  }
});

test('climas extremos além do limite repetem a cor da borda', () => {
  assert.deepEqual(climateTint(TintKind.GRASS, { temperature: 3, humidity: -3 }), climateTint(TintKind.GRASS, { temperature: 1, humidity: -1 }));
});
