// Multiple-choice and number-keypad quiz with a 3D stage (Games 1, 3 and 5).
// Two modes:
//  learn – instant feedback; a wrong answer makes the right one glow (tap it, no points);
//          then every answer choice is explained, aloud and in writing.
//  test  – one answer per question, no feedback; everything is explained at the end.
import { icon } from '../icons.js';
import { audio } from '../audio.js';
import { F, h, shuffle, autoNext } from '../ui.js';
import { Stage } from '../three/engine.js';
import { modelFor } from '../three/models.js';
import { BY_Z, CATS } from '../data/elements.js';
import { IONS } from '../data/questions.js';
import { explainAll, questionText } from '../data/notes.js';
import { t } from '../i18n.js';
import { narrate, narrateAll, hush, sayOption, readAloud } from '../narrate.js';
import { cheer } from '../audio.js';

const KEYS = ['A', 'B', 'C', 'D'];

export function mountQuiz(body, { items, session, onDone, mode = 'learn' }) {
  const test = mode === 'test';
  const root = h(`<div class="quiz ${test ? 'is-test' : 'is-learn'}">
    <div class="stage-wrap">
      <div class="stage"></div>
      <div class="holo-card" hidden></div>
      <div class="stage-hint">${t('Drag to spin · tap to poke')}</div>
    </div>
    <div class="qpanel glass">
      <div class="qmeta"><span class="kind-chip"></span><span class="qnum"></span>
        <button class="say-btn" type="button" title="${t('Read aloud again')}" aria-label="${t('Read aloud again')}">${icon('volume')}</button></div>
      <h2 class="qtext"></h2>
      <div class="options"></div>
      <div class="feedback" hidden></div>
    </div>
  </div>`);
  body.appendChild(root);
  const $ = s => root.querySelector(s);
  const stage = new Stage($('.stage'), { autoRotate: 0.4 });
  let i = -1, cur = null, order = [], state = 'answer', nextCtl = null, keypad = null;
  const answers = []; // test mode: { item, choice, correct, order }

  const optText = o => F(t(o));
  const questionLine = () => {
    const q = questionText(cur);
    if (cur.key != null) return `${q}. ${t('Type the answer on the keypad and press Check.')}`;
    return `${q}. ${order.map((o, k) => `${KEYS[k]}: ${sayOption(t(o))}`).join('. ')}.`;
  };
  const readQuestion = () => narrate(`${t('Question {n}', { n: i + 1 })}. ${questionLine()}`);

  function next() {
    nextCtl?.cancel(); nextCtl = null;
    hush();
    i++;
    if (i >= items.length) { onDone(answers); return; }
    cur = items[i];
    state = 'answer';
    audio.whoosh();
    $('.kind-chip').textContent = t(cur.kind);
    $('.qnum').textContent = t('Question {n} of {total}', { n: i + 1, total: items.length });
    const q = questionText(cur);
    $('.qtext').innerHTML = F(q);
    $('.qtext').classList.toggle('long', q.length > 55);
    $('.qtext').classList.remove('in'); void $('.qtext').offsetWidth; $('.qtext').classList.add('in');
    const fb = $('.feedback'); fb.hidden = true; fb.className = 'feedback';
    stage.set(modelFor(cur.stage, false, BY_Z, IONS));
    holo(false);
    const opts = $('.options');
    opts.innerHTML = '';
    keypad = null;
    if (cur.key != null) { order = []; buildKeypad(opts); readQuestion(); return; }
    order = cur.keep ? (cur.order || [cur.a, ...cur.t]) : cur.order ? cur.order : shuffle([cur.a, ...cur.t]);
    opts.className = 'options n' + order.length + (order.some(x => t(x).length > 16) ? ' long' : '');
    order.forEach((txt, k) => {
      const b = h(`<button class="opt tilt" data-tilt-max="10" style="--d:${k * 70}ms"><span class="opt-key">${KEYS[k]}</span><span class="opt-label">${optText(txt)}</span><span class="opt-shine"></span></button>`);
      b.dataset.v = txt;
      b.onclick = () => pick(b);
      opts.appendChild(b);
    });
    readQuestion();
  }

  const correctBtn = () => [...root.querySelectorAll('.opt')].find(b => b.dataset.v === cur.a);
  const lockAll = () => root.querySelectorAll('.opt').forEach(x => (x.disabled = true));

  function pick(b) {
    if (test) return testPick(b);
    if (state === 'answer') {
      audio.tap();
      if (b.dataset.v === cur.a) {
        state = 'done';
        b.classList.add('right');
        lockAll();
        const pts = session.correct(b, { quiet: true });
        reveal();
        explain('good', `${icon('check')} ${t('Correct')} <span class="pts">+${pts}</span>`, t(cheer()));
      } else {
        state = 'retry';
        b.classList.add('wrong');
        session.wrong(b, { quiet: true });
        const c = correctBtn();
        root.querySelectorAll('.opt').forEach(x => { if (x !== c) { x.disabled = true; if (x !== b) x.classList.add('dim'); } });
        c.classList.add('reveal');
        c.insertAdjacentHTML('beforeend', `<span class="tap-hand">${icon('pointer')}</span>`);
        reveal();
        const ans = t(cur.a);
        feedback('bad', `${icon('x')} ${t('Not quite. The answer is {a}. Tap it to learn it.', { a: `<b class="ans">${F(ans)}</b>` })}`, '');
        narrate(t('Not quite. The answer is {a}. Tap it to learn it.', { a: sayOption(ans) }));
      }
    } else if (state === 'retry' && b.dataset.v === cur.a) {
      state = 'done';
      b.classList.remove('reveal'); b.classList.add('learned');
      b.querySelector('.tap-hand')?.remove();
      lockAll();
      session.learned(b, { quiet: true });
      explain('learn', `${icon('sparkles')} ${t('Now you know it. No points this time, but you learnt it.')}`, t('Now you know it.'));
    }
  }

  // test mode: one choice, no right/wrong shown
  function testPick(b) {
    if (state !== 'answer') return;
    state = 'done';
    audio.tap();
    hush();
    b.classList.add('picked');
    root.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (x !== b) x.classList.add('dim'); });
    answers.push({ item: cur, choice: b.dataset.v, correct: b.dataset.v === cur.a, order });
    feedback('saved', `${icon('check')} ${t('Answer saved. Answers are explained at the end of the test.')}`, '', 1600);
  }

  /** Learn mode: list every answer choice with its explanation and read them all aloud. */
  function explain(kind, head, spokenHead) {
    if (cur.key != null) {
      feedback(kind, head, t(cur.w), 0);
      if (!readAloud()) startNext(7000);
      else narrateAll([spokenHead, t(cur.w)]).then(done => { if (done !== false) startNext(2600); });
      return;
    }
    const list = explainAll(cur, order);
    const html = `<ol class="why-list">${list.map((x, k) => `<li class="why ${x.ok ? 'ok' : 'no'}" data-k="${k}">
        <span class="opt-key">${KEYS[k]}</span>
        <div><b>${optText(x.opt)}</b> <span class="why-tag">${x.ok ? `${icon('check')} ${t('Correct')}` : `${icon('x')} ${t('Not correct')}`}</span><p>${F(x.note)}</p></div></li>`).join('')}</ol>`;
    feedback(kind, head, '', 0, html);
    const lines = [spokenHead, t("Let's look at every answer."),
      ...list.map((x, k) => `${KEYS[k]}: ${sayOption(t(x.opt))}. ${x.ok ? t('Correct.') : t('Not correct.')} ${x.note}`)];
    const rows = [...root.querySelectorAll('.why')];
    narrateAll(lines, { onitem: n => rows.forEach((r, k) => r.classList.toggle('reading', k === n - 2)) })
      .then(done => { rows.forEach(r => r.classList.remove('reading')); if (done !== false) startNext(2600); });
    if (!readAloud()) startNext(6000 + list.length * 2500);
  }

  function startNext(ms) {
    if (nextCtl || !root.isConnected) return;
    const btn = $('.feedback .next-btn');
    if (btn) nextCtl = autoNext(btn, ms, goNext);
  }
  const goNext = () => { hush(); session.step(); next(); };

  function reveal() {
    const tp = cur.stage?.type;
    if ((tp === 'element') || (tp === 'ion' && (cur.stage.hide || cur.stage.mystery))) stage.set(modelFor(cur.stage, true, BY_Z, IONS));
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
        ? `<div class="tile"><span class="z">${e.z}</span><span class="sym">${e.sym}</span><span class="nm">${t(e.name)}</span><span class="ms">${e.mass} u</span></div>
           <div class="info"><div class="cat">${t(cat.label)} · ${t(e.state)}</div><div class="shells">${t('Electrons')}: <b>${e.shells.join(', ')}</b></div><div class="fact">${t(e.fact)}</div></div>`
        : `<div class="tile mystery"><span class="z">?</span><span class="sym">?</span><span class="nm">${t('Mystery element')}</span></div><div class="info"><div class="cat">${t('What does it look like?')}</div><div class="fact">${t('This is how the real element looks. Answer to see its atom!')}</div></div>`;
      card.classList.toggle('revealed', show);
    } else if (st?.type === 'ion' && show) {
      const ion = IONS[st.ion];
      const pos = ion.c.includes('+');
      card.hidden = false;
      card.style.setProperty('--c', pos ? '#fb7185' : '#60a5fa');
      card.innerHTML = `<div class="tile ion"><span class="sym">${F(ion.s + '^' + ion.c)}</span><span class="nm">${t(ion.n + ' ion')}</span></div>
        <div class="info"><div class="cat">${pos ? t('Cation (+)') : t('Anion (−)')} · ${ion.p ? t('Polyatomic') : t('Simple')}</div><div class="shells">${t('Valency')}: <b>${ion.v}</b></div></div>`;
      card.classList.add('revealed');
    } else {
      card.hidden = true;
    }
  }

  function feedback(kind, head, why, ms, extra = '') {
    const fb = $('.feedback');
    fb.hidden = false;
    fb.className = 'feedback ' + kind;
    const showNext = kind !== 'bad';
    fb.innerHTML = `<div class="fb-text"><div class="fb-head">${head}</div>${why ? `<div class="fb-why">${F(why)}</div>` : ''}${extra}</div>${showNext ? `<button class="next-btn">${i + 1 >= items.length ? t('Finish') : t('Next')} ${icon('next')}</button>` : ''}`;
    const btn = fb.querySelector('.next-btn');
    if (btn) btn.onclick = () => { audio.tap(); nextCtl?.cancel(); nextCtl = null; goNext(); };
    if (btn && ms) nextCtl = autoNext(btn, ms, goNext);
  }

  /* ---------- number keypad ---------- */
  function buildKeypad(opts) {
    opts.className = 'options keypad';
    opts.innerHTML = `<div class="kp-display"><span class="kv">?</span><span class="ku">${cur.unit}</span></div>
      ${[7, 8, 9, 4, 5, 6, 1, 2, 3, '.', 0, '⌫'].map(k => `<button class="kp-key tilt" data-k="${k}">${k}</button>`).join('')}
      <button class="kp-check tilt">${t('Check')}</button>`;
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
    const lockKeys = () => opts.querySelectorAll('button').forEach(b => (b.disabled = true));
    const check = () => {
      if (state === 'done') return;
      if (!v || isNaN(parseFloat(v))) { disp.classList.add('bad'); return; }
      const ok = Math.abs(parseFloat(v) - cur.key) < 1e-6;
      const chk = opts.querySelector('.kp-check');
      if (test) {
        state = 'done'; lockKeys(); disp.classList.add('picked'); audio.tap();
        answers.push({ item: cur, choice: `${v} ${cur.unit}`, correct: ok, order: [] });
        feedback('saved', `${icon('check')} ${t('Answer saved. Answers are explained at the end of the test.')}`, '', 1600);
        return;
      }
      const ansText = `${cur.key} ${cur.unit}`;
      if (state === 'answer') {
        if (ok) {
          state = 'done'; disp.classList.add('right'); lockKeys();
          const pts = session.correct(disp, { quiet: true });
          reveal();
          explain('good', `${icon('check')} ${t('Correct')} · <b>${ansText}</b> <span class="pts">+${pts}</span>`, t(cheer()));
        } else {
          state = 'retry';
          session.wrong(disp, { quiet: true });
          disp.classList.add('bad');
          setTimeout(() => { v = ''; upd(); disp.classList.remove('bad'); disp.classList.add('reveal'); }, 700);
          reveal();
          feedback('bad', `${icon('x')} ${t('Not quite. The answer is {a}. Type it on the keypad and press Check.', { a: `<b class="ans">${ansText}</b>` })}`, t(cur.w), 0);
          narrate(`${t('Not quite. The answer is {a}. Type it on the keypad and press Check.', { a: ansText })} ${t(cur.w)}`);
        }
      } else if (state === 'retry') {
        if (ok) {
          state = 'done'; disp.classList.remove('reveal'); disp.classList.add('learned'); lockKeys();
          session.learned(chk, { quiet: true });
          explain('learn', `${icon('sparkles')} ${t('Now you know it. No points this time, but you learnt it.')}`, t('Now you know it.'));
        } else { disp.classList.add('bad'); audio.wrong(); }
      }
    };
    opts.querySelectorAll('.kp-key').forEach(b => (b.onclick = () => press(b.dataset.k)));
    opts.querySelector('.kp-check').onclick = check;
    keypad = { press, check };
    upd();
  }

  $('.say-btn').addEventListener('click', () => { audio.tap(); readQuestion(); });

  const onKey = e => {
    if (!root.isConnected) return;
    if (keypad) {
      if (/^[0-9.]$/.test(e.key)) keypad.press(e.key);
      else if (e.key === 'Backspace') { e.preventDefault(); keypad.press('⌫'); }
      else if (e.key === 'Enter') { e.preventDefault(); if (state === 'done') { if (nextCtl) nextCtl.go(); else $('.feedback .next-btn')?.click(); } else keypad.check(); }
      return;
    }
    const k = '1234'.indexOf(e.key) >= 0 ? +e.key - 1 : KEYS.indexOf(e.key.toUpperCase());
    const btns = root.querySelectorAll('.opt');
    if (k >= 0 && btns[k] && !btns[k].disabled) btns[k].click();
    else if (e.key === 'Enter' && state === 'done') $('.feedback .next-btn')?.click();
  };
  addEventListener('keydown', onKey);

  next();
  return {
    destroy() { nextCtl?.cancel(); hush(); stage.dispose(); removeEventListener('keydown', onKey); },
  };
}
