export const MOVEMENT_SETTINGS = Object.freeze({
  walkSpeed: 4.6,
  jumpSpeed: 8.4,
  gravity: 27,
  terminalSpeed: 50,
  swimSpeedFactor: 0.55,
  swimSpeed: 3.4,
  waterDrag: 4,
  waterSinkSpeed: 1.5,
  waterExitSpeed: 9.8,
});

export function horizontalVelocity(intent, yaw, speed) {
  const x = -Math.sin(yaw) * intent.forward + Math.cos(yaw) * intent.strafe;
  const z = -Math.cos(yaw) * intent.forward - Math.sin(yaw) * intent.strafe;
  const scale = speed / Math.max(Math.hypot(x, z), 1);
  return { x: x * scale, z: z * scale };
}

export function verticalVelocity(current, intent, grounded, dt, settings = MOVEMENT_SETTINGS) {
  const start = intent.jump && grounded ? settings.jumpSpeed : current;
  return Math.max(start - settings.gravity * dt, -settings.terminalSpeed);
}

export function swimVerticalVelocity(current, intent, blockedHorizontally, dt, settings = MOVEMENT_SETTINGS) {
  if (intent.jump && blockedHorizontally) return settings.waterExitSpeed;
  if (intent.jump) return settings.swimSpeed;
  const blend = Math.min(1, settings.waterDrag * dt);
  return current + (-settings.waterSinkSpeed - current) * blend;
}
