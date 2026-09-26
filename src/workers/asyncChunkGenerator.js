import { JobType } from './chunkJobHandler.js';

export class AsyncChunkGenerator {
  constructor(executor, seed, height) {
    this.executor = executor;
    this.seed = seed;
    this.height = height;
  }

  async generate(chunkX, chunkZ, scheduling) {
    const request = { type: JobType.GENERATE, seed: this.seed, height: this.height, chunkX, chunkZ };
    const result = await this.executor.run({ ...scheduling, build: () => ({ request, transfer: [] }) });
    return result === null ? null : result.blocks;
  }
}
