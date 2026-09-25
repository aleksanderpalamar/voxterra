import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Player, PLAYER_DIMENSIONS } from '../src/player/player.js';
import { VoxelCollider } from '../src/physics/voxelCollider.js';
import { createCollisionQuery } from '../src/world/worldQueries.js';
import { IDLE_INTENT } from '../src/input/keyBindings.js';
import { createFlatWorld } from './helpers.js';

function createPlayer() {
  const world = createFlatWorld({ groundY: 4 });
  const collider = new VoxelCollider(createCollisionQuery(world), PLAYER_DIMENSIONS);
  return new Player({ x: 8.5, y: 5, z: 8.5 }, collider);
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
