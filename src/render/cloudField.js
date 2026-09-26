import { createRandom } from '../core/random.js';
import { createNoise2D, fractalNoise2D } from '../core/noise.js';

export const CLOUD_SETTINGS = Object.freeze({
  altitude: 78,
  cellSize: 8,
  cellsPerSide: 40,
  thickness: 3,
  threshold: 0.12,
  noiseScale: 0.14,
  driftSpeed: 1.6,
});

export function cloudCells(seed, settings = CLOUD_SETTINGS) {
  const noise = createNoise2D(createRandom(seed));
  const cells = [];
  for (let z = 0; z < settings.cellsPerSide; z++) {
    for (let x = 0; x < settings.cellsPerSide; x++) {
      const value = fractalNoise2D(noise, x * settings.noiseScale, z * settings.noiseScale, 3);
      if (value > settings.threshold) cells.push({ x, z });
    }
  }
  return cells;
}

export function cloudTileOrigin(cameraCoordinate, offset, span) {
  return offset + span * Math.floor((cameraCoordinate - span / 2 - offset) / span);
}
