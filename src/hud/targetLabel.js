const ICON_CLASS = 'target-icon';

export class TargetLabel {
  constructor(element, document, createIcon) {
    this.element = element;
    this.createIcon = createIcon;
    this.icons = new Map();
    this.nameElement = document.createElement('span');
  }

  show(blockType, name) {
    this.nameElement.textContent = name;
    this.element.replaceChildren(this.iconFor(blockType), this.nameElement);
    this.element.hidden = false;
  }

  hide() {
    this.element.hidden = true;
  }

  iconFor(blockType) {
    if (!this.icons.has(blockType)) {
      const icon = this.createIcon(blockType);
      icon.classList.add(ICON_CLASS);
      this.icons.set(blockType, icon);
    }
    return this.icons.get(blockType);
  }
}
