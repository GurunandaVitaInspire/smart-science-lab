// Ravi, the lab buddy, drawn entirely in SVG code as a jointed puppet.
// Rig pattern from the bang-motion skill ("kartun panggung", Law 5): every joint is a proxy
// {tx,ty,x,y,r,sx,sy} whose transform we write ourselves, so a limb always turns around its
// real joint (hip, knee, ankle, shoulder, elbow, wrist, neck), never around a bounding box.
// Feet stand on y = 0; the drawing is about 480 units tall.

const NS = 'http://www.w3.org/2000/svg';
const N = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};
const G = (parent, attrs) => N('g', attrs, parent);

/** A joint: rotates/scales around its own origin. */
export function J(el, tx = 0, ty = 0) {
  const j = {
    el, tx, ty, x: 0, y: 0, r: 0, sx: 1, sy: 1,
    apply() { el.setAttribute('transform', `translate(${j.tx + j.x},${j.ty + j.y}) rotate(${j.r}) scale(${j.sx},${j.sy})`); },
  };
  j.apply();
  return j;
}

// colours taken from the reference picture
const C = {
  skin: '#F7BC93', skinLight: '#FFD3B0', skinDark: '#E79A72', skinDeep: '#D98560',
  nose: '#F29A74', blush: '#F2877A',
  hair: '#4A2C1C', hairLight: '#74472F', hairDark: '#2E1A10',
  shirt: '#65843B', shirtLight: '#7C9C4D', shirtDark: '#4E6B2C', shirtDeep: '#425C25',
  shorts: '#BFA165', shortsLight: '#D2B87E', shortsDark: '#9C8250',
  shoe: '#F3E2AA', shoeLight: '#FBF0CB', shoeDark: '#DDC88A', sole: '#FBF3D8',
  eye: '#1C1310', mouth: '#8A3A2C', mouthIn: '#5E1F17', tongue: '#E2726C',
  watch: '#1F2023', watchFace: '#34373D',
};

let uid = 0;

