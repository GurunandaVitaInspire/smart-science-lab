// Guided tour: Ravi hops around the page, a spotlight frames what he talks about,
// a dotted arrow links his speech bubble to it, and every line is spoken (if voice is on).
// Skip any time; finishing or skipping remembers the choice in this browser.
import { gsap } from 'gsap';
import { createMascot } from './mascot.js';
import { audio } from '../audio.js';
import { icon } from '../icons.js';

const KEY = 'ssl.tour.v1';
if (import.meta.env.DEV) window.__gsap = gsap; // dev only: lets tests control the animation clock
export function tourDone() { try { return localStorage.getItem(KEY) === 'done'; } catch { return false; } }
function markDone() { try { localStorage.setItem(KEY, 'done'); } catch { /* private mode */ } }

let active = null;
export function tourRunning() { return !!active; }

export function startTour(steps, { onClose } = {}) {
  if (active) return active;
  const root = document.createElement('div');
  root.className = 'tour';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Guided tour');
  root.innerHTML = `
    <div class="tour-dim"></div>
    <div class="tour-spot"></div>
    <svg class="tour-arrow" aria-hidden="true"><path class="ta-line"/><path class="ta-head"/></svg>
    <div class="tour-bubble" aria-live="polite">
      <div class="tb-top"><span class="tb-step"></span><button class="tb-skip" type="button">Skip tour ${icon('x')}</button></div>
      <h3 class="tb-title"></h3>
      <p class="tb-text"></p>
      <div class="tb-actions">
        <div class="tb-dots">${steps.map(() => '<i></i>').join('')}</div>
        <button class="tb-back" type="button">${icon('back')} Back</button>
        <button class="tb-next" type="button">Next ${icon('next')}</button>
      </div>
    </div>`;
  document.body.appendChild(root);
  const $ = s => root.querySelector(s);
  const spot = $('.tour-spot'), bubble = $('.tour-bubble'), arrow = $('.tour-arrow');
  const line = $('.ta-line'), headPath = $('.ta-head');
  const mascot = createMascot(root);

  let i = -1, busy = false, closed = false, talkCall = null, targetEl = null;
  const narrow = () => innerWidth < 700;
  const mascotH = () => (narrow() ? Math.min(150, innerHeight * 0.2) : Math.max(170, Math.min(300, innerHeight * 0.32)));
  mascot.size(mascotH());

  gsap.set(spot, { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0, opacity: 0 });
  gsap.set(bubble, { opacity: 0 });

  const rectOf = el => {
    const r = el.getBoundingClientRect(), pad = 10;
    return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2, right: r.right + pad, bottom: r.bottom + pad, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  };

  /** Where Ravi stands and where his bubble goes for a target (or the centre when there is none). */
  function layout(r) {
    const vw = innerWidth, vh = innerHeight, mh = mascotH(), mw = mh * 0.4;
    mascot.size(mh);
    const bw = narrow() ? vw - 24 : Math.min(440, Math.max(320, vw * 0.4));
    bubble.style.width = bw + 'px';
    const bh = bubble.offsetHeight || 200;
    let mx, my, bx, by;
    if (narrow()) {
      mx = mw / 2 + 12; my = vh - 8;
      bx = 12; by = vh - mh - bh - 12;
      if (r && r.bottom > by - 8 && r.top < vh - 20) { // target hidden behind the bubble: put the bubble on top
        by = 12;
      }
      return { mx, my, bx, by, bw, bh };
    }
    if (!r) {
      mx = vw * 0.34; my = vh - 18;
    } else if (r.bottom > vh - mh * 0.55) {
      // target sits low on the screen (e.g. the game cards): stand on top of it
      my = r.top + 6;
      mx = r.cx > vw / 2 ? r.left + mw * 0.8 : r.right - mw * 0.8;
    } else {
      my = vh - 18;
      const spaceL = r.left, spaceR = vw - r.right;
      mx = r.cx;
      if (r.bottom > my - mh) mx = spaceR > spaceL ? r.right + mw * 0.7 : r.left - mw * 0.7;
    }
    mx = Math.max(mw / 2 + 14, Math.min(vw - mw / 2 - 14, mx));
    my = Math.max(mh + 12, Math.min(vh - 8, my));

    // bubble: try spots around Ravi and keep the one that fits on screen and covers the least of him and the target
    const headY = Math.max(12, Math.min(vh - bh - 12, my - mh * 0.92));
    const mRect = { left: mx - mw * 0.45, right: mx + mw * 0.45, top: my - mh, bottom: my };
    const cands = [
      { x: mx + mw * 0.55 + 14, y: headY },              // right of him
      { x: mx - mw * 0.55 - 14 - bw, y: headY },         // left of him
      { x: mx - bw / 2, y: my - mh - bh - 18 },          // above his head
      { x: mx - bw * 0.15, y: my - mh - bh - 18 },
      { x: mx - bw * 0.85, y: my - mh - bh - 18 },
    ];
    // his pointing arm reaches from the shoulder towards the target: keep that clear too
    let armRect = null;
    if (r) {
      const side = r.cx >= mx ? 1 : -1;
      const sx = mx + side * mw * 0.35, sy = my - mh * 0.55, reach = mh * 0.45;
      // same angle rule as the arm itself (mascot.point): swings outward, never straight up
      let a = (Math.atan2(-(r.cx - sx), r.cy - sy) * 180) / Math.PI;
      if (side > 0 && a > 0) a -= 360;
      if (side < 0 && a < 0) a += 360;
      a = side > 0 ? Math.max(-142, Math.min(-22, a)) : Math.max(22, Math.min(142, a));
      const ex = sx - Math.sin((a * Math.PI) / 180) * reach, ey = sy + Math.cos((a * Math.PI) / 180) * reach;
      armRect = { left: Math.min(sx, ex) - 22, right: Math.max(sx, ex) + 22, top: Math.min(sy, ey) - 22, bottom: Math.max(sy, ey) + 22 };
    }
    // also try a grid of spots: beside, above, past the end of his pointing hand, across the screen
    const xs = [mx + mw * 0.55 + 14, mx - mw * 0.55 - 14 - bw, mx - bw / 2, vw - bw - 24, 24];
    const ys = [headY, my - mh - bh - 18, vh - bh - 24, 24];
    if (armRect) { xs.push(armRect.right + 12, armRect.left - bw - 12); ys.push(armRect.top - bh - 10, armRect.bottom + 10); }
    for (const x of xs) for (const y of ys) cands.push({ x, y, far: true });
    const area = (x, y, o) => o ? Math.max(0, Math.min(x + bw, o.right) - Math.max(x, o.left)) * Math.max(0, Math.min(y + bh, o.bottom) - Math.max(y, o.top)) : 0;
    let best = null;
    for (const c of cands) {
      const x = Math.max(12, Math.min(vw - bw - 12, c.x)), y = Math.max(12, Math.min(vh - bh - 12, c.y));
      const shift = Math.abs(x - c.x) + Math.abs(y - c.y); // how far it had to be pushed to stay on screen
      // covering Ravi or his arm is worst, then the spotlit item; stay close to him when possible
      const gap = Math.hypot(x + bw / 2 - mx, y + bh / 2 - (my - mh * 0.7));
      const cost = area(x, y, mRect) * 4 + area(x, y, armRect) * 4 + area(x, y, r) * 3 + shift * 25 + gap * 6;
      if (!best || cost < best.cost) best = { x, y, cost };
    }
    bx = best.x; by = best.y;
    return { mx, my, bx, by, bw, bh };
  }

  function drawArrow(r, bx, by, bw, bh) {
    if (!r) { gsap.to(arrow, { opacity: 0, duration: 0.2 }); return; }
    // from the bubble edge nearest the target to the spotlight edge
    const sx = Math.max(bx, Math.min(bx + bw, r.cx)), sy = r.cy < by ? by : r.cy > by + bh ? by + bh : by + bh / 2;
    const fromSide = sy === by + bh / 2;
    const s = { x: fromSide ? (r.cx < bx ? bx : bx + bw) : sx, y: sy };
    const t = { x: Math.max(r.left + 12, Math.min(r.right - 12, s.x)), y: r.cy < s.y ? r.bottom : r.top };
    if (fromSide) { t.x = r.cx < s.x ? r.right : r.left; t.y = Math.max(r.top + 12, Math.min(r.bottom - 12, s.y)); }
    const dist = Math.hypot(t.x - s.x, t.y - s.y);
    if (dist < 30) { gsap.to(arrow, { opacity: 0, duration: 0.2 }); return; }
    const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2, nx = -(t.y - s.y) / dist, ny = (t.x - s.x) / dist, bend = Math.min(90, dist * 0.25);
    const c = { x: mx + nx * bend, y: my + ny * bend };
    line.setAttribute('d', `M${s.x} ${s.y} Q${c.x} ${c.y} ${t.x} ${t.y}`);
    const a = Math.atan2(t.y - c.y, t.x - c.x), hl = 13;
    headPath.setAttribute('d', `M${t.x} ${t.y} L${t.x - hl * Math.cos(a - 0.5)} ${t.y - hl * Math.sin(a - 0.5)} M${t.x} ${t.y} L${t.x - hl * Math.cos(a + 0.5)} ${t.y - hl * Math.sin(a + 0.5)}`);
    const len = line.getTotalLength();
    gsap.set(arrow, { opacity: 1 });
    gsap.fromTo(line, { strokeDasharray: `${len}`, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.55, ease: 'power2.out', onComplete: () => line.style.strokeDasharray = '2 9' });
    gsap.fromTo(headPath, { opacity: 0 }, { opacity: 1, duration: 0.2, delay: 0.45 });
  }

  function words(el, text) {
    el.innerHTML = text.split(' ').map(w => `<span class="w">${w}</span>`).join(' ');
    return el.querySelectorAll('.w');
  }

  function speak(text) {
    talkCall?.kill();
    mascot.talk(true);
    const spoken = audio.say(text, { rate: 1.0, pitch: 1.35, onend: () => { if (!closed) mascot.talk(false); } });
    // without a voice, move the mouth for about as long as it takes to read the line
    if (!spoken) talkCall = gsap.delayedCall(Math.min(5, 0.5 + text.split(' ').length * 0.2), () => mascot.talk(false));
  }

  async function scrollIntoReach(el) {
    const r = el.getBoundingClientRect();
    const top = narrow() ? innerHeight * 0.14 : 80;
    const bottom = narrow() ? innerHeight * 0.55 : innerHeight - 40;
    if (r.top >= top && r.bottom <= bottom) return;
    window.scrollBy({ top: r.top - top, behavior: 'smooth' });
    await new Promise(res => setTimeout(res, 480));
  }

  async function go(n) {
    if (busy || closed || n < 0 || n >= steps.length) return;
    busy = true;
    const first = i === -1;
    i = n;
    const st = steps[i];
    targetEl = st.target ? document.querySelector(st.target) : null;
    if (targetEl) await scrollIntoReach(targetEl);
    else if (window.scrollY > 0) { window.scrollTo({ top: 0, behavior: 'smooth' }); await new Promise(res => setTimeout(res, 380)); }
    if (closed) return;
    const r = targetEl ? rectOf(targetEl) : null;

    // header, dots, buttons
    $('.tb-step').textContent = `${i + 1} / ${steps.length}`;
    root.querySelectorAll('.tb-dots i').forEach((d, k) => d.classList.toggle('on', k === i));
    $('.tb-back').style.visibility = i === 0 ? 'hidden' : 'visible';
    $('.tb-next').innerHTML = i === steps.length - 1 ? `${st.cta || "Let's go"} ${icon('next')}` : `Next ${icon('next')}`;
    $('.tb-title').textContent = st.title;
    const ws = words($('.tb-text'), st.text);
    const L = layout(r);

    // spotlight moves to the target (or closes to nothing)
    // the spotlight is also the dimmer (its huge shadow); with no target it shrinks to a point
    spot.classList.toggle('empty', !r);
    if (r) gsap.to(spot, { left: r.left, top: r.top, width: r.width, height: r.height, opacity: 1, duration: 0.6, ease: 'power3.inOut' });
    else gsap.to(spot, { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0, opacity: 1, duration: 0.5, ease: 'power3.inOut' });

    // bubble out, Ravi moves, bubble back in with the words
    gsap.to(arrow, { opacity: 0, duration: 0.15 });
    await gsap.to(bubble, { opacity: 0, y: 10, scale: 0.97, duration: first ? 0 : 0.18, ease: 'power2.in' });
    mascot.setMood(st.mood || 'smile');
    if (first) await mascot.enter(L.mx, L.my);
    else await mascot.hopTo(L.mx, L.my);
    if (closed) return;
    // Ravi points at what he is talking about (or stands relaxed when there is nothing to show)
    if (r) mascot.point(r.cx, r.cy); else mascot.rest();
    gsap.set(bubble, { left: L.bx, top: L.by });
    // tail points at Ravi: from the side when he stands beside the bubble, from below when he is under it
    const besideL = L.bx > L.mx, besideR = L.bx + L.bw < L.mx, below = !besideL && !besideR && L.by + bubble.offsetHeight < L.my - mascot.pos.h * 0.5;
    bubble.classList.toggle('tail-left', besideL);
    bubble.classList.toggle('tail-right', besideR);
    bubble.classList.toggle('tail-down', below);
    bubble.style.setProperty('--tail-x', `${Math.max(24, Math.min(L.bw - 40, L.mx - L.bx - 8))}px`);
    gsap.fromTo(bubble, { opacity: 0, y: 14, scale: 0.94, transformOrigin: L.bx > L.mx ? '0% 50%' : '100% 50%' }, { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: 'back.out(1.6)' });
    gsap.fromTo($('.tb-title'), { opacity: 0, x: -14, filter: 'blur(6px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.4, ease: 'power3.out', delay: 0.08 });
    gsap.fromTo(ws, { opacity: 0, x: -10, filter: 'blur(5px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.32, ease: 'power2.out', stagger: 0.04, delay: 0.16 });
    drawArrow(r, L.bx, L.by, L.bw, bubble.offsetHeight);
    speak(`${st.title}. ${st.text}`);
    $('.tb-next').focus({ preventScroll: true });
    busy = false;
  }

  // keep the spotlight on its target when the page moves or resizes
  const refresh = () => {
    if (closed || busy || i < 0) return;
    const r = targetEl ? rectOf(targetEl) : null;
    if (r) gsap.set(spot, { left: r.left, top: r.top, width: r.width, height: r.height });
    const L = layout(r);
    mascot.pos.x = L.mx; mascot.pos.y = L.my; mascot.size(mascot.pos.h);
    if (r) mascot.point(r.cx, r.cy);
    gsap.set(bubble, { left: L.bx, top: L.by });
    drawArrow(r, L.bx, L.by, L.bw, bubble.offsetHeight);
  };
  let rt = 0;
  const onResize = () => { clearTimeout(rt); rt = setTimeout(refresh, 120); };
  addEventListener('resize', onResize);

  async function close(finished) {
    if (closed) return;
    closed = true;
    markDone();
    talkCall?.kill();
    audio.hush();
    removeEventListener('resize', onResize);
    removeEventListener('keydown', onKey, true);
    mascot.talk(false);
    gsap.to([bubble, arrow], { opacity: 0, duration: 0.2 });
    gsap.to(spot, { opacity: 0, duration: 0.3 });
    if (finished) audio.say("Have fun, scientist!", { pitch: 1.35 });
    await mascot.leave();
    await gsap.to($('.tour-dim'), { opacity: 0, duration: 0.3 });
    mascot.destroy();
    root.remove();
    active = null;
    onClose?.(finished);
  }

  const onKey = e => {
    if (e.key === 'Escape') { e.preventDefault(); close(false); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
  };
  addEventListener('keydown', onKey, true);

  const next = () => { audio.tap(); if (i >= steps.length - 1) close(true); else go(i + 1); };
  $('.tb-next').addEventListener('click', next);
  $('.tb-back').addEventListener('click', () => { audio.tap(); go(i - 1); });
  $('.tb-skip').addEventListener('click', () => { audio.tap(); close(false); });
  // tapping the dimmed page moves on, so small hands are never stuck
  $('.tour-dim').addEventListener('click', next);

  active = { close };
  go(0);
  return active;
}
