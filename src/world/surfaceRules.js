import { BlockType } from './blockTypes.js';
import { Biome } from './biomes.js';
import { SEA_LEVEL } from './terrainShape.js';

export const SNOW_LINE = 48;

const SNOWY_PEAK_TEMPERATURE = 0.1;
const FILLER_DEPTH = 3;

function layers(top, filler, fillerDepth = FILLER_DEPTH) {
  return Object.freeze({ top, filler, fillerDepth });
}

const GRASSLAND = layers(BlockType.GRASS, BlockType.DIRT);
const DUNES = layers(BlockType.SAND, BlockType.SAND);
const SNOWFIELD = layers(BlockType.SNOW, BlockType.DIRT);
const BARE_ROCK = layers(BlockType.STONE, BlockType.STONE, 0);
const SNOWY_ROCK = layers(BlockType.SNOW, BlockType.STONE, 0);

const BIOME_SURFACES = Object.freeze({
  [Biome.OCEAN]: DUNES,
  [Biome.BEACH]: DUNES,
  [Biome.DESERT]: DUNES,
  [Biome.TUNDRA]: SNOWFIELD,
});

function mountainSurface(climate, surfaceY) {
  const snowy = climate.temperature < SNOWY_PEAK_TEMPERATURE || surfaceY >= SNOW_LINE;
  return snowy ? SNOWY_ROCK : BARE_ROCK;
}

export function surfaceLayers(biome, climate, surfaceY) {
  if (biome === Biome.MOUNTAINS) return mountainSurface(climate, surfaceY);
  if (surfaceY < SEA_LEVEL) return DUNES;
  return BIOME_SURFACES[biome] ?? GRASSLAND;
}
