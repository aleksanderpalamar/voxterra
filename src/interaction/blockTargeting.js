import { raycastVoxels } from './voxelRaycast.js';

export const DEFAULT_REACH = 6;

export class BlockTargeting {
  constructor(isTarget, reach = DEFAULT_REACH) {
    this.isTarget = isTarget;
    this.reach = reach;
    this.current = null;
  }

  update(origin, direction) {
    this.current = raycastVoxels(origin, direction, this.reach, this.isTarget);
    return this.current;
  }

  clear() {
    this.current = null;
  }
}
