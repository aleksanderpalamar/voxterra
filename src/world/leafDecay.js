import { BlockType } from './blockTypes.js';
import { DECAYING_LEAVES, SUPPORT_BLOCKS, findUnsupportedLeaves, isLeafSupported } from './leafSupport.js';

export const LEAF_DECAY = Object.freeze({
  supportDistance: 6,
  checkRadius: 6,
  minDelay: 0.4,
  maxDelay: 3,
  tick: 0.2,
});

const NEIGHBORS = Object.freeze([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]);
const keyOf = (x, y, z) => `${x},${y},${z}`;

export class LeafDecay {
  constructor({ world, random = Math.random, settings = LEAF_DECAY }) {
    this.world = world;
    this.random = random;
    this.settings = settings;
    this.clock = 0;
    this.sinceTick = 0;
    this.pending = new Map();
    this.decaying = false;
    world.onBlockChanged((x, y, z, _type, previous) => {
      if (SUPPORT_BLOCKS.has(previous) && !this.decaying) this.inspectAround(x, y, z);
    });
  }

  get pendingCount() {
    return this.pending.size;
  }

  inspectAround(x, y, z) {
    findUnsupportedLeaves(this.world, x, y, z, this.settings).forEach((leaf) => this.schedule(leaf));
  }

  inspectNeighbors(x, y, z) {
    NEIGHBORS.forEach(([dx, dy, dz]) => {
      const [nx, ny, nz] = [x + dx, y + dy, z + dz];
      if (!DECAYING_LEAVES.has(this.world.getBlock(nx, ny, nz))) return;
      if (isLeafSupported(this.world, nx, ny, nz, this.settings.supportDistance)) return;
      this.schedule({ x: nx, y: ny, z: nz });
    });
  }

  schedule({ x, y, z }) {
    const key = keyOf(x, y, z);
    if (this.pending.has(key)) return;
    const { minDelay, maxDelay } = this.settings;
    this.pending.set(key, { x, y, z, dueAt: this.clock + minDelay + this.random() * (maxDelay - minDelay) });
  }

  update(dt) {
    this.clock += dt;
    this.sinceTick += dt;
    if (this.sinceTick < this.settings.tick) return;
    this.sinceTick = 0;
    const due = [...this.pending].filter(([, leaf]) => leaf.dueAt <= this.clock);
    due.forEach(([key, leaf]) => {
      this.pending.delete(key);
      this.decay(leaf);
    });
  }

  decay({ x, y, z }) {
    if (!DECAYING_LEAVES.has(this.world.getBlock(x, y, z))) return;
    if (isLeafSupported(this.world, x, y, z, this.settings.supportDistance)) return;
    this.decaying = true;
    this.world.setBlock(x, y, z, BlockType.AIR);
    this.decaying = false;
    this.inspectNeighbors(x, y, z);
  }
}
