import { createRandom } from '../core/random.js';
import { Tile, TILE_COUNT } from './blockTiles.js';
import { OPAQUE, TILE_SIZE } from './paintKit.js';
import {
  dirtPainter,
  grassSidePainter,
  grassTopPainter,
  icePainter,
  sandPainter,
  snowPainter,
  stonePainter,
  waterPainter,
} from './terrainPainters.js';
import {
  barkPainter,
  cactusSidePainter,
  cactusTopPainter,
  leavesPainter,
  pineLeavesPainter,
  woodTopPainter,
} from './plantPainters.js';

export { TILE_SIZE } from './paintKit.js';

const DEFAULT_TEXTURE_SEED = 1971;

const TILE_PAINTERS = Object.freeze({
  [Tile.GRASS_TOP]: grassTopPainter,
  [Tile.GRASS_SIDE]: grassSidePainter,
  [Tile.DIRT]: dirtPainter,
  [Tile.STONE]: stonePainter,
  [Tile.WOOD_SIDE]: barkPainter,
  [Tile.WOOD_TOP]: woodTopPainter,
  [Tile.LEAVES]: leavesPainter,
  [Tile.SAND]: sandPainter,
  [Tile.SNOW]: snowPainter,
  [Tile.WATER]: waterPainter,
  [Tile.ICE]: icePainter,
  [Tile.PINE_LEAVES]: pineLeavesPainter,
  [Tile.CACTUS_SIDE]: cactusSidePainter,
  [Tile.CACTUS_TOP]: cactusTopPainter,
});

export function paintTile(tile, seed = DEFAULT_TEXTURE_SEED) {
  const createPainter = TILE_PAINTERS[tile];
  if (!createPainter) return null;
  const pixelAt = createPainter(createRandom(seed + tile * 7919));
  const pixels = new Uint8ClampedArray(TILE_SIZE * TILE_SIZE * 4);
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const [red, green, blue, alpha = OPAQUE] = pixelAt(x, y);
      pixels.set([red, green, blue, alpha], (y * TILE_SIZE + x) * 4);
    }
  }
  return pixels;
}

export function paintAllTiles(seed = DEFAULT_TEXTURE_SEED) {
  return Array.from({ length: TILE_COUNT }, (_, tile) => paintTile(tile, seed));
}
