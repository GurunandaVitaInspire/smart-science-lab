// Lucide icons as SVG strings for the plain-JS screens.
import {
  createElement, Sun, Moon, Music, Volume2, Mic, Maximize, ArrowLeft, ArrowRight, Atom, ScrollText, Zap, Combine,
  Scale, FlaskConical, Play, RotateCcw, House, Star, Flame, Trophy, X, Check, Hand, Sparkles, Gem, Hexagon, MousePointerClick,
  Settings, BookOpen, Languages, Pause, Square, GraduationCap, ClipboardCheck, Headphones,
} from 'lucide';

const SET = {
  sun: Sun, moon: Moon, music: Music, volume: Volume2, mic: Mic, maximize: Maximize, back: ArrowLeft, next: ArrowRight,
  atom: Atom, scroll: ScrollText, zap: Zap, combine: Combine, scale: Scale, flask: FlaskConical, play: Play, again: RotateCcw,
  home: House, star: Star, flame: Flame, trophy: Trophy, x: X, check: Check, hand: Hand, sparkles: Sparkles, gem: Gem,
  hexagon: Hexagon, pointer: MousePointerClick,
  settings: Settings, book: BookOpen, languages: Languages, pause: Pause, stop: Square, learn: GraduationCap, test: ClipboardCheck, listen: Headphones,
};

export function icon(name, cls = 'ic') {
  const el = createElement(SET[name]);
  el.setAttribute('class', cls);
  el.setAttribute('aria-hidden', 'true');
  return el.outerHTML;
}
