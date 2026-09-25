import { blockName } from '../world/blockTypes.js';

const SELECTED_CLASS = 'selected';

function createSlot(document, blockType, index, createIcon) {
  const slot = document.createElement('div');
  slot.className = 'hotbar-slot';
  slot.title = blockName(blockType);
  const icon = createIcon(blockType);
  icon.classList.add('hotbar-icon');
  const key = document.createElement('span');
  key.className = 'hotbar-key';
  key.textContent = String(index + 1);
  slot.append(icon, key);
  return slot;
}

export class HotbarView {
  constructor(container, document, items, createIcon) {
    this.slots = items.map((blockType, index) => createSlot(document, blockType, index, createIcon));
    container.replaceChildren(...this.slots);
  }

  highlight(selectedIndex) {
    this.slots.forEach((slot, index) => slot.classList.toggle(SELECTED_CLASS, index === selectedIndex));
  }
}
