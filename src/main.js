import './index.css';
import './style.css';
import { audio } from './audio.js';
import { initFx, rain, fireworks, banner } from './fx.js';
import { initEngine, Stage, setMood } from './three/engine.js';
import { trophyModel } from './three/models.js';
import { plateImages } from './three/plates.js';
import { h, F, shuffle, initTilt, soundButtons, stars, toast } from './ui.js';
import { icon } from './icons.js';
import { initTheme } from './theme.js';
import { t, getLang } from './i18n.js';
import { checkServerKeys } from './settings.js';
import { openSettings } from './settingsPanel.js';
import { narrate, narrateAll, hush, sayOption } from './narrate.js';
import { GAMES, LAB, GAME1, GAME3, GAME4, GAME5, LATIN_BOARDS } from './data/questions.js';
import { LESSONS, HOW, MODES } from './data/lessons.js';
import { explainAll, questionText, optionNote } from './data/notes.js';
import { progress, saveResult, totalXp, totalStars, starsFor } from './state.js';
import { Session } from './games/session.js';
import { mountQuiz } from './games/quiz.js';
import { mountLatin } from './games/latin.js';
import { mountCross } from './games/cross.js';
import { mountLab } from './games/lab.js';
import { startTour, tourDone, tourRunning } from './tour/tour.js';
import { HOME_TOUR } from './tour/steps.js';

const app = document.getElementById('app');
initEngine(document.getElementById('gl'));
initTheme();
initFx();
initTilt();
checkServerKeys();

let screen = null, builder = null; // { el, destroy } and how to rebuild it
function go(build) {
  const old = screen;
  hush();
  builder = build;
  screen = build();
  screen.el.classList.add('screen-in');
  app.appendChild(screen.el);
  if (old) {
    old.destroy?.();
    old.el.classList.add('screen-out');
    setTimeout(() => old.el.remove(), 380);
  }
  window.scrollTo(0, 0);
}
// switching language redraws the current screen in the new language
document.addEventListener('langchange', () => { document.querySelectorAll('.modal-back:not(.settings-back)').forEach(m => m.remove()); if (builder) go(builder); });
document.addEventListener('opensettings', () => openSettings());
document.addEventListener('speechnote', e => toast(t(e.detail)));

const QUIZ = { elements: GAME1, ions: GAME3, laws: GAME5 };
const brand = () => `<div class="brand">
  <span class="brand-mark">${icon('atom')}</span>
  <span class="brand-text"><b>${t('Smart Science Lab')}</b><small>${t('Atoms & Molecules · Class IX')}</small></span>
</div>`;
const chartVar = tier => `var(--chart-${tier})`;

