import { BlockType } from './blockTypes.js';

export function columnBlockAt(y, surfaceY, surface) {
  if (y > surfaceY) return BlockType.AIR;
  if (y === surfaceY) return surface.top;
  if (y >= surfaceY - surface.fillerDepth) return surface.filler;
  return BlockType.STONE;
}

export function fillColumn(target, x, z, surfaceY, surface, water) {
  for (let y = 0; y <= surfaceY; y++) {
    target.setBlock(x, y, z, columnBlockAt(y, surfaceY, surface));
  }
  for (let y = surfaceY + 1; y <= water.level; y++) {
    target.setBlock(x, y, z, y === water.level ? water.surfaceBlock : BlockType.WATER);
  }
}
