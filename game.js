import { ChunkedWorld } from './src/world/chunkedWorld.js';
import { ChunkGenerator } from './src/world/chunkGenerator.js';
import { LeafDecay } from './src/world/leafDecay.js';
import { CHUNK_SIZE, WORLD_HEIGHT } from './src/world/chunkLayout.js';
import { STREAMING_SETTINGS } from './src/world/chunkStreamer.js';
import { PLACEABLE_BLOCKS } from './src/world/blockTypes.js';
import { createTargetQuery } from './src/world/worldQueries.js';
import { Keyboard } from './src/input/keyboard.js';
import { MouseInput } from './src/input/mouseInput.js';
import { LockState, PointerLock } from './src/input/pointerLock.js';
import { BlockTargeting } from './src/interaction/blockTargeting.js';
import { Hotbar } from './src/hotbar/hotbar.js';
import { RenderContext } from './src/render/renderContext.js';
import { TILE_SIZE, paintAllTiles } from './src/render/tilePainters.js';
import { createBlockIconFactory } from './src/hud/blockIcons.js';
import { HotbarView } from './src/hud/hotbarView.js';
import { HudView } from './src/hud/hudView.js';
import { FpsCounter } from './src/hud/fpsCounter.js';
import { DebugPanel } from './src/hud/debugPanel.js';
import { DebugOverlay } from './src/hud/debugOverlay.js';
import { MenuMode, StartScreen } from './src/ui/startScreen.js';
import { Game } from './src/game/game.js';
import { startGameLoop } from './src/game/gameLoop.js';
import { createPlayer, createStreamer, createWorldView, startingPoint } from './src/game/worldSetup.js';
import { createExecutor } from './src/workers/createExecutor.js';
import { loadSavedWorld, openWorldStore } from './src/persistence/openWorldStore.js';
import { parseWorldMetadata } from './src/persistence/worldMetadata.js';
import { WorldAutosave } from './src/persistence/worldAutosave.js';
import { saveOnPageExit } from './src/persistence/pageLifecycle.js';

const VIEW_DISTANCE = (STREAMING_SETTINGS.loadRadius - 1) * CHUNK_SIZE;
const MAX_RANDOM_SEED = 1_000_000_000;
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

function createInput(canvas) {
  const pointerLock = new PointerLock(document, canvas);
  const isLocked = () => pointerLock.state === LockState.LOCKED;
  return { pointerLock, keyboard: new Keyboard(window), mouse: new MouseInput(document, isLocked) };
}

function createHud(tiles, hotbar, inspector) {
  const createIcon = createBlockIconFactory(document, tiles, TILE_SIZE);
  return {
    hud: new HudView({ fps: requireElement('fps'), selectedBlock: requireElement('selected-block') }),
    hotbarView: new HotbarView(requireElement('hotbar'), document, hotbar.items, createIcon),
    fpsCounter: new FpsCounter(),
    debugOverlay: new DebugOverlay(new DebugPanel(requireElement('debug-panel')), (x, z) => inspector.columnAt(x, z)),
  };
}

async function buildGame(context, startScreen) {
  const { store, mode: storageMode } = await openWorldStore(window.indexedDB, reportError);
  const saved = await loadSavedWorld(store, parseWorldMetadata, reportError);
  const seed = saved?.seed ?? resolveSeed(window.location);
  const world = new ChunkedWorld(WORLD_HEIGHT);
  const tiles = paintAllTiles();
  const inspector = new ChunkGenerator(seed, WORLD_HEIGHT);
  const executor = createExecutor(navigator, reportError);
  const view = createWorldView({ context, document, world, tiles, seed, executor, onError: reportError });
  const streamer = createStreamer({ world, seed, executor, store, onError: reportError });
  const start = startingPoint(saved, inspector);
  await streamer.loadAround(start);
  await view.build(start);
  const player = createPlayer(world, saved, start);
  const autosave = new WorldAutosave({ world, store, player, seed, onError: reportError });
  if (saved === null) await autosave.saveNow();
  saveOnPageExit(window, document, autosave);
  const hotbar = new Hotbar(PLACEABLE_BLOCKS);
  const game = new Game({
    world,
    player,
    hotbar,
    view,
    streamer,
    startScreen,
    autosave,
    leafDecay: new LeafDecay({ world }),
    storageMode,
    menuMode: saved === null ? MenuMode.NEW_WORLD : MenuMode.RESUME,
    confirm: (message) => window.confirm(message),
    restart: () => window.location.reload(),
    onError: reportError,
    targeting: new BlockTargeting(createTargetQuery(world)),
    ...createInput(context.canvas),
    ...createHud(tiles, hotbar, inspector),
  });
  game.start();
  startGameLoop(window, (elapsed) => game.frame(elapsed));
}

function main() {
  const startScreen = new StartScreen({
    root: requireElement('start-screen'),
    playButton: requireElement('play-button'),
    newWorldButton: requireElement('new-world-button'),
    status: requireElement('start-status'),
  });
  const context = tryCreateRenderContext();
  if (context === null) {
    startScreen.setStatus(Message.WEBGL_UNAVAILABLE);
    return;
  }
  startScreen.setStatus(Message.LOADING);
  window.setTimeout(() => {
    buildGame(context, startScreen).catch((error) => {
      reportError(error);
      startScreen.setStatus(Message.WORLD_FAILED);
    });
  }, LOADING_DELAY_MS);
}

main();
