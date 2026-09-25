export const LockState = Object.freeze({
  UNLOCKED: 'unlocked',
  LOCKED: 'locked',
});

export class PointerLock {
  constructor(document, element) {
    this.document = document;
    this.element = element;
    this.changeListeners = [];
    this.errorListeners = [];
    document.addEventListener('pointerlockchange', () => this.notifyChange());
    document.addEventListener('pointerlockerror', () => this.notifyError());
  }

  get state() {
    return this.document.pointerLockElement === this.element ? LockState.LOCKED : LockState.UNLOCKED;
  }

  request() {
    Promise.resolve(this.element.requestPointerLock()).catch(() => this.notifyError());
  }

  onChange(listener) {
    this.changeListeners.push(listener);
  }

  onError(listener) {
    this.errorListeners.push(listener);
  }

  notifyChange() {
    this.changeListeners.forEach((listener) => listener(this.state));
  }

  notifyError() {
    this.errorListeners.forEach((listener) => listener());
  }
}
