import { JobType } from './chunkJobHandler.js';
import { extractPaddedVolume } from '../world/paddedVolume.js';

export class AsyncChunkMesher {
  constructor(executor, world, seed) {
    this.executor = executor;
    this.world = world;
    this.seed = seed;
  }

  mesh(chunkX, chunkZ, scheduling) {
    const { height } = this.world;
    const build = () => {
      const volume = extractPaddedVolume((x, z) => this.world.getChunk(x, z), chunkX, chunkZ, height);
      return { request: { type: JobType.MESH, seed: this.seed, height, chunkX, chunkZ, volume }, transfer: [volume.buffer] };
    };
    return this.executor.run({ ...scheduling, build });
  }
}
