import { ChunkedWorld } from './src/world/chunkedWorld.js';
import { ChunkGenerator } from './src/world/chunkGenerator.js';
import { CHUNK_SIZE, WORLD_HEIGHT } from './src/world/chunkLayout.js';
import { ChunkStreamer, STREAMING_SETTINGS } from './src/world/chunkStreamer.js';
import { MemoryChunkStore } from './src/world/memoryChunkStore.js';
import { PLACEABLE_BLOCKS } from './src/world/blockTypes.js';
import { findSpawnPoint } from './src/world/worldGenerator.js';
import { createCollisionQuery, createRenderSource, createTargetQuery } from './src/world/worldQueries.js';
import { VoxelCollider } from './src/physics/voxelCollider.js';
import { PLAYER_DIMENSIONS, Player } from './src/player/player.js';
import { Keyboard } from './src/input/keyboard.js';
import { MouseInput } from './src/input/mouseInput.js';
import { LockState, PointerLock } from './src/input/pointerLock.js';
import { BlockTargeting } from './src/interaction/blockTargeting.js';
import { Hotbar } from './src/hotbar/hotbar.js';
import { RenderContext } from './src/render/renderContext.js';
import { WorldView } from './src/render/worldView.js';
import { createTileUvLookup } from './src/render/blockTiles.js';
import { TILE_SIZE, paintAllTiles } from './src/render/tilePainters.js';
import { createAtlasTexture, createBlockMaterial } from './src/render/textureAtlas.js';
import { createBlockIconFactory } from './src/hud/blockIcons.js';
import { HotbarView } from './src/hud/hotbarView.js';
import { HudView } from './src/hud/hudView.js';
import { FpsCounter } from './src/hud/fpsCounter.js';
import { StartScreen } from './src/ui/startScreen.js';
import { Game } from './src/game/game.js';
import { startGameLoop } from './src/game/gameLoop.js';

const WORLD_ORIGIN = Object.freeze({ x: 0, y: 0, z: 0 });
const VIEW_DISTANCE = (STREAMING_SETTINGS.loadRadius - 1) * CHUNK_SIZE;
const MAX_RANDOM_SEED = 1_000_000_000;
const LOADING_DELAY_MS = 30;

const Message = Object.freeze({
  LOADING: 'Gerando mundo…',
  WEBGL_UNAVAILABLE: 'WebGL não está disponível neste navegador.',
});

function requireElement(id) {
  const element = document.getElementById(id);
  if (element === null) throw new Error(`Elemento #${id} não encontrado no HTML.`);
  return element;
}

function resolveSeed(location) {
  const parsed = Number.parseInt(new URLSearchParams(location.search).get('seed') ?? '', 10);
  if (Number.isFinite(parsed)) return parsed;
  return Math.floor(Math.random() * MAX_RANDOM_SEED);
}

function tryCreateRenderContext() {
  try {
    return new RenderContext(requireElement('game-root'), window, VIEW_DISTANCE);
  } catch (error) {
    console.error(error);
    return null;
  }
}

function createWorldView(context, world, tiles, seed) {
  const view = new WorldView({
    context,
    document,
    source: createRenderSource(world),
    height: WORLD_HEIGHT,
    material: createBlockMaterial(createAtlasTexture(tiles, TILE_SIZE)),
    tileUv: createTileUvLookup(),
    seed,
  });
  world.onBlockChanged((x, _y, z) => view.invalidateBlock(x, z));
  world.onChunkLoaded((chunkX, chunkZ) => view.handleChunkLoaded(chunkX, chunkZ));
  world.onChunkUnloaded((chunkX, chunkZ) => view.handleChunkUnloaded(chunkX, chunkZ));
  return view;
}

function createStreamer(world, seed) {
  const generator = new ChunkGenerator(seed, WORLD_HEIGHT);
  return new ChunkStreamer(world, generator, new MemoryChunkStore());
}

function createInput(canvas) {
  const pointerLock = new PointerLock(document, canvas);
  const isLocked = () => pointerLock.state === LockState.LOCKED;
  return { pointerLock, keyboard: new Keyboard(window), mouse: new MouseInput(document, isLocked) };
}

function createHud(tiles, hotbar) {
  const createIcon = createBlockIconFactory(document, tiles, TILE_SIZE);
  return {
    hud: new HudView({ fps: requireElement('fps'), selectedBlock: requireElement('selected-block') }),
    hotbarView: new HotbarView(requireElement('hotbar'), document, hotbar.items, createIcon),
    fpsCounter: new FpsCounter(),
  };
}

function buildGame(context, startScreen, seed) {
  const world = new ChunkedWorld(WORLD_HEIGHT);
  const tiles = paintAllTiles();
  const view = createWorldView(context, world, tiles, seed);
  const streamer = createStreamer(world, seed);
  streamer.loadAround(WORLD_ORIGIN);
  view.build(WORLD_ORIGIN);
  const collider = new VoxelCollider(createCollisionQuery(world), PLAYER_DIMENSIONS);
  const player = new Player(findSpawnPoint(world, WORLD_ORIGIN.x, WORLD_ORIGIN.z), collider);
  const hotbar = new Hotbar(PLACEABLE_BLOCKS);
  const game = new Game({
    world,
    player,
    hotbar,
    view,
    streamer,
    startScreen,
    targeting: new BlockTargeting(createTargetQuery(world)),
    ...createInput(context.canvas),
    ...createHud(tiles, hotbar),
  });
  game.start();
  startGameLoop(window, (elapsed) => game.frame(elapsed));
}

function main() {
  const startScreen = new StartScreen({
    root: requireElement('start-screen'),
    playButton: requireElement('play-button'),
    status: requireElement('start-status'),
  });
  const context = tryCreateRenderContext();
  if (context === null) {
    startScreen.setStatus(Message.WEBGL_UNAVAILABLE);
    return;
  }
  startScreen.setStatus(Message.LOADING);
  window.setTimeout(() => buildGame(context, startScreen, resolveSeed(window.location)), LOADING_DELAY_MS);
}

main();
