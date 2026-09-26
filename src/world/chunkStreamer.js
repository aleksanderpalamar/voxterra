import { Chunk } from './chunk.js';
import { chunkCoordinate, chunkKey } from './chunkLayout.js';
import { chunksOutsideRadius, chunksWithinRadius } from './chunkStreaming.js';

export const STREAMING_SETTINGS = Object.freeze({
  loadRadius: 9,
  unloadRadius: 11,
  maxInFlight: 16,
});

export class ChunkStreamer {
  constructor({ world, generator, store, settings = STREAMING_SETTINGS, onError = () => {} }) {
    this.world = world;
    this.generator = generator;
    this.store = store;
    this.settings = settings;
    this.onError = onError;
    this.center = null;
    this.queue = [];
    this.inFlight = new Map();
  }

  get pendingCount() {
    return this.queue.length + this.inFlight.size;
  }

  loadAround(position) {
    this.recenter(chunkCoordinate(position.x), chunkCoordinate(position.z));
    return Promise.all(this.requestQueued(Infinity));
  }

  update(position) {
    const chunkX = chunkCoordinate(position.x);
    const chunkZ = chunkCoordinate(position.z);
    if (!this.isCenteredAt(chunkX, chunkZ)) this.recenter(chunkX, chunkZ);
    this.requestQueued(this.settings.maxInFlight - this.inFlight.size);
  }

  isCenteredAt(chunkX, chunkZ) {
    return this.center !== null && this.center.chunkX === chunkX && this.center.chunkZ === chunkZ;
  }

  isWanted(chunkX, chunkZ) {
    const dx = chunkX - this.center.chunkX;
    const dz = chunkZ - this.center.chunkZ;
    return dx * dx + dz * dz <= this.settings.unloadRadius * this.settings.unloadRadius;
  }

  recenter(chunkX, chunkZ) {
    this.center = { chunkX, chunkZ };
    const distant = chunksOutsideRadius(this.world.loadedChunks(), chunkX, chunkZ, this.settings.unloadRadius);
    distant.forEach((chunk) => this.world.unloadChunk(chunk.chunkX, chunk.chunkZ));
    this.queue = chunksWithinRadius(chunkX, chunkZ, this.settings.loadRadius).filter((chunk) => this.isMissing(chunk));
  }

  isMissing({ chunkX, chunkZ }) {
    return !this.world.hasChunk(chunkX, chunkZ) && !this.inFlight.has(chunkKey(chunkX, chunkZ));
  }

  requestQueued(limit) {
    const requests = [];
    while (requests.length < limit && this.queue.length > 0) {
      const chunk = this.queue.shift();
      if (this.isMissing(chunk)) requests.push(this.request(chunk.chunkX, chunk.chunkZ));
    }
    return requests;
  }

  request(chunkX, chunkZ) {
    const key = chunkKey(chunkX, chunkZ);
    const scheduling = {
      priority: () => Math.hypot(chunkX - this.center.chunkX, chunkZ - this.center.chunkZ),
      isStale: () => !this.isWanted(chunkX, chunkZ),
    };
    const pending = this.fetchBlocks(chunkX, chunkZ, scheduling)
      .then((blocks) => this.receive(chunkX, chunkZ, blocks))
      .catch((error) => this.fail(chunkX, chunkZ, error))
      .finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, pending);
    return pending;
  }

  async fetchBlocks(chunkX, chunkZ, scheduling) {
    if (this.store.hasChunk(chunkX, chunkZ)) {
      const stored = await this.store.loadChunk(chunkX, chunkZ);
      if (stored !== null) return stored;
    }
    return this.generator.generate(chunkX, chunkZ, scheduling);
  }

  receive(chunkX, chunkZ, blocks) {
    if (blocks === null || !this.isWanted(chunkX, chunkZ) || this.world.hasChunk(chunkX, chunkZ)) return;
    this.world.loadChunk(new Chunk(chunkX, chunkZ, this.world.height, blocks));
  }

  fail(chunkX, chunkZ, error) {
    this.onError(error);
    this.queue.push({ chunkX, chunkZ });
  }
}
