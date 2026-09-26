import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Tile, createTileUvLookup, tileFor } from '../src/render/blockTiles.js';
import { FaceDirection } from '../src/render/faceDefinitions.js';
import { BlockType } from '../src/world/blockTypes.js';

test('grama usa texturas diferentes para topo, lados e fundo', () => {
  assert.equal(tileFor(BlockType.GRASS, FaceDirection.TOP), Tile.GRASS_TOP);
  assert.equal(tileFor(BlockType.GRASS, FaceDirection.LEFT), Tile.GRASS_SIDE);
  assert.equal(tileFor(BlockType.GRASS, FaceDirection.BOTTOM), Tile.DIRT);
});

test('tronco mostra anéis no topo e casca nos lados', () => {
  assert.equal(tileFor(BlockType.WOOD, FaceDirection.TOP), Tile.WOOD_TOP);
  assert.equal(tileFor(BlockType.WOOD, FaceDirection.FRONT), Tile.WOOD_SIDE);
});

test('lookup reutiliza o mesmo retângulo para o mesmo tile', () => {
  const lookup = createTileUvLookup();
  assert.equal(lookup(BlockType.DIRT, FaceDirection.TOP), lookup(BlockType.DIRT, FaceDirection.LEFT));
});

test('areia e neve usam o mesmo tile em todas as faces', () => {
  [FaceDirection.TOP, FaceDirection.BOTTOM, FaceDirection.LEFT].forEach((direction) => {
    assert.equal(tileFor(BlockType.SAND, direction), Tile.SAND);
    assert.equal(tileFor(BlockType.SNOW, direction), Tile.SNOW);
  });
});

test('água usa o tile de água em todas as faces', () => {
  [FaceDirection.TOP, FaceDirection.FRONT].forEach((direction) => assert.equal(tileFor(BlockType.WATER, direction), Tile.WATER));
});

test('folhas persistentes usam a mesma textura das folhas comuns', () => {
  assert.equal(tileFor(BlockType.PERSISTENT_LEAVES, FaceDirection.TOP), Tile.LEAVES);
});
