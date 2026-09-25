import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRandom } from '../src/core/random.js';
import { createNoise2D } from '../src/core/noise.js';
import { BlockType } from '../src/world/blockTypes.js';
import { World } from '../src/world/world.js';
import {
  TERRAIN_SETTINGS,
  columnBlockAt,
  createHeightMap,
  fillTerrain,
} from '../src/world/terrainGenerator.js';

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

test('createHeightMap respeita os limites e não é plano', () => {
  const noise = createNoise2D(createRandom(42));
  const heightMap = createHeightMap(noise, 64, 64, 40);
  const heights = Array.from(heightMap.heights);
  assert.ok(Math.min(...heights) >= 1);
  assert.ok(Math.max(...heights) <= 40);
  assert.ok(new Set(heights).size > 5);
});

test('fillTerrain preenche cada coluna até a altura da superfície', () => {
  const noise = createNoise2D(createRandom(8));
  const world = new World(16, 64, 16);
  const heightMap = createHeightMap(noise, 16, 16, 50);
  fillTerrain(world, heightMap);
  const surface = heightMap.heightAt(5, 7);
  assert.equal(world.findSurfaceY(5, 7), surface);
  assert.equal(world.getBlock(5, 0, 7), BlockType.STONE);
  assert.equal(world.getBlock(5, surface + 1, 7), BlockType.AIR);
});
