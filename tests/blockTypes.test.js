import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BlockType, isOpaqueBlock, isSolidBlock } from '../src/world/blockTypes.js';

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
