// 3D model factories. Every model is a THREE.Group with
// userData.radius (for camera framing), userData.update(t, dt) and userData.poke().
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { glowSprite, textSprite } from './textures.js';
import { lookFor } from '../data/elements.js';
import { themeState } from '../theme-state.js';

const geoCache = new Map();
const matCache = new Map();
const geo = (key, make) => { if (!geoCache.has(key)) geoCache.set(key, make()); return geoCache.get(key); };
const SPHERE = () => geo('sphere', () => new THREE.SphereGeometry(1, 32, 24));

function std(color, metalness = 0.1, roughness = 0.35, extra = {}) {
  const key = `std|${color}|${metalness}|${roughness}|${JSON.stringify(extra)}`;
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshPhysicalMaterial({ color, metalness, roughness, clearcoat: extra.clearcoat ?? 0.4, clearcoatRoughness: 0.2, envMapIntensity: extra.env ?? 1.1, emissive: extra.emissive || '#000000', emissiveIntensity: extra.ei ?? 1, flatShading: !!extra.flat, transparent: !!extra.opacity, opacity: extra.opacity ?? 1 }));
  }
  return matCache.get(key);
}
function basic(color, opacity = 1, additive = true) {
  if (themeState.light) additive = false;
  const key = `basic|${color}|${opacity}|${additive}`;
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false }));
  return matCache.get(key);
}

// cheap smooth 3D noise (sum of sines) for natural-looking rocks and nuggets
function noise3(x, y, z, seed) {
  return (Math.sin(x * 1.7 + seed) * Math.cos(y * 2.3 + seed * 1.3) + Math.sin(y * 3.1 + z * 1.9 + seed * 0.7) * 0.6 +
    Math.cos(z * 2.7 + x * 1.1 + seed * 2.1) * 0.5 + Math.sin((x + y + z) * 4.3 + seed) * 0.25) / 2.35;
}
function blobGeometry(seed, amp = 0.28, detail = 5, squash = [1, 0.8, 0.9]) {
  return geo(`blob|${seed}|${amp}|${detail}|${squash}`, () => {
    let g = new THREE.IcosahedronGeometry(1, detail);
    g.deleteAttribute('normal'); g.deleteAttribute('uv');
    g = mergeVertices(g);
    const p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = noise3(v.x * 1.3, v.y * 1.3, v.z * 1.3, seed);
      v.multiplyScalar(1 + n * amp);
      v.set(v.x * squash[0], v.y * squash[1], v.z * squash[2]);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  });
}
const seedOf = s => [...String(s)].reduce((a, c) => a + c.charCodeAt(0) * 7.31, 0);

function base(radius) {
  const g = new THREE.Group();
  g.userData.radius = radius;
  g.userData.update = () => {};
  g.userData.poke = () => {};
  return g;
}

/* ================= Bohr atom ================= */
const ELECTRON_COLORS = ['#38e1ff', '#7cf7c4', '#ffd166', '#ff7cd4'];
export function atomModel(el, opts = {}) {
  const shells = el.shells;
  const R0 = 1.05, DR = 0.62;
  const outer = R0 + (shells.length - 1) * DR;
  const g = base(outer + 0.35);

  // nucleus: protons (red) and neutrons (grey) packed in a ball
  const n = el.z + el.neutrons;
  const nr = 0.13, NR = nr * 1.25 * Math.cbrt(n);
  const nuc = new THREE.Group();
  const prot = new THREE.InstancedMesh(SPHERE(), std('#ff3b5c', 0.05, 0.25, { emissive: '#5a0010', ei: 0.6 }), el.z);
  const neut = new THREE.InstancedMesh(SPHERE(), std('#b8c4d6', 0.15, 0.3, { emissive: '#101820', ei: 0.4 }), Math.max(1, el.neutrons));
  neut.count = el.neutrons;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(nr, nr, nr), pos = new THREE.Vector3();
  let pi = 0, ni = 0;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const r = n === 1 ? 0 : NR * Math.cbrt((i + 0.5) / n);
    const y = 1 - (i / Math.max(1, n - 1)) * 2, rr = Math.sqrt(1 - y * y), th = golden * i;
    pos.set(Math.cos(th) * rr * r, y * r, Math.sin(th) * rr * r);
    m4.compose(pos, q, sc);
    const isProton = (pi < el.z) && (ni >= el.neutrons || (i % 2 === 0));
    if (isProton) prot.setMatrixAt(pi++, m4); else neut.setMatrixAt(ni++, m4);
  }
  nuc.add(prot); if (el.neutrons) nuc.add(neut);
  nuc.add(glowSprite('#ff6a88', NR * 7 + 0.6, 0.55));
  g.add(nuc);

  // electron shells
  const ringGeo = r => geo(`ring|${r}`, () => new THREE.TorusGeometry(r, 0.012, 8, 160));
  const eGeo = geo('egeo', () => new THREE.SphereGeometry(0.075, 16, 12));
  const shellsGroup = [];
  shells.forEach((count, k) => {
    const r = R0 + k * DR;
    const plane = new THREE.Group();
    plane.rotation.set(Math.PI / 2 + (k % 2 ? 0.35 : -0.25) + k * 0.1, k * 0.7, k * 0.45);
    const col = ELECTRON_COLORS[k % ELECTRON_COLORS.length];
    plane.add(new THREE.Mesh(ringGeo(r), basic(col, 0.55)));
    const es = [];
    for (let i = 0; i < count; i++) {
      const e = new THREE.Group();
      e.add(new THREE.Mesh(eGeo, basic(themeState.light ? col : '#ffffff', 1, false)));
      e.add(glowSprite(col, 0.55, 0.95));
      plane.add(e);
      es.push({ e, a: (i / count) * Math.PI * 2 });
    }
    g.add(plane);
    shellsGroup.push({ plane, es, r, speed: 1.1 / (1 + k * 0.45) });
  });

  let boost = 0;
  g.userData.update = (t, dt) => {
    boost = Math.max(0, boost - dt * 1.5);
    const sp = 1 + boost * 5;
    for (const s of shellsGroup) {
      for (const o of s.es) { o.a += dt * s.speed * sp; o.e.position.set(Math.cos(o.a) * s.r, Math.sin(o.a) * s.r, 0); }
      s.plane.rotation.z += dt * 0.08;
    }
    nuc.rotation.y += dt * 0.4;
    const pulse = 1 + Math.sin(t * 3) * 0.03 + boost * 0.15;
    nuc.scale.setScalar(pulse);
  };
  g.userData.poke = () => { boost = 1; };
  return g;
}

