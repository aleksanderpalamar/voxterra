import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BlockType,
  Medium,
  RenderLayer,
  blockName,
  isOpaqueBlock,
  isReplaceableBlock,
  isSolidBlock,
  mediumOf,
  renderLayerOf,
} from '../src/world/blockTypes.js';

test('folhas são sólidas mas não opacas', () => {
  assert.equal(isSolidBlock(BlockType.LEAVES), true);
  assert.equal(isOpaqueBlock(BlockType.LEAVES), false);
});

test('blocos comuns são opacos e o ar não', () => {
  [BlockType.GRASS, BlockType.DIRT, BlockType.STONE, BlockType.WOOD].forEach((type) => {
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
  assert.equal(renderLayerOf(BlockType.LEAVES), RenderLayer.SOLID);
  assert.equal(mediumOf(BlockType.STONE), Medium.AIR);
});

test('gelo é sólido, opaco e tem nome', () => {
  assert.equal(isSolidBlock(BlockType.ICE), true);
  assert.equal(isOpaqueBlock(BlockType.ICE), true);
  assert.equal(blockName(BlockType.ICE), 'Ice');
});
