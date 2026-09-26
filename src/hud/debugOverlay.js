import { biomeName } from '../world/biomes.js';
import { chunkCoordinate } from '../world/chunkLayout.js';

export function formatDebugLines(position, column) {
  const { x, y, z } = position;
  return [
    `XYZ: ${x.toFixed(1)} / ${y.toFixed(1)} / ${z.toFixed(1)}`,
    `Chunk: ${chunkCoordinate(x)}, ${chunkCoordinate(z)}`,
    `Bioma: ${biomeName(column.biome)}`,
    `Temperatura: ${column.climate.temperature.toFixed(2)}`,
    `Umidade: ${column.climate.humidity.toFixed(2)}`,
  ];
}

export class DebugOverlay {
  constructor(panel, describeColumn) {
    this.panel = panel;
    this.describeColumn = describeColumn;
    this.visible = false;
    this.panel.setVisible(false);
  }

  toggle() {
    this.visible = !this.visible;
    this.panel.setVisible(this.visible);
  }

  update(position) {
    if (!this.visible) return;
    const column = this.describeColumn(Math.floor(position.x), Math.floor(position.z));
    this.panel.render(formatDebugLines(position, column));
  }
}
