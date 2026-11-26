// Speech for every line in the app, in English or Telugu.
// Engines: the device's own voice, ElevenLabs (eleven_v3/v4 speak Telugu) or Bhashini.
// Cloud clips are cached in the browser (Cache Storage), so a line costs credits only once.
import { settings, hasEleven, hasBhashini, keyHeaders } from './settings.js';
import { getLang } from './i18n.js';

let enabled = true;
export const setVoiceEnabled = on => { enabled = on; if (!on) stop(); };

const listeners = new Set();
export const onSpeakChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = on => listeners.forEach(fn => fn(on));

let token = 0, player = null, warned = new Set();
function warn(msg) {
  if (warned.has(msg)) return;
  warned.add(msg);
  document.dispatchEvent(new CustomEvent('speechnote', { detail: msg }));
}

/* ---------- which engine ---------- */
const deviceVoices = () => (window.speechSynthesis ? speechSynthesis.getVoices() : []);
export const hasDeviceVoice = lang => deviceVoices().some(v => v.lang?.toLowerCase().startsWith(lang));
export function engineFor(lang) {
  const e = settings.engine;
  if (e === 'eleven') return hasEleven() ? 'eleven' : 'device';
  if (e === 'bhashini') return hasBhashini() ? 'bhashini' : 'device';
  if (e === 'device') return 'device';
  // auto: Telugu → Bhashini, then ElevenLabs, then a Telugu device voice; English → ElevenLabs if set up
  if (lang === 'te') return hasBhashini() ? 'bhashini' : hasEleven() ? 'eleven' : 'device';
  return hasEleven() ? 'eleven' : 'device';
}

/* ---------- making text speakable ---------- */
const TE_LETTERS = { A: 'ఎ', B: 'బి', C: 'సి', D: 'డి', E: 'ఇ', F: 'ఎఫ్', G: 'జి', H: 'హెచ్', I: 'ఐ', J: 'జె', K: 'కె', L: 'ఎల్', M: 'ఎమ్', N: 'ఎన్', O: 'ఓ', P: 'పి', Q: 'క్యూ', R: 'ఆర్', S: 'ఎస్', T: 'టి', U: 'యు', V: 'వి', W: 'డబ్ల్యు', X: 'ఎక్స్', Y: 'వై', Z: 'జెడ్' };
const letter = (ch, lang) => (lang === 'te' ? TE_LETTERS[ch.toUpperCase()] || ch : ch.toUpperCase());
const WORDS = {
  en: { plus: 'plus', minus: 'minus', capital: 'capital', small: 'small', ratio: 'to', u: 'u', g: 'grams' },
  te: { plus: 'ప్లస్', minus: 'మైనస్', capital: 'పెద్ద', small: 'చిన్న', ratio: 'కి', u: 'యూనిట్లు', g: 'గ్రాములు' },
};
const FORMULA = /^\(?[A-Z][a-z]?\d*(?:\(?[A-Z][a-z]?\d*\)?\d*)*\)?\d*(?:\^\d*[+−-])?$/;

/** A chemical formula read aloud: "SO4^2−" → "S O 4, 2 minus". */
export function sayFormula(f, lang = getLang()) {
  const W = WORDS[lang] || WORDS.en;
  let [body, charge] = f.split('^');
  const parts = [];
  for (const m of body.matchAll(/([A-Z][a-z]?)|(\d+)|([()])/g)) {
    if (m[1]) parts.push([...m[1]].map(c => letter(c, lang)).join(' '));
    else if (m[2]) parts.push(m[2]);
  }
  let out = parts.join(' ');
  if (charge) {
    const n = charge.replace(/[+−-]/, ''), sign = /[+]/.test(charge) ? W.plus : W.minus;
    out += `, ${n ? n + ' ' : ''}${sign}`;
  }
  return out;
}

/** An answer choice read aloud: element symbols are spelt with capital/small so case traps can be heard. */
export function sayOption(opt, lang = getLang()) {
  const s = String(opt);
  const W = WORDS[lang] || WORDS.en;
  if (/^[A-Za-z]{1,2}$/.test(s)) return [...s].map(c => `${c === c.toUpperCase() ? W.capital : W.small} ${letter(c, lang)}`).join(', ');
  if (FORMULA.test(s) && /[\d^]|[A-Z].*[A-Z]/.test(s)) return sayFormula(s, lang);
  return speakable(s, lang);
}

/** Strip markup and turn formulas inside sentences into words. */
export function speakable(text, lang = getLang()) {
  const W = WORDS[lang] || WORDS.en;
  return String(text)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/(\d+)\s*:\s*(\d+)/g, `$1 ${W.ratio} $2`)
    .replace(/\b(\d+(?:\.\d+)?)\s*u\b/g, `$1 ${W.u}`)
    .replace(/\b(\d+(?:\.\d+)?)\s*g\b/g, `$1 ${W.g}`)
    .replace(/[A-Za-z0-9()]+(?:\^\d*[+−-])?/g, tok => (FORMULA.test(tok) && /\d|\^|[A-Z][a-z]?[A-Z]/.test(tok) ? sayFormula(tok, lang) : tok))
    .replace(/[·•]/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---------- cloud audio with caching ---------- */
const hash = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
const memo = new Map();
async function cached(key, make) {
  if (memo.has(key)) return memo.get(key);
  const url = `https://voice.cache/${key}`;
  try {
    const c = await caches.open('ssl-voice-v1');
    const hit = await c.match(url);
    if (hit) { const b = await hit.blob(); memo.set(key, b); return b; }
    const b = await make();
    await c.put(url, new Response(b, { headers: { 'Content-Type': b.type } }));
    memo.set(key, b);
    return b;
  } catch (e) {
    if (e?.message?.startsWith('API')) throw e;
    const b = await make(); memo.set(key, b); return b;
  }
}

async function cloudClip(engine, text, lang) {
  if (engine === 'eleven') {
    const key = `el/${settings.elevenModel}/${settings.elevenVoice}/${lang}/${hash(text)}`;
    return cached(key, async () => {
      const r = await fetch('/api/eleven', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...keyHeaders() },
        body: JSON.stringify({ text, voiceId: settings.elevenVoice, modelId: settings.elevenModel, lang }),
      });
      if (!r.ok) throw new Error('API ' + ((await r.json().catch(() => ({}))).error || `ElevenLabs error ${r.status}`));
      return r.blob();
    });
  }
  const key = `bh/${settings.bhashiniGender}/${lang}/${hash(text)}`;
  return cached(key, async () => {
    const r = await fetch('/api/bhashini', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...keyHeaders() },
      body: JSON.stringify({ task: 'tts', text, lang, gender: settings.bhashiniGender }),
    });
    if (!r.ok) throw new Error('API ' + ((await r.json().catch(() => ({}))).error || `Bhashini error ${r.status}`));
    return r.blob();
  });
}

