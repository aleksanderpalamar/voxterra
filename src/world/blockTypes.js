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
  BlockType.LEAVES,
]);

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
