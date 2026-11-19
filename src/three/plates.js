// Renders each game as a top-down "plate" image (a ceramic dish with a 3D model on it)
// for the conveyor belt on the home page. Done once, in a small off-screen renderer.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { atomModel, sampleModel, ionModel, moleculeModel, flaskModel } from './models.js';
import { BY_SYM } from '../data/elements.js';
import { themeState } from '../theme-state.js';

const SIZE = 512;
let cache = null;

function plateMesh() {
  const g = new THREE.Group();
  // dish profile: flat base, gently raised rim
  const pts = [];
  pts.push(new THREE.Vector2(0.001, 0));
  pts.push(new THREE.Vector2(0.7, 0));
  pts.push(new THREE.Vector2(0.86, 0.05));
  pts.push(new THREE.Vector2(0.97, 0.12));
  pts.push(new THREE.Vector2(1.0, 0.13));
  pts.push(new THREE.Vector2(1.0, 0.1));
  pts.push(new THREE.Vector2(0.95, 0.06));
  const dish = new THREE.Mesh(
    new THREE.LatheGeometry(pts, 96),
    new THREE.MeshPhysicalMaterial({ color: '#f3f1ec', roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12, side: THREE.DoubleSide }),
  );
  g.add(dish);
  // soft contact shadow in the middle of the dish
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const r = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(0,0,0,0.42)');
  r.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = r; x.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.62, 48), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  g.add(shadow);
  return g;
}

const MAKERS = {
  elements: () => atomModel(BY_SYM.O),
  latin: () => sampleModel('Au'),
  ions: () => ionModel('SO4', '2−', true),
  cross: () => moleculeModel('NaCl', false),
  laws: () => flaskModel(),
  lab: () => sampleModel('Ne'),
};

function renderAll() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(SIZE, SIZE, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;

  const cam = new THREE.OrthographicCamera(-1.02, 1.02, 1.02, -1.02, 0.1, 20);
  cam.position.set(0, 10, 0);
  cam.up.set(0, 0, -1);
  cam.lookAt(0, 0, 0);

  const out = {};
  // glows look best normally blended on a white dish, whatever the page theme
  const wasLight = themeState.light;
  themeState.light = true;
  for (const [id, make] of Object.entries(MAKERS)) {
    const scene = new THREE.Scene();
    scene.environment = env;
    scene.add(new THREE.AmbientLight('#ffffff', 0.4));
    const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(2, 6, 3); scene.add(key);
    const rim = new THREE.DirectionalLight('#9bd7ff', 0.8); rim.position.set(-4, 3, -3); scene.add(rim);
    scene.add(plateMesh());

    const model = make();
    model.userData.update?.(1.4, 0.016);
    const holder = new THREE.Group();
    holder.add(model);
    // models are built to face +z; tip them so the camera above sees their front with some depth
    holder.rotation.x = -Math.PI / 2 + 0.55;
    holder.rotation.z = id === 'lab' ? 0.5 : 0;
    const s = (id === 'elements' ? 0.82 : 0.74) / (model.userData.radius || 1.5);
    holder.scale.setScalar(s);
    holder.position.y = 0.1 + (model.userData.radius || 1.5) * s * 0.55;
    scene.add(holder);

    renderer.render(scene, cam);
    out[id] = canvas.toDataURL('image/png');
  }
  themeState.light = wasLight;
  pm.dispose();
  renderer.dispose();
  renderer.forceContextLoss?.();
  return out;
}

/** Object URLs of the plate images, keyed by game id. */
export function plateImages() {
  if (!cache) {
    try { cache = Promise.resolve(renderAll()); } catch { cache = Promise.resolve({}); }
  }
  return cache;
}
