// Element Lab: explore elements 1 to 30 in 3D (atom model or how the real element looks).
import { audio } from '../audio.js';
import { h } from '../ui.js';
import { burst, centerOf } from '../fx.js';
import { Stage, pulse } from '../three/engine.js';
import { atomModel, sampleModel } from '../three/models.js';
import { ELEMENTS, CATS } from '../data/elements.js';

export function mountLab(body) {
  const root = h(`<div class="lab">
    <div class="lab-view">
      <div class="stage-wrap big">
        <div class="stage"></div>
        <div class="view-toggle">
          <button data-v="real" class="on">Real look</button>
          <button data-v="atom">Atom model</button>
        </div>
        <div class="stage-hint">Drag to spin · tap to poke · scroll to zoom</div>
      </div>
      <div class="holo-card lab-card"></div>
    </div>
    <div class="lab-table glass">
      <div class="ptable"></div>
      <div class="legend">${Object.entries(CATS).map(([, c]) => `<span style="--c:${c.color}">${c.label}</span>`).join('')}</div>
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
    stage.set(view === 'atom' ? atomModel(e) : sampleModel(e.sym));
    const c = CATS[e.cat];
    const card = $('.lab-card');
    card.style.setProperty('--c', c.color);
    card.innerHTML = `<div class="tile"><span class="z">${e.z}</span><span class="sym">${e.sym}</span><span class="nm">${e.name}</span><span class="ms">${e.mass} u</span></div>
      <div class="info"><div class="cat">${c.label} · ${e.state}</div>
      <div class="shells">Protons <b>${e.z}</b> · Neutrons <b>${e.neutrons}</b> · Electrons <b>${e.z}</b></div>
      <div class="shells">Shells: <b>${e.shells.join(', ')}</b></div>
      <div class="fact">${e.fact}</div></div>`;
    card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
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
  addEventListener('keydown', onKey);
  load(cur);
  return { destroy() { stage.dispose(); removeEventListener('keydown', onKey); } };
}
