// Bhashini (ULCA / Dhruva) proxy for translation and Telugu speech.
// POST { task: 'translation', texts: [...], source: 'en', target: 'te' } → { texts: [...] }
// POST { task: 'tts', text, lang: 'te', gender: 'female' }               → audio/wav
// Credentials: BHASHINI_USER_ID + BHASHINI_API_KEY (+ optional BHASHINI_PIPELINE_ID) environment
// variables, or the x-bh-user / x-bh-key / x-bh-pipeline headers from the app's Settings.
// Flow (Bhashini docs): 1) pipeline config call → serviceId + callback URL + inference key,
// 2) compute call to the callback URL with that key.
import { readJson, send, header } from './_shared.js';

const CONFIG_URL = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline';
const DEFAULT_PIPELINE = '64392f96daac500b55c543cd';
const configs = new Map(); // per user/task/language, kept for an hour

async function getConfig({ user, key, pipeline }, task, language, fresh) {
  const id = `${user}|${pipeline}|${task}|${language.sourceLanguage}|${language.targetLanguage || ''}`;
  const hit = configs.get(id);
  if (hit && !fresh && Date.now() - hit.at < 3600e3) return hit;
  const r = await fetch(CONFIG_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', userID: user, ulcaApiKey: key },
    body: JSON.stringify({ pipelineTasks: [{ taskType: task, config: { language } }], pipelineRequestConfig: { pipelineId: pipeline } }),
  });
  if (!r.ok) throw Object.assign(new Error(`Bhashini config: ${(await r.text()).slice(0, 300)}`), { status: r.status });
  const j = await r.json();
  const svc = j.pipelineResponseConfig?.find(p => p.taskType === task)?.config?.[0];
  const ep = j.pipelineInferenceAPIEndPoint;
  if (!svc?.serviceId || !ep?.callbackUrl) throw Object.assign(new Error('Bhashini has no service for this language'), { status: 400 });
  const cfg = { serviceId: svc.serviceId, url: ep.callbackUrl, authName: ep.inferenceApiKey?.name || 'Authorization', authValue: ep.inferenceApiKey?.value, at: Date.now() };
  configs.set(id, cfg);
  return cfg;
}

async function compute(creds, task, language, input, extra = {}) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const cfg = await getConfig(creds, task, language, attempt > 0);
    const r = await fetch(cfg.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [cfg.authName]: cfg.authValue },
      body: JSON.stringify({
        pipelineTasks: [{ taskType: task, config: { language, serviceId: cfg.serviceId, ...extra } }],
        inputData: { input: input.map(source => ({ source })), audio: [{ audioContent: null }] },
      }),
    });
    if ((r.status === 401 || r.status === 403) && attempt === 0) continue; // key expired: fetch a fresh config once
    if (!r.ok) throw Object.assign(new Error(`Bhashini: ${(await r.text()).slice(0, 300)}`), { status: r.status });
    return (await r.json()).pipelineResponse?.[0];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' });
  const creds = {
    user: header(req, 'x-bh-user') || process.env.BHASHINI_USER_ID,
    key: header(req, 'x-bh-key') || process.env.BHASHINI_API_KEY,
    pipeline: header(req, 'x-bh-pipeline') || process.env.BHASHINI_PIPELINE_ID || DEFAULT_PIPELINE,
  };
  if (!creds.user || !creds.key) return send(res, 400, { error: 'No Bhashini user ID / API key. Add them in Settings or set BHASHINI_USER_ID and BHASHINI_API_KEY on the server.' });
  try {
    const body = await readJson(req);
    if (body.task === 'translation') {
      const texts = (body.texts || []).filter(s => typeof s === 'string').slice(0, 50);
      if (!texts.length) return send(res, 400, { error: 'No texts' });
      const out = await compute(creds, 'translation', { sourceLanguage: body.source || 'en', targetLanguage: body.target || 'te' }, texts);
      return send(res, 200, { texts: (out?.output || []).map(o => o.target) });
    }
    if (body.task === 'tts') {
      const text = String(body.text || '');
      if (!text || text.length > 3000) return send(res, 400, { error: 'Text is missing or too long' });
      const out = await compute(creds, 'tts', { sourceLanguage: body.lang || 'te' }, [text], { gender: body.gender === 'male' ? 'male' : 'female' });
      const b64 = out?.audio?.[0]?.audioContent;
      if (!b64) return send(res, 502, { error: 'Bhashini returned no audio' });
      return send(res, 200, Buffer.from(b64, 'base64'), 'audio/wav');
    }
    return send(res, 400, { error: 'Unknown task' });
  } catch (e) {
    return send(res, e.status && e.status < 600 ? e.status : 502, { error: e.message });
  }
}
