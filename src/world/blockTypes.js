export const BlockType = Object.freeze({
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
  SAND: 6,
  SNOW: 7,
  WATER: 8,
  ICE: 9,
  PINE_LEAVES: 10,
  CACTUS: 11,
  PERSISTENT_LEAVES: 12,
  PINE_WOOD: 13,
  ACACIA_WOOD: 14,
  JUNGLE_WOOD: 15,
});

export const RenderLayer = Object.freeze({
  NONE: 'none',
  SOLID: 'solid',
  WATER: 'water',
});

export const Medium = Object.freeze({
  AIR: 'air',
  WATER: 'water',
});

const BLOCK_NAMES = Object.freeze({
  [BlockType.AIR]: 'Air',
  [BlockType.GRASS]: 'Grass',
  [BlockType.DIRT]: 'Dirt',
  [BlockType.STONE]: 'Stone',
  [BlockType.WOOD]: 'Wood',
  [BlockType.LEAVES]: 'Leaves',
  [BlockType.SAND]: 'Sand',
  [BlockType.SNOW]: 'Snow',
  [BlockType.WATER]: 'Water',
  [BlockType.ICE]: 'Ice',
  [BlockType.PINE_LEAVES]: 'Pine Leaves',
  [BlockType.CACTUS]: 'Cactus',
  [BlockType.PERSISTENT_LEAVES]: 'Leaves',
  [BlockType.PINE_WOOD]: 'Pine Wood',
  [BlockType.ACACIA_WOOD]: 'Acacia Wood',
  [BlockType.JUNGLE_WOOD]: 'Jungle Wood',
});

const SOLID_BLOCK = Object.freeze({
  solid: true,
  opaque: true,
  replaceable: false,
  layer: RenderLayer.SOLID,
  medium: Medium.AIR,
});

const BLOCK_PROPERTIES = Object.freeze({
  [BlockType.AIR]: Object.freeze({ ...SOLID_BLOCK, solid: false, opaque: false, replaceable: true, layer: RenderLayer.NONE }),
  [BlockType.LEAVES]: Object.freeze({ ...SOLID_BLOCK, opaque: false }),
  [BlockType.PINE_LEAVES]: Object.freeze({ ...SOLID_BLOCK, opaque: false }),
  [BlockType.PERSISTENT_LEAVES]: Object.freeze({ ...SOLID_BLOCK, opaque: false }),
  [BlockType.WATER]: Object.freeze({
    solid: false,
    opaque: false,
    replaceable: true,
    layer: RenderLayer.WATER,
    medium: Medium.WATER,
  }),
});

export const PLACEABLE_BLOCKS = Object.freeze([
  BlockType.GRASS,
  BlockType.DIRT,
  BlockType.STONE,
  BlockType.WOOD,
  BlockType.PERSISTENT_LEAVES,
]);

export const LOG_BLOCKS = new Set([BlockType.WOOD, BlockType.PINE_WOOD, BlockType.ACACIA_WOOD, BlockType.JUNGLE_WOOD]);

function propertiesOf(type) {
  return BLOCK_PROPERTIES[type] ?? SOLID_BLOCK;
}

export function blockName(type) {
  return BLOCK_NAMES[type] ?? 'Unknown';
}

export function isSolidBlock(type) {
  return propertiesOf(type).solid;
}

export function isOpaqueBlock(type) {
  return propertiesOf(type).opaque;
}

export function isReplaceableBlock(type) {
  return propertiesOf(type).replaceable;
}

export function renderLayerOf(type) {
  return propertiesOf(type).layer;
}

export function mediumOf(type) {
  return propertiesOf(type).medium;
}

export function isLogBlock(type) {
  return LOG_BLOCKS.has(type);
}
