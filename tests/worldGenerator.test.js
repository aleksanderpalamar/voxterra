import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world/world.js';
import { BlockType } from '../src/world/blockTypes.js';
import { findSpawnPoint, generateWorld } from '../src/world/worldGenerator.js';

function countBlocks(world, type) {
  return world.blocks.reduce((total, block) => total + (block === type ? 1 : 0), 0);
}

test('generateWorld é determinístico para a mesma seed', () => {
  const a = new World(48, 64, 48);
  const b = new World(48, 64, 48);
  generateWorld(a, 77);
  generateWorld(b, 77);
  assert.deepEqual(a.blocks, b.blocks);
});

test('generateWorld cria todos os tipos de bloco do terreno', () => {
  const world = new World(64, 64, 64);
  generateWorld(world, 2024);
  [BlockType.GRASS, BlockType.DIRT, BlockType.STONE, BlockType.WOOD, BlockType.LEAVES].forEach((type) => {
    assert.ok(countBlocks(world, type) > 0, `bloco ${type} ausente`);
  });
});

test('findSpawnPoint posiciona o jogador sobre grama e fora de blocos', () => {
  const world = new World(64, 64, 64);
  generateWorld(world, 5);
  const spawn = findSpawnPoint(world);
  const x = Math.floor(spawn.x);
  const z = Math.floor(spawn.z);
  assert.equal(world.getBlock(x, spawn.y - 1, z), BlockType.GRASS);
  assert.equal(world.getBlock(x, spawn.y, z), BlockType.AIR);
  assert.equal(world.getBlock(x, spawn.y + 1, z), BlockType.AIR);
});