/* ---------------- home: the conveyor belt ---------------- */
function homeScreen() {
  setMood('#22d3ee');
  const el = h(`<section class="screen home">
    <header class="topbar">
      ${brand()}
      <button class="guide-btn" type="button" title="${t('Take the guided tour')}"><img src="/mascot/ravi-head.webp" alt=""><span>${t('Guide')}</span></button>
      <div class="stat-pills"><span class="pill">${icon('star')} ${totalStars()}</span><span class="pill">${icon('zap')} ${totalXp()} XP</span></div>
    </header>
    <div class="home-belt"><div class="belt-loading">${t('Setting the plates…')}</div></div>
    <div class="home-stats"></div>
    <footer class="home-foot">${t('ZPHS, Gurajanapalli · Physical Science · V. V. Ramana Murthy')}</footer>
  </section>`);
  el.querySelector('.topbar').appendChild(soundButtons());
  el.querySelector('.guide-btn').addEventListener('click', () => { audio.start(); startTour(HOME_TOUR); });

  el.querySelector('.home-stats').innerHTML = GAMES.map(g => {
    const p = progress.games[g.id];
    return `<button class="stat-card tilt" data-id="${g.id}" style="--c:${chartVar(g.tier)}">
      <span class="sc-top"><span class="sc-ic">${icon(g.icon)}</span><span class="sc-num">0${g.num}</span></span>
      <span class="sc-title">${t(g.title)}</span>
      <span class="sc-meta"><span>${g.count} ${t(g.unit)}</span><span class="sc-stars">${stars(p?.stars || 0)}</span></span>
    </button>`;
  }).join('');
  el.querySelector('.home-stats').addEventListener('click', e => {
    const b = e.target.closest('.stat-card'); if (!b) return;
    audio.tap(); openGame(b.dataset.id);
  });

  let unmount = null, alive = true;
  const games = [...GAMES, LAB].map(g => {
    const p = progress.games[g.id];
    const best = p ? [t('Best {n} pts', { n: p.best }), t('{n}/3 stars', { n: p.stars })] : [];
    return { id: g.id, title: t(g.title), sub: t(g.sub), count: `${g.count} ${t(g.unit)}`, tier: g.tier, details: [...g.details.map(d => t(d)), ...best] };
  });
  const strings = {
    eyebrow: t('Class IX · Atoms & Molecules'), heading: t('Every chemistry game comes round on the belt.'),
    caption: t('Hover to stop the belt, flick it to spin, pick a plate to play.'),
    start: t('Start with elements'), lab: t('Element Lab'),
    legend: { 1: t('Explore'), 2: t('Warm-up'), 3: t('Practice'), 4: t('Tricky'), 5: t('Challenge') },
    labels: { add: t('Play'), close: t('Close'), previous: t('Previous game'), next: t('Next game'), pause: t('Pause belt') },
  };
  Promise.all([import('./home/Home.tsx'), plateImages()]).then(([mod, images]) => {
    if (!alive) return;
    const host = el.querySelector('.home-belt');
    host.innerHTML = '';
    unmount = mod.mountHome(host, { games, images, strings, onPlay: id => { audio.start(); openGame(id); }, onPeek: g => narrate(`${g.name}. ${g.description}`) });
    if (!tourDone() && !location.hash) setTimeout(() => { if (alive) startTour(HOME_TOUR); }, 900);
  });
  return { el, destroy() { alive = false; unmount?.(); } };
}

function openGame(id) {
  if (id === 'lab') { audio.whoosh(); go(labScreen); return; }
  const g = GAMES.find(x => x.id === id);
  if (g) intro(g);
}

/* ---------------- intro: how to play, the lesson, mode and round length ---------------- */
function intro(g, startMode = 'learn') {
  document.querySelectorAll('.modal-back').forEach(x => x.remove());
  const isQuiz = !!QUIZ[g.id];
  let mode = isQuiz ? startMode : 'learn';
  const full = g.id === 'latin' ? t('Both boards · 10') : t('Full game · {n}', { n: g.count });
  const quick = g.id === 'latin' ? t('One board · 5') : t('Quick round · 10');
  const m = h(`<div class="modal-back"><div class="modal intro" role="dialog" aria-modal="true" style="--c:${chartVar(g.tier)}">
    <button class="m-close" aria-label="${t('Close')}">${icon('x')}</button>
    <p class="m-num"><span class="dot"></span>${t('Game {n} / 05', { n: '0' + g.num })}</p>
    <h2>${t(g.title)}</h2>
    <p class="m-sub">${t(g.sub)}</p>
    <div class="intro-tools">
      <button class="mbtn small" data-a="listen">${icon('listen')} ${t('Listen: how to play')}</button>
      <button class="mbtn small" data-a="lesson">${icon('book')} ${t('Learn the topic first')}</button>
    </div>
    <ol class="how">${HOW[g.id].map(x => `<li>${t(x)}</li>`).join('')}</ol>
    ${isQuiz ? `<div class="modes">${Object.entries(MODES).map(([k, v]) => `<button class="mode-card ${k === mode ? 'on' : ''}" data-mode="${k}">
        <span class="mc-ic">${icon(k)}</span><b>${t(v.title)}</b><small>${t(v.text)}</small></button>`).join('')}</div>` : ''}
    <p class="rule-box">${icon('hand')}<span class="rule-text"></span></p>
    <div class="m-btns">
      <button class="mbtn primary" data-n="full">${icon('play')} ${full}</button>
      <button class="mbtn" data-n="quick">${quick}</button>
    </div>
  </div></div>`);
  const rule = () => m.querySelector('.rule-text').textContent = mode === 'test'
    ? t('One answer per question, no hints. Every answer is explained at the end, aloud and in writing.')
    : t('Wrong answer? The right one glows. Tap it to learn it, but that question gives no points. Every choice is then explained.');
  rule();
  document.body.appendChild(m);
  m.querySelector('.mbtn.primary').focus({ preventScroll: true });
  const howLine = () => `${t(g.title)}. ${t(g.sub)} ${t('How to play.')} ${HOW[g.id].map(x => t(x)).join(' ')} ${isQuiz ? t('Choose Play while you learn, or Test your knowledge.') : ''}`;
  narrate(howLine());
  const close = () => { hush(); m.classList.add('out'); setTimeout(() => m.remove(), 220); removeEventListener('keydown', esc); };
  const esc = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', esc);
  m.addEventListener('click', e => {
    if (e.target === m || e.target.closest('.m-close')) { audio.tap(); close(); return; }
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'listen') { audio.start(); narrate(howLine()); return; }
    if (a === 'lesson') { audio.start(); hush(); lesson(g, () => intro(g, mode)); m.remove(); return; }
    const mc = e.target.closest('.mode-card');
    if (mc) {
      mode = mc.dataset.mode; audio.tap();
      m.querySelectorAll('.mode-card').forEach(x => x.classList.toggle('on', x === mc));
      rule();
      narrate(`${t(MODES[mode].title)}. ${t(MODES[mode].text)}`);
      return;
    }
    const b = e.target.closest('.mbtn[data-n]'); if (!b) return;
    audio.start(); audio.whoosh();
    close();
    go(() => gameScreen(g, b.dataset.n === 'quick', mode));
  });
}

