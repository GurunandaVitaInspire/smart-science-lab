// Tells the app which voice/translation services have keys on the server (never the keys).
import { send } from './_shared.js';

export default function handler(req, res) {
  send(res, 200, {
    eleven: !!process.env.ELEVENLABS_API_KEY,
    bhashini: !!(process.env.BHASHINI_USER_ID && process.env.BHASHINI_API_KEY),
  });
}