export function buildRavi() {
  const id = `ravi${++uid}`;
  const svg = N('svg', { viewBox: '-170 -510 340 510', class: 'ravi-svg', overflow: 'visible', 'aria-hidden': 'true' });
  const defs = N('defs', {}, svg);
  const radial = (name, stops, cx = '38%', cy = '32%', r = '75%') => {
    const g = N('radialGradient', { id: `${id}-${name}`, cx, cy, r }, defs);
    stops.forEach(([o, c]) => N('stop', { offset: o, 'stop-color': c }, g));
    return `url(#${id}-${name})`;
  };
  const linear = (name, stops, x2 = 1, y2 = 0) => {
    const g = N('linearGradient', { id: `${id}-${name}`, x1: 0, y1: 0, x2, y2 }, defs);
    stops.forEach(([o, c]) => N('stop', { offset: o, 'stop-color': c }, g));
    return `url(#${id}-${name})`;
  };
  const blur = (name, sd) => { const f = N('filter', { id: `${id}-${name}`, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs); N('feGaussianBlur', { stdDeviation: sd }, f); return `url(#${id}-${name})`; };

  const F = {
    skin: radial('skin', [[0, C.skinLight], [0.55, C.skin], [1, C.skinDark]]),
    skinLimb: linear('skinLimb', [[0, C.skinDark], [0.35, C.skinLight], [0.7, C.skin], [1, C.skinDark]]),
    hair: radial('hair', [[0, C.hairLight], [0.6, C.hair], [1, C.hairDark]], '35%', '30%', '80%'),
    shirt: linear('shirt', [[0, C.shirtDark], [0.25, C.shirt], [0.55, C.shirtLight], [0.8, C.shirt], [1, C.shirtDark]]),
    sleeve: linear('sleeve', [[0, C.shirtDark], [0.4, C.shirtLight], [1, C.shirtDark]]),
    shorts: linear('shorts', [[0, C.shortsDark], [0.4, C.shortsLight], [1, C.shortsDark]]),
    shoe: radial('shoe', [[0, C.shoeLight], [0.6, C.shoe], [1, C.shoeDark]], '40%', '30%', '80%'),
    nose: radial('nose', [[0, '#FFC2A2'], [0.6, C.nose], [1, '#DE8160']], '40%', '35%', '70%'),
    bag: radial('bag', [[0, C.shirtLight], [0.7, C.shirt], [1, C.shirtDark]], '40%', '30%', '85%'),
    soft: blur('soft', 4), softer: blur('softer', 8),
  };

  const ref = { svg };
  const root = J(G(svg), 0, 0);
  ref.root = root;

  // ---------- legs: hip → knee → ankle ----------
  for (const s of [-1, 1]) {
    const side = s < 0 ? 'L' : 'R';
    const thigh = J(G(root.el), s * 33, -150);
    // shorts leg with a rolled cuff
    N('path', { d: 'M -31 -4 L 31 -4 L 36 54 L -36 54 Z', fill: F.shorts }, thigh.el);
    N('rect', { x: -38, y: 46, width: 76, height: 20, rx: 9, fill: C.shortsLight }, thigh.el);
    N('path', { d: 'M -36 50 Q 0 56 36 50', stroke: C.shortsDark, 'stroke-width': 2.5, fill: 'none', opacity: 0.6 }, thigh.el);
    const shin = J(G(thigh.el), 0, 64);
    N('rect', { x: -15, y: -4, width: 30, height: 52, rx: 14, fill: F.skinLimb }, shin.el);
    N('ellipse', { cx: 0, cy: 4, rx: 15, ry: 6, fill: C.skinDeep, opacity: 0.35, filter: F.soft }, shin.el); // shadow under the cuff
    const foot = J(G(shin.el), 0, 50);
    N('ellipse', { cx: s * 5, cy: 4, rx: 42, ry: 29, fill: F.shoe }, foot.el);
    N('ellipse', { cx: s * 5 - 10, cy: -8, rx: 14, ry: 7, fill: '#fff', opacity: 0.35, filter: F.soft }, foot.el);
    N('rect', { x: -44 + s * 5, y: 18, width: 88, height: 18, rx: 10, fill: C.sole }, foot.el);
    N('path', { d: `M ${-43 + s * 5} 23 L ${43 + s * 5} 23`, stroke: C.shoeDark, 'stroke-width': 2, opacity: 0.6 }, foot.el);
    for (let k = 0; k < 3; k++) N('path', { d: `M ${-12 + s * 4} ${-6 + k * 7} Q ${s * 4} ${-9 + k * 7} ${12 + s * 4} ${-6 + k * 7}`, stroke: C.shoeDark, 'stroke-width': 3, 'stroke-linecap': 'round', fill: 'none' }, foot.el);
    ref[side + 'thigh'] = thigh; ref[side + 'shin'] = shin; ref[side + 'foot'] = foot;
  }

  // ---------- torso (hip joint) ----------
  const torso = J(G(root.el), 0, -150);
  ref.torso = torso;
  const T = torso.el;
  N('path', { d: 'M -64 -126 C -76 -120 -82 -102 -82 -84 L -84 4 C -84 13 -78 17 -69 17 L 69 17 C 78 17 84 13 84 4 L 82 -84 C 82 -102 76 -120 64 -126 C 42 -136 24 -139 0 -139 C -24 -139 -42 -136 -64 -126 Z', fill: F.shirt }, T);
  N('path', { d: 'M -80 2 Q 0 12 80 2', stroke: C.shirtDeep, 'stroke-width': 3, fill: 'none', opacity: 0.5 }, T); // hem fold
  N('path', { d: 'M -40 -60 Q -30 -20 -42 10', stroke: C.shirtDark, 'stroke-width': 6, fill: 'none', opacity: 0.25, filter: F.soft }, T); // fabric fold
  N('ellipse', { cx: 0, cy: -128, rx: 34, ry: 10, fill: C.shirtDeep, opacity: 0.55, filter: F.soft }, T); // shadow under the chin
  N('ellipse', { cx: 0, cy: -134, rx: 27, ry: 9, fill: C.shirtDark }, T); // crew neck
  N('ellipse', { cx: 0, cy: -136, rx: 21, ry: 6, fill: C.skinDeep }, T);
  // crossbody strap
  N('path', { d: 'M -52 -132 C -22 -98 20 -70 58 -42', stroke: C.shirtDeep, 'stroke-width': 15, 'stroke-linecap': 'round', fill: 'none' }, T);
  N('path', { d: 'M -54 -136 C -24 -102 18 -74 56 -46', stroke: C.shirtLight, 'stroke-width': 2.5, 'stroke-linecap': 'round', fill: 'none', opacity: 0.55 }, T);

  // ---------- arms: shoulder → elbow → wrist ----------
  const arm = s => {
    const side = s < 0 ? 'L' : 'R';
    const sh = J(G(T), s * 70, -116);
    N('rect', { x: -14, y: 50, width: 28, height: 48, rx: 13, fill: F.skinLimb }, sh.el); // upper arm
    N('rect', { x: -25, y: -20, width: 50, height: 74, rx: 22, fill: F.sleeve }, sh.el); // sleeve
    N('rect', { x: -28, y: 40, width: 56, height: 22, rx: 11, fill: C.shirtLight }, sh.el); // rolled cuff
    N('path', { d: 'M -27 46 Q 0 52 27 46', stroke: C.shirtDark, 'stroke-width': 2.5, fill: 'none', opacity: 0.7 }, sh.el);
    const el = J(G(sh.el), 0, 92);
    N('rect', { x: -13, y: -8, width: 26, height: 70, rx: 13, fill: F.skinLimb }, el.el);
    if (s > 0) { // watch on his left wrist (screen right), as in the picture
      N('rect', { x: -15, y: 42, width: 30, height: 12, rx: 4, fill: C.watch }, el.el);
      N('rect', { x: -9, y: 39, width: 18, height: 17, rx: 4, fill: C.watchFace }, el.el);
    }
    const hand = J(G(el.el), 0, 60);
    const open = G(hand.el);
    N('ellipse', { cx: 0, cy: 14, rx: 17, ry: 20, fill: F.skin }, open);
    N('ellipse', { cx: -s * 13, cy: 8, rx: 7, ry: 11, fill: C.skin, transform: `rotate(${s * 25} ${-s * 13} 8)` }, open); // thumb
    N('path', { d: 'M -8 26 L -8 32 M 0 27 L 0 33 M 8 26 L 8 32', stroke: C.skinDeep, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.5 }, open);
    const point = G(hand.el, { opacity: 0 });
    N('rect', { x: -5.5, y: 18, width: 11, height: 36, rx: 5.5, fill: C.skin }, point); // index finger
    N('circle', { cx: 0, cy: 12, r: 16, fill: F.skin }, point);
    N('path', { d: 'M -10 18 Q 0 24 10 18', stroke: C.skinDeep, 'stroke-width': 2, fill: 'none', opacity: 0.5 }, point);
    ref[side + 'arm'] = sh; ref[side + 'fore'] = el; ref[side + 'hand'] = hand;
    ref[side + 'open'] = open; ref[side + 'point'] = point;
  };
  arm(-1);
  arm(1);

  // bag on the right hip, in front of the arm
  const bag = G(T);
  N('rect', { x: 26, y: -56, width: 72, height: 52, rx: 13, fill: F.bag }, bag);
  N('path', { d: 'M 26 -42 Q 26 -58 42 -58 L 82 -58 Q 98 -58 98 -42 L 98 -28 Q 62 -18 26 -28 Z', fill: C.shirtLight }, bag);
  N('path', { d: 'M 28 -28 Q 62 -18 96 -28', stroke: C.shirtDeep, 'stroke-width': 2.5, fill: 'none', opacity: 0.7 }, bag);
  N('circle', { cx: 62, cy: -24, r: 3.6, fill: C.shirtDeep }, bag);

  // ---------- head: neck joint → look joint ----------
  const head = J(G(T), 0, -138);
  const look = J(G(head.el), 0, 0);
  ref.head = head; ref.look = look;
  const H = look.el;
  N('rect', { x: -17, y: -16, width: 34, height: 22, rx: 8, fill: C.skinDeep }, H); // neck
  for (const s of [-1, 1]) { // ears
    N('ellipse', { cx: s * 77, cy: -72, rx: 16, ry: 22, fill: F.skin }, H);
    N('ellipse', { cx: s * 79, cy: -72, rx: 7, ry: 12, fill: C.skinDeep, opacity: 0.55 }, H);
  }
  // hair behind the head (back of the curls)
  // back of the hair, visible beside the face
  N('path', { d: 'M -86 -96 C -96 -150 -60 -196 0 -198 C 60 -196 96 -150 86 -96 L 70 -112 L -70 -112 Z', fill: C.hairDark }, H);
  // face
  N('path', { d: 'M -74 -92 C -74 -142 -40 -160 0 -160 C 40 -160 74 -142 74 -92 C 74 -38 48 -4 0 -4 C -48 -4 -74 -38 -74 -92 Z', fill: F.skin }, H);
  N('ellipse', { cx: 0, cy: -124, rx: 60, ry: 18, fill: C.skinDeep, opacity: 0.35, filter: F.soft }, H); // shadow under the hair
  for (const s of [-1, 1]) N('ellipse', { cx: s * 44, cy: -46, rx: 15, ry: 9, fill: C.blush, opacity: 0.45, filter: F.soft }, H);
  // eyes (blink = squash the group), pupils can look around
  const eyes = J(G(H), 0, -80);
  const pupils = J(G(eyes.el), 0, 0);
  ref.eyes = eyes; ref.pupils = pupils;
  for (const s of [-1, 1]) {
    N('ellipse', { cx: s * 27, cy: 0, rx: 8, ry: 10.5, fill: C.eye }, pupils.el);
    N('circle', { cx: s * 27 - 3, cy: -4, r: 2.8, fill: '#fff' }, pupils.el);
  }
  // eyebrows
  ref.brows = [-1, 1].map(s => N('path', { d: `M ${s * 18} -100 Q ${s * 28} -104 ${s * 38} -100`, stroke: C.hair, 'stroke-width': 3.2, 'stroke-linecap': 'round', fill: 'none', opacity: 0.85 }, H));
  // nose
  N('ellipse', { cx: 0, cy: -56, rx: 15, ry: 13, fill: F.nose }, H);
  N('ellipse', { cx: -5, cy: -61, rx: 5, ry: 3.5, fill: '#fff', opacity: 0.45 }, H);
  // mouth: a line for smile / neutral, a filled shape while talking
  ref.mouthLine = N('path', { d: 'M -12 -32 Q 0 -22 12 -32', stroke: C.mouth, 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none' }, H);
  const mouthOpen = G(H, { opacity: 0 });
  N('path', { d: 'M -11 -33 Q 0 -35 11 -33 Q 9 -17 0 -17 Q -9 -17 -11 -33 Z', fill: C.mouthIn }, mouthOpen);
  N('ellipse', { cx: 0, cy: -21, rx: 6, ry: 3.5, fill: C.tongue }, mouthOpen);
  ref.mouthOpen = mouthOpen;
  // hair: one wavy mop generated in code (bumpy crown, side volume, swooping fringe),
  // then tufts on top and lighter strands for texture
  const mop = [];
  const crown = (t) => 7 * Math.sin(t * 9) + 4 * Math.sin(t * 17 + 1.3) + 3 * Math.sin(t * 5 + 0.4);
  for (let i = 0; i <= 64; i++) { // from the left temple, over the top, to the right temple
    const t = Math.PI * (1.08 - (i / 64) * 1.16);
    const rr = 88 + crown(t);
    mop.push([Math.cos(t) * rr * 1.04, -104 - Math.sin(t) * rr * 0.98]);
  }
  for (let i = 0; i <= 28; i++) { // fringe, right to left, wavy and swept
    const u = i / 28, x = 84 - u * 168;
    const y = -112 + 9 * Math.sin(u * Math.PI * 5 + 0.6) * (0.6 + 0.4 * Math.sin(u * Math.PI)) - 10 * Math.sin(u * Math.PI) + (u < 0.12 || u > 0.88 ? 18 : 0);
    mop.push([x, y]);
  }
  const d = mop.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z';
  N('path', { d, fill: F.hair, 'stroke-linejoin': 'round' }, H);
  // tufts sticking up
  [[-30, -192, -38, -214, -16], [2, -196, 6, -222, 10], [30, -190, 44, -210, 14], [56, -176, 74, -186, 8]].forEach(([x, y, tx, ty, w]) =>
    N('path', { d: `M ${x - w} ${y + 6} Q ${tx} ${ty} ${x + w} ${y + 4} Z`, fill: C.hair }, H));
  // lighter strands (texture) and a soft shine
  [[-62, -150, -20, -178, -6, -150], [-20, -170, 18, -190, 30, -160], [24, -176, 56, -172, 64, -146], [-74, -124, -60, -150, -40, -142], [40, -150, 70, -150, 74, -122], [-40, -132, -10, -150, 10, -128], [8, -132, 34, -148, 48, -126]]
    .forEach(([x1, y1, cx, cy, x2, y2]) => N('path', { d: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`, stroke: C.hairLight, 'stroke-width': 3.5, 'stroke-linecap': 'round', fill: 'none', opacity: 0.6 }, H));
  N('ellipse', { cx: -26, cy: -170, rx: 26, ry: 9, fill: '#fff', opacity: 0.12, transform: 'rotate(-18 -26 -170)', filter: F.soft }, H);
  // a chibi head: a little bigger than real life, grown upwards from the neck
  look.sx = look.sy = 1.1; look.apply();

  return ref;
}

export const RAVI_VIEW = { x: -170, y: -510, w: 340, h: 510 };
// shoulder positions in drawing units (hip -150 + shoulder -116)
export const SHOULDER = { L: [-70, -266], R: [70, -266] };
