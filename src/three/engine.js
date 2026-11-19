// One full-screen WebGL canvas behind the page.
// It draws the space background (stars, a giant glowing atom, drifting molecules)
// and every "stage": a box on the page where a 3D model is shown on a hologram pedestal.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { glowTexture, glowSprite, holoTexture, beamTexture } from './textures.js';

let renderer, bgScene, bgCamera, envTex;
let stars, starPos, starBase, bigAtom, shock = [], floaters = [];
const stages = new Set();
const clock = new THREE.Clock();
const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
let warp = 0, moodColor = new THREE.Color('#22d3ee'), moodTarget = new THREE.Color('#22d3ee');
let frameTimes = [], quality = 2, W = 0, H = 0;
const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initEngine(canvas) {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    document.documentElement.classList.add('no-webgl');
    return false;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  setPixelRatio();

  const pm = new THREE.PMREMGenerator(renderer);
  envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;

  bgScene = new THREE.Scene();
  bgCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
  bgCamera.position.set(0, 0, 14);
  bgScene.add(new THREE.AmbientLight('#8899ff', 0.6));
  const dl = new THREE.DirectionalLight('#ffffff', 1.4); dl.position.set(5, 8, 6); bgScene.add(dl);
  bgScene.environment = envTex;

  buildStars();
  buildBigAtom();
  buildFloaters();

  resize();
  addEventListener('resize', resize);
  addEventListener('pointermove', e => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  renderer.setAnimationLoop(frame);
  return true;
}

function setPixelRatio() {
  const max = quality >= 2 ? 1.75 : quality === 1 ? 1.25 : 1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, max));
}
function resize() {
  W = innerWidth; H = innerHeight;
  renderer.setSize(W, H, false);
  bgCamera.aspect = W / H;
  bgCamera.updateProjectionMatrix();
  // keep the big atom in the top-right on wide screens, top-centre on phones
  const wide = W / H > 1;
  bigAtom.position.set(wide ? 7.5 : 1.5, wide ? 1.2 : -6.5, -6);
  bigAtom.scale.setScalar(wide ? 1 : 0.75);
}

function buildStars() {
  const N = 1600;
  const geo = new THREE.BufferGeometry();
  starPos = new Float32Array(N * 3); starBase = new Float32Array(N);
  const col = new Float32Array(N * 3);
  const palette = [new THREE.Color('#ffffff'), new THREE.Color('#7dd3fc'), new THREE.Color('#f0abfc'), new THREE.Color('#c4b5fd'), new THREE.Color('#fde68a')];
  for (let i = 0; i < N; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 120;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 80;
    starPos[i * 3 + 2] = -Math.random() * 140 + 10;
    const c = palette[(Math.random() * palette.length) | 0];
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  stars = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.55, map: glowTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  bgScene.add(stars);
}

function buildBigAtom() {
  bigAtom = new THREE.Group();
  const nucleus = glowSprite('#ff5c8a', 3.2, 0.9);
  const core = glowSprite('#ffffff', 1.2, 0.9);
  bigAtom.add(nucleus, core);
  const orbits = [];
  for (let i = 0; i < 3; i++) {
    const curve = new THREE.EllipseCurve(0, 0, 4.2, 1.5, 0, Math.PI * 2);
    const pts = curve.getPoints(160).map(p => new THREE.Vector3(p.x, p.y, 0));
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#22d3ee', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending }));
    const holder = new THREE.Group();
    holder.rotation.z = i * Math.PI / 3;
    holder.add(line);
    const e = glowSprite('#9ff6ff', 0.9, 1);
    holder.add(e);
    bigAtom.add(holder);
    orbits.push({ holder, line, e, curve, ph: i * 2.1, sp: 0.6 + i * 0.15 });
  }
  bigAtom.userData = { orbits, nucleus, core, beat: 0 };
  bgScene.add(bigAtom);
}

function buildFloaters() {
  const mk = (atoms, bonds) => {
    const g = new THREE.Group();
    const sph = new THREE.SphereGeometry(1, 20, 16);
    atoms.forEach(([c, r, x, y, z]) => {
      const m = new THREE.Mesh(sph, new THREE.MeshStandardMaterial({ color: c, roughness: 0.25, metalness: 0.1, emissive: c, emissiveIntensity: 0.25 }));
      m.scale.setScalar(r); m.position.set(x, y, z); g.add(m);
    });
    bonds.forEach(([a, b]) => {
      const pa = new THREE.Vector3(...atoms[a].slice(2)), pb = new THREE.Vector3(...atoms[b].slice(2));
      const d = pb.clone().sub(pa);
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, d.length(), 10), new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.3 }));
      cyl.position.copy(pa).addScaledVector(d, 0.5);
      cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      g.add(cyl);
    });
    return g;
  };
  const water = () => mk([['#ff4757', 0.5, 0, 0, 0], ['#f1f5f9', 0.32, -0.62, -0.5, 0], ['#f1f5f9', 0.32, 0.62, -0.5, 0]], [[0, 1], [0, 2]]);
  const co2 = () => mk([['#334155', 0.45, 0, 0, 0], ['#ff4757', 0.45, -0.95, 0, 0], ['#ff4757', 0.45, 0.95, 0, 0]], [[0, 1], [0, 2]]);
  const nh3 = () => mk([['#3b82f6', 0.48, 0, 0.2, 0], ['#f1f5f9', 0.3, -0.7, -0.35, 0.3], ['#f1f5f9', 0.3, 0.7, -0.35, 0.3], ['#f1f5f9', 0.3, 0, -0.35, -0.75]], [[0, 1], [0, 2], [0, 3]]);
  const makers = [water, co2, nh3, water, co2, nh3];
  makers.forEach((f, i) => {
    const m = f();
    m.position.set((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 16, -10 - Math.random() * 12);
    m.userData = { v: new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.25, 0), r: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.5) };
    bgScene.add(m);
    floaters.push(m);
  });
}

