import { Lighting } from './lighting.js';
import { Sky } from './sky.js';
import { Clouds } from './clouds.js';
import { BlockHighlight } from './blockHighlight.js';
import { ChunkRenderer } from './chunkRenderer.js';
import { MeshPipeline } from './meshPipeline.js';
import { Atmosphere } from './atmosphere.js';
import { buildChunkMesh } from './chunkMesher.js';
import { createChunkTint } from './chunkTint.js';
import { chunkBounds, chunkCoordinate } from '../world/chunkLayout.js';
import { mediumAt } from '../world/fluids.js';

export class WorldView {
  constructor({ context, document, source, height, materials, tileUv, sampleClimate, seed, mesher, onError }) {
    this.context = context;
    this.source = source;
    const { scene, camera } = context;
    this.lighting = new Lighting(scene);
    this.sky = new Sky(scene, document, this.lighting.sunDirection);
    this.clouds = new Clouds(scene, seed);
    this.atmosphere = new Atmosphere({ scene, camera, sky: this.sky, clouds: this.clouds });
    this.highlight = new BlockHighlight(scene);
    this.chunks = new ChunkRenderer(scene, materials);
    this.meshes = new MeshPipeline({
      isMeshable: source.isChunkMeshable,
      mesher,
      meshNow: (chunkX, chunkZ) => {
        const bounds = chunkBounds(chunkX, chunkZ, height);
        return buildChunkMesh(source, bounds, tileUv, createChunkTint(sampleClimate, bounds));
      },
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
    this.atmosphere.apply(mediumAt(this.source.getBlock, eye.x, eye.y, eye.z));
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
