// ElevenLabs text-to-speech proxy.
// POST { text, voiceId, modelId, lang }  → audio/mpeg
// GET  ?voices=1                          → { voices: [{ id, name }] }
// The key comes from the ELEVENLABS_API_KEY environment variable, or from the
// x-el-key header when a teacher typed their own key in the app's Settings.
import { readJson, send, header } from './_shared.js';

const API = 'https://api.elevenlabs.io/v1';
const TELUGU_MODELS = ['eleven_v3', 'eleven_v4', 'eleven_v4_turbo', 'eleven_v3_conversational'];

export default async function handler(req, res) {
  const key = header(req, 'x-el-key') || process.env.ELEVENLABS_API_KEY;
  if (!key) return send(res, 400, { error: 'No ElevenLabs API key. Add one in Settings or set ELEVENLABS_API_KEY on the server.' });
  try {
    if (req.method === 'GET') {
      const r = await fetch(`${API}/voices`, { headers: { 'xi-api-key': key } });
      if (!r.ok) return send(res, r.status, { error: `ElevenLabs: ${(await r.text()).slice(0, 300)}` });
      const j = await r.json();
      return send(res, 200, { voices: (j.voices || []).map(v => ({ id: v.voice_id, name: v.name })) });
    }
    if (req.method !== 'POST') return send(res, 405, { error: 'Use POST' });
    const { text, voiceId, modelId = 'eleven_v3', lang } = await readJson(req);
    if (!text || typeof text !== 'string' || text.length > 3000) return send(res, 400, { error: 'Text is missing or too long' });
    const body = { text, model_id: modelId };
    // language_code is ignored by multilingual_v2; v3/v4 accept it (ISO 639-1, e.g. "te")
    if (lang && modelId !== 'eleven_multilingual_v2') body.language_code = lang;
    if (lang === 'te' && !TELUGU_MODELS.includes(modelId)) return send(res, 400, { error: `${modelId} cannot speak Telugu. Choose eleven_v3 or eleven_v4 in Settings.` });
    const r = await fetch(`${API}/text-to-speech/${encodeURIComponent(voiceId || 'JBFqnCBsd6RMkjVDRZzb')}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify(body),
    });
    if (!r.ok) return send(res, r.status, { error: `ElevenLabs: ${(await r.text()).slice(0, 300)}` });
    return send(res, 200, Buffer.from(await r.arrayBuffer()), 'audio/mpeg');
  } catch (e) {
    return send(res, 502, { error: `ElevenLabs request failed: ${e.message}` });
  }
}
