const BLOCKED_DEFAULT_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'F3']);

export class Keyboard {
  constructor(target) {
    this.pressed = new Set();
    this.listeners = [];
    target.addEventListener('keydown', (event) => this.handleKeyDown(event));
    target.addEventListener('keyup', (event) => this.pressed.delete(event.code));
    target.addEventListener('blur', () => this.clear());
  }

  handleKeyDown(event) {
    if (BLOCKED_DEFAULT_KEYS.has(event.code)) event.preventDefault();
    this.pressed.add(event.code);
    if (event.repeat) return;
    this.listeners.forEach((listener) => listener(event.code));
  }

  isPressed(code) {
    return this.pressed.has(code);
  }

  onKeyPressed(listener) {
    this.listeners.push(listener);
  }

  clear() {
    this.pressed.clear();
  }
}