/* ---------------- lesson: narrated slides about the topic ---------------- */
function lesson(g, back) {
  const slides = LESSONS[g.id];
  let k = 0, playing = true;
  const m = h(`<div class="modal-back"><div class="modal lesson" role="dialog" aria-modal="true" style="--c:${chartVar(g.tier)}">
    <button class="m-close" aria-label="${t('Close')}">${icon('x')}</button>
    <p class="m-num"><span class="dot"></span>${t('Lesson')} · ${t(g.title)}</p>
    <div class="slide"><h2 class="ls-title"></h2><p class="ls-text"></p></div>
    <div class="ls-dots">${slides.map(() => '<i></i>').join('')}</div>
    <div class="m-btns ls-btns">
      <button class="mbtn" data-a="prev">${icon('back')} ${t('Back')}</button>
      <button class="mbtn" data-a="play"></button>
      <button class="mbtn primary" data-a="next"></button>
    </div>
  </div></div>`);
  document.body.appendChild(m);
  const $ = s => m.querySelector(s);
  const show = () => {
    const sl = slides[k];
    $('.ls-title').textContent = t(sl.title);
    $('.ls-text').innerHTML = F(t(sl.text));
    $('.slide').classList.remove('in'); void $('.slide').offsetWidth; $('.slide').classList.add('in');
    m.querySelectorAll('.ls-dots i').forEach((d, j) => d.classList.toggle('on', j === k));
    $('[data-a=next]').innerHTML = k === slides.length - 1 ? `${icon('play')} ${t('Start playing')}` : `${t('Next')} ${icon('next')}`;
    $('[data-a=play]').innerHTML = playing ? `${icon('pause')} ${t('Pause')}` : `${icon('listen')} ${t('Listen')}`;
    if (playing) narrate(`${t(sl.title)}. ${t(sl.text)}`).then(done => { if (done && playing && m.isConnected && k < slides.length - 1) { k++; show(); } });
  };
  const close = () => { hush(); m.remove(); back?.(); };
  m.addEventListener('click', e => {
    if (e.target === m || e.target.closest('.m-close')) { audio.tap(); close(); return; }
    const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
    audio.tap();
    if (a === 'prev' && k > 0) { k--; show(); }
    if (a === 'next') { if (k < slides.length - 1) { k++; show(); } else close(); }
    if (a === 'play') { playing = !playing; if (!playing) hush(); show(); }
  });
  show();
}

