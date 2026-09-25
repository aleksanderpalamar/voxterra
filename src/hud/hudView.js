export class HudView {
  constructor({ fps, selectedBlock }) {
    this.fpsElement = fps;
    this.selectedBlockElement = selectedBlock;
  }

  setFps(value) {
    this.fpsElement.textContent = `FPS: ${value}`;
  }

  setSelectedBlock(name) {
    this.selectedBlockElement.textContent = name;
  }
}
