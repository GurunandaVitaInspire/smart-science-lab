// Languages: English and Telugu.
// Text is translated by its English wording: t('Next') → 'తదుపరి'. Built-in Telugu lives in
// i18n/te.json (reviewed). Optionally Bhashini machine translation fills/overrides it.
import TE from './i18n/te.json';
import { settings, keyHeaders } from './settings.js';

export const LANGS = { en: 'English', te: 'తెలుగు' };
let lang = (() => { try { return localStorage.getItem('ssl.lang') || 'en'; } catch { return 'en'; } })();
const MT_KEY = 'ssl.mt.te.v1';
let mt = (() => { try { return JSON.parse(localStorage.getItem(MT_KEY)) || {}; } catch { return {}; } })();

export const getLang = () => lang;
export function setLang(l) {
  lang = l;
  try { localStorage.setItem('ssl.lang', l); } catch { /* private mode */ }
  document.documentElement.lang = l;
  document.dispatchEvent(new CustomEvent('langchange', { detail: l }));
}
document.documentElement.lang = lang;

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m)) : s);

/** Translate a piece of English text into the current language. */
export function t(en, vars) {
  if (en == null) return '';
  const s = String(en);
  if (lang === 'en' || !s.trim()) return fill(s, vars);
  const viaMt = settings.translate === 'bhashini' ? mt[s] : null;
  return fill(viaMt || TE[s] || mt[s] || s, vars);
}

/** All English strings the app knows (for machine-translating them in one go). */
export const catalog = () => Object.keys(TE);

/** Fill the machine-translation cache from Bhashini for every known string. */
export async function warmBhashini(onProgress) {
  const todo = catalog().filter(s => !mt[s]);
  const size = 25;
  for (let k = 0; k < todo.length; k += size) {
    const batch = todo.slice(k, k + size);
    const r = await fetch('/api/bhashini', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...keyHeaders() },
      body: JSON.stringify({ task: 'translation', source: 'en', target: 'te', texts: batch.map(protect) }),
    });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Bhashini error ${r.status}`);
    const { texts } = await r.json();
    batch.forEach((s, j) => { if (texts?.[j]) mt[s] = unprotect(texts[j]); });
    try { localStorage.setItem(MT_KEY, JSON.stringify(mt)); } catch { /* full */ }
    onProgress?.(Math.min(1, (k + size) / todo.length));
  }
  return Object.keys(mt).length;
}
export function clearMt() { mt = {}; try { localStorage.removeItem(MT_KEY); } catch { /* ignore */ } }

// keep {placeholders} and chemical formulas (NH4^+) untouched by machine translation
const protect = s => s.replace(/\{(\w+)\}/g, '⟦$1⟧');
const unprotect = s => s.replace(/⟦\s*(\w+)\s*⟧/g, '{$1}');
