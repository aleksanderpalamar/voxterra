import { BlockType } from './blockTypes.js';
import { Biome } from './biomes.js';
import { SEA_LEVEL } from './terrainShape.js';

export const SNOW_LINE = 48;

const SNOWY_PEAK_TEMPERATURE = 0.1;
const FILLER_DEPTH = 3;
const LAKEBED_STONE_THRESHOLD = 0.2;

function layers(top, filler, fillerDepth = FILLER_DEPTH) {
  return Object.freeze({ top, filler, fillerDepth });
}

const GRASSLAND = layers(BlockType.GRASS, BlockType.DIRT);
const DUNES = layers(BlockType.SAND, BlockType.SAND);
const SNOWFIELD = layers(BlockType.SNOW, BlockType.DIRT);
const BARE_ROCK = layers(BlockType.STONE, BlockType.STONE, 0);
const SNOWY_ROCK = layers(BlockType.SNOW, BlockType.STONE, 0);
const MUDDY_BED = layers(BlockType.DIRT, BlockType.DIRT, 2);
const ROCKY_BED = layers(BlockType.STONE, BlockType.STONE, 0);

const SANDY_BIOMES = new Set([Biome.OCEAN, Biome.BEACH, Biome.DESERT]);

const BIOME_SURFACES = Object.freeze({
  [Biome.TUNDRA]: SNOWFIELD,
});

function mountainSurface(climate, surfaceY) {
  const snowy = climate.temperature < SNOWY_PEAK_TEMPERATURE || surfaceY >= SNOW_LINE;
  return snowy ? SNOWY_ROCK : BARE_ROCK;
}

function lakebed(variation) {
  return variation > LAKEBED_STONE_THRESHOLD ? ROCKY_BED : MUDDY_BED;
}

export function surfaceLayers(biome, climate, surfaceY, variation = 0) {
  if (biome === Biome.MOUNTAINS) return mountainSurface(climate, surfaceY);
  if (SANDY_BIOMES.has(biome)) return DUNES;
  if (surfaceY < SEA_LEVEL) return lakebed(variation);
  return BIOME_SURFACES[biome] ?? GRASSLAND;
}

export function waterSurfaceBlock(biome) {
  return biome === Biome.TUNDRA ? BlockType.ICE : BlockType.WATER;
}
