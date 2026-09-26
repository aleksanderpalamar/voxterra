import { blockName } from '../world/blockTypes.js';

export class TargetInfo {
  constructor(label, blockAt) {
    this.label = label;
    this.blockAt = blockAt;
    this.shownType = null;
    this.label.hide();
  }

  update(target) {
    if (target === null) {
      this.hide();
      return;
    }
    this.show(this.blockAt(target.position));
  }

  show(blockType) {
    if (blockType === this.shownType) return;
    this.shownType = blockType;
    this.label.show(blockType, blockName(blockType));
  }

  hide() {
    if (this.shownType === null) return;
    this.shownType = null;
    this.label.hide();
  }
}
