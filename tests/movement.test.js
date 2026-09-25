import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOVEMENT_SETTINGS, horizontalVelocity, verticalVelocity } from '../src/player/movement.js';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test('andar para frente com yaw zero segue -Z', () => {
  const velocity = horizontalVelocity({ forward: 1, strafe: 0 }, 0, 4);
  close(velocity.x, 0);
  close(velocity.z, -4);
});

test('andar para a direita com yaw zero segue +X', () => {
  const velocity = horizontalVelocity({ forward: 0, strafe: 1 }, 0, 4);
  close(velocity.x, 4);
  close(velocity.z, 0);
});

test('yaw de 90 graus gira a direção de movimento', () => {
  const velocity = horizontalVelocity({ forward: 1, strafe: 0 }, Math.PI / 2, 4);
  close(velocity.x, -4);
  close(velocity.z, 0);
});

test('movimento diagonal é normalizado', () => {
  const velocity = horizontalVelocity({ forward: 1, strafe: 1 }, 0.3, 4);
  close(Math.hypot(velocity.x, velocity.z), 4);
});

test('sem intenção o jogador fica parado', () => {
  const velocity = horizontalVelocity({ forward: 0, strafe: 0 }, 1, 4);
  close(velocity.x, 0);
  close(velocity.z, 0);
});

test('pulo só acontece quando o jogador está no chão', () => {
  const dt = 1 / 60;
  const jump = { jump: true };
  close(verticalVelocity(0, jump, true, dt), MOVEMENT_SETTINGS.jumpSpeed - MOVEMENT_SETTINGS.gravity * dt);
  close(verticalVelocity(0, jump, false, dt), -MOVEMENT_SETTINGS.gravity * dt);
});

test('gravidade respeita a velocidade terminal', () => {
  assert.equal(verticalVelocity(-1000, { jump: false }, false, 1), -MOVEMENT_SETTINGS.terminalSpeed);
});
