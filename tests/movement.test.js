import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOVEMENT_SETTINGS, horizontalVelocity, swimVerticalVelocity, verticalVelocity } from '../src/player/movement.js';

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

const idle = { jump: false };
const swimUp = { jump: true };

test('na água o jogador afunda devagar até a velocidade limite', () => {
  let velocity = 0;
  for (let i = 0; i < 300; i++) velocity = swimVerticalVelocity(velocity, idle, false, 1 / 60);
  assert.ok(Math.abs(velocity + MOVEMENT_SETTINGS.waterSinkSpeed) < 1e-6);
  assert.ok(MOVEMENT_SETTINGS.waterSinkSpeed < MOVEMENT_SETTINGS.terminalSpeed / 5);
});

test('ao cair na água a queda rápida é amortecida', () => {
  const velocity = swimVerticalVelocity(-20, idle, false, 1 / 60);
  assert.ok(velocity > -20);
  let settled = -20;
  for (let i = 0; i < 60; i++) settled = swimVerticalVelocity(settled, idle, false, 1 / 60);
  assert.ok(settled > -MOVEMENT_SETTINGS.waterSinkSpeed - 0.5, `ainda a ${settled} m/s após 1 s`);
});

test('segurar pular na água faz o jogador subir', () => {
  assert.equal(swimVerticalVelocity(-2, swimUp, false, 1 / 60), MOVEMENT_SETTINGS.swimSpeed);
});

test('encostado num degrau dentro da água, pular dá impulso para sair', () => {
  assert.equal(swimVerticalVelocity(0, swimUp, true, 1 / 60), MOVEMENT_SETTINGS.waterExitSpeed);
  assert.ok(MOVEMENT_SETTINGS.waterExitSpeed > MOVEMENT_SETTINGS.jumpSpeed);
});
