import { JobType } from './chunkJobHandler.js';
import { extractPaddedVolume } from '../world/paddedVolume.js';

export class AsyncChunkMesher {
  constructor(executor, world) {
    this.executor = executor;
    this.world = world;
  }

  mesh(chunkX, chunkZ, scheduling) {
    const { height } = this.world;
    const build = () => {
      const volume = extractPaddedVolume((x, z) => this.world.getChunk(x, z), chunkX, chunkZ, height);
      return { request: { type: JobType.MESH, height, chunkX, chunkZ, volume }, transfer: [volume.buffer] };
    };
    return this.executor.run({ ...scheduling, build });
  }
}
