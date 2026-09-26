import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Player, PLAYER_DIMENSIONS } from '../src/player/player.js';
import { VoxelCollider } from '../src/physics/voxelCollider.js';
import { createCollisionQuery } from '../src/world/worldQueries.js';
import { IDLE_INTENT } from '../src/input/keyBindings.js';
import { createFlatWorld } from './helpers.js';
import { mediumAt } from '../src/world/fluids.js';
import { BlockType } from '../src/world/blockTypes.js';

function createPlayerIn(world, spawn) {
  const collider = new VoxelCollider(createCollisionQuery(world), PLAYER_DIMENSIONS);
  const mediumAtPoint = (x, y, z) => mediumAt((bx, by, bz) => world.getBlock(bx, by, bz), x, y, z);
  return new Player({ spawn, collider, mediumAt: mediumAtPoint });
}

function createPlayer() {
  return createPlayerIn(createFlatWorld({ groundY: 4 }), { x: 8.5, y: 5, z: 8.5 });
}

function createPool({ floorY = 1, waterTop = 8, ledgeX = null } = {}) {
  const world = createFlatWorld({ height: 16, groundY: floorY });
  for (let z = 0; z < 16; z++) {
    for (let x = 0; x < 16; x++) {
      for (let y = floorY + 1; y <= waterTop; y++) world.setBlock(x, y, z, BlockType.WATER);
      if (ledgeX !== null && x >= ledgeX) {
        for (let y = floorY + 1; y <= waterTop + 1; y++) world.setBlock(x, y, z, BlockType.STONE);
      }
    }
  }
  return world;
}

function simulate(player, intent, frames) {
  for (let i = 0; i < frames; i++) player.update(1 / 60, intent);
}

test('pitch é limitado para não virar a câmera', () => {
  const player = createPlayer();
  player.look(0, 10);
  assert.ok(player.pitch < Math.PI / 2);
  player.look(0, -20);
  assert.ok(player.pitch > -Math.PI / 2);
});

test('lookDirection é unitário e aponta para -Z inicialmente', () => {
  const player = createPlayer();
  const direction = player.lookDirection();
  assert.ok(Math.abs(Math.hypot(direction.x, direction.y, direction.z) - 1) < 1e-9);
  assert.ok(direction.z < -0.99);
});

test('jogador pula e volta ao chão', () => {
  const player = createPlayer();
  simulate(player, IDLE_INTENT, 5);
  assert.equal(player.grounded, true);
  simulate(player, { ...IDLE_INTENT, jump: true }, 10);
  assert.ok(player.position.y > 5.5);
  simulate(player, IDLE_INTENT, 90);
  assert.equal(player.grounded, true);
  assert.ok(Math.abs(player.position.y - 5) < 0.01);
});

test('jogador caminha sobre o terreno', () => {
  const player = createPlayer();
  simulate(player, { forward: 1, strafe: 0, jump: false }, 30);
  assert.ok(player.position.z < 8);
  assert.ok(Math.abs(player.position.y - 5) < 0.01);
});

test('eyePosition fica na altura dos olhos', () => {
  const player = createPlayer();
  assert.equal(player.eyePosition().y, 5 + PLAYER_DIMENSIONS.eyeHeight);
});

test('snapshot e setOrientation preservam posição e direção do olhar', () => {
  const player = createPlayer();
  player.setOrientation(1.25, 3);
  const state = player.snapshot();
  assert.equal(state.yaw, 1.25);
  assert.ok(state.pitch < Math.PI / 2);
  assert.deepEqual({ x: state.x, y: state.y, z: state.z }, { x: 8.5, y: 5, z: 8.5 });
  state.x = 99;
  assert.equal(player.position.x, 8.5);
});

test('na água o jogador afunda mais devagar do que cai no ar', () => {
  const pool = createPlayerIn(createPool(), { x: 8.5, y: 7.5, z: 8.5 });
  const air = createPlayerIn(createFlatWorld({ height: 16, groundY: 1 }), { x: 8.5, y: 7.5, z: 8.5 });
  simulate(pool, IDLE_INTENT, 20);
  simulate(air, IDLE_INTENT, 20);
  assert.ok(pool.position.y > air.position.y + 1);
});

test('o jogador não fica em pé sobre a água', () => {
  const player = createPlayerIn(createPool(), { x: 8.5, y: 9, z: 8.5 });
  simulate(player, IDLE_INTENT, 240);
  assert.ok(player.position.y < 3);
});

test('segurar pular na água leva o jogador de volta à superfície', () => {
  const player = createPlayerIn(createPool(), { x: 8.5, y: 2, z: 8.5 });
  simulate(player, { ...IDLE_INTENT, jump: true }, 240);
  assert.ok(player.position.y > 7.5, `ficou em ${player.position.y}`);
});

test('nadando contra um degrau o jogador consegue sair da água', () => {
  const player = createPlayerIn(createPool({ ledgeX: 11 }), { x: 9.5, y: 7.2, z: 8.5 });
  player.setOrientation(-Math.PI / 2, 0);
  simulate(player, { forward: 1, strafe: 0, jump: true }, 180);
  assert.ok(player.position.x > 11, `parou em x=${player.position.x}`);
  assert.ok(player.position.y >= 10 - 1e-3);
});
