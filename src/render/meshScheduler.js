import { chunkCoordinate, chunkKey, chunkNeighborhood } from '../world/chunkLayout.js';
import { byDistanceFrom } from '../world/chunkStreaming.js';

export class MeshScheduler {
  constructor(isMeshable) {
    this.isMeshable = isMeshable;
    this.pending = new Map();
    this.urgent = new Map();
  }

  get pendingCount() {
    return this.pending.size;
  }

  chunkLoaded(chunkX, chunkZ) {
    chunkNeighborhood(chunkX, chunkZ)
      .filter((chunk) => this.isMeshable(chunk.chunkX, chunk.chunkZ))
      .forEach((chunk) => this.pending.set(chunkKey(chunk.chunkX, chunk.chunkZ), chunk));
  }

  chunkUnloaded(chunkX, chunkZ) {
    const affected = chunkNeighborhood(chunkX, chunkZ);
    affected.forEach((chunk) => this.forget(chunkKey(chunk.chunkX, chunk.chunkZ)));
    return affected;
  }

  blockChanged(x, z) {
    const touched = new Map();
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const chunk = { chunkX: chunkCoordinate(x + dx), chunkZ: chunkCoordinate(z + dz) };
        touched.set(chunkKey(chunk.chunkX, chunk.chunkZ), chunk);
      }
    }
    touched.forEach((chunk, key) => {
      if (this.isMeshable(chunk.chunkX, chunk.chunkZ)) this.urgent.set(key, chunk);
    });
  }

  takeUrgent() {
    const chunks = [...this.urgent.values()];
    this.urgent.forEach((_chunk, key) => this.pending.delete(key));
    this.urgent.clear();
    return chunks;
  }

  takeNearest(budget, centerX, centerZ) {
    const chunks = [...this.pending.values()].sort(byDistanceFrom(centerX, centerZ)).slice(0, budget);
    chunks.forEach((chunk) => this.pending.delete(chunkKey(chunk.chunkX, chunk.chunkZ)));
    return chunks;
  }

  forget(key) {
    this.pending.delete(key);
    this.urgent.delete(key);
  }
}
