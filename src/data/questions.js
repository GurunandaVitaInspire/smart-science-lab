// All 100 questions from "SMART SCIENCE LAB · Play and Learn" (Class IX, Atoms and Molecules).
// Formula text: H2SO4 -> subscripts, ^2+ -> superscript charge.
// q: question, a: correct answer, t: wrong options, w: why (shown after answering)
// stage: what the 3D stage shows. keep: keep the option order (True/False, Cation/Anion).

/* ---------- Game 1 · Element Quiz (1 to 30) ---------- */
const WH = (z, a, t, w) => ({ z, kind: 'Name', q: `Element with atomic number ${z} is`, a, t, w });
const SYM = (z, name, a, t, w) => ({ z, kind: 'Symbol', q: `Symbol of ${name}`, a, t, w });
const ZN = (z, s, t, w) => ({ z, kind: 'Atomic no.', q: `Atomic number of ${s}`, a: String(z), t: t.map(String), w });
const IS = (z, s, a, t, w) => ({ z, kind: 'Name', q: `${s} is the symbol of`, a, t, w });

export const GAME1 = [
  WH(1, 'Hydrogen', ['Helium', 'Lithium', 'Oxygen'], 'Hydrogen (H) is the first and lightest element.'),
  SYM(2, 'Helium', 'He', ['HE', 'he', 'H'], 'Helium is He: first letter capital, second letter small. H alone is hydrogen.'),
  ZN(3, 'Li', [2, 4, 5], 'Lithium (Li) is element 3. It has 3 protons and 3 electrons.'),
  ZN(4, 'Beryllium', [3, 5, 6], 'Beryllium (Be) is element 4.'),
  SYM(5, 'Boron', 'B', ['b', 'Bo', 'Br'], 'Boron is B. A one-letter symbol is always a capital. Br is bromine.'),
  ZN(6, 'C', [5, 7, 12], 'Carbon (C) is element 6. 12 is its atomic mass, not its atomic number.'),
  SYM(7, 'Nitrogen', 'N', ['n', 'Ni', 'Ne'], 'Nitrogen is N. Ni is nickel and Ne is neon.'),
  WH(8, 'Oxygen', ['Nitrogen', 'Fluorine', 'Carbon'], 'Oxygen (O) is element 8.'),
  SYM(9, 'Fluorine', 'F', ['f', 'Fl', 'Fe'], 'Fluorine is F. Fe is iron.'),
  ZN(10, 'Ne', [9, 11, 8], 'Neon (Ne) is element 10.'),
  SYM(11, 'Sodium', 'Na', ['NA', 'nA', 'So'], 'Sodium is Na, from the Latin natrium. First letter capital, second letter small.'),
  SYM(12, 'Magnesium', 'Mg', ['MG', 'Mn', 'mG'], 'Magnesium is Mg. Mn is manganese, a different element.'),
  ZN(13, 'Aluminium', [12, 14, 27], 'Aluminium (Al) is element 13. 27 is its atomic mass.'),
  IS(14, 'Si', 'Silicon', ['Silver', 'Sulphur', 'Sodium'], 'Si is silicon. Silver is Ag, sulphur is S and sodium is Na.'),
  ZN(15, 'Phosphorus', [14, 16, 31], 'Phosphorus (P) is element 15. 31 is its atomic mass.'),
  WH(16, 'Sulphur', ['Phosphorus', 'Chlorine', 'Silicon'], 'Sulphur (S) is element 16.'),
  SYM(17, 'Chlorine', 'Cl', ['CL', 'cl', 'C'], 'Chlorine is Cl: capital C, small l. C alone is carbon.'),
  ZN(18, 'Ar', [17, 19, 20], 'Argon (Ar) is element 18.'),
  SYM(19, 'Potassium', 'K', ['k', 'P', 'Po'], 'Potassium is K, from the Latin kalium. P is phosphorus.'),
  SYM(20, 'Calcium', 'Ca', ['CA', 'cA', 'C'], 'Calcium is Ca: capital C, small a.'),
  WH(21, 'Scandium', ['Calcium', 'Titanium', 'Sodium'], 'Scandium (Sc) is element 21, just after calcium (20).'),
  SYM(22, 'Titanium', 'Ti', ['TI', 'ti', 'T'], 'Titanium is Ti.'),
  IS(23, 'V', 'Vanadium', ['Tungsten', 'Titanium', 'Chromium'], 'V is vanadium (element 23). Tungsten is W.'),
  ZN(24, 'Chromium', [23, 25, 26], 'Chromium (Cr) is element 24.'),
  SYM(25, 'Manganese', 'Mn', ['MN', 'Mg', 'Ma'], 'Manganese is Mn. Mg is magnesium.'),
  IS(26, 'Fe', 'Iron', ['Fluorine', 'Lead', 'Copper'], 'Fe is iron, from the Latin ferrum. Fluorine is F.'),
  SYM(27, 'Cobalt', 'Co', ['CO', 'co', 'Cb'], 'Co is cobalt. CO with two capitals is carbon monoxide, a compound of C and O!'),
  ZN(28, 'Ni', [27, 29, 30], 'Nickel (Ni) is element 28.'),
  IS(29, 'Cu', 'Copper', ['Calcium', 'Cobalt', 'Chromium'], 'Cu is copper, from the Latin cuprum.'),
  SYM(30, 'Zinc', 'Zn', ['ZN', 'zn', 'Z'], 'Zinc is Zn, element 30.'),
].map(x => ({ ...x, stage: { type: 'element', z: x.z } }));

