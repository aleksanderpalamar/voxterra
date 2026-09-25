import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TILE_SIZE, paintAllTiles, paintTile } from '../src/render/tilePainters.js';
import { buildAtlasLevels, composeAtlasLevel, downsampleTile } from '../src/render/atlasLayout.js';
import { TILE_COUNT, Tile } from '../src/render/blockTiles.js';

function averageColor(pixels) {
  const totals = [0, 0, 0];
  for (let i = 0; i < pixels.length; i += 4) {
    totals[0] += pixels[i];
    totals[1] += pixels[i + 1];
    totals[2] += pixels[i + 2];
  }
  return totals.map((total) => total / (pixels.length / 4));
}

test('todos os tiles são opacos e do tamanho esperado', () => {
  const tiles = paintAllTiles();
  assert.equal(tiles.length, TILE_COUNT);
  tiles.forEach((pixels) => {
    assert.equal(pixels.length, TILE_SIZE * TILE_SIZE * 4);
    for (let i = 3; i < pixels.length; i += 4) assert.equal(pixels[i], 255);
  });
});

test('tiles são determinísticos e visualmente distintos', () => {
  assert.deepEqual(paintTile(Tile.DIRT), paintTile(Tile.DIRT));
  const [grassR, grassG] = averageColor(paintTile(Tile.GRASS_TOP));
  const [stoneR, stoneG, stoneB] = averageColor(paintTile(Tile.STONE));
  assert.ok(grassG > grassR * 1.3);
  assert.ok(Math.abs(stoneR - stoneB) < 15 && Math.abs(stoneG - stoneB) < 15);
});

test('paintTile retorna null para tile desconhecido', () => {
  assert.equal(paintTile(999), null);
});

test('downsampleTile calcula a média de blocos 2x2', () => {
  const pixels = new Uint8ClampedArray([0, 0, 0, 255, 100, 100, 100, 255, 200, 200, 200, 255, 100, 100, 100, 255]);
  assert.deepEqual(Array.from(downsampleTile(pixels, 2)), [100, 100, 100, 255]);
});

test('composeAtlasLevel posiciona tiles lado a lado com linhas invertidas', () => {
  const red = new Uint8ClampedArray([255, 0, 0, 255]);
  const blue = new Uint8ClampedArray([0, 0, 255, 255]);
  const atlas = composeAtlasLevel([red, blue], 1);
  assert.equal(atlas.width, 2);
  assert.deepEqual(Array.from(atlas.data), [255, 0, 0, 255, 0, 0, 255, 255]);
  const tall = composeAtlasLevel([new Uint8ClampedArray([1, 1, 1, 255, 1, 1, 1, 255, 9, 9, 9, 255, 9, 9, 9, 255])], 2);
  assert.equal(tall.data[0], 9);
});

test('buildAtlasLevels gera a cadeia de mipmaps por tile', () => {
  const levels = buildAtlasLevels(paintAllTiles(), TILE_SIZE);
  assert.deepEqual(levels.map((level) => level.height), [16, 8, 4, 2, 1]);
  assert.equal(levels.at(-1).width, TILE_COUNT);
});
