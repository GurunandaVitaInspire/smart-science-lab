import * as THREE from 'three';
import { themeState } from '../theme-state.js';

const cache = new Map();
function canvasTex(key, w, h, draw) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(key, t);
  return t;
}

/** Soft round glow, used for electrons, stars and light halos. */
export function glowTexture() {
  return canvasTex('glow', 128, 128, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.18, 'rgba(255,255,255,0.85)');
    r.addColorStop(0.45, 'rgba(255,255,255,0.25)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });
}

/** Hologram disc for the pedestal under each 3D model. */
export function holoTexture() {
  return canvasTex('holo', 512, 512, (g, w) => {
    const c = w / 2;
    g.translate(c, c);
    const ring = (r, lw, a, dash) => {
      g.beginPath(); g.setLineDash(dash || []);
      g.strokeStyle = `rgba(120,230,255,${a})`; g.lineWidth = lw;
      g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
    };
    const fill = g.createRadialGradient(0, 0, 0, 0, 0, c);
    fill.addColorStop(0, 'rgba(80,200,255,0.35)');
    fill.addColorStop(0.7, 'rgba(80,140,255,0.10)');
    fill.addColorStop(1, 'rgba(80,140,255,0)');
    g.fillStyle = fill; g.beginPath(); g.arc(0, 0, c, 0, Math.PI * 2); g.fill();
    ring(c * 0.96, 6, 0.9);
    ring(c * 0.86, 2, 0.6, [18, 10]);
    ring(c * 0.7, 3, 0.7);
    ring(c * 0.52, 1.5, 0.5, [6, 8]);
    ring(c * 0.3, 2, 0.6);
    g.setLineDash([]);
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2, r1 = c * 0.88, r2 = c * (i % 6 === 0 ? 0.78 : 0.83);
      g.strokeStyle = `rgba(150,240,255,${i % 6 === 0 ? 0.9 : 0.45})`; g.lineWidth = i % 6 === 0 ? 3 : 1.5;
      g.beginPath(); g.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); g.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); g.stroke();
    }
    for (let k = 0; k < 3; k++) {
      g.strokeStyle = 'rgba(244,114,182,0.85)'; g.lineWidth = 7;
      g.beginPath(); g.arc(0, 0, c * 0.62, k * 2.1, k * 2.1 + 0.7); g.stroke();
    }
  });
}

/** Vertical fade used for the light beam above the pedestal. */
export function beamTexture() {
  return canvasTex('beam', 8, 256, (g, w, h) => {
    const l = g.createLinearGradient(0, 0, 0, h);
    l.addColorStop(0, 'rgba(255,255,255,0)');
    l.addColorStop(0.75, 'rgba(255,255,255,0.35)');
    l.addColorStop(1, 'rgba(255,255,255,0.9)');
    g.fillStyle = l; g.fillRect(0, 0, w, h);
  });
}

/** A text label as a sprite (masses like "16 u", charges like "2+"). */
export function textSprite(text, opts = {}) {
  const color = opts.color || '#ffffff';
  const bg = opts.bg || 'rgba(10,16,40,0.78)';
  const border = opts.border || 'rgba(120,230,255,0.9)';
  const key = `txt|${text}|${color}|${bg}|${border}`;
  const fs = 72;
  const font = `800 ${fs}px Geist, system-ui, sans-serif`;
  const mc = document.createElement('canvas').getContext('2d');
  mc.font = font;
  const cw = Math.max(128, Math.ceil(mc.measureText(text).width + 76));
  const tex = canvasTex(key, cw, 128, (g, w, h) => {
    g.font = font;
    const tw = w - 20;
    const x = 10, y = 10, rh = h - 20, r = rh / 2;
    if (bg !== 'none') {
      g.fillStyle = bg; g.strokeStyle = border; g.lineWidth = 5;
      g.beginPath(); g.roundRect ? g.roundRect(x, y, tw, rh, r) : g.rect(x, y, tw, rh); g.fill(); g.stroke();
    }
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = color; g.shadowBlur = 14;
    g.fillText(text, w / 2, h / 2 + 4);
  });
  const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: opts.depthTest ?? false });
  const s = new THREE.Sprite(m);
  const sc = opts.scale || 1;
  s.scale.set(0.5 * sc * (cw / 128), 0.5 * sc, 1);
  s.renderOrder = 10;
  return s;
}

/** Glowing sprite (additive). */
export function glowSprite(color, size = 1, opacity = 1) {
  const light = themeState.light;
  const m = new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity: light ? opacity * 0.55 : opacity, blending: light ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite: false });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(size);
  return s;
}