/* ---------- Game 2 · Latin Names (2 boards of 5) ---------- */
export const LATIN_BOARDS = [
  {
    name: 'Board A',
    pairs: [
      { el: 'Gold', latin: 'Aurum', sym: 'Au', icon: '🪙' },
      { el: 'Silver', latin: 'Argentum', sym: 'Ag', icon: '💍' },
      { el: 'Iron', latin: 'Ferrum', sym: 'Fe', icon: '🔩' },
      { el: 'Sodium', latin: 'Natrium', sym: 'Na', icon: '🧂' },
      { el: 'Potassium', latin: 'Kalium', sym: 'K', icon: '🍌' },
    ],
  },
  {
    name: 'Board B',
    pairs: [
      { el: 'Copper', latin: 'Cuprum', sym: 'Cu', icon: '🔌' },
      { el: 'Mercury', latin: 'Hydrargyrum', sym: 'Hg', icon: '🌡️' },
      { el: 'Lead', latin: 'Plumbum', sym: 'Pb', icon: '🔋' },
      { el: 'Tin', latin: 'Stannum', sym: 'Sn', icon: '🥫' },
      { el: 'Tungsten', latin: 'Wolfram', sym: 'W', icon: '💡' },
    ],
  },
];

/* ---------- Game 3 · Ions ---------- */
// stage.ion: which ion model to show; hide: hide the charge until answered; mystery: show "?" orb first
const I = (kind, q, a, t, w, stage, extra) => ({ kind, q, a, t, w, stage: { type: 'ion', ...stage }, ...extra });
export const GAME3 = [
  I('Valency', 'Valency of Na^+', '1', ['2', '3', '0'], 'Charge 1+ means valency 1. Sodium gives away 1 electron.', { ion: 'Na' }),
  I('Name', 'NH4^+ is called', 'Ammonium ion', ['Ammonia', 'Nitrate ion', 'Nitride ion'], 'NH4^+ is the ammonium ion. Ammonia is NH3, a neutral molecule.', { ion: 'NH4' }),
  I('Formula', 'Formula of calcium ion', 'Ca^2+', ['Ca^+', 'Ca^2−', 'C^2+'], 'Calcium gives away 2 electrons, so its ion is Ca^2+.', { ion: 'Ca', hide: true }),
  I('Valency', 'Valency of SO4^2−', '2', ['1', '3', '4'], 'The whole group has charge 2−, so the valency is 2. The 4 is only the number of O atoms.', { ion: 'SO4' }),
  I('Name', 'Cl^− is called', 'Chloride ion', ['Chlorine', 'Chlorate ion', 'Chloro ion'], 'A chlorine atom gains 1 electron and becomes the chloride ion.', { ion: 'Cl' }),
  I('Formula', 'Formula of hydroxide ion', 'OH^−', ['OH^+', 'H^+', 'O^2−'], 'The hydroxide ion is OH^−, a group of 2 atoms with valency 1.', { ion: 'OH', hide: true }),
  I('Valency', 'Valency of Al^3+', '3', ['1', '2', '4'], 'Charge 3+ means valency 3.', { ion: 'Al' }),
  I('Name', 'CO3^2− is called', 'Carbonate ion', ['Carbon dioxide', 'Carbide ion', 'Hydrogen carbonate ion'], 'CO3^2− is the carbonate ion. Hydrogen carbonate is HCO3^−.', { ion: 'CO3' }),
  I('Formula', 'Formula of nitrate ion', 'NO3^−', ['NO2^−', 'NO3^2−', 'N^3−'], 'The nitrate ion is NO3^− with valency 1. NO2^− is nitrite.', { ion: 'NO3', hide: true }),
  I('Type', 'Mg^2+ is a', 'Cation', ['Anion'], 'A positive ion is a cation. A negative ion is an anion.', { ion: 'Mg', hide: true }, { keep: true }),
  I('Valency', 'Valency of PO4^3−', '3', ['1', '2', '4'], 'Phosphate has charge 3−, so its valency is 3.', { ion: 'PO4' }),
  I('Formula', 'Formula of zinc ion', 'Zn^2+', ['Zn^+', 'Zn^3+', 'Zn^2−'], 'The zinc ion is Zn^2+, with valency 2.', { ion: 'Zn', hide: true }),
  I('Name', 'O^2− is called', 'Oxide ion', ['Oxygen', 'Ozone', 'Hydroxide ion'], 'An oxygen atom gains 2 electrons and becomes the oxide ion.', { ion: 'O' }),
  I('Formula', 'Formula of sulphate ion', 'SO4^2−', ['SO3^2−', 'S^2−', 'SO4^−'], 'Sulphate is SO4^2−. SO3^2− is sulphite and S^2− is sulphide.', { ion: 'SO4', hide: true }),
  I('Valency', 'Valency of K^+', '1', ['2', '3', '0'], 'Charge 1+ means valency 1.', { ion: 'K' }),
  I('Name', 'PO4^3− is called', 'Phosphate ion', ['Phosphide ion', 'Phosphorus', 'Phosphite ion'], 'PO4^3− is the phosphate ion.', { ion: 'PO4' }),
  I('Type', 'Which one is a polyatomic ion?', 'NH4^+', ['Na^+', 'Cl^−', 'Mg^2+'], 'NH4^+ is a group of atoms (1 N + 4 H) carrying one charge.', { ion: 'NH4', mystery: true }),
  I('Formula', 'Formula of ammonium ion', 'NH4^+', ['NH3', 'NH4^−', 'N^3−'], 'The ammonium ion is NH4^+. NH3 is ammonia gas.', { ion: 'NH4', hide: true }),
  I('Valency', 'Valency of NO3^− (careful: 3 oxygens!)', '1', ['2', '3', '4'], 'Look at the charge, not the 3 oxygens. NO3^− has charge 1−, so valency 1.', { ion: 'NO3' }),
  I('Type', 'Which ion has valency 2?', 'CO3^2−', ['OH^−', 'NO3^−', 'Al^3+'], 'Carbonate CO3^2− has charge 2−, so its valency is 2.', { ion: 'CO3', mystery: true }),
];

