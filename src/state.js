// Saved progress (best score and stars per game) in this browser.
const KEY = 'ssl.progress.v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { games: {} }; } catch { return { games: {} }; }
}
export const progress = load();

export function saveResult(id, score, starCount) {
  const g = progress.games[id] || { best: 0, stars: 0, plays: 0 };
  g.best = Math.max(g.best, score);
  g.stars = Math.max(g.stars, starCount);
  g.plays++;
  progress.games[id] = g;
  try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch { /* private mode */ }
}

export function totalXp() {
  return Object.values(progress.games).reduce((a, g) => a + (g.best || 0), 0);
}
export function totalStars() {
  return Object.values(progress.games).reduce((a, g) => a + (g.stars || 0), 0);
}

export function starsFor(firstTry, total) {
  const p = total ? firstTry / total : 0;
  return p >= 0.9 ? 3 : p >= 0.7 ? 2 : p >= 0.4 ? 1 : 0;
}
