// Ravi as a living character: idle, blink, talk, wave, point, hop and roll.
// DOM layers handle travel (position → hop/squash rig → roll); the SVG joints handle the body.
// Idle numbers follow the bang-motion character guide: body ±1.1° / 1.7 s, head ±1.7° / 2.3 s,
// a blink every ~3.5 s lasting 0.13 s. Joints are tweened through proxies (Law 5).
import { gsap } from 'gsap';
import { buildRavi, RAVI_VIEW, SHOULDER } from './ravi.js';

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const MOUTH = { smile: 'M -12 -32 Q 0 -22 12 -32', neutral: 'M -10 -28 Q 0 -31 10 -28' };
const BROWS = {
  smile: s => `M ${s * 18} -100 Q ${s * 28} -104 ${s * 38} -100`,
  neutral: s => `M ${s * 16} -103 Q ${s * 26} -106 ${s * 38} -99`,
};

export function createMascot(parent) {
  const el = document.createElement('div');
  el.className = 'mascot';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="m-shadow"></div><div class="m-rig"><div class="m-roll"></div></div>';
  parent.appendChild(el);
  const rig = el.querySelector('.m-rig'), roll = el.querySelector('.m-roll'), shadow = el.querySelector('.m-shadow');
  const R = buildRavi();
  roll.appendChild(R.svg);
  gsap.set(rig, { transformOrigin: '50% 100%' });
  gsap.set(roll, { transformOrigin: '50% 62%' });

  /** Tween a joint proxy and write its transform each frame. */
  const T = (j, vars) => gsap.to(j, { duration: 0.45, ease: 'power2.out', ...vars, onUpdate: j.apply, overwrite: 'auto' });

  // ---------- size and position (x, y = between the feet, viewport px) ----------
  const pos = { x: -400, y: innerHeight, h: 260 };
  const W = h => (h * RAVI_VIEW.w) / RAVI_VIEW.h;
  const place = () => { el.style.transform = `translate(${pos.x - W(pos.h) / 2}px, ${pos.y - pos.h}px)`; };
  const size = h => { pos.h = h; el.style.height = h + 'px'; el.style.width = W(h) + 'px'; place(); };

  // ---------- poses ----------
  let pointing = null; // 'L' | 'R' | null
  const hand = (side, mode) => {
    gsap.to(R[side + 'open'], { opacity: mode === 'point' ? 0 : 1, duration: 0.12 });
    gsap.to(R[side + 'point'], { opacity: mode === 'point' ? 1 : 0, duration: 0.12 });
  };
  const restArm = side => {
    const s = side === 'R' ? 1 : -1;
    T(R[side + 'arm'], { r: -s * 7, duration: 0.6, ease: 'power3.out' });
    T(R[side + 'fore'], { r: s * 5, duration: 0.6 });
    T(R[side + 'hand'], { r: 0 });
    hand(side, 'open');
  };
  const rest = () => {
    pointing = null;
    restArm('L'); restArm('R');
    T(R.root, { r: 0 }); T(R.look, { r: 0 }); T(R.pupils, { x: 0, y: 0 });
  };
  const air = on => {
    if (on) {
      T(R.Rarm, { r: -58, duration: 0.25 }); T(R.Larm, { r: 58, duration: 0.25 });
      T(R.Rfore, { r: -22, duration: 0.25 }); T(R.Lfore, { r: 22, duration: 0.25 });
      T(R.Rfoot, { r: 10, duration: 0.25 }); T(R.Lfoot, { r: -10, duration: 0.25 });
      T(R.Rshin, { r: -6, duration: 0.25 }); T(R.Lshin, { r: 6, duration: 0.25 });
      hand('L', 'open'); hand('R', 'open');
    } else {
      T(R.Rfoot, { r: 0, duration: 0.3 }); T(R.Lfoot, { r: 0, duration: 0.3 });
      T(R.Rshin, { r: 0, duration: 0.3 }); T(R.Lshin, { r: 0, duration: 0.3 });
    }
  };

  // ---------- face ----------
  let mood = 'smile', talking = false, talkTimer = 0;
  const setMood = m => {
    mood = m;
    R.mouthLine.setAttribute('d', MOUTH[m] || MOUTH.smile);
    R.brows.forEach((b, k) => b.setAttribute('d', (BROWS[m] || BROWS.smile)(k ? 1 : -1)));
  };
  const mouth = open => {
    R.mouthOpen.setAttribute('opacity', open ? 1 : 0);
    R.mouthLine.setAttribute('opacity', open ? 0 : 1);
  };
  setMood('smile');

  // ---------- idle life ----------
  rest();
  const idle = [
    gsap.fromTo(R.torso, { r: -1.1 }, { r: 1.1, duration: 1.7, ease: 'sine.inOut', yoyo: true, repeat: -1, onUpdate: R.torso.apply }),
    gsap.fromTo(R.torso, { sy: 1 }, { sy: 1.012, duration: 1.9, ease: 'sine.inOut', yoyo: true, repeat: -1, onUpdate: R.torso.apply }),
    gsap.fromTo(R.head, { r: 1.7 }, { r: -1.7, duration: 2.3, ease: 'sine.inOut', yoyo: true, repeat: -1, onUpdate: R.head.apply }),
  ];
  let blinkCall = null;
  const blink = () => {
    gsap.timeline()
      .to(R.eyes, { sy: 0.08, duration: 0.05, onUpdate: R.eyes.apply })
      .to(R.eyes, { sy: 1, duration: 0.08, delay: 0.08, onUpdate: R.eyes.apply });
    blinkCall = gsap.delayedCall(3.5, blink);
  };
  blinkCall = gsap.delayedCall(1.4, blink);

  const api = {
    el, pos, size,
    get width() { return pos.h * 0.4; },
    setMood,
    talk(on) {
      talking = on;
      clearInterval(talkTimer);
      if (on) {
        let open = false;
        talkTimer = setInterval(() => { open = !open; mouth(open); }, 120);
        gsap.fromTo(R.head, { y: 0 }, { y: -2.5, duration: 0.24, yoyo: true, repeat: -1, ease: 'sine.inOut', onUpdate: R.head.apply, overwrite: false });
      } else {
        mouth(false);
        gsap.killTweensOf(R.head, 'y');
        T(R.head, { y: 0, duration: 0.2 });
      }
    },
    /** Point at a spot on the screen with the nearer arm; head, eyes and body turn towards it. */
    point(tx, ty) {
      const box = R.svg.getBoundingClientRect(), k = box.height / RAVI_VIEW.h;
      const sp = side => [box.left + (SHOULDER[side][0] - RAVI_VIEW.x) * k, box.top + (SHOULDER[side][1] - RAVI_VIEW.y) * k];
      const mid = box.left + box.width / 2;
      const side = tx >= mid ? 'R' : 'L', s = side === 'R' ? 1 : -1;
      const [sx, sy] = sp(side);
      let r = (Math.atan2(-(tx - sx), ty - sy) * 180) / Math.PI;
      // right arm swings through negative angles, left arm through positive ones (no wrapping past straight up)
      if (s > 0 && r > 0) r -= 360;
      if (s < 0 && r < 0) r += 360;
      // never straight up: his big head would hide the arm, so the hand comes out beside it
      r = s > 0 ? Math.max(-142, Math.min(-22, r)) : Math.max(22, Math.min(142, r));
      pointing = side;
      restArm(side === 'R' ? 'L' : 'R');
      T(R[side + 'arm'], { r, duration: 0.55, ease: 'back.out(1.7)' });
      T(R[side + 'fore'], { r: 0, duration: 0.4 });
      T(R[side + 'hand'], { r: 0 });
      hand(side, 'point');
      T(R.root, { r: s * 2.5, duration: 0.6 });
      T(R.look, { r: s * 6, duration: 0.6 });
      T(R.pupils, { x: s * 3.5, y: Math.sign(ty - sy) * 2, duration: 0.4 });
    },
    rest,
    /** Hand up, forearm waving. */
    wave(side = 'L') {
      const s = side === 'R' ? 1 : -1;
      hand(side, 'open');
      const tl = gsap.timeline();
      tl.add(T(R[side + 'arm'], { r: -s * 150, duration: 0.35, ease: 'back.out(1.6)' }))
        .to(R[side + 'fore'], { r: -s * 28, duration: 0.18, ease: 'sine.inOut', onUpdate: R[side + 'fore'].apply }, '<0.1')
        .to(R[side + 'fore'], { r: s * 22, duration: 0.22, ease: 'sine.inOut', yoyo: true, repeat: 4, onUpdate: R[side + 'fore'].apply })
        .add(T(R.look, { r: -s * 7, duration: 0.3 }), 0)
        .add(() => { if (pointing !== side) restArm(side); T(R.look, { r: 0, duration: 0.4 }); });
      return tl;
    },
    /** Rolls in from off-screen right, lands, and waves hello. */
    enter(x, y) {
      pos.x = innerWidth + W(pos.h); pos.y = y; place();
      const tl = gsap.timeline();
      if (reduced()) { pos.x = x; place(); return tl.to(el, { opacity: 1, duration: 0.2 }); }
      air(true);
      tl.set(el, { opacity: 1 })
        .to(pos, { x, duration: 1.15, ease: 'power2.out', onUpdate: place }, 0)
        .fromTo(roll, { rotation: 0 }, { rotation: -720, duration: 1.15, ease: 'power2.out' }, 0)
        .fromTo(rig, { y: 0 }, { y: -26, duration: 0.29, ease: 'sine.out', yoyo: true, repeat: 3 }, 0)
        .set(roll, { rotation: 0 })
        .add(() => { air(false); rest(); })
        .to(rig, { scaleY: 0.86, scaleX: 1.1, duration: 0.1, ease: 'power2.out' })
        .to(rig, { scaleY: 1, scaleX: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
        .add(this.wave('L'), '-=0.45');
      return tl;
    },
    /** Hops to a new spot: squash, arc through the air with arms out, land, wobble. */
    hopTo(x, y) {
      const x0 = pos.x, y0 = pos.y, dist = Math.hypot(x - x0, y - y0);
      const tl = gsap.timeline();
      if (dist < 4) return tl;
      if (reduced()) return tl.to(pos, { x, y, duration: 0.3, onUpdate: place });
      const hops = Math.max(1, Math.min(4, Math.round(dist / 340)));
      const dir = Math.sign(x - x0) || 0;
      tl.add(() => { pointing = null; air(true); T(R.root, { r: 0 }); T(R.look, { r: dir * 6 }); T(R.pupils, { x: dir * 4, y: 0 }); });
      for (let i = 0; i < hops; i++) {
        const ax = x0 + ((x - x0) * i) / hops, ay = y0 + ((y - y0) * i) / hops;
        const bx = x0 + ((x - x0) * (i + 1)) / hops, by = y0 + ((y - y0) * (i + 1)) / hops;
        const height = Math.min(150, 60 + dist / hops / 5) + Math.max(0, ay - by) * 0.4;
        const fly = { p: 0 };
        tl.to(rig, { scaleY: 0.88, scaleX: 1.08, duration: 0.11, ease: 'power2.out' })
          .to(rig, { scaleY: 1.06, scaleX: 0.95, rotation: dir * 8, duration: 0.14, ease: 'power2.out' })
          .to(fly, {
            p: 1, duration: 0.42 + Math.min(0.2, dist / hops / 2500), ease: 'none',
            onUpdate: () => {
              const p = fly.p, k = Math.sin(Math.PI * p);
              pos.x = ax + (bx - ax) * gsap.parseEase('power1.inOut')(p);
              pos.y = ay + (by - ay) * p;
              place();
              gsap.set(rig, { y: -height * k });
              gsap.set(shadow, { scale: 1 - 0.45 * k, opacity: 1 - 0.5 * k });
            },
          }, '<')
          .to(rig, { scaleY: 0.86, scaleX: 1.1, rotation: 0, duration: 0.09, ease: 'power2.in' })
          .to(rig, { scaleY: 1, scaleX: 1, duration: 0.45, ease: 'elastic.out(1, 0.45)' });
      }
      tl.add(() => { air(false); rest(); }, '-=0.4');
      return tl;
    },
    /** Waves goodbye and hops away off the right edge. */
    leave() {
      const tl = gsap.timeline();
      tl.add(() => rest()).add(this.wave('R'))
        .add(this.hopTo(innerWidth + W(pos.h), pos.y), '-=0.3')
        .to(el, { opacity: 0, duration: 0.2 });
      return tl;
    },
    destroy() {
      clearInterval(talkTimer);
      idle.forEach(t => t.kill());
      blinkCall?.kill();
      const joints = Object.values(R).filter(v => v && v.apply);
      gsap.killTweensOf([rig, roll, shadow, pos, el, ...joints, R.Lopen, R.Ropen, R.Lpoint, R.Rpoint]);
      el.remove();
    },
  };
  gsap.set(el, { opacity: 0 });
  return api;
}