/* ---------- Game 4 · Criss-Cross ---------- */
export const IONS = {
  Na: { s: 'Na', c: '+', v: 1, n: 'Sodium' },
  K: { s: 'K', c: '+', v: 1, n: 'Potassium' },
  NH4: { s: 'NH4', c: '+', v: 1, n: 'Ammonium', p: true },
  Ca: { s: 'Ca', c: '2+', v: 2, n: 'Calcium' },
  Mg: { s: 'Mg', c: '2+', v: 2, n: 'Magnesium' },
  Zn: { s: 'Zn', c: '2+', v: 2, n: 'Zinc' },
  Al: { s: 'Al', c: '3+', v: 3, n: 'Aluminium' },
  Cl: { s: 'Cl', c: '−', v: 1, n: 'Chloride' },
  OH: { s: 'OH', c: '−', v: 1, n: 'Hydroxide', p: true },
  NO3: { s: 'NO3', c: '−', v: 1, n: 'Nitrate', p: true },
  O: { s: 'O', c: '2−', v: 2, n: 'Oxide' },
  SO4: { s: 'SO4', c: '2−', v: 2, n: 'Sulphate', p: true },
  CO3: { s: 'CO3', c: '2−', v: 2, n: 'Carbonate', p: true },
  PO4: { s: 'PO4', c: '3−', v: 3, n: 'Phosphate', p: true },
};

