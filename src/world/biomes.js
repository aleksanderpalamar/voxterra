export const Biome = Object.freeze({
  PLAINS: 'plains',
  FOREST: 'forest',
  TAIGA: 'taiga',
  TUNDRA: 'tundra',
  DESERT: 'desert',
  SAVANNA: 'savanna',
  RAINFOREST: 'rainforest',
  MOUNTAINS: 'mountains',
});

export const MOUNTAIN_LINE = 35;

const BIOME_NAMES = Object.freeze({
  [Biome.PLAINS]: 'Plains',
  [Biome.FOREST]: 'Forest',
  [Biome.TAIGA]: 'Taiga',
  [Biome.TUNDRA]: 'Tundra',
  [Biome.DESERT]: 'Desert',
  [Biome.SAVANNA]: 'Savanna',
  [Biome.RAINFOREST]: 'Rainforest',
  [Biome.MOUNTAINS]: 'Mountains',
});

const COLD = -0.2;
const VERY_COLD = -0.6;
const HOT = 0.2;

const CLIMATE_RULES = Object.freeze([
  { biome: Biome.TUNDRA, temperature: [-1, VERY_COLD], humidity: [-1, 1] },
  { biome: Biome.TUNDRA, temperature: [VERY_COLD, COLD], humidity: [-1, -0.35] },
  { biome: Biome.TAIGA, temperature: [VERY_COLD, COLD], humidity: [-0.35, 1] },
  { biome: Biome.PLAINS, temperature: [COLD, HOT], humidity: [-1, 0.05] },
  { biome: Biome.FOREST, temperature: [COLD, HOT], humidity: [0.05, 1] },
  { biome: Biome.DESERT, temperature: [HOT, 1], humidity: [-1, -0.2] },
  { biome: Biome.SAVANNA, temperature: [HOT, 1], humidity: [-0.2, 0.2] },
  { biome: Biome.RAINFOREST, temperature: [HOT, 1], humidity: [0.2, 1] },
]);

function withinRange(value, [min, max]) {
  return value >= min && (value < max || max === 1);
}

export function resolveBiome({ temperature, humidity, surfaceY }) {
  if (surfaceY >= MOUNTAIN_LINE) return Biome.MOUNTAINS;
  const rule = CLIMATE_RULES.find((candidate) => withinRange(temperature, candidate.temperature)
    && withinRange(humidity, candidate.humidity));
  return rule === undefined ? Biome.PLAINS : rule.biome;
}

export function biomeName(biome) {
  return BIOME_NAMES[biome] ?? 'Unknown';
}
