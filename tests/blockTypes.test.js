import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BlockType,
  Medium,
  RenderLayer,
  blockName,
  isOpaqueBlock,
  isLogBlock,
  isReplaceableBlock,
  isSolidBlock,
  PLACEABLE_BLOCKS,
  mediumOf,
  renderLayerOf,
} from '../src/world/blockTypes.js';

test('folhas são sólidas mas não opacas', () => {
  assert.equal(isSolidBlock(BlockType.OAK_LEAVES), true);
  assert.equal(isOpaqueBlock(BlockType.OAK_LEAVES), false);
});

test('blocos comuns são opacos e o ar não', () => {
  [BlockType.GRASS, BlockType.DIRT, BlockType.STONE, BlockType.OAK_WOOD].forEach((type) => {
    assert.equal(isOpaqueBlock(type), true);
  });
  assert.equal(isOpaqueBlock(BlockType.AIR), false);
});

test('areia e neve são blocos sólidos e opacos com nome', () => {
  [BlockType.SAND, BlockType.SNOW].forEach((type) => {
    assert.equal(isSolidBlock(type), true);
    assert.equal(isOpaqueBlock(type), true);
  });
  assert.equal(blockName(BlockType.SAND), 'Sand');
  assert.equal(blockName(BlockType.SNOW), 'Snow');
});

test('água é um fluido atravessável, translúcido e substituível', () => {
  assert.equal(isSolidBlock(BlockType.WATER), false);
  assert.equal(isOpaqueBlock(BlockType.WATER), false);
  assert.equal(isReplaceableBlock(BlockType.WATER), true);
  assert.equal(renderLayerOf(BlockType.WATER), RenderLayer.WATER);
  assert.equal(mediumOf(BlockType.WATER), Medium.WATER);
  assert.equal(blockName(BlockType.WATER), 'Water');
});

test('ar é substituível e blocos comuns não', () => {
  assert.equal(isReplaceableBlock(BlockType.AIR), true);
  assert.equal(isReplaceableBlock(BlockType.STONE), false);
  assert.equal(renderLayerOf(BlockType.AIR), RenderLayer.NONE);
  assert.equal(renderLayerOf(BlockType.OAK_LEAVES), RenderLayer.SOLID);
  assert.equal(mediumOf(BlockType.STONE), Medium.AIR);
});

test('gelo é sólido, opaco e tem nome', () => {
  assert.equal(isSolidBlock(BlockType.ICE), true);
  assert.equal(isOpaqueBlock(BlockType.ICE), true);
  assert.equal(blockName(BlockType.ICE), 'Ice');
});

test('folhas de pinheiro são vazadas e cacto é sólido e opaco', () => {
  assert.equal(isSolidBlock(BlockType.SPRUCE_LEAVES), true);
  assert.equal(isOpaqueBlock(BlockType.SPRUCE_LEAVES), false);
  assert.equal(isOpaqueBlock(BlockType.CACTUS), true);
  assert.equal(blockName(BlockType.CACTUS), 'Cactus');
});

test('folhas persistentes se comportam como folhas comuns e são o item da hotbar', () => {
  assert.equal(isSolidBlock(BlockType.PERSISTENT_LEAVES), true);
  assert.equal(isOpaqueBlock(BlockType.PERSISTENT_LEAVES), false);
  assert.equal(blockName(BlockType.PERSISTENT_LEAVES), 'Oak Leaves');
  assert.ok(PLACEABLE_BLOCKS.includes(BlockType.PERSISTENT_LEAVES));
  assert.ok(!PLACEABLE_BLOCKS.includes(BlockType.OAK_LEAVES));
});

test('madeiras de cada espécie são troncos sólidos e opacos', () => {
  [BlockType.OAK_WOOD, BlockType.SPRUCE_WOOD, BlockType.ACACIA_WOOD, BlockType.JUNGLE_WOOD].forEach((type) => {
    assert.equal(isLogBlock(type), true);
    assert.equal(isSolidBlock(type), true);
    assert.equal(isOpaqueBlock(type), true);
  });
  [BlockType.OAK_LEAVES, BlockType.CACTUS, BlockType.STONE].forEach((type) => assert.equal(isLogBlock(type), false));
  assert.deepEqual([BlockType.SPRUCE_WOOD, BlockType.ACACIA_WOOD, BlockType.JUNGLE_WOOD].map(blockName), ['Spruce Wood', 'Acacia Wood', 'Jungle Wood']);
});

test('cada espécie tem folhas próprias, vazadas e com nome', () => {
  const leaves = [BlockType.OAK_LEAVES, BlockType.SPRUCE_LEAVES, BlockType.ACACIA_LEAVES, BlockType.JUNGLE_LEAVES];
  leaves.forEach((type) => {
    assert.equal(isSolidBlock(type), true);
    assert.equal(isOpaqueBlock(type), false);
  });
  assert.deepEqual(leaves.map(blockName), ['Oak Leaves', 'Spruce Leaves', 'Acacia Leaves', 'Jungle Leaves']);
  assert.equal(blockName(BlockType.OAK_WOOD), 'Oak Wood');
});

test('a hotbar oferece as quatro madeiras além de terra, pedra e folhas', () => {
  assert.deepEqual(PLACEABLE_BLOCKS, [
    BlockType.GRASS,
    BlockType.DIRT,
    BlockType.STONE,
    BlockType.OAK_WOOD,
    BlockType.SPRUCE_WOOD,
    BlockType.ACACIA_WOOD,
    BlockType.JUNGLE_WOOD,
    BlockType.PERSISTENT_LEAVES,
  ]);
});
