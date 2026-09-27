export const BlockType = Object.freeze({
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  OAK_WOOD: 4,
  OAK_LEAVES: 5,
  SAND: 6,
  SNOW: 7,
  WATER: 8,
  ICE: 9,
  SPRUCE_LEAVES: 10,
  CACTUS: 11,
  PERSISTENT_LEAVES: 12,
  SPRUCE_WOOD: 13,
  ACACIA_WOOD: 14,
  JUNGLE_WOOD: 15,
  ACACIA_LEAVES: 16,
  JUNGLE_LEAVES: 17,
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
  [BlockType.OAK_WOOD]: 'Oak Wood',
  [BlockType.OAK_LEAVES]: 'Oak Leaves',
  [BlockType.SAND]: 'Sand',
  [BlockType.SNOW]: 'Snow',
  [BlockType.WATER]: 'Water',
  [BlockType.ICE]: 'Ice',
  [BlockType.SPRUCE_LEAVES]: 'Spruce Leaves',
  [BlockType.CACTUS]: 'Cactus',
  [BlockType.PERSISTENT_LEAVES]: 'Oak Leaves',
  [BlockType.SPRUCE_WOOD]: 'Spruce Wood',
  [BlockType.ACACIA_WOOD]: 'Acacia Wood',
  [BlockType.JUNGLE_WOOD]: 'Jungle Wood',
  [BlockType.ACACIA_LEAVES]: 'Acacia Leaves',
  [BlockType.JUNGLE_LEAVES]: 'Jungle Leaves',
});

const SOLID_BLOCK = Object.freeze({
  solid: true,
  opaque: true,
  replaceable: false,
  layer: RenderLayer.SOLID,
  medium: Medium.AIR,
});

const LEAVES_BLOCK = Object.freeze({ ...SOLID_BLOCK, opaque: false });

const BLOCK_PROPERTIES = Object.freeze({
  [BlockType.AIR]: Object.freeze({ ...SOLID_BLOCK, solid: false, opaque: false, replaceable: true, layer: RenderLayer.NONE }),
  [BlockType.OAK_LEAVES]: LEAVES_BLOCK,
  [BlockType.SPRUCE_LEAVES]: LEAVES_BLOCK,
  [BlockType.ACACIA_LEAVES]: LEAVES_BLOCK,
  [BlockType.JUNGLE_LEAVES]: LEAVES_BLOCK,
  [BlockType.PERSISTENT_LEAVES]: LEAVES_BLOCK,
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
  BlockType.OAK_WOOD,
  BlockType.SPRUCE_WOOD,
  BlockType.ACACIA_WOOD,
  BlockType.JUNGLE_WOOD,
  BlockType.PERSISTENT_LEAVES,
]);

export const LOG_BLOCKS = new Set([BlockType.OAK_WOOD, BlockType.SPRUCE_WOOD, BlockType.ACACIA_WOOD, BlockType.JUNGLE_WOOD]);

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
