import { BlockType, LOG_BLOCKS, isLogBlock } from './blockTypes.js';

export const DECAYING_LEAVES = new Set([BlockType.OAK_LEAVES, BlockType.SPRUCE_LEAVES]);
export const LEAF_BLOCKS = new Set([...DECAYING_LEAVES, BlockType.PERSISTENT_LEAVES]);
export const SUPPORT_BLOCKS = new Set([...LEAF_BLOCKS, ...LOG_BLOCKS]);

const NEIGHBORS = Object.freeze([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]);

function isUnloaded(world, x, y, z) {
  return y >= 0 && y < world.height && !world.contains(x, y, z);
}

function packOffset(dx, dy, dz, span) {
  return (dx + span) + (2 * span + 1) * ((dz + span) + (2 * span + 1) * (dy + span));
}

export function isLeafSupported(world, x, y, z, maxDistance) {
  const span = maxDistance + 1;
  const visited = new Set([packOffset(0, 0, 0, span)]);
  let frontier = [[0, 0, 0]];
  for (let distance = 0; distance < maxDistance && frontier.length > 0; distance++) {
    const next = [];
    for (const [cx, cy, cz] of frontier) {
      for (const [dx, dy, dz] of NEIGHBORS) {
        const [ox, oy, oz] = [cx + dx, cy + dy, cz + dz];
        if (isUnloaded(world, x + ox, y + oy, z + oz)) return true;
        const type = world.getBlock(x + ox, y + oy, z + oz);
        if (isLogBlock(type)) return true;
        const key = packOffset(ox, oy, oz, span);
        if (!LEAF_BLOCKS.has(type) || visited.has(key)) continue;
        visited.add(key);
        next.push([ox, oy, oz]);
      }
    }
    frontier = next;
  }
  return false;
}

function captureBox(world, x, y, z, radius) {
  const size = radius * 2 + 1;
  const types = new Uint8Array(size * size * size);
  for (let ly = 0; ly < size; ly++) {
    for (let lz = 0; lz < size; lz++) {
      for (let lx = 0; lx < size; lx++) {
        const [px, py, pz] = [x - radius + lx, y - radius + ly, z - radius + lz];
        if (isUnloaded(world, px, py, pz)) return null;
        types[lx + size * (lz + size * ly)] = world.getBlock(px, py, pz);
      }
    }
  }
  return { types, size };
}

function spreadFromWood({ types, size }, reach) {
  const reached = new Uint8Array(types.length);
  const queue = new Int32Array(types.length);
  let tail = 0;
  types.forEach((type, index) => {
    if (!isLogBlock(type)) return;
    reached[index] = 1;
    queue[tail++] = index;
  });
  const strides = [1, size, size * size];
  for (let head = 0; head < tail; head++) {
    const index = queue[head];
    const distance = reached[index] - 1;
    if (distance >= reach) continue;
    const coordinates = [index % size, Math.floor(index / size) % size, Math.floor(index / (size * size))];
    coordinates.forEach((value, axis) => {
      [-1, 1].forEach((step) => {
        if (value + step < 0 || value + step >= size) return;
        const neighbor = index + step * strides[axis];
        if (reached[neighbor] !== 0 || !LEAF_BLOCKS.has(types[neighbor])) return;
        reached[neighbor] = distance + 2;
        queue[tail++] = neighbor;
      });
    });
  }
  return reached;
}

export function findUnsupportedLeaves(world, x, y, z, { checkRadius, supportDistance }) {
  const radius = checkRadius + supportDistance + 1;
  const box = captureBox(world, x, y, z, radius);
  if (box === null) return [];
  const reached = spreadFromWood(box, supportDistance);
  const unsupported = [];
  for (let dy = -checkRadius; dy <= checkRadius; dy++) {
    for (let dz = -checkRadius; dz <= checkRadius; dz++) {
      for (let dx = -checkRadius; dx <= checkRadius; dx++) {
        const index = (dx + radius) + box.size * ((dz + radius) + box.size * (dy + radius));
        if (DECAYING_LEAVES.has(box.types[index]) && reached[index] === 0) unsupported.push({ x: x + dx, y: y + dy, z: z + dz });
      }
    }
  }
  return unsupported;
}