/* ================= Real-look samples ================= */
export function sampleModel(sym) {
  const look = lookFor(sym);
  const seed = seedOf(sym);
  const g = base(1.5);
  let wobble = 0;
  switch (look.kind) {
    case 'gas': {
      // glowing gas-discharge tube, like the photos of elements
      const tube = new THREE.Group();
      const glass = new THREE.Mesh(geo('capsule', () => new THREE.CapsuleGeometry(0.42, 2.2, 12, 32)), new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0, roughness: 0.02, transparent: true, opacity: 0.18, clearcoat: 1, envMapIntensity: 1.6, depthWrite: false }));
      const core = new THREE.Mesh(geo('core', () => new THREE.CapsuleGeometry(0.2, 2.1, 8, 24)), basic(look.color, 0.9, false));
      const core2 = new THREE.Mesh(geo('core2', () => new THREE.CapsuleGeometry(0.34, 2.15, 8, 24)), basic(look.color, 0.35));
      tube.add(core2, core, glass);
      for (const y of [-1.55, 1.55]) {
        const cap = new THREE.Mesh(geo('cap', () => new THREE.CylinderGeometry(0.3, 0.3, 0.32, 32)), std('#c9ccd3', 1, 0.25));
        cap.position.y = y; tube.add(cap);
        const pin = new THREE.Mesh(geo('pin', () => new THREE.CylinderGeometry(0.05, 0.05, 0.3, 12)), std('#e6e8ec', 1, 0.15));
        pin.position.y = y * 1.12; tube.add(pin);
      }
      const halos = [];
      for (let i = -2; i <= 2; i++) { const h = glowSprite(look.color, 1.5, 0.3); h.position.y = i * 0.5; tube.add(h); halos.push(h); }
      tube.rotation.z = 0.35;
      g.add(tube);
      g.userData.radius = 1.75;
      g.userData.update = (t, dt) => {
        wobble = Math.max(0, wobble - dt * 2);
        const f = 0.82 + Math.sin(t * 13) * 0.06 + Math.sin(t * 31) * 0.04 + wobble * 0.5;
        core.material.opacity = Math.min(1, 0.85 * f);
        halos.forEach((h, i) => { h.material.opacity = 0.26 * f + Math.sin(t * 2 + i) * 0.04; });
      };
      g.userData.poke = () => { wobble = 1; };
      return g;
    }
    case 'cloud': {
      // coloured gas swirling in a round glass flask
      const pts = flaskPoints();
      const glass = new THREE.Mesh(geo('flaskglass', () => new THREE.LatheGeometry(pts, 48)), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.02, transparent: true, opacity: 0.2, clearcoat: 1, side: THREE.DoubleSide, envMapIntensity: 1.6, depthWrite: false }));
      g.add(glass);
      const gas = new THREE.Group();
      const puffs = [];
      for (let i = 0; i < 26; i++) {
        const s = glowSprite(look.color, 0.9 + Math.random() * 0.6, 0.35);
        const a = Math.random() * Math.PI * 2, r = Math.random() * 0.55, y = -0.5 + Math.random() * 0.75;
        s.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        s.material = s.material.clone(); s.material.blending = THREE.NormalBlending; s.material.opacity = 0.32;
        gas.add(s); puffs.push({ s, a, r, y, sp: 0.2 + Math.random() * 0.5 });
      }
      g.add(gas);
      g.position.y = 0.1;
      g.userData.radius = 1.5;
      g.userData.update = (t, dt) => {
        wobble = Math.max(0, wobble - dt);
        for (const p of puffs) { p.a += dt * p.sp * (1 + wobble * 6); p.s.position.set(Math.cos(p.a) * p.r, p.y + Math.sin(t + p.a) * 0.05, Math.sin(p.a) * p.r); }
      };
      g.userData.poke = () => { wobble = 1; };
      return g;
    }
    case 'liquid': {
      // a shiny blob of mercury that wobbles
      const m = new THREE.Mesh(blobGeometry(seed, 0.08, 5, [1.25, 0.6, 1.1]), std(look.color, 1, 0.03, { clearcoat: 1, env: 1.6 }));
      const drops = [];
      for (let i = 0; i < 5; i++) {
        const d = new THREE.Mesh(SPHERE(), m.material);
        const s = 0.08 + Math.random() * 0.12; d.scale.set(s * 1.2, s * 0.7, s * 1.2);
        d.position.set(Math.cos(i * 1.4) * 1.6, -0.4, Math.sin(i * 1.4) * 1.2);
        g.add(d); drops.push(d);
      }
      g.add(m);
      g.userData.update = (t, dt) => {
        wobble = Math.max(0, wobble - dt * 1.2);
        const w = 0.03 + wobble * 0.15;
        m.scale.set(1 + Math.sin(t * 5) * w, 1 - Math.sin(t * 5) * w * 1.2, 1 + Math.cos(t * 5) * w);
      };
      g.userData.poke = () => { wobble = 1; };
      return g;
    }
    case 'soft': {
      // alkali metal: soft block with a freshly cut shiny face
      const blockGeo = geo('rbox', () => new RoundedBoxGeometry(1.8, 1.2, 1.3, 4, 0.18));
      const body = new THREE.Mesh(blockGeo, std(look.color, 0.75, look.rough ?? 0.4, { clearcoat: 0.2 }));
      const face = new THREE.Mesh(geo('cutface', () => new THREE.PlaneGeometry(1.5, 0.95)), std('#f4f5f7', 1, 0.05, { clearcoat: 1, env: 1.8 }));
      face.position.z = 0.651;
      const dull = new THREE.Mesh(blockGeo, std('#8d8a80', 0.4, 0.8, { opacity: 0.35 }));
      dull.scale.setScalar(1.004);
      g.add(body, face, dull);
      g.rotation.set(0.35, -0.5, 0);
      g.userData.radius = 1.45;
      return g;
    }
    case 'graphite': {
      // stacked hexagonal sheets, like graphite
      for (let i = 0; i < 5; i++) {
        const s = new THREE.Mesh(geo('hex', () => new THREE.CylinderGeometry(1.1, 1.1, 0.16, 6)), std(look.color, 0.35, 0.38, { clearcoat: 0.05, env: 0.6 }));
        s.position.y = -0.6 + i * 0.28; s.rotation.y = i * 0.18; s.scale.setScalar(1 - i * 0.06);
        g.add(s);
      }
      g.rotation.x = 0.35;
      g.userData.radius = 1.35;
      return g;
    }
    case 'crystal': {
      // cluster of sharp crystals
      const mat = std(look.color, look.metal ?? 0.3, look.rough ?? 0.25, { flat: true, clearcoat: 0.8 });
      const cg = geo('crystal', () => { const c = new THREE.OctahedronGeometry(1, 0); c.scale(0.38, 1, 0.38); return c; });
      const rnd = mulberry(seed);
      for (let i = 0; i < 9; i++) {
        const c = new THREE.Mesh(cg, mat);
        const s = i === 0 ? 1.15 : 0.45 + rnd() * 0.55;
        c.scale.setScalar(s);
        c.position.set((rnd() - 0.5) * 1.1, -0.3 + s * 0.6, (rnd() - 0.5) * 0.9);
        c.rotation.set((rnd() - 0.5) * 1.1, rnd() * 3, (rnd() - 0.5) * 1.1);
        g.add(c);
      }
      const rock = new THREE.Mesh(blobGeometry(seed, 0.3, 3, [1.3, 0.35, 1]), std(look.color, (look.metal ?? 0.3) * 0.6, 0.7, { flat: true }));
      rock.position.y = -0.55;
      g.add(rock);
      g.userData.radius = 1.5;
      return g;
    }
    case 'lumps': {
      const mat = std(look.color, 0.05, 0.75, { clearcoat: 0.1 });
      const rnd = mulberry(seed);
      for (let i = 0; i < 7; i++) {
        const l = new THREE.Mesh(blobGeometry(seed + i, 0.35, 3, [1, 0.8, 0.9]), mat);
        const s = i === 0 ? 0.75 : 0.3 + rnd() * 0.3;
        l.scale.setScalar(s);
        l.position.set(i === 0 ? 0 : (rnd() - 0.5) * 2, i === 0 ? 0 : -0.45 + rnd() * 0.2, i === 0 ? 0 : (rnd() - 0.5) * 1.4);
        g.add(l);
      }
      g.userData.radius = 1.35;
      return g;
    }
    default: {
      // metal nugget with mirror-like reflections
      const m = new THREE.Mesh(blobGeometry(seed, 0.26, 5), std(look.color, 1, look.rough ?? 0.25, { clearcoat: 0.5, env: 1.5 }));
      m.scale.setScalar(1.05);
      g.add(m);
      const rnd = mulberry(seed);
      for (let i = 0; i < 3; i++) {
        const s = new THREE.Mesh(blobGeometry(seed + i * 3, 0.3, 3), m.material);
        const k = 0.22 + rnd() * 0.18; s.scale.setScalar(k);
        s.position.set(Math.cos(i * 2.2) * 1.25, -0.55, Math.sin(i * 2.2) * 1.05);
        g.add(s);
      }
      g.userData.radius = 1.45;
      return g;
    }
  }
}
function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function flaskPoints() {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const a = -Math.PI / 2 + (i / 24) * Math.PI * 0.86;
    pts.push(new THREE.Vector2(Math.cos(a) * 0.9 + 0.001, Math.sin(a) * 0.9 - 0.15));
  }
  pts.push(new THREE.Vector2(0.26, 0.95), new THREE.Vector2(0.26, 1.35), new THREE.Vector2(0.31, 1.38));
  return pts;
}

