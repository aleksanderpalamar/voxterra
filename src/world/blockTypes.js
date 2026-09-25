export const BlockType = Object.freeze({
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
});

const BLOCK_NAMES = Object.freeze({
  [BlockType.AIR]: 'Air',
  [BlockType.GRASS]: 'Grass',
  [BlockType.DIRT]: 'Dirt',
  [BlockType.STONE]: 'Stone',
  [BlockType.WOOD]: 'Wood',
  [BlockType.LEAVES]: 'Leaves',
});

export const PLACEABLE_BLOCKS = Object.freeze([
  BlockType.GRASS,
  BlockType.DIRT,
  BlockType.STONE,
  BlockType.WOOD,
  BlockType.LEAVES,
]);

export function blockName(type) {
  return BLOCK_NAMES[type] ?? 'Unknown';
}

export function isSolidBlock(type) {
  return type !== BlockType.AIR;
}
