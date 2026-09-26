import { Lighting } from './lighting.js';
import { Sky } from './sky.js';
import { Clouds } from './clouds.js';
import { BlockHighlight } from './blockHighlight.js';
import { ChunkRenderer } from './chunkRenderer.js';
import { chunkCoordinate } from '../world/chunkLayout.js';

const MESH_BUDGET_PER_FRAME = 1;

export class WorldView {
  constructor({ context, document, source, height, material, tileUv, seed }) {
    this.context = context;
    const { scene } = context;
    this.lighting = new Lighting(scene);
    this.sky = new Sky(scene, document, this.lighting.sunDirection);
    this.clouds = new Clouds(scene, seed);
    this.highlight = new BlockHighlight(scene);
    this.chunks = new ChunkRenderer(scene, source, height, material, tileUv);
  }

  build(center) {
    this.chunks.buildPending(chunkCoordinate(center.x), chunkCoordinate(center.z));
  }

  handleChunkLoaded(chunkX, chunkZ) {
    this.chunks.handleChunkLoaded(chunkX, chunkZ);
  }

  handleChunkUnloaded(chunkX, chunkZ) {
    this.chunks.handleChunkUnloaded(chunkX, chunkZ);
  }

  invalidateBlock(x, z) {
    this.chunks.invalidateBlock(x, z);
  }

  update(dt, viewer, target) {
    const { camera } = this.context;
    const eye = viewer.eyePosition();
    camera.position.set(eye.x, eye.y, eye.z);
    camera.rotation.set(viewer.pitch, viewer.yaw, 0);
    const { position } = viewer;
    this.chunks.update(chunkCoordinate(position.x), chunkCoordinate(position.z), MESH_BUDGET_PER_FRAME);
    this.lighting.follow(position);
    this.sky.follow(camera.position);
    this.clouds.update(dt, camera.position);
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