/* ================= Atoms, ions and molecules (ball and stick) ================= */
export const CPK = {
  H: ['#f5f7fb', 0.32], C: ['#3a3f4a', 0.5], N: ['#3b6cff', 0.5], O: ['#ff3b3b', 0.5], Cl: ['#3ddc5a', 0.62], S: ['#ffd21f', 0.6],
  P: ['#ff8c1a', 0.6], Na: ['#a970ff', 0.55], K: ['#8f40d4', 0.62], Ca: ['#3dbb6b', 0.6], Mg: ['#2fd18c', 0.55], Zn: ['#7d8fb3', 0.55],
  Al: ['#ffa6b8', 0.55], Ar: ['#c77dff', 0.6],
};
function ball(sym, scale = 1) {
  const [c, r] = CPK[sym] || ['#cccccc', 0.5];
  const m = new THREE.Mesh(SPHERE(), std(c, 0.05, 0.22, { clearcoat: 1 }));
  m.scale.setScalar(r * scale);
  m.userData.sym = sym;
  return m;
}
function stick(a, b, double = false) {
  const g = new THREE.Group();
  const dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
  const cyl = geo('bond', () => new THREE.CylinderGeometry(0.09, 0.09, 1, 16));
  const offs = double ? [-0.11, 0.11] : [0];
  for (const o of offs) {
    const m = new THREE.Mesh(cyl, std('#d9e2f0', 0.6, 0.25));
    m.scale.y = len; m.position.x = o;
    g.add(m);
  }
  g.position.copy(a).addScaledVector(dir, 0.5);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return g;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const placed = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const TETRA = [V(1, 1, 1), V(1, -1, -1), V(-1, 1, -1), V(-1, -1, 1)].map(v => v.normalize());
const TRIG = [0, 1, 2].map(i => V(Math.cos(i * 2 * Math.PI / 3 + Math.PI / 2), Math.sin(i * 2 * Math.PI / 3 + Math.PI / 2), 0));

// each structure: list of [sym, position], bonds [i, j, double]
function structure(key) {
  const L = 1.25;
  switch (key) {
    case 'Na': case 'K': case 'Ca': case 'Mg': case 'Zn': case 'Al': case 'Cl': case 'O': case 'Ar':
      return { atoms: [[key, V(0, 0, 0)]], bonds: [] };
    case 'OH': return { atoms: [['O', V(-0.35, 0, 0)], ['H', V(0.75, 0, 0)]], bonds: [[0, 1]] };
    case 'NH4': return { atoms: [['N', V(0, 0, 0)], ...TETRA.map(d => ['H', d.clone().multiplyScalar(1.05)])], bonds: [[0, 1], [0, 2], [0, 3], [0, 4]] };
    case 'SO4': return { atoms: [['S', V(0, 0, 0)], ...TETRA.map(d => ['O', d.clone().multiplyScalar(L * 1.1)])], bonds: [[0, 1, true], [0, 2, true], [0, 3], [0, 4]] };
    case 'PO4': return { atoms: [['P', V(0, 0, 0)], ...TETRA.map(d => ['O', d.clone().multiplyScalar(L * 1.1)])], bonds: [[0, 1, true], [0, 2], [0, 3], [0, 4]] };
    case 'NO3': return { atoms: [['N', V(0, 0, 0)], ...TRIG.map(d => ['O', d.clone().multiplyScalar(L)])], bonds: [[0, 1, true], [0, 2], [0, 3]] };
    case 'CO3': return { atoms: [['C', V(0, 0, 0)], ...TRIG.map(d => ['O', d.clone().multiplyScalar(L)])], bonds: [[0, 1, true], [0, 2], [0, 3]] };
    case 'H2O': { const a = (104.5 / 2) * Math.PI / 180; return { atoms: [['O', V(0, 0.3, 0)], ['H', V(-Math.sin(a), 0.3 - Math.cos(a), 0).multiplyScalar(1.1)], ['H', V(Math.sin(a), 0.3 - Math.cos(a), 0).multiplyScalar(1.1)]], bonds: [[0, 1], [0, 2]] }; }
    case 'CO2': return { atoms: [['C', V(0, 0, 0)], ['O', V(-L, 0, 0)], ['O', V(L, 0, 0)]], bonds: [[0, 1, true], [0, 2, true]] };
    case 'NH3': { const out = [0, 1, 2].map(i => V(Math.cos(i * 2.094) * 0.95, -0.4, Math.sin(i * 2.094) * 0.95)); return { atoms: [['N', V(0, 0.25, 0)], ...out.map(p => ['H', p])], bonds: [[0, 1], [0, 2], [0, 3]] }; }
    case 'H2SO4': {
      const os = TETRA.map(d => d.clone().multiplyScalar(L * 1.1));
      const hs = [os[2], os[3]].map(o => o.clone().add(o.clone().normalize().multiplyScalar(0.85)).add(V(0, 0.25, 0)));
      return { atoms: [['S', V(0, 0, 0)], ...os.map(p => ['O', p]), ['H', hs[0]], ['H', hs[1]]], bonds: [[0, 1, true], [0, 2, true], [0, 3], [0, 4], [3, 5], [4, 6]] };
    }
    case 'Cl2': return { atoms: [['Cl', V(-0.7, 0, 0)], ['Cl', V(0.7, 0, 0)]], bonds: [[0, 1]] };
    case 'O3': { const a = (117 / 2) * Math.PI / 180; return { atoms: [['O', V(0, 0.35, 0)], ['O', V(-Math.sin(a) * L, 0.35 - Math.cos(a) * L, 0)], ['O', V(Math.sin(a) * L, 0.35 - Math.cos(a) * L, 0)]], bonds: [[0, 1, true], [0, 2]] }; }
    case 'P4': { const t = TETRA.map(d => d.clone().multiplyScalar(0.95)); return { atoms: t.map(p => ['P', p]), bonds: [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]] }; }
    default: return { atoms: [['C', V(0, 0, 0)]], bonds: [] };
  }
}
const LABEL_COL = ['#fde68a', '#a5f3fc', '#f9a8d4'];
const MASS = { H: 1, C: 12, N: 14, O: 16, S: 32, Na: 23, Cl: 35.5, P: 31 };

