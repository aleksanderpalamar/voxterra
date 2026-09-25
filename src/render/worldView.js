import { Lighting } from './lighting.js';
import { Sky } from './sky.js';
import { Clouds } from './clouds.js';
import { BlockHighlight } from './blockHighlight.js';
import { ChunkRenderer } from './chunkRenderer.js';

export class WorldView {
  constructor({ context, document, source, dimensions, material, tileUv, seed }) {
    this.context = context;
    const { scene } = context;
    this.lighting = new Lighting(scene);
    this.sky = new Sky(scene, document, this.lighting.sunDirection);
    this.clouds = new Clouds(scene, seed, { x: dimensions.sizeX / 2, z: dimensions.sizeZ / 2 });
    this.highlight = new BlockHighlight(scene);
    this.chunks = new ChunkRenderer(scene, source, dimensions, material, tileUv);
  }

  build() {
    this.chunks.buildAll();
  }

  invalidateBlock(x, z) {
    this.chunks.invalidateBlock(x, z);
  }

  update(dt, viewer, target) {
    const { camera } = this.context;
    const eye = viewer.eyePosition();
    camera.position.set(eye.x, eye.y, eye.z);
    camera.rotation.set(viewer.pitch, viewer.yaw, 0);
    this.chunks.flush();
    this.lighting.follow(viewer.position);
    this.sky.follow(camera.position);
    this.clouds.update(dt);
    this.updateHighlight(target);
  }

  updateHighlight(target) {
    if (target === null) {
      this.highlight.hide();
      return;
    }
    this.highlight.show(target.position);
  }

  render() {
    this.context.render();
  }
}
