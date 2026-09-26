import { createRandom, hashCoordinates, randomInt } from '../core/random.js';
import { MAX_DENSITY, canGrowOn, chooseSpecies, heightFor, vegetationFor } from './vegetation.js';

export const FLORA_GRID = Object.freeze({ cellSize: 4, margin: 1 });
export const SPECIES_JITTER = 0.12;

const CROWN_CLEARANCE = 3;

function rollCandidate(random, cellX, cellZ, grid) {
  const innerMax = grid.cellSize - 1 - grid.margin;
  return {
    x: cellX * grid.cellSize + randomInt(random, grid.margin, innerMax),
    z: cellZ * grid.cellSize + randomInt(random, grid.margin, innerMax),
    presence: random(),
    speciesRoll: random(),
    heightRoll: random(),
    variant: randomInt(random, 0, 3),
    jitter: {
      temperature: (random() * 2 - 1) * SPECIES_JITTER,
      humidity: (random() * 2 - 1) * SPECIES_JITTER,
    },
  };
}

export function plantInCell(seed, cellX, cellZ, site, grid = FLORA_GRID) {
  const candidate = rollCandidate(createRandom(hashCoordinates(seed, cellX, cellZ)), cellX, cellZ, grid);
  if (candidate.presence >= MAX_DENSITY) return null;
  const spot = site.floraSiteAt(candidate.x, candidate.z, candidate.jitter);
  if (spot === null) return null;
  const vegetation = vegetationFor(spot.biome);
  if (candidate.presence >= vegetation.density) return null;
  const species = chooseSpecies(vegetation, candidate.speciesRoll);
  if (!canGrowOn(species, spot.groundBlock)) return null;
  const height = heightFor(species, candidate.heightRoll);
  if (spot.groundY + height + CROWN_CLEARANCE >= site.height) return null;
  return { species, x: candidate.x, z: candidate.z, groundY: spot.groundY, height, variant: candidate.variant };
}

export function plantsInArea(seed, area, site, grid = FLORA_GRID) {
  const cellOf = (coordinate) => Math.floor(coordinate / grid.cellSize);
  const plants = [];
  for (let cellZ = cellOf(area.minZ); cellZ <= cellOf(area.maxZ); cellZ++) {
    for (let cellX = cellOf(area.minX); cellX <= cellOf(area.maxX); cellX++) {
      const plant = plantInCell(seed, cellX, cellZ, site, grid);
      if (plant !== null) plants.push(plant);
    }
  }
  return plants;
}
