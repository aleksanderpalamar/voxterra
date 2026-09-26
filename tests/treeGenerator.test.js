import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BlockType } from '../src/world/blockTypes.js';
import { TREE_SETTINGS, placeTree, treeInCell, treesInArea } from '../src/world/treeGenerator.js';
import { createEmptyWorld } from './helpers.js';

const flatTerrain = (height, fertile = true) => ({
  plantableGround: () => (fertile ? height : null),
});

test('placeTree cria tronco de madeira e copa de folhas', () => {
  const world = createEmptyWorld({ height: 16 });
  placeTree(world, { x: 4, z: 4, groundY: 2, trunkHeight: 5 });
  for (let y = 3; y <= 7; y++) assert.equal(world.getBlock(4, y, 4), BlockType.WOOD);
  assert.equal(world.getBlock(4, 2, 4), BlockType.DIRT);
  assert.equal(world.getBlock(4, 8, 4), BlockType.LEAVES);
  assert.equal(world.getBlock(6, 5, 4), BlockType.LEAVES);
  assert.equal(world.getBlock(6, 5, 6), BlockType.AIR);
});

test('placeTree não sobrescreve blocos existentes com folhas', () => {
  const world = createEmptyWorld({ height: 16 });
  world.setBlock(5, 6, 4, BlockType.STONE);
  placeTree(world, { x: 4, z: 4, groundY: 2, trunkHeight: 5 });
  assert.equal(world.getBlock(5, 6, 4), BlockType.STONE);
});

test('treeInCell é determinístico e posiciona a árvore dentro da célula', () => {
  const trees = [];
  for (let cell = -10; cell < 10; cell++) {
    const tree = treeInCell(11, cell, -cell, flatTerrain(10));
    assert.deepEqual(tree, treeInCell(11, cell, -cell, flatTerrain(10)));
    if (tree === null) continue;
    trees.push(tree);
    const cellStartX = cell * TREE_SETTINGS.cellSize;
    assert.ok(tree.x >= cellStartX + TREE_SETTINGS.margin);
    assert.ok(tree.x <= cellStartX + TREE_SETTINGS.cellSize - 1 - TREE_SETTINGS.margin);
    assert.equal(tree.groundY, 10);
  }
  assert.ok(trees.length > 0);
});

test('treeInCell não planta em terreno infértil', () => {
  for (let cell = 0; cell < 20; cell++) {
    assert.equal(treeInCell(11, cell, cell, flatTerrain(10, false)), null);
  }
});

test('treesInArea considera todas as células que tocam a área', () => {
  const area = { minX: -8, minZ: -8, maxX: 20, maxZ: 20 };
  const trees = treesInArea(3, area, flatTerrain(10));
  const expected = [];
  for (let cellZ = -2; cellZ <= 2; cellZ++) {
    for (let cellX = -2; cellX <= 2; cellX++) {
      const tree = treeInCell(3, cellX, cellZ, flatTerrain(10));
      if (tree !== null) expected.push(tree);
    }
  }
  assert.deepEqual(trees, expected);
});