function buildStructure(key, opts = {}) {
  const g = new THREE.Group();
  const s = structure(key);
  const big = s.atoms.length === 1 ? 1.9 : 1;
  const balls = [];
  const labelled = new Set();
  s.atoms.forEach(([sym, p]) => {
    const b = ball(sym, big); b.position.copy(p); g.add(b); balls.push(b);
    if (s.atoms.length === 1) { const t = textSprite(sym, { bg: 'none', color: '#ffffff', scale: 1.5 }); t.position.copy(p); g.add(t); }
    if (opts.labels && !labelled.has(sym)) {
      const k = labelled.size; labelled.add(sym);
      const col = LABEL_COL[k % 3];
      const lab = textSprite(`${sym} = ${MASS[sym]} u`, { color: col, border: col, scale: 0.85 });
      const up = k % 2 === 0 ? 1 : -1;
      lab.position.copy(p).add(V(0, up * ((CPK[sym]?.[1] || 0.5) * big + 0.45), 0.3));
      g.add(lab);
    }
  });
  s.bonds.forEach(([i, j, d]) => g.add(stick(s.atoms[i][1], s.atoms[j][1], d)));
  let r = 0;
  s.atoms.forEach(([sym, p]) => { r = Math.max(r, p.length() + (CPK[sym]?.[1] || 0.5) * big); });
  g.userData.r = r;
  g.userData.balls = balls;
  return g;
}