/* ---------------- stages ---------------- */
export class Stage {
  constructor(el, opts = {}) {
    this.el = el;
    this.opts = opts;
    this.scene = new THREE.Scene();
    this.scene.environment = envTex;
    this.camera = new THREE.PerspectiveCamera(opts.fov || 35, 1, 0.1, 100);
    this.camera.position.set(0, 0.35, 8);
    const s = this.scene;
    s.add(new THREE.AmbientLight('#ffffff', 0.35));
    const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(3, 5, 6); s.add(key);
    const rimA = new THREE.DirectionalLight('#22d3ee', 1.6); rimA.position.set(-6, 2, -4); s.add(rimA);
    const rimB = new THREE.DirectionalLight('#f472b6', 1.4); rimB.position.set(6, -1, -5); s.add(rimB);

    this.root = new THREE.Group(); // pointer tilt
    this.spin = new THREE.Group(); // drag spin + auto-rotate
    this.root.add(this.spin);
    s.add(this.root);
    if (opts.pedestal !== false) this.buildPedestal();

    this.model = null; this.old = [];
    this.rot = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, drag: false };
    this.dist = 8; this.distTarget = 8; this.zoom = 1;
    this.bindPointer();
    stages.add(this);
    if (lightMode) retint(this.scene);
  }

  buildPedestal() {
    const p = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ map: holoTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    disc.rotation.x = -Math.PI / 2;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 2.2, 48, 1, true), new THREE.MeshBasicMaterial({ map: beamTexture(), color: '#38bdf8', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 1.1;
    const N = 60, pg = new THREE.BufferGeometry(), pp = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const a = Math.random() * 6.28, r = Math.random() * 0.85; pp.set([Math.cos(a) * r, Math.random() * 2.2, Math.sin(a) * r], i * 3); }
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    const motes = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.06, map: glowTexture(), color: '#a5f3fc', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    p.add(disc, beam, motes);
    p.userData = { disc, beam, motes, pp };
    this.pedestal = p;
    this.scene.add(p);
  }

  bindPointer() {
    const el = this.el;
    let last = null, downAt = null;
    this.onMove = e => {
      const r = el.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (this.rot.drag && last) {
        const dx = e.clientX - last.x, dy = e.clientY - last.y;
        this.rot.vy = dx * 0.012; this.rot.vx = dy * 0.008;
        this.rot.y += this.rot.vy; this.rot.x = THREE.MathUtils.clamp(this.rot.x + this.rot.vx, -1.1, 1.1);
        last = { x: e.clientX, y: e.clientY };
      } else {
        this.rot.ty = nx * 0.45; this.rot.tx = ny * 0.3;
      }
    };
    this.onDown = e => {
      this.rot.drag = true; last = { x: e.clientX, y: e.clientY }; downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
      try { el.setPointerCapture(e.pointerId); } catch { /* ok */ }
    };
    this.onUp = e => {
      this.rot.drag = false; last = null;
      if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 8 && performance.now() - downAt.t < 400) this.poke();
      downAt = null;
    };
    this.onLeave = () => { if (!this.rot.drag) { this.rot.tx = 0; this.rot.ty = 0; } };
    this.onWheel = e => {
      if (!this.opts.zoom) return;
      e.preventDefault();
      this.zoom = THREE.MathUtils.clamp(this.zoom * (e.deltaY > 0 ? 1.1 : 0.9), 0.6, 1.6);
    };
    el.addEventListener('pointermove', this.onMove);
    el.addEventListener('pointerdown', this.onDown);
    el.addEventListener('pointerup', this.onUp);
    el.addEventListener('pointercancel', this.onUp);
    el.addEventListener('pointerleave', this.onLeave);
    el.addEventListener('wheel', this.onWheel, { passive: false });
  }

  poke() {
    if (!this.model) return;
    this.model.userData.poke?.();
    this.rot.vy += 0.35;
    this.bounce = 1;
    this.opts.onPoke?.();
  }

  /** Show a new model with a pop-in animation. */
  set(model) {
    if (this.model) { this.old.push({ m: this.model, t: 0 }); }
    this.model = model;
    if (!model) return;
    model.userData.t = 0;
    model.scale.setScalar(0.001);
    this.spin.add(model);
    if (lightMode) retint(model);
    const r = model.userData.radius || 1.5;
    this.radius = r;
    if (this.pedestal) {
      this.pedestal.position.y = -r * 1.02;
      this.pedestal.scale.setScalar(Math.max(1, r * 0.85));
    }
  }

  dispose() {
    stages.delete(this);
    const el = this.el;
    el.removeEventListener('pointermove', this.onMove);
    el.removeEventListener('pointerdown', this.onDown);
    el.removeEventListener('pointerup', this.onUp);
    el.removeEventListener('pointercancel', this.onUp);
    el.removeEventListener('pointerleave', this.onLeave);
    el.removeEventListener('wheel', this.onWheel);
  }

  update(t, dt, rect) {
    const r = this.rot;
    if (!r.drag) {
      r.vy *= 0.94; r.vx *= 0.9;
      r.y += r.vy + dt * (this.opts.autoRotate ?? 0.35);
      r.x += (0 - r.x) * 0.02;
    }
    this.root.rotation.x += (r.tx - this.root.rotation.x) * 0.08;
    this.root.rotation.y += (r.ty - this.root.rotation.y) * 0.08;
    this.spin.rotation.y = r.y;
    this.spin.rotation.x = r.x;

    // pop-in / pop-out
    for (let i = this.old.length - 1; i >= 0; i--) {
      const o = this.old[i]; o.t += dt;
      const k = Math.max(0, 1 - o.t / 0.25);
      o.m.scale.setScalar(k * k);
      if (k <= 0) { this.spin.remove(o.m); this.old.splice(i, 1); }
    }
    if (this.model) {
      const m = this.model, u = m.userData;
      u.t += dt;
      const k = Math.min(1, u.t / 0.7);
      const el = k >= 1 ? 1 : 1 - Math.pow(2, -9 * k) * Math.cos(k * 12);
      this.bounce = Math.max(0, (this.bounce || 0) - dt * 2.5);
      m.scale.setScalar(Math.max(0.001, el) * (1 + Math.sin(this.bounce * 9) * this.bounce * 0.12));
      u.update?.(t, dt);
    }
    // hologram pedestal
    if (this.pedestal) {
      const p = this.pedestal.userData;
      p.disc.rotation.z += dt * 0.5;
      p.beam.material.opacity = 0.16 + Math.sin(t * 2) * 0.05;
      const pos = p.motes.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) { let y = pos.getY(i) + dt * 0.45; if (y > 2.2) y = 0; pos.setY(i, y); }
      pos.needsUpdate = true;
    }
    // frame the model so it fits the box on any screen shape
    const aspect = rect.width / rect.height;
    this.camera.aspect = aspect;
    const vf = THREE.MathUtils.degToRad(this.camera.fov) / 2;
    const half = Math.min(vf, Math.atan(Math.tan(vf) * aspect));
    const rad = (this.radius || 1.5) * (this.pedestal ? 1.12 : 1.0);
    this.distTarget = (rad / Math.sin(half)) * 1.04 * this.zoom;
    this.dist += (this.distTarget - this.dist) * 0.12;
    this.camera.position.set(0, rad * 0.12, this.dist);
    this.camera.lookAt(0, -rad * 0.05, 0);
    this.camera.updateProjectionMatrix();
  }
}

