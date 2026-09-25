export const MouseButton = Object.freeze({
  PRIMARY: 0,
  SECONDARY: 2,
});

const MAX_LOOK_DELTA = 300;

export class MouseInput {
  constructor(target, isActive) {
    this.isActive = isActive;
    this.lookListeners = [];
    this.buttonListeners = [];
    this.scrollListeners = [];
    target.addEventListener('mousemove', (event) => this.handleMove(event));
    target.addEventListener('mousedown', (event) => this.handleButton(event));
    target.addEventListener('wheel', (event) => this.handleWheel(event), { passive: true });
    target.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  handleMove(event) {
    if (!this.isActive()) return;
    if (Math.abs(event.movementX) > MAX_LOOK_DELTA || Math.abs(event.movementY) > MAX_LOOK_DELTA) return;
    this.lookListeners.forEach((listener) => listener(event.movementX, event.movementY));
  }

  handleButton(event) {
    if (!this.isActive()) return;
    this.buttonListeners.forEach((listener) => listener(event.button));
  }

  handleWheel(event) {
    if (!this.isActive() || event.deltaY === 0) return;
    this.scrollListeners.forEach((listener) => listener(Math.sign(event.deltaY)));
  }

  onLook(listener) {
    this.lookListeners.push(listener);
  }

  onButton(listener) {
    this.buttonListeners.push(listener);
  }

  onScroll(listener) {
    this.scrollListeners.push(listener);
  }
}