export const GAME4 = [
  ['Na', 'Cl', '1s are not written'], ['K', 'OH', '1s are not written'], ['NH4', 'Cl', 'No bracket for 1'],
  ['Mg', 'Cl', 'Direct'], ['Ca', 'OH', 'Add brackets'], ['Zn', 'NO3', 'Add brackets'], ['Al', 'Cl', 'Direct'],
  ['Al', 'OH', 'Add brackets'], ['Na', 'O', 'Direct'], ['K', 'SO4', 'No bracket for 1'], ['NH4', 'SO4', 'Bracket on cation'],
  ['Na', 'CO3', 'Direct'], ['Ca', 'O', 'Cut down 2 : 2'], ['Mg', 'SO4', 'Cut down 2 : 2'], ['Zn', 'CO3', 'Cut down 2 : 2'],
  ['Al', 'O', 'Direct'], ['Al', 'SO4', 'Add brackets'], ['Ca', 'PO4', 'Add brackets'], ['Na', 'PO4', 'No bracket for 1'],
  ['Al', 'PO4', 'Cut down 3 : 3'],
].map(([c, a, rule]) => ({ cat: c, an: a, rule }));

/* ---------- Game 5 · Laws and Masses ---------- */
const ATY = ['Monoatomic', 'Diatomic', 'Triatomic', 'Tetra-atomic'];
const at = (q, a, w, mol) => ({ kind: 'Atomicity', q, a, t: ATY.filter(x => x !== a), w, stage: { type: 'molecule', mol }, order: ATY });
const tf = (q, a, w) => ({ kind: 'Dalton', q, a, t: [a === 'True' ? 'False' : 'True'], w, keep: true, order: ['True', 'False'], stage: { type: 'atoms' } });
export const GAME5 = [
  { kind: 'Conservation', q: 'Who gave the law of conservation of mass?', a: 'Antoine Lavoisier', t: ['Joseph Proust', 'John Dalton', 'Berzelius'], w: 'Lavoisier showed that mass is neither created nor destroyed in a chemical reaction.', stage: { type: 'flask' } },
  { kind: 'Conservation', key: 11.3, unit: 'g', q: '5.3 g sodium carbonate reacts with 6.0 g ethanoic acid. Total mass of the products?', w: '5.3 + 6.0 = 11.3 g. Mass is conserved.', stage: { type: 'balance' } },
  { kind: 'Conservation', q: 'In our Digital Lab the closed flask weighs 152.36 g before mixing. After mixing it weighs', a: '152.36 g', t: ['More than 152.36 g', 'Less than 152.36 g', '0 g'], w: 'Mass can neither be created nor destroyed, so the closed flask still weighs 152.36 g.', stage: { type: 'balance' } },
  { kind: 'Conservation', key: 44, unit: 'g', q: '12 g carbon burns fully in 32 g oxygen. Mass of CO2 formed?', w: '12 + 32 = 44 g of CO2.', stage: { type: 'molecule', mol: 'CO2' } },
  { kind: 'Proportions', q: 'Who gave the law of constant proportions?', a: 'Joseph Proust', t: ['Antoine Lavoisier', 'John Dalton', 'Avogadro'], w: 'Proust: a compound always has its elements in a fixed ratio by mass.', stage: { type: 'flask' } },
  { kind: 'Proportions', q: 'Ratio of hydrogen to oxygen by mass in water', a: '1 : 8', t: ['2 : 1', '1 : 16', '8 : 1'], w: '2 : 1 is the ratio of atoms. By mass it is 2 × 1 : 16, which is 1 : 8.', stage: { type: 'molecule', mol: 'H2O', labels: true } },
  { kind: 'Proportions', key: 24, unit: 'g', q: 'Hydrogen and oxygen combine in 1 : 8 by mass. Oxygen needed for 3 g hydrogen?', w: '3 × 8 = 24 g of oxygen.', stage: { type: 'molecule', mol: 'H2O' } },
  tf('All matter is made of very tiny particles called atoms.', 'True', 'This is the first postulate of Dalton\'s atomic theory.'),
  tf('Atoms can be created or destroyed in a chemical reaction.', 'False', 'Atoms are neither created nor destroyed. That is why mass is conserved.'),
  tf('Atoms of a given element are identical in mass and chemical properties.', 'True', 'This is a postulate of Dalton\'s atomic theory.'),
  tf('Atoms combine in the ratio of small whole numbers to form compounds.', 'True', 'This is a postulate of Dalton\'s atomic theory.'),
  at('Atomicity of argon, Ar', 'Monoatomic', 'Noble gases like argon exist as single atoms.', 'Ar'),
  at('Atomicity of chlorine, Cl2', 'Diatomic', 'Cl2 has 2 atoms in each molecule.', 'Cl2'),
  at('Atomicity of ozone, O3', 'Triatomic', 'One ozone molecule has 3 oxygen atoms.', 'O3'),
  at('Atomicity of phosphorus, P4', 'Tetra-atomic', 'P4 has 4 atoms in each molecule.', 'P4'),
  { kind: 'Mol. mass', key: 18, unit: 'u', q: 'Molecular mass of H2O (H = 1, O = 16)', w: '2 × 1 + 16 = 18 u.', stage: { type: 'molecule', mol: 'H2O', labels: true } },
  { kind: 'Mol. mass', key: 44, unit: 'u', q: 'Molecular mass of CO2 (C = 12, O = 16)', w: '12 + 2 × 16 = 44 u.', stage: { type: 'molecule', mol: 'CO2', labels: true } },
  { kind: 'Mol. mass', key: 17, unit: 'u', q: 'Molecular mass of NH3 (N = 14, H = 1)', w: '14 + 3 × 1 = 17 u.', stage: { type: 'molecule', mol: 'NH3', labels: true } },
  { kind: 'Mol. mass', key: 98, unit: 'u', q: 'Molecular mass of H2SO4 (H = 1, S = 32, O = 16)', w: '2 × 1 + 32 + 4 × 16 = 98 u.', stage: { type: 'molecule', mol: 'H2SO4', labels: true } },
  { kind: 'Mol. mass', key: 58.5, unit: 'u', q: 'Formula unit mass of NaCl (Na = 23, Cl = 35.5)', w: '23 + 35.5 = 58.5 u.', stage: { type: 'molecule', mol: 'NaCl', labels: true } },
];

