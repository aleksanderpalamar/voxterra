import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KeyBinding, hotbarSlotFromKey, readMovementIntent } from '../src/input/keyBindings.js';

const pressed = (...codes) => (code) => codes.includes(code);

test('WASD e espaço são convertidos em intenção de movimento', () => {
  assert.deepEqual(readMovementIntent(pressed(KeyBinding.FORWARD, KeyBinding.LEFT, KeyBinding.JUMP)), {
    forward: 1,
    strafe: -1,
    jump: true,
  });
});

test('teclas opostas se anulam', () => {
  const intent = readMovementIntent(pressed(KeyBinding.FORWARD, KeyBinding.BACKWARD, KeyBinding.RIGHT, KeyBinding.LEFT));
  assert.equal(intent.forward, 0);
  assert.equal(intent.strafe, 0);
});

test('teclas numéricas selecionam slots válidos da hotbar', () => {
  assert.equal(hotbarSlotFromKey('Digit1', 5), 0);
  assert.equal(hotbarSlotFromKey('Digit5', 5), 4);
  assert.equal(hotbarSlotFromKey('Digit6', 5), null);
  assert.equal(hotbarSlotFromKey('Digit0', 5), null);
  assert.equal(hotbarSlotFromKey('KeyW', 5), null);
});
