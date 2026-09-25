export class StartScreen {
  constructor({ root, playButton, status }) {
    this.root = root;
    this.playButton = playButton;
    this.status = status;
  }

  onPlay(listener) {
    this.playButton.addEventListener('click', listener);
  }

  show() {
    this.root.hidden = false;
  }

  hide() {
    this.root.hidden = true;
    this.playButton.blur();
  }

  setStatus(message) {
    this.status.textContent = message;
  }

  setReady(ready) {
    this.playButton.disabled = !ready;
  }
}
