import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chunk } from '../src/world/chunk.js';
import { BlockType } from '../src/world/blockTypes.js';
import { CHUNK_SIZE, chunkVolume } from '../src/world/chunkLayout.js';

test('chunk usa coordenadas de mundo a partir da sua origem', () => {
  const chunk = new Chunk(2, -1, 8);
  assert.equal(chunk.originX, 2 * CHUNK_SIZE);
  assert.equal(chunk.originZ, -CHUNK_SIZE);
  assert.equal(chunk.setBlock(33, 3, -5, BlockType.WOOD), true);
  assert.equal(chunk.getBlock(33, 3, -5), BlockType.WOOD);
  assert.equal(chunk.blocks.length, chunkVolume(8));
});

test('chunk ignora posições fora dos seus limites', () => {
  const chunk = new Chunk(0, 0, 8);
  assert.equal(chunk.setBlock(CHUNK_SIZE, 1, 1, BlockType.STONE), false);
  assert.equal(chunk.setBlock(1, 8, 1, BlockType.STONE), false);
  assert.equal(chunk.getBlock(-1, 1, 1), BlockType.AIR);
  assert.equal(chunk.contains(0, 0, CHUNK_SIZE - 1), true);
  assert.equal(chunk.contains(0, -1, 0), false);
});

test('setBlock informa quando o bloco não muda', () => {
  const chunk = new Chunk(0, 0, 8);
  chunk.setBlock(1, 1, 1, BlockType.DIRT);
  assert.equal(chunk.setBlock(1, 1, 1, BlockType.DIRT), false);
});

test('chunk pode ser criado a partir de dados existentes', () => {
  const blocks = new Uint8Array(chunkVolume(4));
  blocks[0] = BlockType.STONE;
  const chunk = new Chunk(1, 1, 4, blocks);
  assert.equal(chunk.getBlock(CHUNK_SIZE, 0, CHUNK_SIZE), BlockType.STONE);
});

test('markDirty e markSaved controlam as alterações pendentes', () => {
  const chunk = new Chunk(0, 0, 4);
  assert.equal(chunk.dirty, false);
  chunk.markDirty();
  assert.equal(chunk.dirty, true);
  chunk.markSaved();
  assert.equal(chunk.dirty, false);
});
