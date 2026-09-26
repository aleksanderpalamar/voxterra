import { BlockType } from './blockTypes.js';
import { Species } from './vegetation.js';

const CrownShape = Object.freeze({
  SQUARE: 'square',
  ROUNDED: 'rounded',
  ROUND: 'round',
});

const LEAN_DIRECTIONS = Object.freeze([[1, 0], [-1, 0], [0, 1], [0, -1]]);
const CONIFER_BARE_TRUNK = 3;
const ACACIA_LEAN = 2;

const OAK_CROWN = Object.freeze([
  [-2, 2, CrownShape.ROUNDED],
  [-1, 2, CrownShape.SQUARE],
  [0, 1, CrownShape.SQUARE],
  [1, 1, CrownShape.ROUNDED],
]);

const JUNGLE_CROWN = Object.freeze([
  [-2, 2, CrownShape.ROUND],
  [-1, 3, CrownShape.ROUND],
  [0, 3, CrownShape.ROUND],
  [1, 2, CrownShape.ROUND],
  [2, 1, CrownShape.ROUNDED],
]);

function insideCrown(dx, dz, radius, shape) {
  if (shape === CrownShape.ROUND) return dx * dx + dz * dz <= radius * radius + radius;
  if (shape === CrownShape.ROUNDED) return radius === 0 || Math.abs(dx) !== radius || Math.abs(dz) !== radius;
  return true;
}

function placeCrownLayer(world, centerX, y, centerZ, radius, shape, leaf) {
  for (let dz = -radius; dz <= radius; dz++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (!insideCrown(dx, dz, radius, shape)) continue;
      if (world.getBlock(centerX + dx, y, centerZ + dz) !== BlockType.AIR) continue;
      world.setBlock(centerX + dx, y, centerZ + dz, leaf);
    }
  }
}

function placeStem(world, plant, block) {
  for (let y = plant.groundY + 1; y <= plant.groundY + plant.height; y++) world.setBlock(plant.x, y, plant.z, block);
}

function prepareGround(world, plant) {
  if (world.getBlock(plant.x, plant.groundY, plant.z) !== BlockType.GRASS) return;
  world.setBlock(plant.x, plant.groundY, plant.z, BlockType.DIRT);
}

function placeLayeredTree(world, plant, crown) {
  prepareGround(world, plant);
  placeStem(world, plant, BlockType.WOOD);
  const topY = plant.groundY + plant.height;
  crown.forEach(([offset, radius, shape]) => placeCrownLayer(world, plant.x, topY + offset, plant.z, radius, shape, BlockType.LEAVES));
}

function coniferRadius(depth) {
  if (depth === 0) return 0;
  if (depth <= 2) return 1;
  return depth % 2 === 1 ? 2 : 1;
}

function placeConifer(world, plant) {
  prepareGround(world, plant);
  placeStem(world, plant, BlockType.WOOD);
  const topY = plant.groundY + plant.height;
  for (let y = topY + 1; y >= plant.groundY + CONIFER_BARE_TRUNK; y--) {
    placeCrownLayer(world, plant.x, y, plant.z, coniferRadius(topY + 1 - y), CrownShape.ROUNDED, BlockType.PINE_LEAVES);
  }
}

function placeAcacia(world, plant) {
  prepareGround(world, plant);
  const [dx, dz] = LEAN_DIRECTIONS[plant.variant % LEAN_DIRECTIONS.length];
  const straight = plant.height - ACACIA_LEAN;
  let x = plant.x;
  let z = plant.z;
  for (let step = 1; step <= plant.height; step++) {
    if (step > straight) {
      x += dx;
      z += dz;
    }
    world.setBlock(x, plant.groundY + step, z, BlockType.WOOD);
  }
  const topY = plant.groundY + plant.height;
  placeCrownLayer(world, x, topY + 1, z, 3, CrownShape.ROUND, BlockType.LEAVES);
  placeCrownLayer(world, x, topY + 2, z, 1, CrownShape.SQUARE, BlockType.LEAVES);
}

function placeBush(world, plant) {
  prepareGround(world, plant);
  placeStem(world, plant, BlockType.WOOD);
  placeCrownLayer(world, plant.x, plant.groundY + 1, plant.z, 1, CrownShape.SQUARE, BlockType.LEAVES);
  placeCrownLayer(world, plant.x, plant.groundY + 2, plant.z, 1, CrownShape.ROUNDED, BlockType.LEAVES);
}

const PLACERS = Object.freeze({
  [Species.OAK]: (world, plant) => placeLayeredTree(world, plant, OAK_CROWN),
  [Species.JUNGLE]: (world, plant) => placeLayeredTree(world, plant, JUNGLE_CROWN),
  [Species.CONIFER]: placeConifer,
  [Species.ACACIA]: placeAcacia,
  [Species.BUSH]: placeBush,
  [Species.CACTUS]: (world, plant) => placeStem(world, plant, BlockType.CACTUS),
});

export function placePlant(world, plant) {
  PLACERS[plant.species](world, plant);
}