/* ---------- playing ---------- */
function playBlob(blob, my) {
  return new Promise(resolve => {
    if (my !== token) return resolve(false);
    const url = URL.createObjectURL(blob);
    const a = new Audio(url);
    a.playbackRate = settings.rate;
    player = a;
    const done = ok => { URL.revokeObjectURL(url); if (player === a) player = null; resolve(ok); };
    a.onended = () => done(true);
    a.onerror = () => done(false);
    a.play().catch(() => done(false));
  });
}

function pickVoice(lang) {
  const vs = deviceVoices();
  const want = lang === 'te' ? /^te/i : /^en/i;
  const pref = lang === 'te' ? [/te-IN/i] : [/en-IN/i, /en-GB/i, /en-US/i];
  const list = vs.filter(v => want.test(v.lang));
  for (const p of pref) { const v = list.find(x => p.test(x.lang) && /female|zira|heera|samantha|google|neural|online/i.test(x.name)) || list.find(x => p.test(x.lang)); if (v) return v; }
  return list[0] || null;
}

function deviceSay(text, lang, my) {
  return new Promise(resolve => {
    const ss = window.speechSynthesis;
    const voice = pickVoice(lang);
    if (!ss || (lang !== 'en' && !voice)) {
      if (lang === 'te') warn('This device has no Telugu voice. Add an ElevenLabs or Bhashini key in Settings to hear Telugu.');
      return resolve(false);
    }
    // long text is cut into sentences (some browsers stop after ~15 s)
    const parts = text.match(/[^.!?।]+[.!?।]?/g)?.map(s => s.trim()).filter(Boolean) || [text];
    let k = 0;
    const next = () => {
      if (my !== token) return resolve(false);
      if (k >= parts.length) return resolve(true);
      const u = new SpeechSynthesisUtterance(parts[k++]);
      if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = lang === 'te' ? 'te-IN' : 'en-IN';
      u.rate = 0.98 * settings.rate; u.pitch = 1.15;
      u.onend = next; u.onerror = () => resolve(false);
      ss.speak(u);
    };
    next();
  });
}

/** Stop whatever is being said. */
export function stop() {
  token++;
  try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  if (player) { player.pause(); player = null; }
  emit(false);
}

/** Say one line (interrupts anything already playing). Resolves true when it was heard to the end. */
export async function say(text, { lang = getLang(), onend } = {}) {
  stop();
  const my = token;
  if (!enabled || !text) { onend?.(); return false; }
  const words = speakable(text, lang);
  const engine = engineFor(lang);
  emit(true);
  let ok = false;
  try {
    if (engine === 'device') ok = await deviceSay(words, lang, my);
    else {
      const blob = await cloudClip(engine, words, lang);
      ok = await playBlob(blob, my);
    }
  } catch (e) {
    warn((e?.message || 'Voice service failed').replace(/^API /, '') + ' Using the device voice instead.');
    if (my === token) ok = await deviceSay(words, lang, my);
  }
  if (my === token) emit(false);
  onend?.();
  return ok;
}

/** Say several lines one after another; onitem(i) fires as each starts. Returns false if interrupted. */
export async function sequence(lines, { onitem, lang = getLang() } = {}) {
  stop();
  const my = token;
  prefetch(lines, lang);
  for (let i = 0; i < lines.length; i++) {
    if (my !== token) return false;
    onitem?.(i);
    // say() bumps the token, so carry ours forward
    const ok = await sayKeep(lines[i], lang, my);
    if (!ok && my !== token) return false;
  }
  return true;
}
async function sayKeep(text, lang, my) {
  if (!enabled || !text) return false;
  const words = speakable(text, lang), engine = engineFor(lang);
  emit(true);
  let ok = false;
  try {
    if (engine === 'device') ok = await deviceSay(words, lang, my);
    else ok = await playBlob(await cloudClip(engine, words, lang), my);
  } catch (e) {
    warn((e?.message || 'Voice service failed').replace(/^API /, '') + ' Using the device voice instead.');
    ok = await deviceSay(words, lang, my);
  }
  if (my === token) emit(false);
  return ok;
}

/** Fetch cloud clips ahead of time so the next lines start without a pause. */
export function prefetch(lines, lang = getLang()) {
  const engine = engineFor(lang);
  if (engine === 'device' || !enabled) return;
  (async () => { for (const l of lines) { try { await cloudClip(engine, speakable(l, lang), lang); } catch { return; } } })();
}

export const isEnabled = () => enabled;