/* ---------------- game shell ---------------- */
function gameScreen(g, quick, mode = 'learn') {
  setMood(g.color);
  const test = mode === 'test' && !!QUIZ[g.id];
  const el = h(`<section class="screen game ${test ? 'test-mode' : ''}" style="--c:${chartVar(g.tier)}">
    <header class="game-top">
      <button class="icon-btn back" title="${t('Back to all games')}" aria-label="${t('Back')}">${icon('back')}</button>
      <div class="gt-title"><span class="gt-num">0${g.num}</span><span>${t(g.title)}</span><span class="mode-chip">${icon(test ? 'test' : 'learn')} ${t(test ? MODES.test.title : MODES.learn.title)}</span></div>
      <div class="gt-progress"><div class="bar"><i></i></div><span class="pcount"></span></div>
      <div class="hud"><div class="hud-box streak" title="${t('Streak')}">${icon('flame')}<b class="sv">0</b></div><div class="hud-box score" title="${t('Score')}">${icon('star')}<b class="scv">0</b></div></div>
    </header>
    <div class="game-body"></div>
  </section>`);
  el.querySelector('.game-top').appendChild(soundButtons());
  const hud = {
    score: el.querySelector('.scv'), streak: el.querySelector('.sv'), bar: el.querySelector('.bar i'), count: el.querySelector('.pcount'),
    scoreBox: el.querySelector('.hud-box.score'), streakBox: el.querySelector('.hud-box.streak'),
  };
  const body = el.querySelector('.game-body');
  let game = null, session = null;
  const done = answers => {
    if (test) {
      const right = answers.filter(a => a.correct).length;
      const st = starsFor(right, answers.length);
      saveResult(g.id, right * 10, st);
      go(() => reviewScreen(g, answers, st, quick));
      return;
    }
    const st = starsFor(session.firstTry, session.total);
    saveResult(g.id, session.score, st);
    go(() => resultsScreen(g, session, st, quick));
  };
  const take = (arr, n) => (quick ? shuffle(arr).slice(0, n) : shuffle(arr));
  if (QUIZ[g.id]) {
    const items = take(QUIZ[g.id], 10);
    session = new Session(g.id, items.length, hud);
    game = mountQuiz(body, { items, session, onDone: done, game: g, mode: test ? 'test' : 'learn' });
  } else if (g.id === 'latin') {
    const boards = quick ? [LATIN_BOARDS[(Math.random() * 2) | 0]] : LATIN_BOARDS;
    session = new Session(g.id, boards.reduce((n, b) => n + b.pairs.length, 0), hud);
    game = mountLatin(body, { boards, session, onDone: done });
  } else if (g.id === 'cross') {
    const items = quick ? [...GAME4.slice(0, 2), ...shuffle(GAME4.slice(2)).slice(0, 8)] : [...GAME4.slice(0, 2), ...shuffle(GAME4.slice(2))];
    session = new Session(g.id, items.length, hud);
    game = mountCross(body, { items, session, onDone: done });
  }
  el.querySelector('.back').onclick = () => { audio.tap(); audio.setIntensity(0); go(homeScreen); };
  return { el, destroy() { game?.destroy(); audio.setIntensity(0); } };
}

/* ---------------- results (learn mode) ---------------- */
const MSG = st => (st === 3 ? 'Superstar scientist' : st === 2 ? 'Great work' : st === 1 ? 'Good try' : 'Keep practising');
const SAY = st => (st === 3 ? 'Fantastic! You earned three stars!' : st === 2 ? 'Great work! Two stars!' : st === 1 ? 'Good try! One star. Play again to get more!' : 'Keep practising, you will get better!');
function resultsScreen(g, s, st, quick) {
  const pct = Math.round((s.firstTry / s.total) * 100);
  const msg = t(MSG(st));
  const el = h(`<section class="screen results" style="--c:${chartVar(g.tier)}">
    <div class="res-card">
      <div class="stage-wrap trophy"><div class="stage"></div></div>
      <div class="res-info">
        <p class="res-game"><span class="dot"></span>${t('Game {n}', { n: '0' + g.num })} · ${t(g.title)}${quick ? ' · ' + t('quick round') : ''}</p>
        <h2 class="res-msg">${msg}</h2>
        <div class="res-stars">${stars(st)}</div>
        <div class="res-stats">
          <div><b>${s.score}</b><span>${t('Points')}</span></div>
          <div><b>${s.firstTry}/${s.total}</b><span>${t('Right first time')}</span></div>
          <div><b>${pct}%</b><span>${t('Accuracy')}</span></div>
          <div><b>${s.bestStreak}</b><span>${t('Best streak')}</span></div>
        </div>
        <div class="res-btns">
          <button class="mbtn primary" data-a="again">${icon('again')} ${t('Play again')}</button>
          ${QUIZ[g.id] ? `<button class="mbtn" data-a="test">${icon('test')} ${t(MODES.test.title)}</button>` : ''}
          <button class="mbtn" data-a="next">${t('Next game')} ${icon('next')}</button>
          <button class="mbtn ghost" data-a="hub">${icon('home')} ${t('All games')}</button>
        </div>
      </div>
    </div>
  </section>`);
  const stage = new Stage(el.querySelector('.stage'), { autoRotate: 0.8 });
  stage.set(trophyModel(st >= 3 ? '#ffcc33' : st === 2 ? '#d9dde3' : '#cd7f32'));
  setTimeout(() => {
    audio.win();
    fireworks(st + 3);
    rain(st >= 2 ? 200 : 90);
    banner(t('{n} / 3 stars', { n: st }), msg);
    narrate(`${t(SAY(st))} ${t('You got {a} out of {b} right the first time.', { a: s.firstTry, b: s.total })}`);
  }, 350);
  el.querySelector('.res-btns').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    audio.tap();
    const a = b.dataset.a;
    if (a === 'again') go(() => gameScreen(g, quick, 'learn'));
    else if (a === 'test') go(() => gameScreen(g, quick, 'test'));
    else if (a === 'hub') go(homeScreen);
    else { go(homeScreen); setTimeout(() => intro(GAMES[(GAMES.indexOf(g) + 1) % GAMES.length]), 300); }
  });
  return { el, destroy() { stage.dispose(); } };
}