// A glowing "fresnel" shell used for the charge aura around ions
function auraMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: { c: { value: new THREE.Color(color) }, k: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 c; uniform float k; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0-abs(dot(vN,vV)), 2.2); gl_FragColor = vec4(c, f*0.95*k); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

/** Ion model with a red (+) or blue (−) aura. charge: '2+', '−' ... ; show=false hides the charge. */
export function ionModel(key, charge, show = true, labelScale = 1.15) {
  const g = base(1.6);
  const body = buildStructure(key);
  g.add(body);
  const r = body.userData.r + 0.35;
  const pos = /\+/.test(charge);
  const color = !show ? '#9fb3d9' : pos ? '#ff4d6d' : '#3d8bff';
  const aura = new THREE.Mesh(SPHERE(), auraMaterial(color));
  aura.scale.setScalar(r);
  g.add(aura);
  let label = null;
  if (show) {
    label = textSprite(charge, { color: pos ? '#ff8fa3' : '#8fc1ff', border: pos ? 'rgba(255,80,110,.95)' : 'rgba(80,150,255,.95)', scale: labelScale });
    label.position.set(r * 0.85, r * 0.85, 0);
    g.add(label);
  } else {
    label = textSprite('?', { color: '#e9d5ff', border: 'rgba(192,132,252,.95)', scale: labelScale });
    label.position.set(r * 0.85, r * 0.85, 0);
    g.add(label);
  }
  g.userData.radius = r + 0.35;
  let boost = 0;
  g.userData.update = (t, dt) => {
    boost = Math.max(0, boost - dt * 1.4);
    aura.material.uniforms.k.value = 0.75 + Math.sin(t * 2.4) * 0.25 + boost;
    aura.scale.setScalar(r * (1 + Math.sin(t * 2.4) * 0.03 + boost * 0.15));
    body.rotation.y += dt * 0.25;
  };
  g.userData.poke = () => { boost = 1; };
  return g;
}

