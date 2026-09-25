import { BlockType } from './blockTypes.js';
import { fractalNoise2D } from '../core/noise.js';

export const TERRAIN_SETTINGS = Object.freeze({
  baseHeight: 20,
  hillScale: 0.022,
  hillAmplitude: 20,
  hillOctaves: 4,
  mountainScale: 0.008,
  mountainAmplitude: 140,
  mountainOffset: 173.31,
  dirtDepth: 3,
  rockLine: 35,
});

export class HeightMap {
  constructor(sizeX, sizeZ) {
    this.sizeX = sizeX;
    this.sizeZ = sizeZ;
    this.heights = new Int16Array(sizeX * sizeZ);
  }

  heightAt(x, z) {
    return this.heights[x + z * this.sizeX];
  }

  setHeight(x, z, height) {
    this.heights[x + z * this.sizeX] = height;
  }
}

export function sampleSurfaceHeight(noise, x, z, settings = TERRAIN_SETTINGS) {
  const hills = fractalNoise2D(noise, x * settings.hillScale, z * settings.hillScale, settings.hillOctaves);
  const mountainX = x * settings.mountainScale + settings.mountainOffset;
  const mountainZ = z * settings.mountainScale - settings.mountainOffset;
  const ridge = Math.max(0, fractalNoise2D(noise, mountainX, mountainZ, 2));
  return settings.baseHeight + hills * settings.hillAmplitude + ridge * ridge * settings.mountainAmplitude;
}

export function createHeightMap(noise, sizeX, sizeZ, maxHeight, settings = TERRAIN_SETTINGS) {
  const heightMap = new HeightMap(sizeX, sizeZ);
  for (let z = 0; z < sizeZ; z++) {
    for (let x = 0; x < sizeX; x++) {
      const height = Math.round(sampleSurfaceHeight(noise, x, z, settings));
      heightMap.setHeight(x, z, Math.min(Math.max(height, 1), maxHeight));
    }
  }
  return heightMap;
}

export function columnBlockAt(y, surfaceY, settings = TERRAIN_SETTINGS) {
  if (y > surfaceY) return BlockType.AIR;
  if (surfaceY >= settings.rockLine) return BlockType.STONE;
  if (y === surfaceY) return BlockType.GRASS;
  if (y >= surfaceY - settings.dirtDepth) return BlockType.DIRT;
  return BlockType.STONE;
}

export function fillTerrain(world, heightMap, settings = TERRAIN_SETTINGS) {
  for (let z = 0; z < heightMap.sizeZ; z++) {
    for (let x = 0; x < heightMap.sizeX; x++) {
      const surfaceY = heightMap.heightAt(x, z);
      for (let y = 0; y <= surfaceY; y++) {
        world.setBlock(x, y, z, columnBlockAt(y, surfaceY, settings));
      }
    }
  }
}
