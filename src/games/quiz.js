// Multiple-choice and number-keypad quiz with a 3D stage (Games 1, 3 and 5).
// Wrong answer -> the right one glows, the child taps it to learn it (no points).
import { icon } from '../icons.js';
import { audio } from '../audio.js';
import { F, h, shuffle, autoNext } from '../ui.js';
import { Stage } from '../three/engine.js';
import { modelFor } from '../three/models.js';
import { BY_Z, CATS } from '../data/elements.js';
import { IONS } from '../data/questions.js';

const KEYS = ['A', 'B', 'C', 'D'];

export function mountQuiz(body, { items, session, onDone, game }) {
  const root = h(`<div class="quiz">
    <div class="stage-wrap">
      <div class="stage"></div>
      <div class="holo-card" hidden></div>
      <div class="stage-hint">Drag to spin · tap to poke</div>
    </div>
    <div class="qpanel glass">
      <div class="qmeta"><span class="kind-chip"></span><span class="qnum"></span></div>
      <h2 class="qtext"></h2>
      <div class="options"></div>
      <div class="feedback" hidden></div>
    </div>
  </div>`);
  body.appendChild(root);
  const $ = s => root.querySelector(s);
  const stage = new Stage($('.stage'), { autoRotate: 0.4 });
  let i = -1, cur = null, state = 'answer', nextCtl = null, keypad = null;

  function next() {
    nextCtl?.cancel(); nextCtl = null;
    i++;
    if (i >= items.length) { onDone(); return; }
    cur = items[i];
    state = 'answer';
    audio.whoosh();
    $('.kind-chip').textContent = cur.kind;
    $('.qnum').textContent = `Question ${i + 1} of ${items.length}`;
    $('.qtext').innerHTML = F(cur.q);
    $('.qtext').classList.toggle('long', cur.q.length > 55);
    $('.qtext').classList.remove('in'); void $('.qtext').offsetWidth; $('.qtext').classList.add('in');
    const fb = $('.feedback'); fb.hidden = true; fb.className = 'feedback';
    stage.set(modelFor(cur.stage, false, BY_Z, IONS));
    holo(false);
    const opts = $('.options');
    opts.innerHTML = '';
    keypad = null;
    if (cur.key != null) { buildKeypad(opts); return; }
    const list = cur.keep ? (cur.order || [cur.a, ...cur.t]) : cur.order ? cur.order : shuffle([cur.a, ...cur.t]);
    opts.className = 'options n' + list.length + (list.some(x => x.length > 16) ? ' long' : '');
    list.forEach((txt, k) => {
      const b = h(`<button class="opt tilt" data-tilt-max="10" style="--d:${k * 70}ms"><span class="opt-key">${KEYS[k]}</span><span class="opt-label">${F(txt)}</span><span class="opt-shine"></span></button>`);
      b.dataset.v = txt;
      b.onclick = () => pick(b);
      opts.appendChild(b);
    });
  }

  function correctBtn() { return [...root.querySelectorAll('.opt')].find(b => b.dataset.v === cur.a); }

  function pick(b) {
    if (state === 'answer') {
      audio.tap();
      if (b.dataset.v === cur.a) {
        state = 'done';
        b.classList.add('right');
        lockAll();
        const pts = session.correct(b);
        reveal();
        feedback('good', `${icon('check')} Correct <span class="pts">+${pts}</span>`, cur.w, 3800);
      } else {
        state = 'retry';
        b.classList.add('wrong');
        session.wrong(b);
        const c = correctBtn();
        root.querySelectorAll('.opt').forEach(x => { if (x !== c) { x.disabled = true; if (x !== b) x.classList.add('dim'); } });
        c.classList.add('reveal');
        c.insertAdjacentHTML('beforeend', `<span class="tap-hand">${icon('pointer')}</span>`);
        reveal();
        feedback('bad', `${icon('x')} Not quite. The answer is <b class="ans">${F(cur.a)}</b>. Tap it to learn it.`, cur.w, 0);
      }
    } else if (state === 'retry' && b.dataset.v === cur.a) {
      state = 'done';
      b.classList.remove('reveal'); b.classList.add('learned');
      b.querySelector('.tap-hand')?.remove();
      lockAll();
      session.learned(b);
      feedback('learn', `${icon('sparkles')} Now you know it. No points this time, but you learnt it.`, cur.w, 5200);
    }
  }

  function lockAll() { root.querySelectorAll('.opt').forEach(x => (x.disabled = true)); }

  function reveal() {
    const t = cur.stage?.type;
    if ((t === 'element') || (t === 'ion' && (cur.stage.hide || cur.stage.mystery))) stage.set(modelFor(cur.stage, true, BY_Z, IONS));
    holo(true);
  }

  function holo(show) {
    const card = $('.holo-card');
    const st = cur.stage;
    if (st?.type === 'element') {
      const e = BY_Z[st.z];
      const cat = CATS[e.cat];
      card.hidden = false;
      card.style.setProperty('--c', cat.color);
      card.innerHTML = show
        ? `<div class="tile"><span class="z">${e.z}</span><span class="sym">${e.sym}</span><span class="nm">${e.name}</span><span class="ms">${e.mass} u</span></div>
           <div class="info"><div class="cat">${cat.label} · ${e.state}</div><div class="shells">Electrons: <b>${e.shells.join(', ')}</b></div><div class="fact">${e.fact}</div></div>`
        : `<div class="tile mystery"><span class="z">?</span><span class="sym">?</span><span class="nm">Mystery element</span></div><div class="info"><div class="cat">What does it look like?</div><div class="fact">This is how the real element looks. Answer to see its atom!</div></div>`;
      card.classList.toggle('revealed', show);
    } else if (st?.type === 'ion' && show) {
      const ion = IONS[st.ion];
      const pos = ion.c.includes('+');
      card.hidden = false;
      card.style.setProperty('--c', pos ? '#fb7185' : '#60a5fa');
      card.innerHTML = `<div class="tile ion"><span class="sym">${F(ion.s + '^' + ion.c)}</span><span class="nm">${ion.n} ion</span></div>
        <div class="info"><div class="cat">${pos ? 'Cation (+)' : 'Anion (−)'} · ${ion.p ? 'Polyatomic' : 'Simple'}</div><div class="shells">Valency: <b>${ion.v}</b></div></div>`;
      card.classList.add('revealed');
    } else {
      card.hidden = true;
    }
  }

  function feedback(kind, head, why, ms) {
    const fb = $('.feedback');
    fb.hidden = false;
    fb.className = 'feedback ' + kind;
    fb.innerHTML = `<div class="fb-text"><div class="fb-head">${head}</div>${why ? `<div class="fb-why">${F(why)}</div>` : ''}</div>${ms ? `<button class="next-btn">${i + 1 >= items.length ? 'Finish' : 'Next'} ${icon('next')}</button>` : ''}`;
    if (ms) {
      const btn = fb.querySelector('.next-btn');
      nextCtl = autoNext(btn, ms, () => { session.step(); next(); });
    }
  }

  /* ---------- number keypad ---------- */
  function buildKeypad(opts) {
    opts.className = 'options keypad';
    opts.innerHTML = `<div class="kp-display"><span class="kv">?</span><span class="ku">${cur.unit}</span></div>
      ${[7, 8, 9, 4, 5, 6, 1, 2, 3, '.', 0, '⌫'].map(k => `<button class="kp-key tilt" data-k="${k}">${k}</button>`).join('')}
      <button class="kp-check tilt">Check</button>`;
    let v = '';
    const disp = opts.querySelector('.kp-display'), kv = opts.querySelector('.kv');
    const upd = () => { kv.textContent = v || '?'; kv.classList.toggle('empty', !v); };
    const press = k => {
      if (state === 'done') return;
      audio.key();
      if (k === '⌫') v = v.slice(0, -1);
      else if (k === '.') { if (!v.includes('.') && v.length < 6) v = (v || '0') + '.'; }
      else if (v.length < 6) v = (v === '0' ? '' : v) + k;
      disp.classList.remove('bad');
      upd();
    };
    const check = () => {
      if (state === 'done') return;
      if (!v || isNaN(parseFloat(v))) { disp.classList.add('bad'); return; }
      const ok = Math.abs(parseFloat(v) - cur.key) < 1e-6;
      const chk = opts.querySelector('.kp-check');
      if (state === 'answer') {
        if (ok) {
          state = 'done'; disp.classList.add('right'); lockKeys();
          const pts = session.correct(disp);
          reveal();
          feedback('good', `${icon('check')} Correct · <b>${cur.key} ${cur.unit}</b> <span class="pts">+${pts}</span>`, cur.w, 3800);
        } else {
          state = 'retry';
          session.wrong(disp, { line: 'Oops! Look at the answer, then type it in.' });
          disp.classList.add('bad');
          setTimeout(() => { v = ''; upd(); disp.classList.remove('bad'); disp.classList.add('reveal'); }, 700);
          reveal();
          feedback('bad', `${icon('x')} Not quite. The answer is <b class="ans">${cur.key} ${cur.unit}</b>. Type it on the keypad and press Check.`, cur.w, 0);
        }
      } else if (state === 'retry') {
        if (ok) {
          state = 'done'; disp.classList.remove('reveal'); disp.classList.add('learned'); lockKeys();
          session.learned(chk);
          feedback('learn', `${icon('sparkles')} Now you know it. No points this time, but you learnt it.`, cur.w, 5200);
        } else { disp.classList.add('bad'); audio.wrong(); }
      }
    };
    const lockKeys = () => opts.querySelectorAll('button').forEach(b => (b.disabled = true));
    opts.querySelectorAll('.kp-key').forEach(b => (b.onclick = () => press(b.dataset.k)));
    opts.querySelector('.kp-check').onclick = check;
    keypad = { press, check };
    upd();
  }

  const onKey = e => {
    if (!root.isConnected) return;
    if (keypad) {
      if (/^[0-9.]$/.test(e.key)) keypad.press(e.key);
      else if (e.key === 'Backspace') { e.preventDefault(); keypad.press('⌫'); }
      else if (e.key === 'Enter') { e.preventDefault(); if (state === 'done') nextCtl?.go(); else keypad.check(); }
      return;
    }
    const k = '1234'.indexOf(e.key) >= 0 ? +e.key - 1 : KEYS.indexOf(e.key.toUpperCase());
    const btns = root.querySelectorAll('.opt');
    if (k >= 0 && btns[k] && !btns[k].disabled) btns[k].click();
    else if (e.key === 'Enter' && state === 'done') nextCtl?.go();
  };
  addEventListener('keydown', onKey);

  next();
  return {
    destroy() { nextCtl?.cancel(); stage.dispose(); removeEventListener('keydown', onKey); },
  };
}