/** Molecule model; labels=true shows the atomic masses. */
export function moleculeModel(key, labels = false) {
  if (key === 'NaCl') return lattice(labels);
  const g = base(1.6);
  const body = buildStructure(key, { labels });
  g.add(body);
  g.userData.radius = body.userData.r + (labels ? 0.6 : 0.25);
  let boost = 0;
  g.userData.update = (t, dt) => {
    boost = Math.max(0, boost - dt);
    body.children.forEach((c, i) => { if (c.userData.sym) c.position.y += Math.sin(t * 9 + i) * 0.0009 * (1 + boost * 20); });
  };
  g.userData.poke = () => { boost = 1; };
  return g;
}

function lattice(labels) {
  const g = base(1.9);
  const body = new THREE.Group();
  const d = 0.85;
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    const na = (x + y + z + 3) % 2 === 0;
    const b = ball(na ? 'Na' : 'Cl', na ? 0.62 : 0.72);
    b.position.set(x * d, y * d, z * d);
    body.add(b);
  }
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(d * 2, d * 2, d * 2)), new THREE.LineBasicMaterial({ color: '#7dd3fc', transparent: true, opacity: 0.5 }));
  body.add(edges);
  g.add(body);
  if (labels) {
    const a = textSprite('Na = 23 u', { color: '#e9d5ff', scale: 0.6 }); a.position.set(-1.2, 1.75, 0.5);
    const b = textSprite('Cl = 35.5 u', { color: '#bbf7d0', scale: 0.6 }); b.position.set(1.2, 1.75, 0.5);
    g.add(a, b);
  }
  g.userData.radius = 2.1;
  g.userData.update = (t, dt) => { body.rotation.y += dt * 0.2; };
  return g;
}

/* ================= Lab scenes ================= */
export function flaskModel() {
  const g = base(1.7);
  // conical (Erlenmeyer) flask
  const pts = [V(0.001, -1.1, 0), V(1.05, -1.1, 0), V(1.12, -1.0, 0), V(0.32, 0.55, 0), V(0.3, 1.2, 0), V(0.36, 1.25, 0)].map(p => new THREE.Vector2(p.x, p.y));
  const glass = new THREE.Mesh(geo('erlen', () => new THREE.LatheGeometry(pts, 48)), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.02, transparent: true, opacity: 0.22, clearcoat: 1, side: THREE.DoubleSide, envMapIntensity: 1.7, depthWrite: false }));
  const lpts = [V(0.001, -1.06, 0), V(1.02, -1.06, 0), V(1.06, -0.98, 0), V(0.72, -0.25, 0), V(0.001, -0.25, 0)].map(p => new THREE.Vector2(p.x, p.y));
  const liquid = new THREE.Mesh(geo('erlenliq', () => new THREE.LatheGeometry(lpts, 48)), new THREE.MeshPhysicalMaterial({ color: '#22d3ee', roughness: 0.1, transparent: true, opacity: 0.75, emissive: '#0e7490', emissiveIntensity: 0.6, clearcoat: 1 }));
  g.add(liquid, glass);
  const bubbles = [];
  for (let i = 0; i < 16; i++) {
    const b = new THREE.Mesh(SPHERE(), basic('#bdf4ff', 0.7));
    b.scale.setScalar(0.035 + Math.random() * 0.04);
    bubbles.push({ b, x: (Math.random() - 0.5) * 1.2, z: (Math.random() - 0.5) * 1.2, y: -1 + Math.random() * 0.7, sp: 0.3 + Math.random() * 0.6 });
    g.add(b);
  }
  g.add(placed(glowSprite('#22d3ee', 3, 0.35), 0, -0.7, 0));
  let boost = 0;
  g.userData.update = (t, dt) => {
    boost = Math.max(0, boost - dt);
    for (const o of bubbles) {
      o.y += dt * o.sp * (1 + boost * 4);
      if (o.y > -0.3) o.y = -1.02;
      const w = 1 - (o.y + 1.05) * 0.4;
      o.b.position.set(o.x * w, o.y, o.z * w);
    }
  };
  g.userData.poke = () => { boost = 1; };
  return g;
}

