import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRandom } from '../src/core/random.js';
import { createNoise2D } from '../src/core/noise.js';
import { BlockType } from '../src/world/blockTypes.js';
import { TERRAIN_SETTINGS, columnBlockAt, fillColumn, surfaceHeight } from '../src/world/terrainGenerator.js';
import { createEmptyWorld } from './helpers.js';

test('columnBlockAt empilha grama, terra e pedra', () => {
  const surface = 20;
  assert.equal(columnBlockAt(21, surface), BlockType.AIR);
  assert.equal(columnBlockAt(20, surface), BlockType.GRASS);
  assert.equal(columnBlockAt(19, surface), BlockType.DIRT);
  assert.equal(columnBlockAt(20 - TERRAIN_SETTINGS.dirtDepth, surface), BlockType.DIRT);
  assert.equal(columnBlockAt(20 - TERRAIN_SETTINGS.dirtDepth - 1, surface), BlockType.STONE);
});

test('columnBlockAt gera picos rochosos acima da linha de rocha', () => {
  const surface = TERRAIN_SETTINGS.rockLine + 2;
  assert.equal(columnBlockAt(surface, surface), BlockType.STONE);
});

test('surfaceHeight respeita os limites e varia pelo terreno', () => {
  const noise = createNoise2D(createRandom(42));
  const heights = [];
  for (let z = -64; z < 64; z += 4) {
    for (let x = -64; x < 64; x += 4) heights.push(surfaceHeight(noise, x, z, 40));
  }
  assert.ok(Math.min(...heights) >= 1);
  assert.ok(Math.max(...heights) <= 40);
  assert.ok(new Set(heights).size > 5);
  assert.ok(heights.every(Number.isInteger));
});

test('fillColumn preenche a coluna até a superfície', () => {
  const world = createEmptyWorld({ height: 32 });
  fillColumn(world, 5, 7, 20);
  assert.equal(world.findSurfaceY(5, 7), 20);
  assert.equal(world.getBlock(5, 20, 7), BlockType.GRASS);
  assert.equal(world.getBlock(5, 0, 7), BlockType.STONE);
  assert.equal(world.getBlock(5, 21, 7), BlockType.AIR);
});