/* ---------------- background reactions ---------------- */
export function pulse(color = '#4ade80') {
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 96), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  ring.position.set(0, 0, -2);
  bgScene.add(ring);
  if (lightMode) ring.material.blending = THREE.NormalBlending;
  shock.push({ ring, t: 0 });
  bigAtom.userData.beat = 1;
  warp = Math.max(warp, 0.6);
  moodColor.set(color);
}
export function setWarp(v) { warp = Math.max(warp, v); }
export function setMood(color) { moodTarget.set(color); }

/* ---------------- frame loop ---------------- */
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  adapt(dt);

  pointer.sx += (pointer.x - pointer.sx) * 0.04;
  pointer.sy += (pointer.y - pointer.sy) * 0.04;
  bgCamera.position.x = pointer.sx * 1.2;
  bgCamera.position.y = -pointer.sy * 0.8;
  bgCamera.lookAt(0, 0, -20);

  // stars drift towards us; faster when warping after a correct answer
  warp = Math.max(0, warp - dt * 0.6);
  const speed = (reduced ? 0.5 : 2.2) + warp * 60;
  const p = stars.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let z = starPos[i * 3 + 2] + speed * dt;
    if (z > 14) z -= 150;
    starPos[i * 3 + 2] = z;
  }
  p.needsUpdate = true;
  stars.material.size = 0.55 + warp * 0.6;

  // big atom
  moodColor.lerp(moodTarget, 0.02);
  const A = bigAtom.userData;
  A.beat = Math.max(0, A.beat - dt * 1.2);
  bigAtom.rotation.y = t * 0.15 + pointer.sx * 0.3;
  bigAtom.rotation.x = 0.4 + pointer.sy * 0.2;
  A.nucleus.scale.setScalar(3.2 + Math.sin(t * 2) * 0.2 + A.beat * 2.5);
  A.orbits.forEach(o => {
    const a = t * o.sp * (1 + A.beat * 3) + o.ph;
    const pt = o.curve.getPoint((a / (Math.PI * 2)) % 1);
    o.e.position.set(pt.x, pt.y, 0);
    o.line.material.color.copy(moodColor);
    o.e.material.color.copy(moodColor).lerp(new THREE.Color('#ffffff'), 0.5);
  });

  floaters.forEach(m => {
    const u = m.userData;
    m.position.addScaledVector(u.v, dt);
    m.rotation.x += u.r.x * dt; m.rotation.y += u.r.y * dt;
    if (m.position.x > 18) m.position.x = -18; if (m.position.x < -18) m.position.x = 18;
    if (m.position.y > 11) m.position.y = -11; if (m.position.y < -11) m.position.y = 11;
  });

  for (let i = shock.length - 1; i >= 0; i--) {
    const s = shock[i]; s.t += dt;
    s.ring.scale.setScalar(1 + s.t * 22);
    s.ring.material.opacity = Math.max(0, 0.9 - s.t * 1.1);
    if (s.t > 0.85) { bgScene.remove(s.ring); s.ring.geometry.dispose(); s.ring.material.dispose(); shock.splice(i, 1); }
  }

  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, W, H);
  renderer.clear();
  renderer.render(bgScene, bgCamera);

  renderer.setScissorTest(true);
  for (const s of stages) {
    if (!s.el.isConnected) continue;
    const r = s.el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) continue;
    if (s.el.closest('[hidden]') || s.el.offsetParent === null) continue;
    s.update(t, dt, r);
    const y = H - r.bottom;
    renderer.setViewport(r.left, y, r.width, r.height);
    renderer.setScissor(r.left, y, r.width, r.height);
    renderer.clearDepth();
    renderer.render(s.scene, s.camera);
  }
  renderer.setScissorTest(false);
}

function adapt(dt) {
  frameTimes.push(dt);
  if (frameTimes.length < 90) return;
  const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
  frameTimes = [];
  if (avg > 1 / 30 && quality > 0) {
    quality--;
    setPixelRatio(); resize();
    if (quality === 0) { floaters.forEach(f => (f.visible = false)); stars.geometry.setDrawRange(0, 700); }
  }
}

export function getRenderer() { return renderer; }

/* ---------------- light / dark ---------------- */
let lightMode = false;
function retint(root) {
  root.traverse(o => {
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of mats) {
      if (m.blending === THREE.AdditiveBlending && !m.userData.wasAdd) { m.userData.wasAdd = true; m.userData.baseOpacity = m.opacity; }
      if (!m.userData.wasAdd) continue;
      m.blending = lightMode ? THREE.NormalBlending : THREE.AdditiveBlending;
      m.needsUpdate = true;
    }
  });
}
export function setTheme(light) {
  lightMode = !!light;
  if (!renderer) return;
  stars.material.color.set(lightMode ? '#475569' : '#ffffff');
  stars.material.opacity = lightMode ? 0.55 : 1;
  retint(bgScene);
  for (const s of stages) retint(s.scene);
}
export function isLight() { return lightMode; }
