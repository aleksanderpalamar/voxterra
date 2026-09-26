import { createWorldMetadata } from './worldMetadata.js';

export const AUTOSAVE_INTERVAL = 5;

export class WorldAutosave {
  constructor({ world, store, player, seed, interval = AUTOSAVE_INTERVAL, onError = () => {} }) {
    this.world = world;
    this.store = store;
    this.player = player;
    this.seed = seed;
    this.interval = interval;
    this.onError = onError;
    this.elapsed = 0;
    this.discarded = false;
    this.pending = new Set();
    world.onChunkUnloaded((_chunkX, _chunkZ, chunk) => this.saveChunk(chunk));
  }

  update(dt) {
    this.elapsed += dt;
    if (this.elapsed < this.interval) return Promise.resolve();
    this.elapsed = 0;
    return this.saveNow();
  }

  saveNow() {
    if (this.discarded) return Promise.resolve();
    const chunkSaves = this.world.loadedChunks().filter((chunk) => chunk.dirty).map((chunk) => this.saveChunk(chunk));
    const metadata = createWorldMetadata(this.seed, this.player.snapshot());
    return Promise.all([...chunkSaves, this.track(this.store.saveMetadata(metadata))]);
  }

  saveChunk(chunk) {
    if (this.discarded || !chunk.dirty) return Promise.resolve();
    chunk.markSaved();
    const saving = this.store.saveChunk(chunk.chunkX, chunk.chunkZ, chunk.blocks).catch((error) => {
      chunk.markDirty();
      throw error;
    });
    return this.track(saving);
  }

  track(promise) {
    const tracked = promise.catch((error) => this.onError(error)).finally(() => this.pending.delete(tracked));
    this.pending.add(tracked);
    return tracked;
  }

  async discard() {
    this.discarded = true;
    await Promise.all(this.pending);
  }

  async erase() {
    await this.discard();
    await this.store.clear();
  }
}
