export class Hotbar {
  constructor(items) {
    this.items = [...items];
    this.selectedIndex = 0;
    this.listeners = [];
  }

  get selectedBlock() {
    return this.items[this.selectedIndex];
  }

  get size() {
    return this.items.length;
  }

  select(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.items.length) return false;
    this.selectedIndex = index;
    this.listeners.forEach((listener) => listener(index, this.selectedBlock));
    return true;
  }

  cycle(offset) {
    const count = this.items.length;
    return this.select((((this.selectedIndex + offset) % count) + count) % count);
  }

  onChange(listener) {
    this.listeners.push(listener);
  }
}
