import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCollisionQuery } from '../src/world/worldQueries.js';
import { VoxelCollider } from '../src/physics/voxelCollider.js';
import { PLAYER_DIMENSIONS } from '../src/player/player.js';
import { BlockType } from '../src/world/blockTypes.js';
import { createFlatWorld } from './helpers.js';

function setup() {
  const world = createFlatWorld({ groundY: 4 });
  return { world, collider: new VoxelCollider(createCollisionQuery(world), PLAYER_DIMENSIONS) };
}

test('corpo em queda para sobre o chão e fica apoiado', () => {
  const { collider } = setup();
  const position = { x: 8.5, y: 7, z: 8.5 };
  const velocity = { x: 0, y: 0, z: 0 };
  let grounded = false;
  for (let i = 0; i < 30; i++) {
    velocity.y = -10;
    grounded = collider.move(position, velocity, 1 / 60).grounded;
  }
  assert.equal(grounded, true);
  assert.ok(Math.abs(position.y - 5) < 0.01);
  assert.equal(velocity.y, 0);
});

test('corpo não atravessa uma parede', () => {
  const { world, collider } = setup();
  for (let y = 5; y <= 7; y++) world.setBlock(10, y, 8, BlockType.STONE);
  const position = { x: 8.5, y: 5, z: 8.5 };
  const velocity = { x: 5, y: 0, z: 0 };
  for (let i = 0; i < 60; i++) collider.move(position, velocity, 1 / 60);
  assert.ok(position.x + PLAYER_DIMENSIONS.width / 2 <= 10);
  assert.equal(velocity.x, 0);
});

test('queda muito rápida não atravessa o chão', () => {
  const { collider } = setup();
  const position = { x: 8.5, y: 12, z: 8.5 };
  const velocity = { x: 0, y: -200, z: 0 };
  const { grounded } = collider.move(position, velocity, 0.05);
  assert.equal(grounded, true);
  assert.ok(position.y >= 5);
});

test('cabeça bate no teto e zera a velocidade vertical', () => {
  const { world, collider } = setup();
  world.setBlock(8, 7, 8, BlockType.STONE);
  const position = { x: 8.5, y: 5, z: 8.5 };
  const velocity = { x: 0, y: 8, z: 0 };
  collider.move(position, velocity, 0.1);
  assert.ok(position.y + PLAYER_DIMENSIONS.height <= 7);
  assert.equal(velocity.y, 0);
});

test('borda do mundo funciona como parede invisível', () => {
  const { collider } = setup();
  const position = { x: 1, y: 5, z: 8.5 };
  const velocity = { x: -5, y: 0, z: 0 };
  for (let i = 0; i < 60; i++) collider.move(position, velocity, 1 / 60);
  assert.ok(position.x - PLAYER_DIMENSIONS.width / 2 >= 0);
});

test('o relatório de colisão indica bloqueio horizontal', () => {
  const { world, collider } = setup();
  world.setBlock(10, 5, 8, BlockType.STONE);
  const position = { x: 9.5, y: 5, z: 8.5 };
  assert.equal(collider.move(position, { x: 5, y: 0, z: 0 }, 1 / 20).blockedHorizontally, true);
  assert.equal(collider.move(position, { x: 0, y: 0, z: 5 }, 1 / 60).blockedHorizontally, false);
});
