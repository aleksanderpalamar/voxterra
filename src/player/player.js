import { bodyBox } from '../physics/aabb.js';
import { MOVEMENT_SETTINGS, horizontalVelocity, verticalVelocity } from './movement.js';

export const PLAYER_DIMENSIONS = Object.freeze({
  width: 0.6,
  height: 1.8,
  eyeHeight: 1.62,
});

const PITCH_LIMIT = Math.PI / 2 - 0.001;

export class Player {
  constructor(spawn, collider, dimensions = PLAYER_DIMENSIONS, settings = MOVEMENT_SETTINGS) {
    this.position = { x: spawn.x, y: spawn.y, z: spawn.z };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.yaw = 0;
    this.pitch = 0;
    this.grounded = false;
    this.collider = collider;
    this.dimensions = dimensions;
    this.settings = settings;
  }

  look(deltaYaw, deltaPitch) {
    this.setOrientation(this.yaw + deltaYaw, this.pitch + deltaPitch);
  }

  setOrientation(yaw, pitch) {
    this.yaw = yaw % (Math.PI * 2);
    this.pitch = Math.min(Math.max(pitch, -PITCH_LIMIT), PITCH_LIMIT);
  }

  snapshot() {
    const { x, y, z } = this.position;
    return { x, y, z, yaw: this.yaw, pitch: this.pitch };
  }

  update(dt, intent) {
    const horizontal = horizontalVelocity(intent, this.yaw, this.settings.walkSpeed);
    this.velocity.x = horizontal.x;
    this.velocity.z = horizontal.z;
    this.velocity.y = verticalVelocity(this.velocity.y, intent, this.grounded, dt, this.settings);
    this.grounded = this.collider.move(this.position, this.velocity, dt);
  }

  eyePosition() {
    return {
      x: this.position.x,
      y: this.position.y + this.dimensions.eyeHeight,
      z: this.position.z,
    };
  }

  lookDirection() {
    const cosPitch = Math.cos(this.pitch);
    return {
      x: -Math.sin(this.yaw) * cosPitch,
      y: Math.sin(this.pitch),
      z: -Math.cos(this.yaw) * cosPitch,
    };
  }

  bounds() {
    return bodyBox(this.position, this.dimensions);
  }
}
