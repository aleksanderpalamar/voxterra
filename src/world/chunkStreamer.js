import { Chunk } from './chunk.js';
import { chunkCoordinate } from './chunkLayout.js';
import { chunksOutsideRadius, chunksWithinRadius } from './chunkStreaming.js';

export const STREAMING_SETTINGS = Object.freeze({
  loadRadius: 9,
  unloadRadius: 11,
  generationBudget: 4,
});

export class ChunkStreamer {
  constructor(world, generator, store, settings = STREAMING_SETTINGS) {
    this.world = world;
    this.generator = generator;
    this.store = store;
    this.settings = settings;
    this.center = null;
    this.queue = [];
  }

  get pendingCount() {
    return this.queue.length;
  }

  loadAround(position) {
    this.recenter(chunkCoordinate(position.x), chunkCoordinate(position.z));
    this.processQueue(Infinity);
  }

  update(position) {
    const chunkX = chunkCoordinate(position.x);
    const chunkZ = chunkCoordinate(position.z);
    if (!this.isCenteredAt(chunkX, chunkZ)) this.recenter(chunkX, chunkZ);
    this.processQueue(this.settings.generationBudget);
  }

  isCenteredAt(chunkX, chunkZ) {
    return this.center !== null && this.center.chunkX === chunkX && this.center.chunkZ === chunkZ;
  }

  recenter(chunkX, chunkZ) {
    this.center = { chunkX, chunkZ };
    const distant = chunksOutsideRadius(this.world.loadedChunks(), chunkX, chunkZ, this.settings.unloadRadius);
    distant.forEach((chunk) => this.unload(chunk));
    this.queue = chunksWithinRadius(chunkX, chunkZ, this.settings.loadRadius)
      .filter((chunk) => !this.world.hasChunk(chunk.chunkX, chunk.chunkZ));
  }

  processQueue(budget) {
    let loaded = 0;
    while (loaded < budget && this.queue.length > 0) {
      const { chunkX, chunkZ } = this.queue.shift();
      if (this.world.hasChunk(chunkX, chunkZ)) continue;
      this.world.loadChunk(this.provideChunk(chunkX, chunkZ));
      loaded += 1;
    }
  }

  provideChunk(chunkX, chunkZ) {
    const stored = this.store.load(chunkX, chunkZ);
    if (stored === null) return this.generator.generate(chunkX, chunkZ);
    const chunk = new Chunk(chunkX, chunkZ, this.world.height, stored);
    chunk.markModified();
    return chunk;
  }

  unload(chunk) {
    this.world.unloadChunk(chunk.chunkX, chunk.chunkZ);
    if (!chunk.modified) return;
    this.store.save(chunk.chunkX, chunk.chunkZ, chunk.blocks);
  }
}
