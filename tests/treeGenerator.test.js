import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRandom } from '../src/core/random.js';
import { BlockType } from '../src/world/blockTypes.js';
import { World } from '../src/world/world.js';
import { HeightMap } from '../src/world/terrainGenerator.js';
import { TREE_SETTINGS, placeTree, planTrees } from '../src/world/treeGenerator.js';

function flatHeightMap(size, height) {
  const heightMap = new HeightMap(size, size);
  heightMap.heights.fill(height);
  return heightMap;
}

test('placeTree cria tronco de madeira e copa de folhas', () => {
  const world = new World(9, 16, 9);
  placeTree(world, { x: 4, z: 4, groundY: 2, trunkHeight: 5 });
  for (let y = 3; y <= 7; y++) assert.equal(world.getBlock(4, y, 4), BlockType.WOOD);
  assert.equal(world.getBlock(4, 2, 4), BlockType.DIRT);
  assert.equal(world.getBlock(4, 8, 4), BlockType.LEAVES);
  assert.equal(world.getBlock(6, 5, 4), BlockType.LEAVES);
  assert.equal(world.getBlock(6, 5, 6), BlockType.AIR);
});

test('placeTree não sobrescreve blocos existentes com folhas', () => {
  const world = new World(9, 16, 9);
  world.setBlock(5, 6, 4, BlockType.STONE);
  placeTree(world, { x: 4, z: 4, groundY: 2, trunkHeight: 5 });
  assert.equal(world.getBlock(5, 6, 4), BlockType.STONE);
});

test('planTrees é determinístico e mantém árvores dentro do mapa', () => {
  const heightMap = flatHeightMap(70, 10);
  const plan = () => planTrees(createRandom(11), heightMap, () => true);
  const trees = plan();
  assert.deepEqual(trees, plan());
  assert.ok(trees.length > 0);
  trees.forEach((tree) => {
    assert.ok(tree.x >= TREE_SETTINGS.margin && tree.x < 70 - TREE_SETTINGS.margin);
    assert.ok(tree.trunkHeight >= TREE_SETTINGS.minTrunkHeight && tree.trunkHeight <= TREE_SETTINGS.maxTrunkHeight);
    assert.equal(tree.groundY, 10);
  });
});

test('planTrees ignora colunas não férteis', () => {
  const heightMap = flatHeightMap(70, 10);
  assert.deepEqual(planTrees(createRandom(11), heightMap, () => false), []);
});
