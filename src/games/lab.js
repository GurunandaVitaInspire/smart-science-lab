// Element Lab: explore elements 1 to 30 in 3D (how the real element looks, or its Bohr atom).
import { audio } from '../audio.js';
import { h } from '../ui.js';
import { burst, centerOf } from '../fx.js';
import { Stage, pulse } from '../three/engine.js';
import { atomModel, sampleModel } from '../three/models.js';
import { ELEMENTS, CATS } from '../data/elements.js';

const SHELL_NAMES = ['K', 'L', 'M', 'N'];

export function mountLab(body) {
  const root = h(`<div class="lab">
    <div class="lab-view">
      <div class="stage-wrap big">
        <div class="stage"></div>
        <div class="particle-key" aria-hidden="true">
          <span><i class="pk proton"></i>Proton</span>
          <span><i class="pk neutron"></i>Neutron</span>
          <span><i class="pk electron"></i>Electron</span>
        </div>
        <div class="view-toggle">
          <button data-v="real" class="on">Real look</button>
          <button data-v="atom">Atom model</button>
        </div>
        <div class="stage-hint">Drag to spin · tap to poke · scroll to zoom</div>
      </div>
    </div>
    <div class="lab-side">
      <div class="lab-detail"></div>
      <div class="lab-table">
        <div class="ptable"></div>
        <div class="legend">${Object.entries(CATS).map(([, c]) => `<span style="--c:${c.color}">${c.label}</span>`).join('')}</div>
      </div>
    </div>
  </div>`);
  body.appendChild(root);
  const $ = s => root.querySelector(s);
  const stage = new Stage($('.stage'), { autoRotate: 0.35, zoom: true });
  let cur = ELEMENTS[0], view = 'real';

  const table = $('.ptable');
  table.innerHTML = ELEMENTS.map(e => `<button class="ptile tilt" data-z="${e.z}" style="--c:${CATS[e.cat].color};grid-row:${e.period};grid-column:${e.group}">
      <span class="z">${e.z}</span><span class="sym">${e.sym}</span><span class="nm">${e.name}</span></button>`).join('');

  function load(e, fromEl) {
    cur = e;
    table.querySelectorAll('.ptile').forEach(t => t.classList.toggle('sel', +t.dataset.z === e.z));
    root.classList.toggle('atom-view', view === 'atom');
    stage.set(view === 'atom' ? atomModel(e) : sampleModel(e.sym));
    const c = CATS[e.cat];
    const d = $('.lab-detail');
    d.style.setProperty('--c', c.color);
    d.innerHTML = `
      <div class="ld-tile"><span class="z">${e.z}</span><span class="sym">${e.sym}</span><span class="ms">${e.mass} u</span></div>
      <div class="ld-main">
        <p class="ld-cat"><span class="dot"></span>${c.label} · ${e.state}</p>
        <h2 class="ld-name">${e.name}</h2>
        <p class="ld-fact">${e.fact}</p>
      </div>
      <div class="ld-stats">
        <div><b class="p">${e.z}</b><span>Protons</span></div>
        <div><b class="n">${e.neutrons}</b><span>Neutrons</span></div>
        <div><b class="e">${e.z}</b><span>Electrons</span></div>
        <div><b>${e.mass}</b><span>Mass (u)</span></div>
      </div>
      <div class="ld-shells">
        <span class="ld-label">Electron shells</span>
        ${e.shells.map((n, k) => `<span class="shell"><b>${SHELL_NAMES[k]}</b>${n}</span>`).join('')}
      </div>`;
    d.classList.remove('pop'); void d.offsetWidth; d.classList.add('pop');
    if (fromEl) { const [x, y] = centerOf(fromEl); burst(x, y, { count: 18, speed: 5, colors: [c.color, '#ffffff'] }); pulse(c.color); }
  }

  table.addEventListener('click', e => {
    const t = e.target.closest('.ptile'); if (!t) return;
    audio.pop();
    load(ELEMENTS[+t.dataset.z - 1], t);
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
  return { destroy() { stage.dispose(); removeEventListener('keydown', onKey); document.removeEventListener('themechange', onTheme); } };
}
