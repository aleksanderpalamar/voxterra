import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BlockType } from '../src/world/blockTypes.js';
import { columnBlockAt, fillColumn } from '../src/world/terrainGenerator.js';
import { createEmptyWorld } from './helpers.js';

const GRASSLAND = Object.freeze({ top: BlockType.GRASS, filler: BlockType.DIRT, fillerDepth: 3 });

test('columnBlockAt empilha topo, camada de preenchimento e pedra', () => {
  const surface = 20;
  assert.equal(columnBlockAt(21, surface, GRASSLAND), BlockType.AIR);
  assert.equal(columnBlockAt(20, surface, GRASSLAND), BlockType.GRASS);
  assert.equal(columnBlockAt(19, surface, GRASSLAND), BlockType.DIRT);
  assert.equal(columnBlockAt(17, surface, GRASSLAND), BlockType.DIRT);
  assert.equal(columnBlockAt(16, surface, GRASSLAND), BlockType.STONE);
});

test('columnBlockAt respeita outras camadas de superfície', () => {
  const desert = { top: BlockType.SAND, filler: BlockType.SAND, fillerDepth: 3 };
  assert.equal(columnBlockAt(20, 20, desert), BlockType.SAND);
  assert.equal(columnBlockAt(18, 20, desert), BlockType.SAND);
  assert.equal(columnBlockAt(10, 20, desert), BlockType.STONE);
});

test('fillColumn preenche a coluna até a superfície', () => {
  const world = createEmptyWorld({ height: 32 });
  fillColumn(world, 5, 7, 20, GRASSLAND, 10);
  assert.equal(world.findSurfaceY(5, 7), 20);
  assert.equal(world.getBlock(5, 20, 7), BlockType.GRASS);
  assert.equal(world.getBlock(5, 0, 7), BlockType.STONE);
  assert.equal(world.getBlock(5, 21, 7), BlockType.AIR);
});

test('fillColumn enche de água o espaço entre a superfície e o nível do mar', () => {
  const world = createEmptyWorld({ height: 32 });
  fillColumn(world, 2, 2, 12, GRASSLAND, 15);
  assert.equal(world.getBlock(2, 12, 2), BlockType.GRASS);
  [13, 14, 15].forEach((y) => assert.equal(world.getBlock(2, y, 2), BlockType.WATER));
  assert.equal(world.getBlock(2, 16, 2), BlockType.AIR);
});
