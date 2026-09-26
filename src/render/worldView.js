import { Lighting } from './lighting.js';
import { Sky } from './sky.js';
import { Clouds } from './clouds.js';
import { BlockHighlight } from './blockHighlight.js';
import { ChunkRenderer } from './chunkRenderer.js';
import { MeshPipeline } from './meshPipeline.js';
import { buildChunkMesh } from './chunkMesher.js';
import { chunkBounds, chunkCoordinate } from '../world/chunkLayout.js';

export class WorldView {
  constructor({ context, document, source, height, material, tileUv, seed, mesher, onError }) {
    this.context = context;
    const { scene } = context;
    this.lighting = new Lighting(scene);
    this.sky = new Sky(scene, document, this.lighting.sunDirection);
    this.clouds = new Clouds(scene, seed);
    this.highlight = new BlockHighlight(scene);
    this.chunks = new ChunkRenderer(scene, material);
    this.meshes = new MeshPipeline({
      isMeshable: source.isChunkMeshable,
      mesher,
      meshNow: (chunkX, chunkZ) => buildChunkMesh(source, chunkBounds(chunkX, chunkZ, height), tileUv),
      sink: this.chunks,
      onError,
    });
  }

  build(center) {
    return this.meshes.buildAll(chunkCoordinate(center.x), chunkCoordinate(center.z));
  }

  handleChunkLoaded(chunkX, chunkZ) {
    this.meshes.handleChunkLoaded(chunkX, chunkZ);
  }

  handleChunkUnloaded(chunkX, chunkZ) {
    this.meshes.handleChunkUnloaded(chunkX, chunkZ);
  }

  invalidateBlock(x, z) {
    this.meshes.invalidateBlock(x, z);
  }

  update(dt, viewer, target) {
    const { camera } = this.context;
    const eye = viewer.eyePosition();
    camera.position.set(eye.x, eye.y, eye.z);
    camera.rotation.set(viewer.pitch, viewer.yaw, 0);
    const { position } = viewer;
    this.meshes.update(chunkCoordinate(position.x), chunkCoordinate(position.z));
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
