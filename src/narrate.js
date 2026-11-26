// Reading the app aloud. Narration follows two switches: the voice button (mic) in the
// top bar and "Read questions and answers aloud" in Settings.
import * as speech from './speech.js';
import { settings } from './settings.js';
import { audio } from './audio.js';

export const readAloud = () => settings.readAloud && audio.voiceOn;

/** Say one already-translated line (if reading aloud is on). */
export function narrate(text, opts) {
  if (!readAloud()) { opts?.onend?.(); return Promise.resolve(false); }
  return speech.say(text, opts);
}

/** Say several lines in order; onitem(i) runs as each starts. */
export function narrateAll(lines, opts) {
  if (!readAloud()) return Promise.resolve(false);
  return speech.sequence(lines.filter(Boolean), opts);
}

export const hush = () => speech.stop();
export { sayOption, sayFormula } from './speech.js';
