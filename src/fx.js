// 2D celebration effects drawn on a canvas above the page:
// particle bursts, glitter rain, floating points, banners and screen flashes.

const NEON = ['#22d3ee', '#a78bfa', '#f472b6', '#facc15', '#4ade80', '#fb923c', '#60a5fa', '#ffffff'];
let cv, ctx, W = 0, H = 0, dpr = 1, running = false;
const parts = [];
const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initFx() {
  cv = document.createElement('canvas');
  cv.className = 'fx-canvas';
  document.body.appendChild(cv);
  ctx = cv.getContext('2d');
  const size = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  addEventListener('resize', size);
}

function loop() {
  ctx.clearRect(0, 0, W, H);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= 1 / 60;
    if (p.life <= 0 || p.y > H + 60) { parts.splice(i, 1); continue; }
    p.vx *= p.drag; p.vy = p.vy * p.drag + p.g;
    p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    if (p.sway) p.x += Math.sin(p.y * 0.02 + p.phase) * p.sway;
    const a = Math.min(1, p.life / p.fade);
    const tw = p.twinkle ? 0.55 + 0.45 * Math.sin(p.life * 22 + p.phase) : 1;
    ctx.globalAlpha = a * tw;
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    if (p.shape === 'ring') {
      ctx.strokeStyle = p.c; ctx.lineWidth = 4 * a;
      ctx.beginPath(); ctx.arc(0, 0, p.r * (1 + (p.max - p.life) * 3), 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.fillStyle = p.c;
      if (p.glow) { ctx.shadowColor = p.c; ctx.shadowBlur = 12; }
      if (p.shape === 'star') star(p.s);
      else if (p.shape === 'dot') { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.scale(1, Math.cos(p.rot * 3)); ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); }
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  if (parts.length) requestAnimationFrame(loop); else { running = false; ctx.clearRect(0, 0, W, H); }
}
function star(s) {
  const r = s / 2, i = r * 0.42;
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? i : r;
    k ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
}
function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }

/** Particle burst from a point (e.g. the centre of the correct button). */
export function burst(x, y, opts = {}) {
  if (!ctx) return;
  const n = reduced ? 12 : (opts.count || 46);
  const colors = opts.colors || NEON;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = (opts.speed || 9) * (0.35 + Math.random());
    parts.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.up || 2), g: 0.22, drag: 0.955,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, s: 6 + Math.random() * 9,
      c: colors[(Math.random() * colors.length) | 0], shape: ['star', 'dot', 'rect'][(Math.random() * 3) | 0],
      life: 1.2 + Math.random() * 0.8, fade: 0.5, glow: true, twinkle: Math.random() < 0.4, phase: Math.random() * 9,
    });
  }
  for (let k = 0; k < 2; k++) parts.push({ x, y, vx: 0, vy: 0, g: 0, drag: 1, rot: 0, vr: 0, r: 20 + k * 12, max: 0.6, life: 0.6, fade: 0.6, c: colors[k], shape: 'ring' });
  kick();
}

/** Glitter and confetti raining from the top of the screen. */
export function rain(n = 140, colors = NEON) {
  if (!ctx) return;
  if (reduced) n = 30;
  for (let i = 0; i < n; i++) {
    parts.push({
      x: Math.random() * W, y: -20 - Math.random() * H * 0.6, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3, g: 0.03, drag: 0.995,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.25, s: 8 + Math.random() * 10, sway: 0.8,
      c: colors[(Math.random() * colors.length) | 0], shape: Math.random() < 0.35 ? 'star' : 'rect',
      life: 6, fade: 1, glow: Math.random() < 0.5, twinkle: Math.random() < 0.5, phase: Math.random() * 9,
    });
  }
  kick();
}

/** Fireworks: several bursts around the screen. */
export function fireworks(times = 6) {
  for (let i = 0; i < times; i++) {
    setTimeout(() => burst(W * (0.15 + Math.random() * 0.7), H * (0.15 + Math.random() * 0.4), { count: 60, speed: 11 }), i * 260);
  }
}

/** Floating "+10" text that rises and fades. */
export function floatText(x, y, text, color = '#4ade80') {
  const el = document.createElement('div');
  el.className = 'float-text';
  el.textContent = text;
  el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.color = color;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

/** Big centre banner ("ON FIRE x3"). */
export function banner(text, sub = '', kind = 'good') {
  document.querySelectorAll('.banner').forEach(b => b.remove());
  const el = document.createElement('div');
  el.className = 'banner ' + kind;
  el.innerHTML = `<div class="banner-main">${text}</div>${sub ? `<div class="banner-sub">${sub}</div>` : ''}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2300);
}

/** Coloured flash around the edges of the screen. */
export function flash(kind = 'good') {
  const el = document.createElement('div');
  el.className = 'screen-flash ' + kind;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

export function centerOf(el) {
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
}

export function shake(el) {
  el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 520);
}
