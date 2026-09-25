import * as THREE from 'three';
import { buildAtlasLevels } from './atlasLayout.js';

export function createAtlasTexture(tilePixels, tileSize) {
  const levels = buildAtlasLevels(tilePixels, tileSize);
  const [base] = levels;
  const texture = new THREE.DataTexture(base.data, base.width, base.height, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.mipmaps = levels;
  texture.generateMipmaps = false;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapLinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createBlockMaterial(texture) {
  return new THREE.MeshLambertMaterial({ map: texture, vertexColors: true });
}
