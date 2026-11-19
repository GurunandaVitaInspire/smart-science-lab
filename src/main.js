import './index.css';
import './style.css';
import { audio } from './audio.js';
import { initFx, rain, fireworks, banner } from './fx.js';
import { initEngine, Stage, setMood } from './three/engine.js';
import { trophyModel } from './three/models.js';
import { plateImages } from './three/plates.js';
import { h, shuffle, initTilt, soundButtons, stars } from './ui.js';
import { icon } from './icons.js';
import { initTheme } from './theme.js';
import { GAMES, LAB, GAME1, GAME3, GAME4, GAME5, LATIN_BOARDS } from './data/questions.js';
import { progress, saveResult, totalXp, totalStars, starsFor } from './state.js';
import { Session } from './games/session.js';
import { mountQuiz } from './games/quiz.js';
import { mountLatin } from './games/latin.js';
import { mountCross } from './games/cross.js';
import { mountLab } from './games/lab.js';

const app = document.getElementById('app');
initEngine(document.getElementById('gl'));
initTheme();
initFx();
initTilt();

let screen = null; // { el, destroy }
function go(build) {
  const old = screen;
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

const brand = () => `<div class="brand">
  <span class="brand-mark">${icon('atom')}</span>
  <span class="brand-text"><b>Smart Science Lab</b><small>Atoms &amp; Molecules · Class IX</small></span>
</div>`;
const chartVar = tier => `var(--chart-${tier})`;

/* ---------------- home: the conveyor belt ---------------- */
function homeScreen() {
  setMood('#22d3ee');
  const el = h(`<section class="screen home">
    <header class="topbar">
      ${brand()}
      <div class="stat-pills"><span class="pill">${icon('star')} ${totalStars()}</span><span class="pill">${icon('zap')} ${totalXp()} XP</span></div>
    </header>
    <div class="home-belt"><div class="belt-loading">Setting the plates…</div></div>
    <div class="home-stats"></div>
    <footer class="home-foot">ZPHS, Gurajanapalli · Physical Science · V. V. Ramana Murthy</footer>
  </section>`);
  el.querySelector('.topbar').appendChild(soundButtons());

  // progress strip under the belt
  el.querySelector('.home-stats').innerHTML = GAMES.map(g => {
    const p = progress.games[g.id];
    return `<button class="stat-card tilt" data-id="${g.id}" style="--c:${chartVar(g.tier)}">
      <span class="sc-top"><span class="sc-ic">${icon(g.icon)}</span><span class="sc-num">0${g.num}</span></span>
      <span class="sc-title">${g.title}</span>
      <span class="sc-meta"><span>${g.count} ${g.unit}</span><span class="sc-stars">${stars(p?.stars || 0)}</span></span>
    </button>`;
  }).join('');
  el.querySelector('.home-stats').addEventListener('click', e => {
    const b = e.target.closest('.stat-card'); if (!b) return;
    audio.tap(); openGame(b.dataset.id);
  });

  let unmount = null, alive = true;
  const games = [...GAMES, LAB].map(g => {
    const p = progress.games[g.id];
    const best = p ? [`Best ${p.best} pts`, `${p.stars}/3 stars`] : [];
    return { id: g.id, title: g.title, sub: g.sub, count: `${g.count} ${g.unit}`, tier: g.tier, details: [...g.details, ...best] };
  });
  // the React belt and the 3D plate pictures load in the background
  Promise.all([import('./home/Home.tsx'), plateImages()]).then(([mod, images]) => {
    if (!alive) return;
    const host = el.querySelector('.home-belt');
    host.innerHTML = '';
    unmount = mod.mountHome(host, { games, images, onPlay: id => { audio.start(); openGame(id); } });
  });
  return { el, destroy() { alive = false; unmount?.(); } };
}

function openGame(id) {
  if (id === 'lab') { audio.whoosh(); go(labScreen); return; }
  const g = GAMES.find(x => x.id === id);
  if (g) intro(g);
}

/* ---------------- intro / round length ---------------- */
const HOW = {
  elements: ['Read the question about the element.', 'Tap the right answer. Watch the capital and small letters.', 'Answer to see the atom of the element in 3D.'],
  latin: ['Drag a Latin name to its element.', 'Or tap a name, then tap the box.', 'Finish a board to win glitter stars.'],
  ions: ['Find the valency, name or formula of the ion.', 'Red glow is a positive ion (cation), blue glow a negative ion (anion).', 'Spin the 3D ion to see its atoms.'],
  cross: ['Drag each valency number across to the other ion.', 'Add brackets for a group taken 2 or 3 times. Cut down if both numbers are the same.', 'Tap "Formula ready" to make the compound.'],
  laws: ['Answer questions on the laws of chemistry.', 'Some questions use a number keypad.', 'Atomic masses are shown on the 3D models.'],
};
function intro(g) {
  const full = g.id === 'latin' ? 'Both boards · 10' : `Full game · ${g.count}`;
  const quick = g.id === 'latin' ? 'One board · 5' : 'Quick round · 10';
  const m = h(`<div class="modal-back"><div class="modal" role="dialog" aria-modal="true" style="--c:${chartVar(g.tier)}">
    <button class="m-close" aria-label="Close">${icon('x')}</button>
    <p class="m-num"><span class="dot"></span>Game 0${g.num} / 05</p>
    <h2>${g.title}</h2>
    <p class="m-sub">${g.sub}</p>
    <ol class="how">${HOW[g.id].map(x => `<li>${x}</li>`).join('')}</ol>
    <p class="rule-box">${icon('hand')}<span>Wrong answer? The right one glows. Tap it to learn it, but that question gives no points.</span></p>
    <div class="m-btns">
      <button class="mbtn primary" data-n="full">${icon('play')} ${full}</button>
      <button class="mbtn" data-n="quick">${quick}</button>
    </div>
  </div></div>`);
  document.body.appendChild(m);
  m.querySelector('.mbtn.primary').focus({ preventScroll: true });
  const close = () => { m.classList.add('out'); setTimeout(() => m.remove(), 220); removeEventListener('keydown', esc); };
  const esc = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', esc);
  m.addEventListener('click', e => {
    if (e.target === m || e.target.closest('.m-close')) { audio.tap(); close(); return; }
    const b = e.target.closest('.mbtn'); if (!b) return;
    audio.start(); audio.whoosh();
    close();
    go(() => gameScreen(g, b.dataset.n === 'quick'));
  });
}

/* ---------------- game shell ---------------- */
function gameScreen(g, quick) {
  setMood(g.color);
  const el = h(`<section class="screen game" style="--c:${chartVar(g.tier)}">
    <header class="game-top">
      <button class="icon-btn back" title="Back to all games" aria-label="Back">${icon('back')}</button>
      <div class="gt-title"><span class="gt-num">0${g.num}</span><span>${g.title}</span></div>
      <div class="gt-progress"><div class="bar"><i></i></div><span class="pcount"></span></div>
      <div class="hud"><div class="hud-box streak" title="Streak">${icon('flame')}<b class="sv">0</b></div><div class="hud-box score" title="Score">${icon('star')}<b class="scv">0</b></div></div>
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
  const done = () => {
    const st = starsFor(session.firstTry, session.total);
    saveResult(g.id, session.score, st);
    go(() => resultsScreen(g, session, st, quick));
  };
  const take = (arr, n) => (quick ? shuffle(arr).slice(0, n) : shuffle(arr));
  if (g.id === 'elements' || g.id === 'ions' || g.id === 'laws') {
    const src = { elements: GAME1, ions: GAME3, laws: GAME5 }[g.id];
    const items = take(src, 10);
    session = new Session(g.id, items.length, hud);
    game = mountQuiz(body, { items, session, onDone: done, game: g });
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

/* ---------------- results ---------------- */
function resultsScreen(g, s, st, quick) {
  const pct = Math.round((s.firstTry / s.total) * 100);
  const msg = st === 3 ? 'Superstar scientist' : st === 2 ? 'Great work' : st === 1 ? 'Good try' : 'Keep practising';
  const el = h(`<section class="screen results" style="--c:${chartVar(g.tier)}">
    <div class="res-card">
      <div class="stage-wrap trophy"><div class="stage"></div></div>
      <div class="res-info">
        <p class="res-game"><span class="dot"></span>Game 0${g.num} · ${g.title}${quick ? ' · quick round' : ''}</p>
        <h2 class="res-msg">${msg}</h2>
        <div class="res-stars">${stars(st)}</div>
        <div class="res-stats">
          <div><b>${s.score}</b><span>Points</span></div>
          <div><b>${s.firstTry}/${s.total}</b><span>Right first time</span></div>
          <div><b>${pct}%</b><span>Accuracy</span></div>
          <div><b>${s.bestStreak}</b><span>Best streak</span></div>
        </div>
        <div class="res-btns">
          <button class="mbtn primary" data-a="again">${icon('again')} Play again</button>
          <button class="mbtn" data-a="next">Next game ${icon('next')}</button>
          <button class="mbtn ghost" data-a="hub">${icon('home')} All games</button>
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
    banner(`${st} / 3 stars`, msg);
    audio.say(st === 3 ? 'Fantastic! You earned three stars!' : st === 2 ? 'Great work! Two stars!' : st === 1 ? 'Good try! One star. Play again to get more!' : 'Keep practising, you will get better!');
  }, 350);
  el.querySelector('.res-btns').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    audio.tap();
    const a = b.dataset.a;
    if (a === 'again') go(() => gameScreen(g, quick));
    else if (a === 'hub') go(homeScreen);
    else { go(homeScreen); setTimeout(() => intro(GAMES[(GAMES.indexOf(g) + 1) % GAMES.length]), 300); }
  });
  return { el, destroy() { stage.dispose(); } };
}

/* ---------------- lab ---------------- */
function labScreen() {
  setMood('#4ade80');
  const el = h(`<section class="screen game lab-screen" style="--c:${chartVar(1)}">
    <header class="game-top">
      <button class="icon-btn back" title="Back to all games" aria-label="Back">${icon('back')}</button>
      <div class="gt-title"><span class="gt-num">${icon('flask')}</span><span>Element Lab</span></div>
      <div class="gt-sub">Tap any element to see it in 3D</div>
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
  if (!greeted) { greeted = true; setTimeout(() => audio.say('Welcome to Smart Science Lab! Pick a game from the belt.'), 300); }
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
