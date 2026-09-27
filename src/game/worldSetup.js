import { WORLD_HEIGHT } from '../world/chunkLayout.js';
import { ChunkStreamer } from '../world/chunkStreamer.js';
import { findLandCenter, findSpawnPoint } from '../world/worldGenerator.js';
import { createCollisionQuery, createRenderSource } from '../world/worldQueries.js';
import { mediumAt } from '../world/fluids.js';
import { VoxelCollider } from '../physics/voxelCollider.js';
import { PLAYER_DIMENSIONS, Player } from '../player/player.js';
import { WorldView } from '../render/worldView.js';
import { createTileUvLookup } from '../render/blockTiles.js';
import { TILE_SIZE } from '../render/tilePainters.js';
import { createAtlasTexture, createBlockMaterial, createWaterMaterial } from '../render/textureAtlas.js';
import { AsyncChunkGenerator } from '../workers/asyncChunkGenerator.js';
import { AsyncChunkMesher } from '../workers/asyncChunkMesher.js';
import { ClimateSampler } from '../world/climate.js';

export const WORLD_ORIGIN = Object.freeze({ x: 0, y: 0, z: 0 });

export function createWorldView({ context, document, world, tiles, seed, executor, onError }) {
  const texture = createAtlasTexture(tiles, TILE_SIZE);
  const climate = new ClimateSampler(seed);
  const view = new WorldView({
    context,
    document,
    source: createRenderSource(world),
    height: WORLD_HEIGHT,
    materials: { solid: createBlockMaterial(texture), water: createWaterMaterial(texture) },
    tileUv: createTileUvLookup(),
    sampleClimate: (x, z) => climate.sample(x, z),
    seed,
    mesher: new AsyncChunkMesher(executor, world, seed),
    onError,
  });
  world.onBlockChanged((x, _y, z) => view.invalidateBlock(x, z));
  world.onChunkLoaded((chunkX, chunkZ) => view.handleChunkLoaded(chunkX, chunkZ));
  world.onChunkUnloaded((chunkX, chunkZ) => view.handleChunkUnloaded(chunkX, chunkZ));
  return view;
}

export function createStreamer({ world, seed, executor, store, onError }) {
  const generator = new AsyncChunkGenerator(executor, seed, WORLD_HEIGHT);
  return new ChunkStreamer({ world, generator, store, onError });
}

export function startingPoint(saved, inspector) {
  if (saved !== null) return saved.player;
  return findLandCenter((x, z) => inspector.columnAt(x, z), WORLD_ORIGIN);
}

export function createPlayer(world, saved, start) {
  const collider = new VoxelCollider(createCollisionQuery(world), PLAYER_DIMENSIONS);
  const mediumAtPoint = (x, y, z) => mediumAt((bx, by, bz) => world.getBlock(bx, by, bz), x, y, z);
  const spawn = saved === null ? findSpawnPoint(world, start.x, start.z) : saved.player;
  const player = new Player({ spawn, collider, mediumAt: mediumAtPoint });
  if (saved !== null) player.setOrientation(saved.player.yaw, saved.player.pitch);
  return player;
}
