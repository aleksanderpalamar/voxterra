export const KeyBinding = Object.freeze({
  FORWARD: 'KeyW',
  BACKWARD: 'KeyS',
  LEFT: 'KeyA',
  RIGHT: 'KeyD',
  JUMP: 'Space',
  DEBUG: 'F3',
});

export const IDLE_INTENT = Object.freeze({ forward: 0, strafe: 0, jump: false });

const DIGIT_PREFIX = 'Digit';

function axisValue(isPressed, positive, negative) {
  return Number(isPressed(positive)) - Number(isPressed(negative));
}

export function readMovementIntent(isPressed) {
  return {
    forward: axisValue(isPressed, KeyBinding.FORWARD, KeyBinding.BACKWARD),
    strafe: axisValue(isPressed, KeyBinding.RIGHT, KeyBinding.LEFT),
    jump: isPressed(KeyBinding.JUMP),
  };
}

export function hotbarSlotFromKey(code, slotCount) {
  if (!code.startsWith(DIGIT_PREFIX)) return null;
  const slot = Number(code.slice(DIGIT_PREFIX.length)) - 1;
  if (!Number.isInteger(slot) || slot < 0 || slot >= slotCount) return null;
  return slot;
}