/* ---------------- review (test mode): every answer explained, aloud and in writing ---------------- */
function reviewScreen(g, answers, st, quick) {
  const right = answers.filter(a => a.correct).length;
  const msg = t(MSG(st));
  const ansText = a => (a.item.key != null ? `${a.item.key} ${a.item.unit}` : t(a.item.a));
  const cardLines = (a, n) => {
    const q = questionText(a.item);
    const chose = a.item.key != null ? a.choice : sayOption(t(a.choice));
    const lines = [`${t('Question {n}', { n })}. ${q}`, t('You chose {x}.', { x: chose })];
    if (a.correct) lines.push(`${t('That is correct.')} ${t(a.item.w)}`);
    else {
      lines.push(t('That is not correct. The right answer is {a}.', { a: a.item.key != null ? ansText(a) : sayOption(t(a.item.a)) }));
      if (a.item.key == null) lines.push(optionNote(a.item, a.choice));
      lines.push(t(a.item.w));
    }
    return lines;
  };
  const el = h(`<section class="screen review" style="--c:${chartVar(g.tier)}">
    <header class="game-top">
      <button class="icon-btn back" title="${t('Back to all games')}" aria-label="${t('Back')}">${icon('back')}</button>
      <div class="gt-title"><span class="gt-num">0${g.num}</span><span>${t(g.title)}</span><span class="mode-chip">${icon('test')} ${t(MODES.test.title)}</span></div>
      <div class="gt-sub"></div>
    </header>
    <div class="rev-head glass">
      <div><p class="res-game"><span class="dot"></span>${t('Test results')}</p><h2 class="res-msg">${msg}</h2></div>
      <div class="rev-score"><b>${right}/${answers.length}</b><span>${t('correct')}</span><div class="res-stars">${stars(st)}</div></div>
      <div class="res-btns">
        <button class="mbtn primary" data-a="listen">${icon('listen')} ${t('Listen to all explanations')}</button>
        <button class="mbtn" data-a="again">${icon('again')} ${t('Take the test again')}</button>
        <button class="mbtn" data-a="learn">${icon('learn')} ${t(MODES.learn.title)}</button>
        <button class="mbtn ghost" data-a="hub">${icon('home')} ${t('All games')}</button>
      </div>
    </div>
    <ol class="rev-list">${answers.map((a, k) => {
      const q = questionText(a.item);
      const all = a.item.key == null ? explainAll(a.item, a.order) : [];
      return `<li class="rev-card ${a.correct ? 'ok' : 'no'}" data-k="${k}">
        <div class="rc-top"><span class="rc-num">${k + 1}</span><span class="rc-badge">${a.correct ? `${icon('check')} ${t('Correct')}` : `${icon('x')} ${t('Not correct')}`}</span>
          <button class="say-btn" data-a="one" data-k="${k}" title="${t('Listen')}">${icon('volume')}</button></div>
        <h3>${F(q)}</h3>
        <p class="rc-ans">${t('Your answer')}: <b class="${a.correct ? 'good' : 'bad'}">${F(a.item.key != null ? a.choice : t(a.choice))}</b>${a.correct ? '' : ` · ${t('Correct answer')}: <b class="good">${F(ansText(a))}</b>`}</p>
        <p class="rc-why">${F(t(a.item.w))}</p>
        ${all.length ? `<ul class="rc-opts">${all.map(x => `<li class="${x.ok ? 'ok' : x.opt === a.choice ? 'picked' : ''}"><b>${F(t(x.opt))}</b> ${x.ok ? icon('check') : icon('x')} <span>${F(x.note)}</span></li>`).join('')}</ul>` : ''}
      </li>`;
    }).join('')}</ol>
  </section>`);
  el.querySelector('.game-top').appendChild(soundButtons());
  const cards = [...el.querySelectorAll('.rev-card')];
  let listening = false;
  const mark = k => cards.forEach((c, j) => { c.classList.toggle('reading', j === k); if (j === k) c.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
  async function listenAll() {
    listening = true;
    const btn = el.querySelector('[data-a=listen]');
    btn.innerHTML = `${icon('stop')} ${t('Stop')}`;
    const lines = [], owner = [];
    lines.push(`${t('You got {a} out of {b} correct.', { a: right, b: answers.length })} ${msg}.`); owner.push(-1);
    answers.forEach((a, k) => cardLines(a, k + 1).forEach(l => { lines.push(l); owner.push(k); }));
    await narrateAll(lines, { onitem: n => { if (owner[n] >= 0) mark(owner[n]); } });
    listening = false; mark(-1);
    btn.innerHTML = `${icon('listen')} ${t('Listen to all explanations')}`;
  }
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    audio.tap();
    if (a === 'listen') { if (listening) { hush(); listening = false; } else listenAll(); }
    if (a === 'one') { const k = +b.dataset.k; mark(k); narrateAll(cardLines(answers[k], k + 1)).then(() => mark(-1)); }
    if (a === 'again') go(() => gameScreen(g, quick, 'test'));
    if (a === 'learn') go(() => gameScreen(g, quick, 'learn'));
    if (a === 'hub') go(homeScreen);
  });
  el.querySelector('.back').onclick = () => { audio.tap(); go(homeScreen); };
  setTimeout(() => {
    if (st >= 2) { audio.win(); fireworks(st + 2); }
    narrate(`${t('You got {a} out of {b} correct.', { a: right, b: answers.length })} ${msg}. ${t('Tap Listen to all explanations to hear why each answer is right or wrong.')}`);
  }, 400);
  return { el, destroy() { hush(); } };
}

