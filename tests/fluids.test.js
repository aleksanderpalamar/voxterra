import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WATER_SURFACE_HEIGHT, mediumAt } from '../src/world/fluids.js';
import { BlockType, Medium } from '../src/world/blockTypes.js';

const column = (types) => (x, y) => (x === 0 && types[y] !== undefined ? types[y] : BlockType.AIR);
const lake = column([BlockType.STONE, BlockType.WATER, BlockType.WATER]);

test('pontos dentro de água coberta por água estão submersos', () => {
  assert.equal(mediumAt(lake, 0.5, 1.99, 0.5), Medium.WATER);
});

test('a superfície da água fica um pouco abaixo do topo do bloco', () => {
  assert.equal(mediumAt(lake, 0.5, 2 + WATER_SURFACE_HEIGHT - 0.01, 0.5), Medium.WATER);
  assert.equal(mediumAt(lake, 0.5, 2 + WATER_SURFACE_HEIGHT + 0.01, 0.5), Medium.AIR);
});

test('ar e blocos sólidos não são meio aquático', () => {
  assert.equal(mediumAt(lake, 0.5, 3.5, 0.5), Medium.AIR);
  assert.equal(mediumAt(lake, 0.5, 0.5, 0.5), Medium.AIR);
});
