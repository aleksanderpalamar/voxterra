import { BlockType } from '../world/blockTypes.js';
import { FaceDirection } from './faceDefinitions.js';
import { tileUvRect } from './atlasLayout.js';

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
  WATER: 9,
  ICE: 10,
  PINE_LEAVES: 11,
  CACTUS_SIDE: 12,
  CACTUS_TOP: 13,
  PINE_WOOD_SIDE: 14,
  PINE_WOOD_TOP: 15,
  ACACIA_WOOD_SIDE: 16,
  ACACIA_WOOD_TOP: 17,
  JUNGLE_WOOD_SIDE: 18,
  JUNGLE_WOOD_TOP: 19,
});

export const TILE_COUNT = Object.keys(Tile).length;


function uniformTiles(tile) {
  return Object.freeze({ top: tile, bottom: tile, side: tile });
}

function pillarTiles(end, side) {
  return Object.freeze({ top: end, bottom: end, side });
}

const BLOCK_TILES = Object.freeze({
  [BlockType.GRASS]: Object.freeze({ top: Tile.GRASS_TOP, bottom: Tile.DIRT, side: Tile.GRASS_SIDE }),
  [BlockType.DIRT]: uniformTiles(Tile.DIRT),
  [BlockType.STONE]: uniformTiles(Tile.STONE),
  [BlockType.WOOD]: pillarTiles(Tile.WOOD_TOP, Tile.WOOD_SIDE),
  [BlockType.PINE_WOOD]: pillarTiles(Tile.PINE_WOOD_TOP, Tile.PINE_WOOD_SIDE),
  [BlockType.ACACIA_WOOD]: pillarTiles(Tile.ACACIA_WOOD_TOP, Tile.ACACIA_WOOD_SIDE),
  [BlockType.JUNGLE_WOOD]: pillarTiles(Tile.JUNGLE_WOOD_TOP, Tile.JUNGLE_WOOD_SIDE),
  [BlockType.LEAVES]: uniformTiles(Tile.LEAVES),
  [BlockType.PERSISTENT_LEAVES]: uniformTiles(Tile.LEAVES),
  [BlockType.SAND]: uniformTiles(Tile.SAND),
  [BlockType.SNOW]: uniformTiles(Tile.SNOW),
  [BlockType.WATER]: uniformTiles(Tile.WATER),
  [BlockType.ICE]: uniformTiles(Tile.ICE),
  [BlockType.PINE_LEAVES]: uniformTiles(Tile.PINE_LEAVES),
  [BlockType.CACTUS]: pillarTiles(Tile.CACTUS_TOP, Tile.CACTUS_SIDE),
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

export function createTileUvLookup() {
  const cache = new Map();
  return (blockType, direction) => {
    const tile = tileFor(blockType, direction);
    if (!cache.has(tile)) cache.set(tile, tileUvRect(tile, TILE_COUNT));
    return cache.get(tile);
  };
}
