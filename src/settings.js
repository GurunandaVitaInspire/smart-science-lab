// User settings for language, reading aloud and voice/translation services.
// Stored only in this browser. API keys typed here are sent only to this app's own
// server functions (/api/...), which forward them to ElevenLabs / Bhashini.
const KEY = 'ssl.settings.v1';

const DEFAULTS = {
  readAloud: true,          // read questions, answers and explanations aloud
  rate: 1,                  // speaking speed
  engine: 'auto',           // auto | device | eleven | bhashini
  translate: 'builtin',     // builtin | bhashini
  elevenKey: '',
  elevenVoice: 'JBFqnCBsd6RMkjVDRZzb',
  elevenModel: 'eleven_v3', // eleven_v3 / eleven_v4 / eleven_v4_turbo speak Telugu; eleven_multilingual_v2 does not
  bhashiniUser: '',
  bhashiniKey: '',
  bhashiniPipeline: '64392f96daac500b55c543cd',
  bhashiniGender: 'female',
};

function load() {
  try { return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch { return { ...DEFAULTS }; }
}

export const settings = load();

export function saveSettings(patch) {
  Object.assign(settings, patch);
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* private mode */ }
  document.dispatchEvent(new CustomEvent('settingschange', { detail: patch }));
}

/** Which services have keys on the server (Vercel environment variables). */
export const serverKeys = { eleven: false, bhashini: false, checked: false };
export async function checkServerKeys() {
  try {
    const r = await fetch('/api/status');
    if (r.ok) Object.assign(serverKeys, await r.json(), { checked: true });
  } catch { serverKeys.checked = true; }
  return serverKeys;
}

export const hasEleven = () => !!(settings.elevenKey || serverKeys.eleven);
export const hasBhashini = () => !!((settings.bhashiniUser && settings.bhashiniKey) || serverKeys.bhashini);

/** Headers that carry keys typed in Settings (empty when the server has its own). */
export function keyHeaders() {
  const h = {};
  if (settings.elevenKey) h['x-el-key'] = settings.elevenKey;
  if (settings.bhashiniUser) h['x-bh-user'] = settings.bhashiniUser;
  if (settings.bhashiniKey) h['x-bh-key'] = settings.bhashiniKey;
  if (settings.bhashiniPipeline) h['x-bh-pipeline'] = settings.bhashiniPipeline;
  return h;
}
