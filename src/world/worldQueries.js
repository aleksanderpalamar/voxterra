import { isOpaqueBlock, isSolidBlock } from './blockTypes.js';

export function createCollisionQuery(world) {
  return (x, y, z) => {
    if (y >= world.height) return false;
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

export function createOpacityQuery(world) {
  return (x, y, z) => {
    if (y < 0) return true;
    return isOpaqueBlock(world.getBlock(x, y, z));
  };
}

export function createMeshSource(blocks) {
  return {
    getBlock: (x, y, z) => blocks.getBlock(x, y, z),
    isOpaque: createOpacityQuery(blocks),
    isOccluding: createOcclusionQuery(blocks),
  };
}

export function createRenderSource(world) {
  return {
    ...createMeshSource(world),
    isChunkMeshable: (chunkX, chunkZ) => world.hasNeighborhood(chunkX, chunkZ),
  };
}

export function createTargetQuery(world) {
  return (x, y, z) => isSolidBlock(world.getBlock(x, y, z));
}