export function balanceModel() {
  const g = base(1.9);
  const metal = std('#cbd5e1', 1, 0.2);
  const dark = std('#1e293b', 0.6, 0.3);
  const basePlate = new THREE.Mesh(geo('bbase', () => new RoundedBoxGeometry(2.6, 0.22, 1.2, 3, 0.08)), dark);
  basePlate.position.y = -1.3;
  const pillar = new THREE.Mesh(geo('bpil', () => new THREE.CylinderGeometry(0.08, 0.12, 2, 16)), metal);
  pillar.position.y = -0.3;
  const beam = new THREE.Group(); beam.position.y = 0.7;
  const bar = new THREE.Mesh(geo('bbar', () => new RoundedBoxGeometry(3, 0.1, 0.12, 2, 0.04)), metal);
  beam.add(bar);
  const pans = [];
  for (const x of [-1.4, 1.4]) {
    const hang = new THREE.Group(); hang.position.x = x;
    const str = new THREE.Mesh(geo('bstr', () => new THREE.CylinderGeometry(0.012, 0.012, 1, 6)), metal); str.position.y = -0.5;
    const pan = new THREE.Mesh(geo('bpan', () => new THREE.CylinderGeometry(0.55, 0.42, 0.08, 32)), std('#e2e8f0', 1, 0.12)); pan.position.y = -1;
    hang.add(str, pan);
    // flask-like pile of particles on each pan
    for (let i = 0; i < 7; i++) {
      const left = x < 0;
      const b = ball(left ? (i % 2 ? 'O' : 'C') : (i % 3 ? 'O' : 'C'), 0.35);
      b.position.set((Math.random() - 0.5) * 0.55, -0.85 + Math.random() * 0.25, (Math.random() - 0.5) * 0.4);
      hang.add(b);
    }
    beam.add(hang); pans.push(hang);
  }
  const top = new THREE.Mesh(SPHERE(), metal); top.scale.setScalar(0.12); top.position.y = 0.72;
  g.add(basePlate, pillar, beam, top);
  const eq = textSprite('mass before = mass after', { color: '#a7f3d0', scale: 0.85 });
  eq.position.set(0, 1.45, 0);
  g.add(eq);
  let boost = 0;
  g.userData.update = (t, dt) => {
    boost = Math.max(0, boost - dt * 0.8);
    const a = Math.sin(t * 1.6) * 0.03 + Math.sin(t * 7) * 0.12 * boost;
    beam.rotation.z = a;
    pans.forEach(p => { p.rotation.z = -a; });
  };
  g.userData.poke = () => { boost = 1; };
  return g;
}

/** Dalton's atoms: little coloured spheres that join into molecules and split again. */
export function atomsCloud() {
  const g = base(1.8);
  const syms = ['H', 'O', 'C', 'N', 'H', 'O', 'H', 'C', 'O', 'N', 'H', 'S'];
  const items = syms.map((s, i) => {
    const b = ball(s, 0.75);
    const home = V((Math.random() - 0.5) * 2.6, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1.6);
    b.position.copy(home);
    g.add(b);
    return { b, home, ph: Math.random() * 9 };
  });
  let boost = 0;
  g.userData.update = (t, dt) => {
    boost = Math.max(0, boost - dt);
    const k = 0.5 + 0.5 * Math.sin(t * 0.7);
    items.forEach((o, i) => {
      const pair = items[i ^ 1];
      const target = o.home.clone().lerp(pair.home, 0.42 * k);
      o.b.position.lerp(target, 0.06);
      o.b.position.y += Math.sin(t * 2 + o.ph) * 0.004 * (1 + boost * 10);
    });
  };
  g.userData.poke = () => { boost = 1; };
  return g;
}

/** Mystery orb shown before a question reveals its answer. */
export function mysteryOrb() {
  const g = base(1.45);
  const ico = new THREE.Mesh(geo('mico', () => new THREE.IcosahedronGeometry(1, 1)), new THREE.MeshBasicMaterial({ color: '#a78bfa', wireframe: true, transparent: true, opacity: 0.7 }));
  const inner = new THREE.Mesh(geo('mico2', () => new THREE.IcosahedronGeometry(0.62, 0)), std('#7c3aed', 0.4, 0.2, { emissive: '#5b21b6', ei: 0.8, flat: true }));
  const glow = glowSprite('#c084fc', 3.2, 0.6);
  const q = textSprite('?', { color: '#fdf4ff', bg: 'none', scale: 1.4 });
  g.add(glow, inner, ico, q);
  let boost = 0;
  g.userData.update = (t, dt) => {
    boost = Math.max(0, boost - dt);
    ico.rotation.y += dt * (0.4 + boost * 4); ico.rotation.x += dt * 0.2;
    inner.rotation.y -= dt * 0.7; inner.rotation.z += dt * 0.3;
    const s = 1 + Math.sin(t * 2.5) * 0.06 + boost * 0.2;
    inner.scale.setScalar(s); glow.material.opacity = 0.45 + Math.sin(t * 2.5) * 0.15;
  };
  g.userData.poke = () => { boost = 1; };
  return g;
}

