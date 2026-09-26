import { MeshScheduler } from './meshScheduler.js';

export const PIPELINE_SETTINGS = Object.freeze({
  dispatchBudget: 4,
  uploadBudget: 2,
});

export class MeshPipeline {
  constructor({ isMeshable, mesher, meshNow, sink, onError = () => {}, settings = PIPELINE_SETTINGS }) {
    this.scheduler = new MeshScheduler(isMeshable);
    this.mesher = mesher;
    this.meshNow = meshNow;
    this.sink = sink;
    this.onError = onError;
    this.settings = settings;
    this.center = { chunkX: 0, chunkZ: 0 };
    this.ready = [];
  }

  handleChunkLoaded(chunkX, chunkZ) {
    this.scheduler.chunkLoaded(chunkX, chunkZ);
  }

  handleChunkUnloaded(chunkX, chunkZ) {
    this.scheduler.chunkUnloaded(chunkX, chunkZ).forEach((chunk) => this.sink.remove(chunk.chunkX, chunk.chunkZ));
  }

  invalidateBlock(x, z) {
    this.scheduler.blockChanged(x, z);
  }

  update(centerChunkX, centerChunkZ) {
    this.center = { chunkX: centerChunkX, chunkZ: centerChunkZ };
    this.scheduler.takeUrgent().forEach((chunk) => this.rebuildNow(chunk.chunkX, chunk.chunkZ));
    this.scheduler.takeNearest(this.settings.dispatchBudget, centerChunkX, centerChunkZ)
      .forEach((chunk) => this.dispatch(chunk.chunkX, chunk.chunkZ));
    this.upload(this.settings.uploadBudget);
  }

  async buildAll(centerChunkX, centerChunkZ) {
    this.center = { chunkX: centerChunkX, chunkZ: centerChunkZ };
    const jobs = this.scheduler.takeNearest(Infinity, centerChunkX, centerChunkZ)
      .map((chunk) => this.dispatch(chunk.chunkX, chunk.chunkZ));
    await Promise.all(jobs);
    this.upload(Infinity);
  }

  rebuildNow(chunkX, chunkZ) {
    this.scheduler.issueTicket(chunkX, chunkZ);
    this.sink.apply(chunkX, chunkZ, this.meshNow(chunkX, chunkZ));
  }

  dispatch(chunkX, chunkZ) {
    const ticket = this.scheduler.issueTicket(chunkX, chunkZ);
    const scheduling = {
      priority: () => Math.hypot(chunkX - this.center.chunkX, chunkZ - this.center.chunkZ),
      isStale: () => !this.scheduler.isCurrent(chunkX, chunkZ, ticket),
    };
    return this.mesher.mesh(chunkX, chunkZ, scheduling)
      .then((meshData) => this.queueReady(chunkX, chunkZ, ticket, meshData))
      .catch((error) => this.fail(chunkX, chunkZ, ticket, error));
  }

  queueReady(chunkX, chunkZ, ticket, meshData) {
    if (meshData === null) return;
    this.ready.push({ chunkX, chunkZ, ticket, meshData });
  }

  fail(chunkX, chunkZ, ticket, error) {
    this.onError(error);
    if (this.scheduler.isCurrent(chunkX, chunkZ, ticket)) this.scheduler.requeue(chunkX, chunkZ);
  }

  upload(budget) {
    let uploaded = 0;
    while (uploaded < budget && this.ready.length > 0) {
      const { chunkX, chunkZ, ticket, meshData } = this.ready.shift();
      if (!this.scheduler.isCurrent(chunkX, chunkZ, ticket)) continue;
      this.sink.apply(chunkX, chunkZ, meshData);
      uploaded += 1;
    }
  }
}
