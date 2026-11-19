// Game 2: drag each Latin name to its element (2 boards of 5).
// A wrong drop flies back and the right box glows; that pair then gives no points.
import { icon } from '../icons.js';
import { audio } from '../audio.js';
import { h, shuffle, autoNext } from '../ui.js';
import { banner, rain, burst, centerOf } from '../fx.js';
import { Stage } from '../three/engine.js';
import { sampleModel } from '../three/models.js';
import { lookFor } from '../data/elements.js';

export function mountLatin(body, { boards, session, onDone }) {
  const root = h(`<div class="latin">
    <div class="stage-wrap">
      <div class="stage"></div>
      <div class="holo-card latin-card"></div>
      <div class="stage-hint">Drag to spin · tap to poke</div>
    </div>
    <div class="lpanel glass">
      <div class="qmeta"><span class="kind-chip"></span><span class="qnum"></span></div>
      <h2 class="qtext">Drag each Latin name to its element</h2>
      <div class="lrows"></div>
      <div class="ltray"></div>
      <div class="feedback" hidden></div>
    </div>
  </div>`);
  body.appendChild(root);
  const $ = s => root.querySelector(s);
  const stage = new Stage($('.stage'), { autoRotate: 0.5 });
  let bi = -1, B = null, placed = 0, sel = null, nextCtl = null, missed = new Set(), shownSym = null, dragging = false, holdUntil = 0;

  function show(p, matched) {
    if (shownSym !== p.sym) { stage.set(sampleModel(p.sym)); shownSym = p.sym; }
    const c = $('.latin-card');
    c.innerHTML = `<div class="tile"><span class="sym">${p.sym}</span><span class="nm">${p.el}</span></div>
      <div class="info"><div class="cat">${matched ? 'Latin name' : 'Element'}</div><div class="shells">${matched ? `<b>${p.latin}</b> → symbol <b>${p.sym}</b>` : `${p.icon} ${p.el}`}</div>
      <div class="fact">${matched ? `The symbol ${p.sym} comes from the Latin word <b>${p.latin}</b>.` : 'Which Latin name belongs to it?'}</div></div>`;
    c.style.setProperty('--c', lookFor(p.sym).color);
  }

  function load() {
    nextCtl?.cancel();
    bi++;
    if (bi >= boards.length) { onDone(); return; }
    B = boards[bi]; placed = 0; sel = null; missed = new Set();
    audio.whoosh();
    $('.kind-chip').textContent = B.name;
    $('.qnum').textContent = `Board ${bi + 1} of ${boards.length}`;
    $('.feedback').hidden = true;
    $('.lrows').innerHTML = B.pairs.map((p, i) => `<div class="lrow tilt" data-tilt-max="6" data-i="${i}">
        <span class="licon">${p.icon}</span><span class="lname">${p.el}</span>
        <button class="drop" data-i="${i}" aria-label="Box for ${p.el}"><span>Drop here</span></button></div>`).join('');
    $('.ltray').innerHTML = shuffle(B.pairs.map((_, i) => i)).map(i => `<button class="chip" data-i="${i}"><b>${B.pairs[i].latin}</b> <small>(${B.pairs[i].sym})</small></button>`).join('');
    show(B.pairs[0], false);
    wire();
  }

  const drops = () => [...root.querySelectorAll('.drop:not(.ok)')];
  function dropAt(x, y) { return drops().find(d => { const r = d.getBoundingClientRect(); return x >= r.left - 12 && x <= r.right + 12 && y >= r.top - 12 && y <= r.bottom + 12; }); }
  function hot(d) { root.querySelectorAll('.drop.hot').forEach(x => x !== d && x.classList.remove('hot')); d?.classList.add('hot'); }
  function back(chip) { chip.classList.add('back'); chip.style.transform = ''; setTimeout(() => chip.classList.remove('back', 'drag'), 340); }
  function choose(chip) {
    audio.tap();
    if (sel === chip) { chip.classList.remove('sel'); sel = null; return; }
    sel?.classList.remove('sel'); sel = chip; chip.classList.add('sel');
    const p = B.pairs[+chip.dataset.i];
    say('', `Now tap the element box for <b>${p.latin}</b>.`);
  }

  function place(chip, box) {
    hot(null);
    const i = +chip.dataset.i, p = B.pairs[i];
    root.querySelectorAll('.drop.reveal').forEach(d => d.classList.remove('reveal'));
    if (chip.dataset.i === box.dataset.i) {
      chip.classList.remove('sel', 'drag', 'back'); chip.style.transform = ''; chip.disabled = true;
      box.innerHTML = ''; box.appendChild(chip); box.classList.add('ok'); box.disabled = true;
      box.closest('.lrow').classList.add('done');
      if (sel === chip) sel = null;
      placed++;
      audio.pop();
      if (missed.has(i)) { session.learned(box); say('learn', `${icon('sparkles')} Yes. <b>${p.el}</b> → <b>${p.latin} (${p.sym})</b>. No points for this one, but now you know it.`); }
      else { const pts = session.correct(box, { small: true }); say('good', `${icon('check')} <b>${p.el}</b> → <b>${p.latin} (${p.sym})</b> <span class="pts">+${pts}</span>`); }
      session.step();
      holdUntil = performance.now() + 2500;
      show(p, true);
      if (placed === B.pairs.length) finishBoard();
    } else {
      back(chip); chip.classList.remove('sel'); if (sel === chip) sel = null;
      box.classList.add('bad'); setTimeout(() => box.classList.remove('bad'), 450);
      const right = root.querySelector(`.drop[data-i="${i}"]`);
      right.classList.add('reveal');
      if (!missed.has(i)) { missed.add(i); session.wrong(box, { line: `Oops! ${p.latin} belongs to ${p.el}. Look at the glowing box!` }); }
      else audio.wrong();
      holdUntil = performance.now() + 2500;
      say('bad', `${icon('x')} Not that one. <b>${p.latin} (${p.sym})</b> belongs to <b>${p.el}</b>. See the glowing box? Drag it there.`);
      show(p, false);
    }
  }

  function say(kind, html) {
    const fb = $('.feedback'); fb.hidden = false; fb.className = 'feedback ' + kind;
    fb.innerHTML = `<div class="fb-text"><div class="fb-head">${html}</div></div>`;
  }

  function finishBoard() {
    banner('Board complete', `${B.pairs.length - missed.size} of ${B.pairs.length} first time`);
    rain(160);
    audio.streak();
    const fb = $('.feedback'); fb.hidden = false; fb.className = 'feedback good';
    fb.innerHTML = `<div class="fb-text"><div class="fb-head">${icon('sparkles')} All ${B.pairs.length} matched. Glitter stars for you!</div></div><button class="next-btn">${bi + 1 >= boards.length ? 'Finish' : 'Next board'} ${icon('next')}</button>`;
    nextCtl = autoNext(fb.querySelector('.next-btn'), 4200, load);
  }

  function wire() {
    root.querySelectorAll('.ltray .chip').forEach(chip => {
      let st = null, moved = false;
      chip.addEventListener('pointerdown', e => {
        if (chip.disabled) return;
        st = { x: e.clientX, y: e.clientY }; moved = false;
        try { chip.setPointerCapture(e.pointerId); } catch { /* ok */ }
        const p = B.pairs[+chip.dataset.i];
        void p;
      });
      chip.addEventListener('pointermove', e => {
        if (!st) return;
        const dx = e.clientX - st.x, dy = e.clientY - st.y;
        if (!moved && Math.hypot(dx, dy) > 6) { moved = true; dragging = true; chip.classList.add('drag'); if (sel && sel !== chip) { sel.classList.remove('sel'); sel = null; } }
        if (moved) { chip.style.transform = `translate(${dx}px,${dy}px) scale(1.08) rotate(${dx * 0.02}deg)`; hot(dropAt(e.clientX, e.clientY)); }
      });
      chip.addEventListener('pointerup', e => {
        if (!st) return;
        const was = moved; st = null; moved = false; dragging = false;
        if (was) { const d = dropAt(e.clientX, e.clientY); if (d) place(chip, d); else { hot(null); back(chip); } }
        else choose(chip);
      });
      chip.addEventListener('pointercancel', () => { st = null; moved = false; dragging = false; hot(null); back(chip); });
    });
    root.querySelectorAll('.drop').forEach(d => d.addEventListener('click', () => {
      if (d.disabled) return;
      if (sel) place(sel, d);
      else { say('', 'Pick a Latin name chip first (drag it, or tap it and then tap a box).'); }
    }));
    root.querySelectorAll('.lrow').forEach(r => r.addEventListener('pointerenter', () => {
      if (r.classList.contains('done') || dragging || performance.now() < holdUntil) return;
      show(B.pairs[+r.dataset.i], false);
    }));
  }

  load();
  return { destroy() { nextCtl?.cancel(); stage.dispose(); } };
}
