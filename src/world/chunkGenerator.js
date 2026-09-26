import { BlockType } from './blockTypes.js';
import { Chunk } from './chunk.js';
import { CHUNK_SIZE, WORLD_HEIGHT } from './chunkLayout.js';
import { createRandom } from '../core/random.js';
import { createNoise2D } from '../core/noise.js';
import { TERRAIN_SETTINGS, columnBlockAt, fillColumn, surfaceHeight } from './terrainGenerator.js';
import { placeTree, treesInArea } from './treeGenerator.js';

const CEILING_MARGIN = 10;

export class ChunkGenerator {
  constructor(seed, height = WORLD_HEIGHT, settings = TERRAIN_SETTINGS) {
    this.seed = seed;
    this.height = height;
    this.settings = settings;
    this.maxSurfaceY = height - CEILING_MARGIN;
    this.noise = createNoise2D(createRandom(seed));
  }

  surfaceHeightAt(x, z) {
    return surfaceHeight(this.noise, x, z, this.maxSurfaceY, this.settings);
  }

  isFertile(surfaceY) {
    return columnBlockAt(surfaceY, surfaceY, this.settings) === BlockType.GRASS;
  }

  generate(chunkX, chunkZ) {
    const chunk = new Chunk(chunkX, chunkZ, this.height);
    this.fillTerrain(chunk);
    this.plantTrees(chunk);
    return chunk;
  }

  fillTerrain(chunk) {
    for (let localZ = 0; localZ < CHUNK_SIZE; localZ++) {
      for (let localX = 0; localX < CHUNK_SIZE; localX++) {
        const x = chunk.originX + localX;
        const z = chunk.originZ + localZ;
        fillColumn(chunk, x, z, this.surfaceHeightAt(x, z), this.settings);
      }
    }
  }

  plantTrees(chunk) {
    const area = {
      minX: chunk.originX,
      minZ: chunk.originZ,
      maxX: chunk.originX + CHUNK_SIZE - 1,
      maxZ: chunk.originZ + CHUNK_SIZE - 1,
    };
    treesInArea(this.seed, area, this).forEach((tree) => placeTree(chunk, tree));
  }
}
