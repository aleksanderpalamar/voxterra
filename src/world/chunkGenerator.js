import { BlockType } from './blockTypes.js';
import { Chunk } from './chunk.js';
import { CHUNK_SIZE, WORLD_HEIGHT } from './chunkLayout.js';
import { fillColumn } from './terrainGenerator.js';
import { SEA_LEVEL, TerrainShaper } from './terrainShape.js';
import { placeTree, treesInArea } from './treeGenerator.js';
import { ClimateSampler } from './climate.js';
import { resolveBiome, withinBeachBand } from './biomes.js';
import { surfaceLayers } from './surfaceRules.js';

const CEILING_MARGIN = 10;
const SHORE_SAMPLES = Object.freeze([
  [2, 0], [-2, 0], [0, 2], [0, -2],
  [4, 0], [-4, 0], [0, 4], [0, -4],
  [3, 3], [3, -3], [-3, 3], [-3, -3],
]);

export class ChunkGenerator {
  constructor(seed, height = WORLD_HEIGHT) {
    this.seed = seed;
    this.height = height;
    this.shaper = new TerrainShaper(seed, height - CEILING_MARGIN);
    this.climate = new ClimateSampler(seed);
  }

  surfaceHeightAt(x, z) {
    return this.shaper.heightAt(x, z);
  }

  columnAt(x, z) {
    const continentalness = this.shaper.continentalnessAt(x, z);
    const surfaceY = this.shaper.heightAt(x, z, continentalness);
    const climate = this.climate.sample(x, z);
    const besideWater = withinBeachBand(surfaceY) && this.hasWaterNearby(x, z, surfaceY);
    const biome = resolveBiome({ ...climate, surfaceY, continentalness, besideWater });
    return { surfaceY, continentalness, climate, biome, surface: surfaceLayers(biome, climate, surfaceY) };
  }

  hasWaterNearby(x, z, surfaceY) {
    if (surfaceY < SEA_LEVEL) return true;
    return SHORE_SAMPLES.some(([dx, dz]) => this.shaper.heightAt(x + dx, z + dz) < SEA_LEVEL);
  }

  plantableGround(x, z) {
    const column = this.columnAt(x, z);
    return column.surface.top === BlockType.GRASS ? column.surfaceY : null;
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
        const column = this.columnAt(x, z);
        fillColumn(chunk, x, z, column.surfaceY, column.surface, SEA_LEVEL);
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
