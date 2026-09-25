import { isSolidBlock } from './blockTypes.js';

export function createCollisionQuery(world) {
  return (x, y, z) => {
    if (y >= world.sizeY) return false;
    if (!world.contains(x, y, z)) return true;
    return isSolidBlock(world.getBlock(x, y, z));
  };
}

export function createOcclusionQuery(world) {
  return (x, y, z) => {
    if (y < 0) return true;
    return isSolidBlock(world.getBlock(x, y, z));
  };
}

export function createTargetQuery(world) {
  return (x, y, z) => isSolidBlock(world.getBlock(x, y, z));
}