/* ---------------- lab ---------------- */
function labScreen() {
  setMood('#4ade80');
  const el = h(`<section class="screen game lab-screen" style="--c:${chartVar(1)}">
    <header class="game-top">
      <button class="icon-btn back" title="${t('Back to all games')}" aria-label="${t('Back')}">${icon('back')}</button>
      <div class="gt-title"><span class="gt-num">${icon('flask')}</span><span>${t('Element Lab')}</span></div>
      <div class="gt-sub">${t('Tap any element to see it in 3D')}</div>
    </header>
    <div class="game-body"></div>
  </section>`);
  el.querySelector('.game-top').appendChild(soundButtons());
  const lab = mountLab(el.querySelector('.game-body'));
  el.querySelector('.back').onclick = () => { audio.tap(); go(homeScreen); };
  return { el, destroy() { lab.destroy(); } };
}

/* ---------------- boot ---------------- */
let greeted = false;
const unlock = () => {
  audio.start();
  if (!greeted) { greeted = true; setTimeout(() => { if (!tourRunning() && tourDone()) narrate(t('Welcome to Smart Science Lab! Pick a game from the belt.')); }, 300); }
};
document.addEventListener('pointerdown', unlock, { once: true, capture: true });
document.addEventListener('keydown', unlock, { once: true, capture: true });
document.addEventListener('visibilitychange', () => (document.hidden ? audio.pause() : audio.resume()));

// Direct links for teachers: /#elements, /#latin, /#ions, /#cross, /#laws, /#lab
const hash = location.hash.slice(1);
const direct = GAMES.find(g => g.id === hash);
if (direct) { go(homeScreen); setTimeout(() => intro(direct), 250); }
else if (hash === 'lab') go(labScreen);
else go(homeScreen);
void getLang;
