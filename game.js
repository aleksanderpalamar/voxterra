import { ChunkedWorld } from './src/world/chunkedWorld.js';
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
import { WorkerPool } from './src/workers/workerPool.js';
import { InlineExecutor } from './src/workers/inlineExecutor.js';
import { createChunkJobHandler } from './src/workers/chunkJobHandler.js';
import { AsyncChunkGenerator } from './src/workers/asyncChunkGenerator.js';
import { AsyncChunkMesher } from './src/workers/asyncChunkMesher.js';

const WORLD_ORIGIN = Object.freeze({ x: 0, y: 0, z: 0 });
const VIEW_DISTANCE = (STREAMING_SETTINGS.loadRadius - 1) * CHUNK_SIZE;
const MAX_RANDOM_SEED = 1_000_000_000;
const MAX_WORKERS = 4;
const LOADING_DELAY_MS = 30;

const Message = Object.freeze({
  LOADING: 'Gerando mundo…',
  WEBGL_UNAVAILABLE: 'WebGL não está disponível neste navegador.',
  WORLD_FAILED: 'Não foi possível gerar o mundo. Recarregue a página.',
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

function reportError(error) {
  console.error(error);
}

function workerCount() {
  return Math.max(1, Math.min(MAX_WORKERS, (navigator.hardwareConcurrency ?? 2) - 1));
}

function createExecutor() {
  if (typeof Worker === 'undefined') return new InlineExecutor(createChunkJobHandler());
  try {
    const url = new URL('./src/workers/chunkWorker.js', import.meta.url);
    return new WorkerPool(() => new Worker(url, { type: 'module' }), workerCount());
  } catch (error) {
    reportError(error);
    return new InlineExecutor(createChunkJobHandler());
  }
}

function createWorldView(context, world, tiles, seed, executor) {
  const view = new WorldView({
    context,
    document,
    source: createRenderSource(world),
    height: WORLD_HEIGHT,
    material: createBlockMaterial(createAtlasTexture(tiles, TILE_SIZE)),
    tileUv: createTileUvLookup(),
    seed,
    mesher: new AsyncChunkMesher(executor, world),
    onError: reportError,
  });
  world.onBlockChanged((x, _y, z) => view.invalidateBlock(x, z));
  world.onChunkLoaded((chunkX, chunkZ) => view.handleChunkLoaded(chunkX, chunkZ));
  world.onChunkUnloaded((chunkX, chunkZ) => view.handleChunkUnloaded(chunkX, chunkZ));
  return view;
}

function createStreamer(world, seed, executor) {
  const generator = new AsyncChunkGenerator(executor, seed, WORLD_HEIGHT);
  return new ChunkStreamer({ world, generator, store: new MemoryChunkStore(), onError: reportError });
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

async function buildGame(context, startScreen, seed) {
  const world = new ChunkedWorld(WORLD_HEIGHT);
  const tiles = paintAllTiles();
  const executor = createExecutor();
  const view = createWorldView(context, world, tiles, seed, executor);
  const streamer = createStreamer(world, seed, executor);
  await streamer.loadAround(WORLD_ORIGIN);
  await view.build(WORLD_ORIGIN);
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
  window.setTimeout(() => {
    buildGame(context, startScreen, resolveSeed(window.location)).catch((error) => {
      reportError(error);
      startScreen.setStatus(Message.WORLD_FAILED);
    });
  }, LOADING_DELAY_MS);
}

main();
