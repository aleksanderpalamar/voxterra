import * as THREE from 'three';
import { lightSpaceBasis, snapToTexelGrid } from './shadowAlignment.js';

const SUN_DIRECTION = new THREE.Vector3(0.45, 0.82, 0.35).normalize();
const SUN_DISTANCE = 90;
const SHADOW_EXTENT = 48;
const SHADOW_MAP_SIZE = 2048;
const SHADOW_TEXEL_SIZE = (SHADOW_EXTENT * 2) / SHADOW_MAP_SIZE;

function configureShadow(light) {
  light.castShadow = true;
  light.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
  Object.assign(light.shadow.camera, {
    left: -SHADOW_EXTENT,
    right: SHADOW_EXTENT,
    top: SHADOW_EXTENT,
    bottom: -SHADOW_EXTENT,
    near: 1,
    far: SUN_DISTANCE * 2.2,
  });
  light.shadow.camera.updateProjectionMatrix();
  light.shadow.bias = -0.0004;
  light.shadow.normalBias = 0.04;
}

export class Lighting {
  constructor(scene) {
    this.ambient = new THREE.AmbientLight(0xffffff, 0.75);
    this.hemisphere = new THREE.HemisphereLight(0xcfe4ff, 0x6a5a44, 0.85);
    this.sun = new THREE.DirectionalLight(0xfff2dc, 2.3);
    this.shadowBasis = lightSpaceBasis(SUN_DIRECTION);
    configureShadow(this.sun);
    scene.add(this.ambient, this.hemisphere, this.sun, this.sun.target);
  }

  get sunDirection() {
    return SUN_DIRECTION;
  }

  follow(position) {
    const anchor = this.shadowAnchor(position);
    this.sun.target.position.set(anchor.x, anchor.y, anchor.z);
    this.sun.position.copy(this.sun.target.position).addScaledVector(SUN_DIRECTION, SUN_DISTANCE);
  }

  shadowAnchor(position) {
    if (this.shadowBasis === null) return position;
    return snapToTexelGrid(position, this.shadowBasis, SHADOW_TEXEL_SIZE);
  }
}
