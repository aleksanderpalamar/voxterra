import { biomeName } from '../world/biomes.js';
import { chunkCoordinate } from '../world/chunkLayout.js';

function formatValue(value, digits) {
  const text = value.toFixed(digits);
  return Number(text) === 0 ? (0).toFixed(digits) : text;
}

export function formatDebugLines(position, column) {
  const { x, y, z } = position;
  return [
    `XYZ: ${formatValue(x, 1)} / ${formatValue(y, 1)} / ${formatValue(z, 1)}`,
    `Chunk: ${chunkCoordinate(x)}, ${chunkCoordinate(z)}`,
    `Bioma: ${biomeName(column.biome)}`,
    `Continentalidade: ${formatValue(column.continentalness, 2)}`,
    `Temperatura: ${formatValue(column.climate.temperature, 2)}`,
    `Umidade: ${formatValue(column.climate.humidity, 2)}`,
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
