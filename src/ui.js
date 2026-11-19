// Small shared helpers for the page.
import { audio } from './audio.js';
import { icon } from './icons.js';
import { toggleTheme } from './theme.js';

/** Formula text to HTML: "SO4^2−" -> SO<sub>4</sub><sup>2−</sup> */
export function F(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/\^([0-9]*[+−-])/g, '<sup>$1</sup>')
    .replace(/([A-Za-z)])(\d+)/g, '$1<sub>$2</sub>');
}

export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export const shuffle = a => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/** 3D tilt for every element with class "tilt" (cards and buttons follow the finger / cursor). */
export function initTilt() {
  let cur = null;
  const reset = el => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.classList.remove('tilting'); };
  document.addEventListener('pointermove', e => {
    const el = e.target.closest && e.target.closest('.tilt');
    if (cur && cur !== el) { reset(cur); cur = null; }
    if (!el || el.disabled) return;
    if (cur !== el && e.pointerType === 'mouse') audio.hover();
    cur = el;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const max = el.dataset.tiltMax ? +el.dataset.tiltMax : 8;
    el.style.setProperty('--rx', `${(0.5 - y) * max}deg`);
    el.style.setProperty('--ry', `${(x - 0.5) * max}deg`);
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
    el.classList.add('tilting');
  }, { passive: true });
  document.addEventListener('pointerleave', () => { if (cur) { reset(cur); cur = null; } });
  document.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse' && cur) { reset(cur); cur = null; } });
}

/** Header buttons: theme, music, effects, voice, full screen. */
export function soundButtons() {
  const el = h(`<div class="sound-btns">
    <button class="icon-btn" data-s="theme" title="Light / dark" aria-label="Switch light or dark theme"><span class="i-dark">${icon('sun')}</span><span class="i-light">${icon('moon')}</span></button>
    <button class="icon-btn" data-s="music" title="Music on / off" aria-label="Music">${icon('music')}</button>
    <button class="icon-btn" data-s="sfx" title="Sound effects on / off" aria-label="Sound effects">${icon('volume')}</button>
    <button class="icon-btn" data-s="voice" title="Voice cheers on / off" aria-label="Voice cheers">${icon('mic')}</button>
    <button class="icon-btn hide-sm" data-s="full" title="Full screen" aria-label="Full screen">${icon('maximize')}</button>
  </div>`);
  const sync = () => {
    el.querySelector('[data-s=music]').classList.toggle('off', !audio.musicOn);
    el.querySelector('[data-s=sfx]').classList.toggle('off', !audio.sfxOn);
    el.querySelector('[data-s=voice]').classList.toggle('off', !audio.voiceOn);
  };
  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const s = b.dataset.s;
    if (s === 'music') audio.toggleMusic();
    else if (s === 'sfx') audio.toggleSfx();
    else if (s === 'voice') audio.toggleVoice();
    else if (s === 'full') toggleFull();
    else if (s === 'theme') toggleTheme();
    audio.tap();
    document.querySelectorAll('.sound-btns').forEach(x => x.dispatchEvent(new Event('sync')));
  });
  el.addEventListener('sync', sync);
  sync();
  return el;
}

function toggleFull() {
  const d = document;
  try {
    if (!d.fullscreenElement && !d.webkitFullscreenElement) (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen).call(d.documentElement);
    else (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  } catch { /* not allowed */ }
}

/** Next button with a countdown bar that presses itself. */
export function autoNext(btn, ms, fn) {
  let done = false, timer = null;
  const go = () => { if (done) return; done = true; clearTimeout(timer); fn(); };
  btn.style.setProperty('--t', ms + 'ms');
  btn.classList.remove('counting'); void btn.offsetWidth; btn.classList.add('counting');
  btn.onclick = () => { audio.tap(); go(); };
  const tick = () => {
    if (done) return;
    if (document.hidden || !btn.isConnected || btn.offsetParent === null) { timer = setTimeout(tick, 800); return; }
    go();
  };
  timer = setTimeout(tick, ms);
  return { cancel() { done = true; clearTimeout(timer); btn.classList.remove('counting'); }, go };
}

export function stars(n, max = 3) {
  return Array.from({ length: max }, (_, i) => `<span class="star ${i < n ? 'on' : ''}" style="--i:${i}">${icon('star')}</span>`).join('');
}
