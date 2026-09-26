import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BlockType } from '../src/world/blockTypes.js';
import { Species, SPECIES_TRAITS } from '../src/world/vegetation.js';
import { placePlant } from '../src/world/treeShapes.js';
import { createEmptyWorld } from './helpers.js';

const CHUNKS = [];
for (let chunkZ = -1; chunkZ <= 1; chunkZ++) {
  for (let chunkX = -1; chunkX <= 1; chunkX++) CHUNKS.push([chunkX, chunkZ]);
}

function grow(plant) {
  const world = createEmptyWorld({ height: 32, chunks: CHUNKS });
  world.setBlock(plant.x, plant.groundY, plant.z, plant.ground ?? BlockType.GRASS);
  placePlant(world, { variant: 0, ...plant });
  return world;
}

function blocksOf(world, type) {
  const found = [];
  for (let y = 0; y < 32; y++) {
    for (let z = -12; z <= 12; z++) {
      for (let x = -12; x <= 12; x++) if (world.getBlock(x, y, z) === type) found.push({ x, y, z });
    }
  }
  return found;
}

const reach = (blocks, plant) => Math.max(...blocks.map((block) => Math.max(Math.abs(block.x - plant.x), Math.abs(block.z - plant.z))));

test('carvalho tem tronco reto e copa de folhas comuns', () => {
  const plant = { species: Species.OAK, x: 0, z: 0, groundY: 2, height: 5 };
  const world = grow(plant);
  for (let y = 3; y <= 7; y++) assert.equal(world.getBlock(0, y, 0), BlockType.WOOD);
  assert.equal(world.getBlock(0, 2, 0), BlockType.DIRT);
  assert.equal(world.getBlock(0, 8, 0), BlockType.LEAVES);
});

test('conífera é alta, estreita no topo e usa folhas de pinheiro', () => {
  const plant = { species: Species.CONIFER, x: 0, z: 0, groundY: 2, height: 9 };
  const world = grow(plant);
  const leaves = blocksOf(world, BlockType.PINE_LEAVES);
  assert.ok(leaves.length > 20);
  assert.equal(blocksOf(world, BlockType.LEAVES).length, 0);
  const topY = Math.max(...leaves.map((leaf) => leaf.y));
  const widthAt = (y) => reach(leaves.filter((leaf) => leaf.y === y), plant);
  assert.equal(widthAt(topY), 0);
  assert.ok(widthAt(topY - 3) > widthAt(topY - 1));
  assert.equal(world.getBlock(0, 2 + 9, 0), BlockType.WOOD);
});

test('acácia inclina o tronco e abre uma copa larga e achatada', () => {
  const plant = { species: Species.ACACIA, x: 0, z: 0, groundY: 2, height: 5 };
  const world = grow(plant);
  const wood = blocksOf(world, BlockType.WOOD);
  assert.ok(wood.some((block) => block.x !== 0 || block.z !== 0), 'tronco não inclinou');
  const leaves = blocksOf(world, BlockType.LEAVES);
  const layers = new Set(leaves.map((leaf) => leaf.y));
  assert.ok(layers.size <= 2);
  assert.ok(reach(leaves, plant) >= 3);
});

test('árvore tropical é muito alta e tem copa ampla', () => {
  const plant = { species: Species.JUNGLE, x: 0, z: 0, groundY: 2, height: 12 };
  const world = grow(plant);
  assert.equal(world.getBlock(0, 14, 0), BlockType.WOOD);
  assert.ok(reach(blocksOf(world, BlockType.LEAVES), plant) >= 3);
});

test('arbusto é baixo, com um bloco de madeira', () => {
  const plant = { species: Species.BUSH, x: 0, z: 0, groundY: 2, height: 1 };
  const world = grow(plant);
  assert.equal(blocksOf(world, BlockType.WOOD).length, 1);
  assert.ok(Math.max(...blocksOf(world, BlockType.LEAVES).map((leaf) => leaf.y)) <= 5);
});

test('cacto é uma coluna sobre a areia, sem folhas', () => {
  const plant = { species: Species.CACTUS, x: 0, z: 0, groundY: 2, height: 3, ground: BlockType.SAND };
  const world = grow(plant);
  [3, 4, 5].forEach((y) => assert.equal(world.getBlock(0, y, 0), BlockType.CACTUS));
  assert.equal(world.getBlock(0, 6, 0), BlockType.AIR);
  assert.equal(world.getBlock(0, 2, 0), BlockType.SAND);
  assert.equal(blocksOf(world, BlockType.LEAVES).length, 0);
});

test('conífera sobre neve não troca o chão por terra', () => {
  const world = grow({ species: Species.CONIFER, x: 0, z: 0, groundY: 2, height: 8, ground: BlockType.SNOW });
  assert.equal(world.getBlock(0, 2, 0), BlockType.SNOW);
});

test('nenhuma espécie passa do alcance de copa declarado', () => {
  Object.values(Species).forEach((species) => {
    [0, 1, 2, 3].forEach((variant) => {
      const { maxHeight, crownReach } = SPECIES_TRAITS[species];
      const plant = { species, x: 0, z: 0, groundY: 2, height: maxHeight, variant, ground: species === Species.CACTUS ? BlockType.SAND : BlockType.GRASS };
      const world = grow(plant);
      const placed = [BlockType.WOOD, BlockType.LEAVES, BlockType.PINE_LEAVES, BlockType.CACTUS].flatMap((type) => blocksOf(world, type));
      assert.ok(reach(placed, plant) <= crownReach, `${species}/${variant}`);
    });
  });
});

test('folhas não sobrescrevem blocos existentes', () => {
  const world = createEmptyWorld({ height: 32, chunks: CHUNKS });
  world.setBlock(1, 6, 0, BlockType.STONE);
  placePlant(world, { species: Species.OAK, x: 0, z: 0, groundY: 2, height: 5, variant: 0 });
  assert.equal(world.getBlock(1, 6, 0), BlockType.STONE);
});
