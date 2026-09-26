import { BlockType } from './blockTypes.js';
import { createRandom, hashCoordinates, randomInt } from '../core/random.js';

export const TREE_SETTINGS = Object.freeze({
  cellSize: 7,
  margin: 2,
  chance: 0.5,
  minTrunkHeight: 4,
  maxTrunkHeight: 6,
});

export const CanopyShape = Object.freeze({
  SQUARE: 'square',
  ROUNDED: 'rounded',
});

const CANOPY_LAYERS = Object.freeze([
  { offsetY: -2, radius: 2, shape: CanopyShape.ROUNDED },
  { offsetY: -1, radius: 2, shape: CanopyShape.SQUARE },
  { offsetY: 0, radius: 1, shape: CanopyShape.SQUARE },
  { offsetY: 1, radius: 1, shape: CanopyShape.ROUNDED },
]);

function rollCandidate(random, cellX, cellZ, settings) {
  const innerMax = settings.cellSize - 1 - settings.margin;
  return {
    roll: random(),
    x: cellX + randomInt(random, settings.margin, innerMax),
    z: cellZ + randomInt(random, settings.margin, innerMax),
    trunkHeight: randomInt(random, settings.minTrunkHeight, settings.maxTrunkHeight),
  };
}

export function treeInCell(seed, cellX, cellZ, terrain, settings = TREE_SETTINGS) {
  const random = createRandom(hashCoordinates(seed, cellX, cellZ));
  const candidate = rollCandidate(random, cellX * settings.cellSize, cellZ * settings.cellSize, settings);
  if (candidate.roll > settings.chance) return null;
  const groundY = terrain.plantableGround(candidate.x, candidate.z);
  if (groundY === null) return null;
  return { x: candidate.x, z: candidate.z, groundY, trunkHeight: candidate.trunkHeight };
}

export function treesInArea(seed, area, terrain, settings = TREE_SETTINGS) {
  const cellOf = (coordinate) => Math.floor(coordinate / settings.cellSize);
  const trees = [];
  for (let cellZ = cellOf(area.minZ); cellZ <= cellOf(area.maxZ); cellZ++) {
    for (let cellX = cellOf(area.minX); cellX <= cellOf(area.maxX); cellX++) {
      const tree = treeInCell(seed, cellX, cellZ, terrain, settings);
      if (tree !== null) trees.push(tree);
    }
  }
  return trees;
}

function isTrimmedCorner(dx, dz, layer) {
  return layer.shape === CanopyShape.ROUNDED && Math.abs(dx) === layer.radius && Math.abs(dz) === layer.radius;
}

function placeLeaf(world, x, y, z) {
  if (world.getBlock(x, y, z) !== BlockType.AIR) return;
  world.setBlock(x, y, z, BlockType.LEAVES);
}

function placeCanopyLayer(world, tree, topY, layer) {
  for (let dz = -layer.radius; dz <= layer.radius; dz++) {
    for (let dx = -layer.radius; dx <= layer.radius; dx++) {
      if (isTrimmedCorner(dx, dz, layer)) continue;
      placeLeaf(world, tree.x + dx, topY + layer.offsetY, tree.z + dz);
    }
  }
}

export function placeTree(world, tree) {
  const topY = tree.groundY + tree.trunkHeight;
  world.setBlock(tree.x, tree.groundY, tree.z, BlockType.DIRT);
  for (let y = tree.groundY + 1; y <= topY; y++) {
    world.setBlock(tree.x, y, tree.z, BlockType.WOOD);
  }
  CANOPY_LAYERS.forEach((layer) => placeCanopyLayer(world, tree, topY, layer));
}
