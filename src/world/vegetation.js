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

function traits(grounds, minHeight, maxHeight, crownReach) {
  return Object.freeze({ grounds: Object.freeze(grounds), minHeight, maxHeight, crownReach });
}

export const SPECIES_TRAITS = Object.freeze({
  [Species.OAK]: traits([BlockType.GRASS], 4, 6, 2),
  [Species.CONIFER]: traits([BlockType.GRASS, BlockType.SNOW], 7, 10, 2),
  [Species.ACACIA]: traits([BlockType.GRASS], 5, 6, 5),
  [Species.JUNGLE]: traits([BlockType.GRASS], 10, 14, 3),
  [Species.BUSH]: traits([BlockType.GRASS], 1, 1, 1),
  [Species.CACTUS]: traits([BlockType.SAND], 1, 3, 0),
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
