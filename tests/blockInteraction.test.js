import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BlockType } from '../src/world/blockTypes.js';
import { bodyBox } from '../src/physics/aabb.js';
import { PLAYER_DIMENSIONS } from '../src/player/player.js';
import {
  BreakResult,
  PlacementResult,
  breakBlock,
  placeBlock,
  placementPosition,
} from '../src/interaction/blockInteraction.js';
import { createFlatWorld } from './helpers.js';

const farAwayBox = bodyBox({ x: 1.5, y: 5, z: 1.5 }, PLAYER_DIMENSIONS);

test('placementPosition soma a normal da face atingida', () => {
  const hit = { position: { x: 3, y: 4, z: 5 }, normal: { x: 0, y: 1, z: 0 } };
  assert.deepEqual(placementPosition(hit), { x: 3, y: 5, z: 5 });
});

test('quebrar um bloco o transforma em ar', () => {
  const world = createFlatWorld({ groundY: 4 });
  assert.equal(breakBlock(world, { x: 8, y: 4, z: 8 }), BreakResult.BROKEN);
  assert.equal(world.getBlock(8, 4, 8), BlockType.AIR);
});

test('não é possível quebrar ar nem a camada do fundo', () => {
  const world = createFlatWorld({ groundY: 4 });
  assert.equal(breakBlock(world, { x: 8, y: 9, z: 8 }), BreakResult.EMPTY);
  assert.equal(breakBlock(world, { x: 8, y: 0, z: 8 }), BreakResult.UNBREAKABLE);
  assert.equal(world.getBlock(8, 0, 8), BlockType.STONE);
});

test('colocar bloco na face selecionada', () => {
  const world = createFlatWorld({ groundY: 4 });
  const hit = { position: { x: 8, y: 4, z: 8 }, normal: { x: 0, y: 1, z: 0 } };
  assert.equal(placeBlock(world, hit, BlockType.WOOD, farAwayBox), PlacementResult.PLACED);
  assert.equal(world.getBlock(8, 5, 8), BlockType.WOOD);
});

test('não coloca bloco dentro do jogador', () => {
  const world = createFlatWorld({ groundY: 4 });
  const playerBox = bodyBox({ x: 8.5, y: 5, z: 8.5 }, PLAYER_DIMENSIONS);
  const hit = { position: { x: 8, y: 4, z: 8 }, normal: { x: 0, y: 1, z: 0 } };
  assert.equal(placeBlock(world, hit, BlockType.DIRT, playerBox), PlacementResult.BLOCKED_BY_PLAYER);
  assert.equal(world.getBlock(8, 5, 8), BlockType.AIR);
});

test('não coloca bloco em posição ocupada nem fora do mundo', () => {
  const world = createFlatWorld({ size: 16, height: 16, groundY: 15 });
  const occupied = { position: { x: 8, y: 3, z: 8 }, normal: { x: 0, y: 1, z: 0 } };
  const outside = { position: { x: 8, y: 15, z: 8 }, normal: { x: 0, y: 1, z: 0 } };
  assert.equal(placeBlock(world, occupied, BlockType.DIRT, farAwayBox), PlacementResult.OCCUPIED);
  assert.equal(placeBlock(world, outside, BlockType.DIRT, farAwayBox), PlacementResult.OUT_OF_WORLD);
});

test('não coloca bloco quando o alvo não possui face definida', () => {
  const world = createFlatWorld({ groundY: 4 });
  const hit = { position: { x: 8, y: 4, z: 8 }, normal: { x: 0, y: 0, z: 0 } };
  assert.equal(placeBlock(world, hit, BlockType.DIRT, farAwayBox), PlacementResult.INVALID_FACE);
});
