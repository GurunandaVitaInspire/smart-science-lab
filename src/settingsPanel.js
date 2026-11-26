// Settings: language, reading aloud, voice engine (device / ElevenLabs / Bhashini) and translations.
import { h } from './ui.js';
import { icon } from './icons.js';
import { audio } from './audio.js';
import { t, getLang, setLang, LANGS, warmBhashini, clearMt } from './i18n.js';
import { settings, saveSettings, serverKeys, checkServerKeys, hasEleven, hasBhashini, keyHeaders } from './settings.js';
import * as speech from './speech.js';

const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const MODELS = [
  ['eleven_v3', 'eleven_v3 · English + Telugu'],
  ['eleven_v4_turbo', 'eleven_v4_turbo · English + Telugu, faster'],
  ['eleven_v4', 'eleven_v4 · English + Telugu'],
  ['eleven_multilingual_v2', 'eleven_multilingual_v2 · English only (no Telugu)'],
];

export async function openSettings() {
  document.querySelector('.settings-back')?.remove();
  if (!serverKeys.checked) await checkServerKeys();
  const tel = speech.hasDeviceVoice('te');
  const status = (ok, server) => ok ? `<span class="st ok">${icon('check')} ${server ? t('Ready (server key)') : t('Ready')}</span>` : `<span class="st">${t('Not set up')}</span>`;
  const m = h(`<div class="modal-back settings-back"><div class="modal settings" role="dialog" aria-modal="true" aria-label="${t('Settings')}">
    <button class="m-close" aria-label="${t('Close')}">${icon('x')}</button>
    <h2>${t('Settings')}</h2>

    <section class="set-sec">
      <h3>${icon('languages')} ${t('Language')}</h3>
      <div class="seg" data-k="lang">${Object.entries(LANGS).map(([k, v]) => `<button data-v="${k}" class="${getLang() === k ? 'on' : ''}">${v}</button>`).join('')}</div>
      <label class="row"><input type="checkbox" data-k="readAloud" ${settings.readAloud ? 'checked' : ''}> ${t('Read questions, answers and explanations aloud')}</label>
      <label class="row">${t('Speaking speed')} <input type="range" min="0.7" max="1.3" step="0.05" data-k="rate" value="${esc(settings.rate)}"></label>
    </section>

    <section class="set-sec">
      <h3>${icon('listen')} ${t('Voice')}</h3>
      <div class="seg" data-k="engine">
        ${[['auto', t('Auto')], ['device', t('Device voice')], ['eleven', 'ElevenLabs'], ['bhashini', 'Bhashini']].map(([k, v]) => `<button data-v="${k}" class="${settings.engine === k ? 'on' : ''}">${v}</button>`).join('')}
      </div>
      <p class="hint">${t('Auto uses Bhashini or ElevenLabs for Telugu when they are set up, otherwise the device voice.')} ${tel ? t('This device has a Telugu voice.') : t('This device has no Telugu voice, so Telugu audio needs ElevenLabs or Bhashini.')}</p>
      <button class="mbtn small" data-a="test">${icon('play')} ${t('Test the voice')}</button>
    </section>

    <section class="set-sec">
      <h3>ElevenLabs ${status(hasEleven(), serverKeys.eleven && !settings.elevenKey)}</h3>
      <label class="field">${t('API key')}<input type="password" autocomplete="off" data-k="elevenKey" value="${esc(settings.elevenKey)}" placeholder="${serverKeys.eleven ? t('Using the key set on the server') : 'xi-api-key'}"></label>
      <label class="field">${t('Voice ID')}<span class="inline"><input data-k="elevenVoice" value="${esc(settings.elevenVoice)}"><button class="mbtn small" data-a="voices">${t('Load my voices')}</button></span><select data-k="elevenVoiceSel" hidden></select></label>
      <label class="field">${t('Model')}<select data-k="elevenModel">${MODELS.map(([k, v]) => `<option value="${k}" ${settings.elevenModel === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    </section>

    <section class="set-sec">
      <h3>Bhashini ${status(hasBhashini(), serverKeys.bhashini && !settings.bhashiniKey)}</h3>
      <label class="field">${t('User ID')}<input autocomplete="off" data-k="bhashiniUser" value="${esc(settings.bhashiniUser)}" placeholder="${serverKeys.bhashini ? t('Using the key set on the server') : 'userID'}"></label>
      <label class="field">${t('ULCA API key')}<input type="password" autocomplete="off" data-k="bhashiniKey" value="${esc(settings.bhashiniKey)}" placeholder="ulcaApiKey"></label>
      <label class="field">${t('Pipeline ID')}<input autocomplete="off" data-k="bhashiniPipeline" value="${esc(settings.bhashiniPipeline)}"></label>
      <div class="seg" data-k="bhashiniGender">${[['female', t('Female voice')], ['male', t('Male voice')]].map(([k, v]) => `<button data-v="${k}" class="${settings.bhashiniGender === k ? 'on' : ''}">${v}</button>`).join('')}</div>
      <h4>${t('Telugu text')}</h4>
      <div class="seg" data-k="translate">${[['builtin', t('Built-in translation')], ['bhashini', t('Bhashini machine translation')]].map(([k, v]) => `<button data-v="${k}" class="${settings.translate === k ? 'on' : ''}">${v}</button>`).join('')}</div>
      <div class="inline"><button class="mbtn small" data-a="translate">${icon('languages')} ${t('Translate everything now')}</button><button class="mbtn small ghost" data-a="clearmt">${t('Clear machine translations')}</button></div>
      <p class="progress-line" hidden></p>
    </section>

    <p class="hint">${t('Keys are saved only in this browser and sent only to this app\'s own server, which passes them to ElevenLabs or Bhashini. For a school, set them once as Vercel environment variables (ELEVENLABS_API_KEY, BHASHINI_USER_ID, BHASHINI_API_KEY) so students never see them.')}</p>
  </div></div>`);
  document.body.appendChild(m);
  const $ = s => m.querySelector(s);
  const close = () => { m.classList.add('out'); setTimeout(() => m.remove(), 220); };
  m.addEventListener('click', async e => {
    if (e.target === m || e.target.closest('.m-close')) { audio.tap(); close(); return; }
    const segBtn = e.target.closest('.seg button');
    if (segBtn) {
      const k = segBtn.parentElement.dataset.k, v = segBtn.dataset.v;
      segBtn.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === segBtn));
      audio.tap();
      if (k === 'lang') { setLang(v); close(); setTimeout(openSettings, 300); return; }
      saveSettings({ [k]: v });
      if (k === 'translate') document.dispatchEvent(new CustomEvent('langchange', { detail: getLang() }));
      return;
    }
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'test') { audio.tap(); speech.say(t('Hello! I am Ravi, your lab buddy. Let us learn chemistry together.')); }
    if (a === 'voices') {
      const r = await fetch('/api/eleven?voices=1', { headers: keyHeaders() });
      const j = await r.json().catch(() => ({}));
      const sel = $('[data-k=elevenVoiceSel]');
      if (!r.ok) { sel.hidden = true; alertLine(j.error || 'ElevenLabs error'); return; }
      sel.innerHTML = j.voices.map(v => `<option value="${v.id}" ${v.id === settings.elevenVoice ? 'selected' : ''}>${v.name}</option>`).join('');
      sel.hidden = false;
    }
    if (a === 'translate') {
      const line = $('.progress-line'); line.hidden = false; line.textContent = t('Translating…');
      try {
        const n = await warmBhashini(p => { line.textContent = `${t('Translating…')} ${Math.round(p * 100)}%`; });
        line.textContent = t('{n} lines translated with Bhashini.', { n });
        document.dispatchEvent(new CustomEvent('langchange', { detail: getLang() }));
      } catch (err) { line.textContent = err.message; }
    }
    if (a === 'clearmt') { clearMt(); alertLine(t('Machine translations cleared.')); }
  });
  const alertLine = msg => { const line = $('.progress-line'); line.hidden = false; line.textContent = msg; };
  m.addEventListener('change', e => {
    const el = e.target, k = el.dataset.k;
    if (!k) return;
    if (k === 'elevenVoiceSel') { $('[data-k=elevenVoice]').value = el.value; saveSettings({ elevenVoice: el.value }); return; }
    saveSettings({ [k]: el.type === 'checkbox' ? el.checked : el.type === 'range' ? +el.value : el.value.trim() });
  });
  addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); removeEventListener('keydown', esc); } });
}
