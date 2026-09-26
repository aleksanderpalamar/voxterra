import { BlockType, isReplaceableBlock, isSolidBlock } from '../world/blockTypes.js';
import { blockBox, boxesOverlap } from '../physics/aabb.js';

export const BreakResult = Object.freeze({
  BROKEN: 'broken',
  EMPTY: 'empty',
  UNBREAKABLE: 'unbreakable',
});

export const PlacementResult = Object.freeze({
  PLACED: 'placed',
  OUT_OF_WORLD: 'out-of-world',
  OCCUPIED: 'occupied',
  BLOCKED_BY_PLAYER: 'blocked-by-player',
  INVALID_FACE: 'invalid-face',
});

const BEDROCK_LEVEL = 0;

export function placementPosition(hit) {
  return {
    x: hit.position.x + hit.normal.x,
    y: hit.position.y + hit.normal.y,
    z: hit.position.z + hit.normal.z,
  };
}

function hasFace(hit) {
  return hit.normal.x !== 0 || hit.normal.y !== 0 || hit.normal.z !== 0;
}

export function evaluatePlacement(world, position, occupiedBox) {
  const { x, y, z } = position;
  if (!world.contains(x, y, z)) return PlacementResult.OUT_OF_WORLD;
  if (!isReplaceableBlock(world.getBlock(x, y, z))) return PlacementResult.OCCUPIED;
  if (boxesOverlap(blockBox(x, y, z), occupiedBox)) return PlacementResult.BLOCKED_BY_PLAYER;
  return PlacementResult.PLACED;
}

export function placeBlock(world, hit, blockType, occupiedBox) {
  if (!hasFace(hit)) return PlacementResult.INVALID_FACE;
  const position = placementPosition(hit);
  const result = evaluatePlacement(world, position, occupiedBox);
  if (result !== PlacementResult.PLACED) return result;
  world.setBlock(position.x, position.y, position.z, blockType);
  return result;
}

export function breakBlock(world, position) {
  const { x, y, z } = position;
  if (y <= BEDROCK_LEVEL) return BreakResult.UNBREAKABLE;
  if (!isSolidBlock(world.getBlock(x, y, z))) return BreakResult.EMPTY;
  world.setBlock(x, y, z, BlockType.AIR);
  return BreakResult.BROKEN;
}
