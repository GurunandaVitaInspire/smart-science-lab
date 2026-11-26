// Game 4: Criss-Cross. Drag each valency across to the other ion, add brackets,
// cut down, then build the formula. The 3D stage shows the ions joining.
import { icon } from '../icons.js';
import { audio } from '../audio.js';
import { F, h, autoNext } from '../ui.js';
import { banner } from '../fx.js';
import { Stage } from '../three/engine.js';
import { compoundModel } from '../three/models.js';
import { IONS } from '../data/questions.js';
import { t } from '../i18n.js';
import { narrate, hush, sayFormula } from '../narrate.js';

const plain = html => String(html).replace(/<[^>]+>/g, '');
const compound = (c, a) => `${t(c.n)} ${t(a.n.toLowerCase())}`;

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const other = k => (k === 'cat' ? 'an' : 'cat');
const COL = { cat: '#fb7185', an: '#60a5fa' };

export function formulaOf(cat, an) {
  const g = gcd(cat.v, an.v), nc = an.v / g, na = cat.v / g;
  const part = (ion, n) => (ion.p && n > 1 ? `(${ion.s})` : ion.s) + (n > 1 ? n : '');
  return { text: part(cat, nc) + part(an, na), nc, na };
}

export function mountCross(body, { items, session, onDone }) {
  const root = h(`<div class="cross">
    <div class="stage-wrap">
      <div class="stage"></div>
      <div class="stage-hint">${t('Drag to spin · tap to poke')}</div>
    </div>
    <div class="xpanel glass">
      <div class="qmeta"><span class="kind-chip">${t('Criss-Cross')}</span><span class="qnum"></span></div>
      <h2 class="qtext"></h2>
      <div class="xboard">
        <svg class="xar" aria-hidden="true"></svg>
        <div class="xrow">
          <div class="xion cat tilt" data-tilt-max="8"><div class="xsym"></div><div class="xnm"></div><div class="xvh"><span class="xvl">${t('Valency')}</span><span class="xhold"></span></div></div>
          <div class="xion an tilt" data-tilt-max="8"><div class="xsym"></div><div class="xnm"></div><div class="xvh"><span class="xvl">${t('Valency')}</span><span class="xhold"></span></div></div>
        </div>
        <div class="xform">
          <div class="xf cat"><span class="xp"></span><button class="xslot" data-s="cat" aria-label="Number after the cation">?</button></div>
          <div class="xf an"><span class="xp"></span><button class="xslot" data-s="an" aria-label="Number after the anion">?</button></div>
        </div>
      </div>
      <div class="xacts" hidden>
        <button class="xa tilt" data-a="br"><b>( )</b> ${t('Add brackets')}</button>
        <button class="xa tilt" data-a="cut"><b>÷</b> ${t('Cut down')}</button>
        <button class="xa tilt" data-a="ok"><b>✓</b> ${t('Formula ready')}</button>
      </div>
      <div class="feedback" hidden></div>
    </div>
  </div>`);
  body.appendChild(root);
  const qs = s => root.querySelector(s), qa = s => [...root.querySelectorAll(s)];
  const UI = { board: qs('.xboard'), svg: qs('.xar'), acts: qs('.xacts'), fb: qs('.feedback') };
  const side = k => ({ sym: qs(`.xion.${k} .xsym`), nm: qs(`.xion.${k} .xnm`), hold: qs(`.xion.${k} .xhold`), p: qs(`.xf.${k} .xp`), slot: qs(`.xf.${k} .xslot`) });
  const SD = { cat: side('cat'), an: side('an') };
  const stage = new Stage(qs('.stage'), { autoRotate: 0.15 });
  let idx = -1, cur = null, S = null, sel = null, live = null, nextCtl = null;

  // every message is shown and read aloud (formulas are spelt out)
  const say = (kind, html, spoken) => { UI.fb.hidden = false; UI.fb.className = 'feedback ' + kind; UI.fb.innerHTML = `<div class="fb-text"><div class="fb-head">${html}</div></div>`; narrate(spoken ?? plain(html)); };
  function wrong(html, hintEl, spoken) {
    if (!S.wrong) session.wrong(null, { quiet: true });
    else audio.wrong();
    S.wrong = true;
    say('bad', icon('x') + ' ' + html, spoken);
    qa('.reveal').forEach(x => x.classList.remove('reveal'));
    hintEl?.classList.add('reveal');
  }

  function showStage(nc, na, join) {
    const m = compoundModel(cur.cat.s === 'NH4' ? 'NH4' : cur.catKey, cur.anKey, nc, na, cur.cat.c, cur.an.c);
    stage.set(m);
    if (join) setTimeout(() => m.userData.join(), 350);
  }

  function next() {
    nextCtl?.cancel();
    idx++;
    if (idx >= items.length) { onDone(); return; }
    const it = items[idx];
    cur = { cat: IONS[it.cat], an: IONS[it.an], catKey: it.cat, anKey: it.an, rule: it.rule, guide: idx < 2 };
    S = { placed: { cat: false, an: false }, n: { cat: 0, an: 0 }, br: false, cut: false, done: false, wrong: false };
    sel = null; live = null;
    audio.whoosh();
    qs('.qnum').textContent = t('Formula {n} of {total}', { n: idx + 1, total: items.length });
    qs('.qtext').innerHTML = t('Make the formula of {name}', { name: `<b>${compound(cur.cat, cur.an)}</b>` });
    for (const k of ['cat', 'an']) {
      const ion = cur[k];
      SD[k].sym.innerHTML = F(ion.s + '^' + ion.c);
      SD[k].nm.textContent = t(ion.n + ' ion');
      SD[k].hold.innerHTML = `<button class="vchip" data-k="${k}">${ion.v}</button>`;
      SD[k].slot.disabled = false;
    }
    UI.acts.hidden = true;
    qa('.xa').forEach(b => { b.disabled = false; b.classList.remove('ok', 'reveal'); });
    render(); wire();
    const intro = t('Make the formula of {name}', { name: compound(cur.cat, cur.an) }) + '. ' +
      t('{ion} has valency {v}.', { ion: sayFormula(cur.cat.s + '^' + cur.cat.c), v: cur.cat.v }) + ' ' + t('{ion} has valency {v}.', { ion: sayFormula(cur.an.s + '^' + cur.an.c), v: cur.an.v }) + ' ';
    const tip = cur.guide ? t('Drag each valency number along its glowing arrow to the other ion. (Or tap a number, then tap a box.)') : t('Drag each valency across to the other ion (criss-cross).');
    say('', tip, intro + tip);
    showStage(1, 1, false);
    requestAnimationFrame(arrows); setTimeout(arrows, 150);
  }

  function render() {
    const c = cur.cat, a = cur.an;
    const pc = S.br && c.p && S.n.cat > 1, pa = S.br && a.p && S.n.an > 1;
    SD.cat.p.innerHTML = F(pc ? `(${c.s})` : c.s);
    SD.an.p.innerHTML = F(pa ? `(${a.s})` : a.s);
    for (const k of ['cat', 'an']) {
      const sl = SD[k].slot;
      if (S.placed[other(k)]) {
        sl.textContent = S.n[k];
        sl.className = 'xslot ok' + (S.n[k] === 1 ? ' one' : '') + (S.done && S.n[k] === 1 ? ' gone' : '');
      } else { sl.textContent = '?'; sl.className = 'xslot'; }
    }
  }

  function center(e, where) {
    const b = UI.board.getBoundingClientRect(), r = e.getBoundingClientRect();
    return [r.left - b.left + r.width / 2, where === 'top' ? r.top - b.top : where === 'bot' ? r.bottom - b.top : r.top - b.top + r.height / 2];
  }
  function arrows() {
    if (!root.isConnected || !S) return;
    const svg = UI.svg, b = UI.board.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${b.width} ${b.height}`);
    svg.innerHTML = '';
    const draw = (x1, y1, x2, y2, col, cls) => {
      const ns = 'http://www.w3.org/2000/svg';
      const g = document.createElementNS(ns, 'g'); g.setAttribute('class', 'xa1 ' + cls);
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', `M${x1} ${y1} L${x2} ${y2}`); p.setAttribute('stroke', col); p.setAttribute('stroke-width', 6); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('fill', 'none');
      const a = Math.atan2(y2 - y1, x2 - x1), hh = 16;
      const head = document.createElementNS(ns, 'path');
      head.setAttribute('d', `M${x2} ${y2} L${x2 - hh * Math.cos(a - 0.45)} ${y2 - hh * Math.sin(a - 0.45)} L${x2 - hh * Math.cos(a + 0.45)} ${y2 - hh * Math.sin(a + 0.45)} Z`);
      head.setAttribute('fill', col);
      g.append(p, head); svg.appendChild(g);
    };
    for (const k of ['cat', 'an']) {
      const from = center(SD[k].hold, 'bot');
      if (S.placed[k]) { const sl = SD[other(k)].slot; const to = center(sl.offsetParent ? sl : SD[other(k)].p, 'top'); draw(from[0], from[1], to[0], to[1], COL[k], 'done'); }
      else if (live && live.k === k) draw(from[0], from[1], live.x - b.left, live.y - b.top, COL[k], 'live');
      else if (cur.guide) { const to = center(SD[other(k)].slot, 'top'); draw(from[0], from[1], to[0], to[1], COL[k], 'guide'); }
    }
  }

  const slotAt = (x, y) => qa('.xslot').find(d => { if (d.disabled) return false; const r = d.getBoundingClientRect(); return x >= r.left - 14 && x <= r.right + 14 && y >= r.top - 14 && y <= r.bottom + 14; });
  const hot = s => { qa('.xslot.hot').forEach(d => d !== s && d.classList.remove('hot')); s?.classList.add('hot'); };
  const back = chip => { chip.classList.add('back'); chip.style.transform = ''; setTimeout(() => chip.classList.remove('back', 'drag'), 340); };

  function place(chip, slot) {
    hot(null);
    const k = chip.dataset.k;
    if (slot.dataset.s === other(k)) {
      qa('.xslot.reveal').forEach(x => x.classList.remove('reveal'));
      S.placed[k] = true; S.n[other(k)] = cur[k].v;
      chip.remove(); slot.disabled = true; if (sel === chip) sel = null;
      audio.pop(); render(); arrows();
      if (S.placed.cat && S.placed.an) {
        UI.acts.hidden = false;
        showStage(S.n.cat, S.n.an, false);
        say('', t('Good crossing. Now: add brackets, cut down, or is the formula ready?'));
        requestAnimationFrame(arrows);
      } else say('good', `${icon('check')} ${t('{v} goes under {ion}. Now the other one!', { v: cur[k].v, ion: F(cur[other(k)].s) })}`, t('{v} goes under {ion}. Now the other one!', { v: cur[k].v, ion: sayFormula(cur[other(k)].s) }));
    } else {
      back(chip); chip.classList.remove('sel'); if (sel === chip) sel = null;
      slot.classList.add('bad'); setTimeout(() => slot.classList.remove('bad'), 450);
      wrong(t('Cross over! The valency of {a} goes under {b} (the glowing box).', { a: F(cur[k].s), b: `<b>${F(cur[other(k)].s)}</b>` }), SD[other(k)].slot, t('Cross over! The valency of {a} goes under {b} (the glowing box).', { a: sayFormula(cur[k].s), b: sayFormula(cur[other(k)].s) }));
    }
    live = null; arrows();
  }
  function choose(chip) {
    audio.tap();
    if (sel === chip) { chip.classList.remove('sel'); sel = null; return; }
    sel?.classList.remove('sel'); sel = chip; chip.classList.add('sel');
    say('', t('Now tap the box where this number goes.'));
  }
  function wire() {
    qa('.xhold .vchip').forEach(chip => {
      let st = null, moved = false;
      chip.addEventListener('pointerdown', e => { st = { x: e.clientX, y: e.clientY }; moved = false; try { chip.setPointerCapture(e.pointerId); } catch { /* ok */ } });
      chip.addEventListener('pointermove', e => {
        if (!st) return;
        const dx = e.clientX - st.x, dy = e.clientY - st.y;
        if (!moved && Math.hypot(dx, dy) > 6) { moved = true; chip.classList.add('drag'); if (sel && sel !== chip) { sel.classList.remove('sel'); sel = null; } }
        if (moved) { chip.style.transform = `translate(${dx}px,${dy}px) scale(1.15)`; hot(slotAt(e.clientX, e.clientY)); live = { k: chip.dataset.k, x: e.clientX, y: e.clientY }; arrows(); }
      });
      chip.addEventListener('pointerup', e => {
        if (!st) return;
        const was = moved; st = null; moved = false;
        if (was) { const s = slotAt(e.clientX, e.clientY); if (s) place(chip, s); else { hot(null); back(chip); live = null; arrows(); } }
        else choose(chip);
      });
      chip.addEventListener('pointercancel', () => { st = null; moved = false; hot(null); back(chip); live = null; arrows(); });
    });
  }
  qa('.xslot').forEach(s => s.addEventListener('click', () => {
    if (s.disabled) return;
    if (sel) place(sel, s); else say('', t('Pick a valency number first, then tap this box.'));
  }));

  const needCut = () => !S.cut && S.n.cat === S.n.an && S.n.cat > 1;
  const needBr = () => !S.br && !needCut() && ((cur.cat.p && S.n.cat > 1) || (cur.an.p && S.n.an > 1));
  const actBtn = a => qs(`.xa[data-a="${a}"]`);
  const rightAct = () => (needCut() ? 'cut' : needBr() ? 'br' : 'ok');

  qa('.xa').forEach(b => b.addEventListener('click', () => {
    if (S.done || !(S.placed.cat && S.placed.an)) return;
    const act = b.dataset.a;
    audio.tap();
    if (act === 'br') {
      if (needCut()) return wrong(t('First cut down: both numbers are the same.'), actBtn('cut'));
      if (!needBr()) return wrong(S.br ? t('Brackets are already added.') : t('No brackets needed. Brackets are only for a group of atoms taken 2 or 3 times.'), actBtn(rightAct()));
      S.br = true; b.disabled = true; b.classList.add('ok'); b.classList.remove('reveal'); audio.pop(); render();
      say('good', `${icon('check')} ${t('Brackets added around the group. Anything more?')}`);
    } else if (act === 'cut') {
      if (!needCut()) return wrong(S.cut ? t('Already cut down.') : t('Cannot cut down. Cut down only when both numbers are the same, like 2 and 2.'), actBtn(rightAct()));
      const g = gcd(S.n.cat, S.n.an); S.n.cat /= g; S.n.an /= g; S.cut = true;
      b.disabled = true; b.classList.add('ok'); b.classList.remove('reveal'); audio.pop(); render();
      showStage(S.n.cat, S.n.an, false);
      say('good', `${icon('check')} ${t('{g} : {g} becomes 1 : 1. Anything more?', { g })}`);
    } else {
      if (needCut()) return wrong(t('Not ready. Both numbers are the same, so cut down first.'), actBtn('cut'));
      if (needBr()) return wrong(t('Not ready. A group of atoms is taken more than once, so it needs brackets.'), actBtn('br'));
      S.done = true; render(); qa('.xa').forEach(x => { x.disabled = true; x.classList.remove('reveal'); }); b.classList.add('ok'); arrows();
      const fm = formulaOf(cur.cat, cur.an);
      showStage(fm.nc, fm.na, true);
      const name = compound(cur.cat, cur.an);
      let head;
      if (!S.wrong) { const pts = session.correct(qs('.xform'), { quiet: true }); head = `${icon('check')} ${t('Correct.')} ${t('{f} is {name}.', { f: `<b class="big-f">${F(fm.text)}</b>`, name })} <span class="pts">+${pts}</span>`; banner(F(fm.text), name, 'formula'); }
      else { session.learned(qs('.xform'), { quiet: true }); head = `${icon('sparkles')} ${t('You fixed it.')} ${t('{f} is {name}.', { f: `<b class="big-f">${F(fm.text)}</b>`, name })} ${t('No points this time.')}`; }
      narrate(`${S.wrong ? t('You fixed it.') : t('Correct.')} ${t('{f} is {name}.', { f: sayFormula(fm.text), name })} ${t('Rule')}: ${t(cur.rule)}. ${t('The number 1 is not written.')}`);
      UI.fb.hidden = false; UI.fb.className = 'feedback ' + (S.wrong ? 'learn' : 'good');
      UI.fb.innerHTML = `<div class="fb-text"><div class="fb-head">${head}</div><div class="fb-why">${t('Rule')}: ${t(cur.rule)}. ${t('The number 1 is not written.')}</div></div><button class="next-btn">${idx + 1 >= items.length ? t('Finish') : t('Next')} ${icon('next')}</button>`;
      nextCtl = autoNext(UI.fb.querySelector('.next-btn'), S.wrong ? 9000 : 8000, () => { hush(); session.step(); next(); });
    }
  }));

  const ro = window.ResizeObserver ? new ResizeObserver(() => arrows()) : null;
  ro?.observe(UI.board);
  const onResize = () => requestAnimationFrame(arrows);
  addEventListener('resize', onResize);
  next();
  return { destroy() { nextCtl?.cancel(); hush(); stage.dispose(); ro?.disconnect(); removeEventListener('resize', onResize); } };
}