/** Gold trophy for the results screen. */
export function trophyModel(color = '#ffcc33') {
  const g = base(1.75);
  const gold = std(color, 1, 0.12, { clearcoat: 1, env: 1.6 });
  const cupPts = [];
  for (let i = 0; i <= 20; i++) { const t = i / 20; cupPts.push(new THREE.Vector2(0.25 + Math.sin(t * Math.PI * 0.5) * 0.75, -0.1 + t * 1.15)); }
  const cup = new THREE.Mesh(geo('cup', () => new THREE.LatheGeometry(cupPts, 48)), gold);
  cup.material.side = THREE.DoubleSide;
  const stem = new THREE.Mesh(geo('tstem', () => new THREE.CylinderGeometry(0.12, 0.22, 0.6, 24)), gold); stem.position.y = -0.4;
  const plate = new THREE.Mesh(geo('tplate', () => new THREE.CylinderGeometry(0.6, 0.7, 0.18, 32)), gold); plate.position.y = -0.75;
  const block = new THREE.Mesh(geo('tblock', () => new RoundedBoxGeometry(1.4, 0.45, 1.1, 3, 0.06)), std('#1e1b4b', 0.3, 0.4)); block.position.y = -1.05;
  const handles = [-1, 1].map(s => { const h = new THREE.Mesh(geo('thandle', () => new THREE.TorusGeometry(0.32, 0.06, 12, 32, Math.PI * 1.2)), gold); h.position.set(s * 0.98, 0.6, 0); h.rotation.z = s > 0 ? -Math.PI * 0.6 : Math.PI * 1.6; return h; });
  const starShape = new THREE.Shape();
  for (let k = 0; k < 10; k++) { const a = Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 0.13 : 0.3; k ? starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const star = new THREE.Mesh(geo('tstar', () => new THREE.ExtrudeGeometry(starShape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 })), std('#fff3b0', 1, 0.1, { emissive: '#ffb703', ei: 0.4 }));
  star.position.set(0, 1.45, -0.04);
  g.add(cup, stem, plate, block, ...handles, star, placed(glowSprite('#ffd166', 4, 0.35), 0, 0.5, -0.5));
  let boost = 0;
  g.userData.update = (t, dt) => { boost = Math.max(0, boost - dt); star.rotation.y += dt * (1.5 + boost * 8); };
  g.userData.poke = () => { boost = 1; };
  return g;
}

/** Ions coming together into a compound (criss-cross result). */
export function compoundModel(catKey, anKey, nCat, nAn, catCharge, anCharge) {
  const g = base(2);
  const total = nCat + nAn;
  const items = [];
  const s = 0.55;
  const size = key => ionModel(key, '+', true).userData.radius * s * 0.82;
  const rc = size(catKey), ra = size(anKey);
  const place = (key, charge, i, count, side, r) => {
    const m = ionModel(key, charge, true, 2.2);
    m.scale.setScalar(s);
    const spread = (i - (count - 1) / 2) * r * 1.75;
    const start = V(side * (r + 1.1) / 0.75, spread, 0);
    const end = V(side * r * 0.9, spread, 0);
    m.position.copy(start);
    g.add(m);
    items.push({ m, start, end });
  };
  for (let i = 0; i < nCat; i++) place(catKey, catCharge, i, nCat, -1, rc);
  for (let i = 0; i < nAn; i++) place(anKey, anCharge, i, nAn, 1, ra);
  const flashS = glowSprite('#ffffff', 0.1, 0);
  g.add(flashS);
  const colH = Math.max(nCat * rc, nAn * ra) * 1.75 / 2;
  g.userData.radius = Math.max(colH + 0.3, rc * 2 + 1.3, ra * 2 + 1.3);
  let t0 = null, joined = false;
  g.userData.join = () => { joined = true; t0 = null; };
  g.userData.update = (t, dt) => {
    items.forEach(o => o.m.userData.update(t, dt));
    if (!joined) {
      items.forEach((o, i) => { o.m.position.lerp(V(o.start.x * 0.75, o.start.y, 0), 0.05); o.m.position.y += Math.sin(t * 2 + i) * 0.003; });
      return;
    }
    if (t0 === null) t0 = t;
    const k = Math.min(1, (t - t0) / 0.9), e = 1 - Math.pow(1 - k, 3);
    items.forEach(o => o.m.position.lerpVectors(V(o.start.x * 0.75, o.start.y, 0), o.end, e));
    const f = k < 1 ? 0 : Math.max(0, 1 - (t - t0 - 0.9) * 1.5);
    flashS.material.opacity = f; flashS.scale.setScalar(1 + (1 - f) * 7);
    g.rotation.y = Math.sin(t * 0.6) * 0.35;
  };
  g.userData.count = total;
  return g;
}

/** Choose a model from a question's "stage" description. */
export function modelFor(stage, revealed, ELEMENTS_BY_Z, IONS) {
  switch (stage?.type) {
    case 'element': {
      const el = ELEMENTS_BY_Z[stage.z];
      return revealed ? atomModel(el) : sampleModel(el.sym);
    }
    case 'ion': {
      if (stage.mystery && !revealed) return mysteryOrb();
      const ion = IONS[stage.ion];
      return ionModel(stage.ion, ion.c, revealed || !stage.hide);
    }
    case 'molecule': return moleculeModel(stage.mol, !!stage.labels);
    case 'flask': return flaskModel();
    case 'balance': return balanceModel();
    case 'atoms': return atomsCloud();
    default: return mysteryOrb();
  }
}
