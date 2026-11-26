// Score, streak and all the "reactions" (sound, voice, particles, banners)
// shared by every game.
import { audio, cheer, streakCheer, wrongLine, learnLine } from '../audio.js';
import { t } from '../i18n.js';
import { burst, floatText, banner, flash, rain, centerOf, shake } from '../fx.js';
import { pulse, setWarp } from '../three/engine.js';

export class Session {
  constructor(game, total, hud) {
    this.game = game;
    this.total = total;
    this.hud = hud; // { score, streak, bar, count }
    this.done = 0;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.firstTry = 0;
    this.render();
  }

  render() {
    const { hud } = this;
    if (!hud) return;
    hud.score.textContent = this.score;
    hud.streak.textContent = this.streak;
    hud.streakBox.classList.toggle('hot', this.streak >= 3);
    hud.count.textContent = `${Math.min(this.done + 1, this.total)} / ${this.total}`;
    hud.bar.style.width = `${(this.done / this.total) * 100}%`;
  }

  bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

  /** First-try correct answer: points + celebration. */
  correct(fromEl, opts = {}) {
    this.streak++;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    this.firstTry++;
    const bonus = this.streak >= 5 ? 10 : this.streak >= 3 ? 5 : 0;
    const pts = 10 + bonus;
    this.score += pts;
    const [x, y] = fromEl ? centerOf(fromEl) : [innerWidth / 2, innerHeight / 2];
    burst(x, y, { count: opts.small ? 26 : 50 });
    floatText(x, y - 20, `+${pts}`, '#34d399');
    pulse('#4ade80');
    flash('good');
    const milestone = this.streak === 3 || this.streak === 5 || (this.streak >= 10 && this.streak % 5 === 0);
    if (milestone) {
      audio.streak();
      banner(t('{n} in a row', { n: this.streak }), this.streak >= 5 ? t('Unstoppable · +10 bonus each') : t('On fire · +5 bonus each'));
      rain(120);
      setWarp(1.5);
      if (!opts.quiet) audio.say(streakCheer());
    } else {
      audio.correct();
      if (!opts.quiet) audio.say(cheer());
    }
    audio.setIntensity(this.streak >= 3 ? 1 : 0);
    if (this.hud) { this.bump(this.hud.scoreBox); if (this.streak >= 3) this.bump(this.hud.streakBox); }
    this.render();
    return pts;
  }

  /** Wrong answer: no points, streak lost, show the right answer. */
  wrong(el, opts = {}) {
    if (this.streak >= 3) banner(t('Streak lost'), t('Keep going, you can do it!'), 'soft');
    this.streak = 0;
    audio.setIntensity(0);
    audio.wrong();
    if (el) shake(el);
    flash('bad');
    if (!opts.quiet) audio.say(opts.line || wrongLine());
    this.render();
  }

  /** The child fixed the answer after seeing it: encourage, no points. */
  learned(el, opts = {}) {
    audio.learn();
    if (el) { const [x, y] = centerOf(el); burst(x, y, { count: 16, speed: 5, colors: ['#93c5fd', '#c4b5fd', '#ffffff'] }); }
    if (!opts.quiet) audio.say(learnLine());
  }

  step() { this.done++; this.render(); }
}
