import { GameState } from './gameState.js';
import { LockState } from '../input/pointerLock.js';
import { MouseButton } from '../input/mouseInput.js';
import { IDLE_INTENT, KeyBinding, hotbarSlotFromKey, readMovementIntent } from '../input/keyBindings.js';
import { breakBlock, placeBlock } from '../interaction/blockInteraction.js';
import { blockName } from '../world/blockTypes.js';
import { MenuMode } from '../ui/startScreen.js';
import { StorageMode } from '../persistence/openWorldStore.js';

const MAX_FRAME_TIME = 0.05;
const MOUSE_SENSITIVITY = 0.0022;

export const MenuMessage = Object.freeze({
  NEW_WORLD: 'Clique em Play para começar',
  RESUME: 'Seu progresso é salvo automaticamente',
  MEMORY_ONLY: 'Salvamento indisponível neste navegador: o progresso não será guardado.',
  LOCK_FAILED: 'Não foi possível capturar o mouse. Aguarde um instante e clique em Play novamente.',
  CONFIRM_NEW_WORLD: 'Criar um novo mundo? O mundo atual será apagado.',
  CREATING_WORLD: 'Criando um novo mundo…',
  ERASE_FAILED: 'Não foi possível apagar o mundo salvo. Tente novamente.',
});

export class Game {
  constructor(dependencies) {
    this.world = dependencies.world;
    this.player = dependencies.player;
    this.targeting = dependencies.targeting;
    this.hotbar = dependencies.hotbar;
    this.keyboard = dependencies.keyboard;
    this.mouse = dependencies.mouse;
    this.pointerLock = dependencies.pointerLock;
    this.view = dependencies.view;
    this.streamer = dependencies.streamer;
    this.hud = dependencies.hud;
    this.hotbarView = dependencies.hotbarView;
    this.startScreen = dependencies.startScreen;
    this.fpsCounter = dependencies.fpsCounter;
    this.debugOverlay = dependencies.debugOverlay;
    this.autosave = dependencies.autosave;
    this.menuMode = dependencies.menuMode;
    this.storageMode = dependencies.storageMode;
    this.confirm = dependencies.confirm;
    this.restart = dependencies.restart;
    this.onError = dependencies.onError;
    this.state = GameState.LOADING;
  }

  start() {
    this.bindMenu();
    this.bindControls();
    this.bindHotbar();
    this.enterMenu();
    this.startScreen.setReady(true);
  }

  bindMenu() {
    this.startScreen.onPlay(() => this.pointerLock.request());
    this.startScreen.onNewWorld(() => this.startNewWorld());
    this.pointerLock.onChange((lockState) => this.handleLockChange(lockState));
    this.pointerLock.onError(() => this.startScreen.setStatus(MenuMessage.LOCK_FAILED));
  }

  bindControls() {
    this.mouse.onLook((dx, dy) => this.player.look(-dx * MOUSE_SENSITIVITY, -dy * MOUSE_SENSITIVITY));
    this.mouse.onButton((button) => this.handleMouseButton(button));
    this.mouse.onScroll((direction) => this.hotbar.cycle(direction));
    this.keyboard.onKeyPressed((code) => this.handleKey(code));
  }

  bindHotbar() {
    this.hotbar.onChange((index, blockType) => this.showSelection(index, blockType));
    this.showSelection(this.hotbar.selectedIndex, this.hotbar.selectedBlock);
  }

  showSelection(index, blockType) {
    this.hotbarView.highlight(index);
    this.hud.setSelectedBlock(blockName(blockType));
  }

  handleLockChange(lockState) {
    if (lockState === LockState.LOCKED) {
      this.enterPlaying();
      return;
    }
    this.enterMenu();
  }

  enterPlaying() {
    this.state = GameState.PLAYING;
    this.menuMode = MenuMode.RESUME;
    this.startScreen.hide();
  }

  enterMenu() {
    if (this.state === GameState.PLAYING) this.autosave.saveNow();
    this.state = GameState.MENU;
    this.keyboard.clear();
    this.targeting.clear();
    this.startScreen.setMode(this.menuMode);
    this.startScreen.setStatus(this.menuMessage());
    this.startScreen.show();
  }

  menuMessage() {
    if (this.storageMode === StorageMode.MEMORY) return MenuMessage.MEMORY_ONLY;
    return this.menuMode === MenuMode.RESUME ? MenuMessage.RESUME : MenuMessage.NEW_WORLD;
  }

  async startNewWorld() {
    if (this.menuMode === MenuMode.RESUME && !this.confirm(MenuMessage.CONFIRM_NEW_WORLD)) return;
    this.startScreen.setReady(false);
    this.startScreen.setStatus(MenuMessage.CREATING_WORLD);
    try {
      await this.autosave.erase();
      this.restart();
    } catch (error) {
      this.onError(error);
      this.startScreen.setStatus(MenuMessage.ERASE_FAILED);
      this.startScreen.setReady(true);
    }
  }

  handleKey(code) {
    if (this.state !== GameState.PLAYING) return;
    if (code === KeyBinding.DEBUG) {
      this.debugOverlay.toggle();
      return;
    }
    const slot = hotbarSlotFromKey(code, this.hotbar.size);
    if (slot === null) return;
    this.hotbar.select(slot);
  }

  handleMouseButton(button) {
    const target = this.targeting.current;
    if (this.state !== GameState.PLAYING || target === null) return;
    switch (button) {
      case MouseButton.PRIMARY:
        breakBlock(this.world, target.position);
        break;
      case MouseButton.SECONDARY:
        placeBlock(this.world, target, this.hotbar.selectedBlock, this.player.bounds());
        break;
      default:
        return;
    }
    this.refreshTarget();
  }

  refreshTarget() {
    if (this.state !== GameState.PLAYING) {
      this.targeting.clear();
      return;
    }
    this.targeting.update(this.player.eyePosition(), this.player.lookDirection());
  }

  currentIntent() {
    if (this.state !== GameState.PLAYING) return IDLE_INTENT;
    return readMovementIntent((code) => this.keyboard.isPressed(code));
  }

  frame(elapsed) {
    const dt = Math.min(elapsed, MAX_FRAME_TIME);
    this.player.update(dt, this.currentIntent());
    this.streamer.update(this.player.position);
    if (this.state === GameState.PLAYING) this.autosave.update(dt);
    this.refreshTarget();
    this.view.update(dt, this.player, this.targeting.current);
    this.view.render();
    this.debugOverlay.update(this.player.position);
    this.reportFps(elapsed);
  }

  reportFps(elapsed) {
    const fps = this.fpsCounter.tick(elapsed);
    if (fps === null) return;
    this.hud.setFps(fps);
  }
}
