import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TILE_SIZE, paintAllTiles, paintTile } from '../src/render/tilePainters.js';
import { buildAtlasLevels, composeAtlasLevel, downsampleTile, padTile, tileUvRect } from '../src/render/atlasLayout.js';
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

function alphaValues(pixels) {
  return Array.from({ length: pixels.length / 4 }, (_, index) => pixels[index * 4 + 3]);
}

test('tiles sólidos são opacos e do tamanho esperado', () => {
  const tiles = paintAllTiles();
  assert.equal(tiles.length, TILE_COUNT);
  tiles.forEach((pixels, tile) => {
    assert.equal(pixels.length, TILE_SIZE * TILE_SIZE * 4);
    if (tile === Tile.LEAVES) return;
    assert.ok(alphaValues(pixels).every((alpha) => alpha === 255));
  });
});

test('folhas possuem furos transparentes e partes opacas', () => {
  const alphas = alphaValues(paintTile(Tile.LEAVES));
  const holes = alphas.filter((alpha) => alpha === 0).length;
  assert.ok(alphas.every((alpha) => alpha === 0 || alpha === 255));
  assert.ok(holes > alphas.length * 0.1 && holes < alphas.length * 0.4);
});

test('furos das folhas mantêm cor de folha para não escurecer o filtro', () => {
  const pixels = paintTile(Tile.LEAVES);
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] !== 0) continue;
    assert.ok(pixels[i + 1] > pixels[i] && pixels[i + 1] > pixels[i + 2]);
  }
});

test('areia é amarelada e neve é quase branca', () => {
  const [sandR, sandG, sandB] = averageColor(paintTile(Tile.SAND));
  const [snowR, snowG, snowB] = averageColor(paintTile(Tile.SNOW));
  assert.ok(sandR > sandB + 40 && sandG > sandB + 25);
  assert.ok(Math.min(snowR, snowG, snowB) > 215);
});

test('água é azulada', () => {
  const [red, green, blue] = averageColor(paintTile(Tile.WATER));
  assert.ok(blue > red + 60 && blue > green + 30);
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

test('downsampleTile pondera a cor pelo alpha', () => {
  const pixels = new Uint8ClampedArray([40, 200, 40, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(Array.from(downsampleTile(pixels, 2)), [40, 200, 40, 64]);
});

test('downsampleTile totalmente transparente usa média simples', () => {
  const pixels = new Uint8ClampedArray([10, 20, 30, 0, 30, 40, 50, 0, 10, 20, 30, 0, 30, 40, 50, 0]);
  assert.deepEqual(Array.from(downsampleTile(pixels, 2)), [20, 30, 40, 0]);
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

test('buildAtlasLevels gera a cadeia de mipmaps por célula com margem', () => {
  const levels = buildAtlasLevels(paintAllTiles(), TILE_SIZE);
  assert.deepEqual(levels.map((level) => level.height), [32, 16, 8, 4, 2, 1]);
  assert.equal(levels[0].width, TILE_COUNT * TILE_SIZE * 2);
  assert.equal(levels.at(-1).width, TILE_COUNT);
});

test('padTile repete os pixels da borda na margem e preserva o centro', () => {
  const pixels = new Uint8ClampedArray([10, 0, 0, 255, 20, 0, 0, 255, 30, 0, 0, 255, 40, 0, 0, 255]);
  const cell = padTile(pixels, 2);
  const red = (x, y) => cell[(y * 4 + x) * 4];
  assert.deepEqual([red(1, 1), red(2, 1), red(1, 2), red(2, 2)], [10, 20, 30, 40]);
  assert.deepEqual([red(0, 0), red(3, 0), red(0, 3), red(3, 3)], [10, 20, 30, 40]);
  assert.deepEqual([red(0, 1), red(3, 2)], [10, 40]);
});

test('tileUvRect aponta para o centro da célula, longe dos vizinhos', () => {
  const cellWidth = 1 / TILE_COUNT;
  [0, 4, TILE_COUNT - 1].forEach((tile) => {
    const rect = tileUvRect(tile, TILE_COUNT);
    assert.ok(Math.abs(rect.u0 - (tile + 0.25) * cellWidth) < 1e-12);
    assert.ok(Math.abs(rect.u1 - (tile + 0.75) * cellWidth) < 1e-12);
    assert.deepEqual([rect.v0, rect.v1], [0.25, 0.75]);
  });
});
