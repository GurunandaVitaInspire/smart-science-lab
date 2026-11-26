// Element Lab: explore elements 1 to 30 in 3D (how the real element looks, or its Bohr atom).
import { audio } from '../audio.js';
import { h } from '../ui.js';
import { burst, centerOf } from '../fx.js';
import { Stage, pulse } from '../three/engine.js';
import { atomModel, sampleModel } from '../three/models.js';
import { ELEMENTS, CATS } from '../data/elements.js';
import { t } from '../i18n.js';
import { narrate, hush, sayOption } from '../narrate.js';

const SHELL_NAMES = ['K', 'L', 'M', 'N'];

export function mountLab(body) {
  const root = h(`<div class="lab">
    <div class="lab-view">
      <div class="stage-wrap big">
        <div class="stage"></div>
        <div class="particle-key" aria-hidden="true">
          <span><i class="pk proton"></i>${t('Proton')}</span>
          <span><i class="pk neutron"></i>${t('Neutron')}</span>
          <span><i class="pk electron"></i>${t('Electron')}</span>
        </div>
        <div class="view-toggle">
          <button data-v="real" class="on">${t('Real look')}</button>
          <button data-v="atom">${t('Atom model')}</button>
        </div>
        <div class="stage-hint">${t('Drag to spin · tap to poke · scroll to zoom')}</div>
      </div>
    </div>
    <div class="lab-side">
      <div class="lab-detail"></div>
      <div class="lab-table">
        <div class="ptable"></div>
        <div class="legend">${Object.entries(CATS).map(([, c]) => `<span style="--c:${c.color}">${t(c.label)}</span>`).join('')}</div>
      </div>
    </div>
  </div>`);
  body.appendChild(root);
  const $ = s => root.querySelector(s);
  const stage = new Stage($('.stage'), { autoRotate: 0.35, zoom: true });
  let cur = ELEMENTS[0], view = 'real';

  const table = $('.ptable');
  table.innerHTML = ELEMENTS.map(e => `<button class="ptile tilt" data-z="${e.z}" style="--c:${CATS[e.cat].color};grid-row:${e.period};grid-column:${e.group}">
      <span class="z">${e.z}</span><span class="sym">${e.sym}</span><span class="nm">${t(e.name)}</span></button>`).join('');

  function load(e, fromEl) {
    cur = e;
    table.querySelectorAll('.ptile').forEach(tl => tl.classList.toggle('sel', +tl.dataset.z === e.z));
    root.classList.toggle('atom-view', view === 'atom');
    stage.set(view === 'atom' ? atomModel(e) : sampleModel(e.sym));
    const c = CATS[e.cat];
    const d = $('.lab-detail');
    d.style.setProperty('--c', c.color);
    d.innerHTML = `
      <div class="ld-tile"><span class="z">${e.z}</span><span class="sym">${e.sym}</span><span class="ms">${e.mass} u</span></div>
      <div class="ld-main">
        <p class="ld-cat"><span class="dot"></span>${t(c.label)} · ${t(e.state)}</p>
        <h2 class="ld-name">${t(e.name)}</h2>
        <p class="ld-fact">${t(e.fact)}</p>
      </div>
      <div class="ld-stats">
        <div><b class="p">${e.z}</b><span>${t('Protons')}</span></div>
        <div><b class="n">${e.neutrons}</b><span>${t('Neutrons')}</span></div>
        <div><b class="e">${e.z}</b><span>${t('Electrons')}</span></div>
        <div><b>${e.mass}</b><span>${t('Mass (u)')}</span></div>
      </div>
      <div class="ld-shells">
        <span class="ld-label">${t('Electron shells')}</span>
        ${e.shells.map((n, k) => `<span class="shell"><b>${SHELL_NAMES[k]}</b>${n}</span>`).join('')}
      </div>`;
    d.classList.remove('pop'); void d.offsetWidth; d.classList.add('pop');
    if (fromEl) { const [x, y] = centerOf(fromEl); burst(x, y, { count: 18, speed: 5, colors: [c.color, '#ffffff'] }); pulse(c.color); }
    // read the element aloud: name, symbol, numbers, shells and the fun fact
    if (fromEl || view === 'atom') narrate([
      `${t(e.name)}.`,
      t('Symbol {sym}. Atomic number {z}. Atomic mass {m} u.', { sym: sayOption(e.sym), z: e.z, m: e.mass }),
      `${t(c.label)}, ${t(e.state)}.`,
      view === 'atom' ? t('It has {p} protons, {n} neutrons and {e} electrons, in shells {s}.', { p: e.z, n: e.neutrons, e: e.z, s: e.shells.join(', ') }) : '',
      t(e.fact),
    ].filter(Boolean).join(' '));
  }

  table.addEventListener('click', e => {
    const tile = e.target.closest('.ptile'); if (!tile) return;
    audio.pop();
    load(ELEMENTS[+tile.dataset.z - 1], tile);
  });
  $('.view-toggle').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    view = b.dataset.v; audio.whoosh();
    root.querySelectorAll('.view-toggle button').forEach(x => x.classList.toggle('on', x === b));
    load(cur);
  });
  const onKey = e => {
    if (!root.isConnected) return;
    if (e.key === 'ArrowRight') load(ELEMENTS[cur.z % 30]);
    else if (e.key === 'ArrowLeft') load(ELEMENTS[(cur.z + 28) % 30]);
  };
  // the atom's colours are set for light or dark when it is built, so rebuild on a theme switch
  const onTheme = () => load(cur);
  addEventListener('keydown', onKey);
  document.addEventListener('themechange', onTheme);
  load(cur);
  return { destroy() { hush(); stage.dispose(); removeEventListener('keydown', onKey); document.removeEventListener('themechange', onTheme); } };
}
