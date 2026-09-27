import { BlockType } from '../world/blockTypes.js';

export const TintKind = Object.freeze({
  NONE: 'none',
  GRASS: 'grass',
  FOLIAGE: 'foliage',
});

export const NEUTRAL_TINT = Object.freeze([1, 1, 1]);

const CLIMATE_SPAN = 0.55;
const FOLIAGE_STRENGTH = 0.6;
const DISPLAY_GAMMA = 2.2;

const BLOCK_TINTS = Object.freeze({
  [BlockType.GRASS]: TintKind.GRASS,
  [BlockType.OAK_LEAVES]: TintKind.FOLIAGE,
  [BlockType.SPRUCE_LEAVES]: TintKind.FOLIAGE,
  [BlockType.ACACIA_LEAVES]: TintKind.FOLIAGE,
  [BlockType.JUNGLE_LEAVES]: TintKind.FOLIAGE,
  [BlockType.PERSISTENT_LEAVES]: TintKind.FOLIAGE,
});

const GRASS_PALETTE = Object.freeze([
  [[0.72, 0.9, 0.98], [0.66, 0.88, 1.0], [0.6, 0.86, 1.0]],
  [[1.1, 1.02, 0.82], [1, 1, 1], [0.9, 1.04, 0.92]],
  [[1.4, 1.08, 0.5], [1.2, 1.08, 0.62], [0.84, 1.16, 0.72]],
]);

export function tintKindOf(blockType) {
  return BLOCK_TINTS[blockType] ?? TintKind.NONE;
}

function normalized(value) {
  const t = Math.min(Math.max((value + CLIMATE_SPAN) / (2 * CLIMATE_SPAN), 0), 1);
  return t * t * (3 - 2 * t);
}

function mix(from, to, amount) {
  return from.map((channel, index) => channel + (to[index] - channel) * amount);
}

function paletteAt(warmth, wetness) {
  const row = Math.min(Math.floor(warmth * 2), 1);
  const column = Math.min(Math.floor(wetness * 2), 1);
  const rowAmount = warmth * 2 - row;
  const columnAmount = wetness * 2 - column;
  const near = mix(GRASS_PALETTE[row][column], GRASS_PALETTE[row][column + 1], columnAmount);
  const far = mix(GRASS_PALETTE[row + 1][column], GRASS_PALETTE[row + 1][column + 1], columnAmount);
  return mix(near, far, rowAmount);
}

function perceivedTint(kind, { temperature, humidity }) {
  const grass = paletteAt(normalized(temperature), normalized(humidity));
  return kind === TintKind.FOLIAGE ? mix(NEUTRAL_TINT, grass, FOLIAGE_STRENGTH) : grass;
}

export function climateTint(kind, climate) {
  if (kind === TintKind.NONE) return NEUTRAL_TINT;
  return perceivedTint(kind, climate).map((channel) => channel ** DISPLAY_GAMMA);
}
