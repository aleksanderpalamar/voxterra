export const MenuMode = Object.freeze({
  NEW_WORLD: 'new-world',
  RESUME: 'resume',
});

const PLAY_LABELS = Object.freeze({
  [MenuMode.NEW_WORLD]: 'Play',
  [MenuMode.RESUME]: 'Continuar',
});

export class StartScreen {
  constructor({ root, playButton, newWorldButton, status }) {
    this.root = root;
    this.playButton = playButton;
    this.newWorldButton = newWorldButton;
    this.status = status;
  }

  onPlay(listener) {
    this.playButton.addEventListener('click', listener);
  }

  onNewWorld(listener) {
    this.newWorldButton.addEventListener('click', listener);
  }

  show() {
    this.root.hidden = false;
  }

  hide() {
    this.root.hidden = true;
    this.playButton.blur();
  }

  setMode(mode) {
    this.playButton.textContent = PLAY_LABELS[mode];
  }

  setStatus(message) {
    this.status.textContent = message;
  }

  setReady(ready) {
    this.playButton.disabled = !ready;
    this.newWorldButton.disabled = !ready;
  }
}
