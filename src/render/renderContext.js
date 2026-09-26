import * as THREE from 'three';

export const SKY_COLORS = Object.freeze({
  zenith: 0x3d7bd9,
  horizon: 0xa9d3f5,
});

const FOG_NEAR_RATIO = 0.375;
const CAMERA_SETTINGS = Object.freeze({ fov: 75, near: 0.05, far: 600 });
const MAX_PIXEL_RATIO = 2;

function createRenderer(window) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

function createScene(viewDistance) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY_COLORS.horizon);
  scene.fog = new THREE.Fog(SKY_COLORS.horizon, viewDistance * FOG_NEAR_RATIO, viewDistance);
  return scene;
}

function createCamera(window) {
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(CAMERA_SETTINGS.fov, aspect, CAMERA_SETTINGS.near, CAMERA_SETTINGS.far);
  camera.rotation.order = 'YXZ';
  return camera;
}

export class RenderContext {
  constructor(container, window, viewDistance) {
    this.renderer = createRenderer(window);
    this.scene = createScene(viewDistance);
    this.camera = createCamera(window);
    this.canvas = this.renderer.domElement;
    container.appendChild(this.canvas);
    window.addEventListener('resize', () => this.resize(window.innerWidth, window.innerHeight));
  }

  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
