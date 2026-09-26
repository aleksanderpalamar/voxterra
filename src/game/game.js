import { GameState } from './gameState.js';
import { LockState } from '../input/pointerLock.js';
import { MouseButton } from '../input/mouseInput.js';
import { IDLE_INTENT, hotbarSlotFromKey, readMovementIntent } from '../input/keyBindings.js';
import { breakBlock, placeBlock } from '../interaction/blockInteraction.js';
import { blockName } from '../world/blockTypes.js';

const MAX_FRAME_TIME = 0.05;
const MOUSE_SENSITIVITY = 0.0022;

export const MenuMessage = Object.freeze({
  READY: 'Clique em Play para começar',
  LOCK_FAILED: 'Não foi possível capturar o mouse. Aguarde um instante e clique em Play novamente.',
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
    this.startScreen.hide();
  }

  enterMenu() {
    this.state = GameState.MENU;
    this.keyboard.clear();
    this.targeting.clear();
    this.startScreen.setStatus(MenuMessage.READY);
    this.startScreen.show();
  }

  handleKey(code) {
    if (this.state !== GameState.PLAYING) return;
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
    this.refreshTarget();
    this.view.update(dt, this.player, this.targeting.current);
    this.view.render();
    this.reportFps(elapsed);
  }

  reportFps(elapsed) {
    const fps = this.fpsCounter.tick(elapsed);
    if (fps === null) return;
    this.hud.setFps(fps);
  }
}
