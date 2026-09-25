import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TILE_COUNT, Tile, createTileUvLookup, tileFor, tileUvRect } from '../src/render/blockTiles.js';
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

test('tileUvRect fica contido na fatia do tile no atlas', () => {
  const rect = tileUvRect(Tile.STONE);
  assert.ok(rect.u0 > Tile.STONE / TILE_COUNT);
  assert.ok(rect.u1 < (Tile.STONE + 1) / TILE_COUNT);
  assert.ok(rect.v0 > 0 && rect.v1 < 1);
});

test('lookup reutiliza o mesmo retângulo para o mesmo tile', () => {
  const lookup = createTileUvLookup();
  assert.equal(lookup(BlockType.DIRT, FaceDirection.TOP), lookup(BlockType.DIRT, FaceDirection.LEFT));
});
