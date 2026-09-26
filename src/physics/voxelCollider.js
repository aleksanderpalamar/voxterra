import { anyCellInBox, bodyBox } from './aabb.js';

const MAX_STEP_DISTANCE = 0.35;
const SKIN = 1e-4;
const AXIS_ORDER = Object.freeze(['y', 'x', 'z']);

const AXIS_BOUNDS = Object.freeze({
  x: { min: 'minX', max: 'maxX' },
  y: { min: 'minY', max: 'maxY' },
  z: { min: 'minZ', max: 'maxZ' },
});

export const Contact = Object.freeze({
  NONE: 'none',
  NEGATIVE: 'negative',
  POSITIVE: 'positive',
});

function stepCount(velocity, dt) {
  const largest = Math.max(Math.abs(velocity.x), Math.abs(velocity.y), Math.abs(velocity.z)) * dt;
  return Math.max(1, Math.ceil(largest / MAX_STEP_DISTANCE));
}

export class VoxelCollider {
  constructor(isSolid, dimensions) {
    this.isSolid = isSolid;
    this.dimensions = dimensions;
  }

  collides(position) {
    return anyCellInBox(bodyBox(position, this.dimensions), this.isSolid);
  }

  move(position, velocity, dt) {
    const steps = stepCount(velocity, dt);
    const stepDt = dt / steps;
    const report = { grounded: false, blockedHorizontally: false };
    for (let step = 0; step < steps; step++) {
      for (const axis of AXIS_ORDER) {
        const contact = this.moveAxis(position, velocity, axis, velocity[axis] * stepDt);
        if (contact === Contact.NONE) continue;
        if (axis === 'y') report.grounded ||= contact === Contact.NEGATIVE;
        else report.blockedHorizontally = true;
      }
    }
    return report;
  }

  moveAxis(position, velocity, axis, delta) {
    if (delta === 0) return Contact.NONE;
    position[axis] += delta;
    if (!this.collides(position)) return Contact.NONE;
    position[axis] = this.resolvedCoordinate(position, axis, delta);
    velocity[axis] = 0;
    return delta < 0 ? Contact.NEGATIVE : Contact.POSITIVE;
  }

  resolvedCoordinate(position, axis, delta) {
    const box = bodyBox(position, this.dimensions);
    const bounds = AXIS_BOUNDS[axis];
    if (delta > 0) {
      const extent = box[bounds.max] - position[axis];
      return Math.floor(box[bounds.max]) - extent - SKIN;
    }
    const extent = position[axis] - box[bounds.min];
    return Math.floor(box[bounds.min]) + 1 + extent + SKIN;
  }
}
