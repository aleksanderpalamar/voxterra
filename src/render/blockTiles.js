import { BlockType } from '../world/blockTypes.js';
import { FaceDirection } from './faceDefinitions.js';

export const Tile = Object.freeze({
  GRASS_TOP: 0,
  GRASS_SIDE: 1,
  DIRT: 2,
  STONE: 3,
  WOOD_SIDE: 4,
  WOOD_TOP: 5,
  LEAVES: 6,
  SAND: 7,
  SNOW: 8,
});

export const TILE_COUNT = Object.keys(Tile).length;

const UV_INSET = 0.002;

function uniformTiles(tile) {
  return Object.freeze({ top: tile, bottom: tile, side: tile });
}

const BLOCK_TILES = Object.freeze({
  [BlockType.GRASS]: Object.freeze({ top: Tile.GRASS_TOP, bottom: Tile.DIRT, side: Tile.GRASS_SIDE }),
  [BlockType.DIRT]: uniformTiles(Tile.DIRT),
  [BlockType.STONE]: uniformTiles(Tile.STONE),
  [BlockType.WOOD]: Object.freeze({ top: Tile.WOOD_TOP, bottom: Tile.WOOD_TOP, side: Tile.WOOD_SIDE }),
  [BlockType.LEAVES]: uniformTiles(Tile.LEAVES),
  [BlockType.SAND]: uniformTiles(Tile.SAND),
  [BlockType.SNOW]: uniformTiles(Tile.SNOW),
});

const MISSING_TILES = uniformTiles(Tile.STONE);

export function tileFor(blockType, direction) {
  const tiles = BLOCK_TILES[blockType] ?? MISSING_TILES;
  switch (direction) {
    case FaceDirection.TOP:
      return tiles.top;
    case FaceDirection.BOTTOM:
      return tiles.bottom;
    default:
      return tiles.side;
  }
}

export function tileUvRect(tile, tileCount = TILE_COUNT) {
  const width = 1 / tileCount;
  const inset = width * UV_INSET;
  return Object.freeze({
    u0: tile * width + inset,
    u1: (tile + 1) * width - inset,
    v0: UV_INSET,
    v1: 1 - UV_INSET,
  });
}

export function createTileUvLookup() {
  const cache = new Map();
  return (blockType, direction) => {
    const tile = tileFor(blockType, direction);
    if (!cache.has(tile)) cache.set(tile, tileUvRect(tile));
    return cache.get(tile);
  };
}
