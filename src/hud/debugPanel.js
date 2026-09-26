export class DebugPanel {
  constructor(element) {
    this.element = element;
  }

  setVisible(visible) {
    this.element.hidden = !visible;
  }

  render(lines) {
    this.element.textContent = lines.join('\n');
  }
}