export const GAMES = [
  { id: 'elements', num: 1, title: 'Element Quiz', sub: 'Names, symbols and atomic numbers of elements 1 to 30.', icon: 'atom', tier: 2, color: '#38bdf8', count: GAME1.length, unit: 'questions', details: ['30 elements', 'Capital / small letter traps', 'Atom reveal in 3D'] },
  { id: 'latin', num: 2, title: 'Latin Names', sub: 'Drag each element to its Latin name and symbol.', icon: 'scroll', tier: 3, color: '#c084fc', count: 10, unit: 'pairs', details: ['2 boards of 5', 'Drag and drop', 'Real metals in 3D'] },
  { id: 'ions', num: 3, title: 'Ions', sub: 'Valency, name and formula of 14 ions.', icon: 'zap', tier: 4, color: '#2dd4bf', count: GAME3.length, unit: 'questions', details: ['7 cations, 7 anions', 'Charge glow in 3D'] },
  { id: 'cross', num: 4, title: 'Criss-Cross', sub: 'Cross the valencies, add brackets, cut down and build the formula.', icon: 'combine', tier: 5, color: '#fb7185', count: GAME4.length, unit: 'formulas', details: ['Drag valencies', 'Brackets and cut down', 'Ions join in 3D'] },
  { id: 'laws', num: 5, title: 'Laws & Masses', sub: 'Conservation of mass, constant proportions, Dalton, atomicity and molecular mass.', icon: 'scale', tier: 4, color: '#fbbf24', count: GAME5.length, unit: 'questions', details: ['Number keypad', 'Molecules in 3D'] },
];

export const LAB = { id: 'lab', title: 'Element Lab', sub: 'Spin elements 1 to 30 in 3D: how the real element looks, and its atom.', icon: 'flask', tier: 1, color: '#4ade80', count: 30, unit: 'elements', details: ['Real look', 'Bohr atom model', 'Facts for each element'] };
