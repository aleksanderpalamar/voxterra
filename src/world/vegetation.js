import { BlockType } from './blockTypes.js';
import { Biome } from './biomes.js';

export const Species = Object.freeze({
  OAK: 'oak',
  CONIFER: 'conifer',
  ACACIA: 'acacia',
  JUNGLE: 'jungle',
  BUSH: 'bush',
  CACTUS: 'cactus',
});

function traits({ grounds, stem, foliage = null, minHeight, maxHeight, crownReach }) {
  return Object.freeze({ grounds: Object.freeze(grounds), stem, foliage, minHeight, maxHeight, crownReach });
}

export const SPECIES_TRAITS = Object.freeze({
  [Species.OAK]: traits({
    grounds: [BlockType.GRASS], stem: BlockType.OAK_WOOD, foliage: BlockType.OAK_LEAVES, minHeight: 4, maxHeight: 6, crownReach: 2,
  }),
  [Species.CONIFER]: traits({
    grounds: [BlockType.GRASS, BlockType.SNOW], stem: BlockType.SPRUCE_WOOD, foliage: BlockType.SPRUCE_LEAVES,
    minHeight: 7, maxHeight: 10, crownReach: 2,
  }),
  [Species.ACACIA]: traits({
    grounds: [BlockType.GRASS], stem: BlockType.ACACIA_WOOD, foliage: BlockType.ACACIA_LEAVES, minHeight: 5, maxHeight: 6, crownReach: 5,
  }),
  [Species.JUNGLE]: traits({
    grounds: [BlockType.GRASS], stem: BlockType.JUNGLE_WOOD, foliage: BlockType.JUNGLE_LEAVES, minHeight: 10, maxHeight: 14, crownReach: 3,
  }),
  [Species.BUSH]: traits({
    grounds: [BlockType.GRASS], stem: BlockType.OAK_WOOD, foliage: BlockType.OAK_LEAVES, minHeight: 1, maxHeight: 1, crownReach: 1,
  }),
  [Species.CACTUS]: traits({ grounds: [BlockType.SAND], stem: BlockType.CACTUS, minHeight: 1, maxHeight: 3, crownReach: 0 }),
});

export const MAX_CROWN_REACH = Math.max(...Object.values(SPECIES_TRAITS).map((entry) => entry.crownReach));

function profile(density, entries) {
  const species = entries.map(([name, weight]) => Object.freeze({ species: name, weight }));
  return Object.freeze({ density, species: Object.freeze(species) });
}

const BARREN = profile(0, []);

const VEGETATION = Object.freeze({
  [Biome.OCEAN]: BARREN,
  [Biome.BEACH]: BARREN,
  [Biome.PLAINS]: profile(0.03, [[Species.OAK, 9], [Species.BUSH, 1]]),
  [Biome.FOREST]: profile(0.42, [[Species.OAK, 8], [Species.BUSH, 2]]),
  [Biome.TAIGA]: profile(0.38, [[Species.CONIFER, 1]]),
  [Biome.TUNDRA]: profile(0.02, [[Species.CONIFER, 1]]),
  [Biome.DESERT]: profile(0.05, [[Species.CACTUS, 1]]),
  [Biome.SAVANNA]: profile(0.07, [[Species.ACACIA, 7], [Species.BUSH, 3]]),
  [Biome.RAINFOREST]: profile(0.7, [[Species.JUNGLE, 5], [Species.BUSH, 4], [Species.OAK, 1]]),
  [Biome.MOUNTAINS]: profile(0.03, [[Species.CONIFER, 1]]),
});

export const MAX_DENSITY = Math.max(...Object.values(VEGETATION).map((entry) => entry.density));

export function vegetationFor(biome) {
  return VEGETATION[biome] ?? BARREN;
}

export function chooseSpecies(vegetation, roll) {
  const total = vegetation.species.reduce((sum, entry) => sum + entry.weight, 0);
  let remaining = roll * total;
  const chosen = vegetation.species.find((entry) => {
    remaining -= entry.weight;
    return remaining < 0;
  });
  return (chosen ?? vegetation.species.at(-1)).species;
}

export function canGrowOn(species, groundBlock) {
  return SPECIES_TRAITS[species].grounds.includes(groundBlock);
}

export function heightFor(species, roll) {
  const { minHeight, maxHeight } = SPECIES_TRAITS[species];
  return minHeight + Math.floor(roll * (maxHeight - minHeight + 1));
}
