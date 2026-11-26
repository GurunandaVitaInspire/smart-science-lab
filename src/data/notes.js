// Why each answer choice is right or wrong, for "Play while you learn" and the test review.
// Element Quiz notes are built from the element table; Ions and Laws notes are written by hand.
// All text goes through t(), so it appears in the chosen language.
import { t } from '../i18n.js';
import { ELEMENTS, BY_SYM, BY_Z, EXTRA_METALS } from './elements.js';

const BY_NAME = Object.fromEntries([...ELEMENTS, ...Object.values(EXTRA_METALS)].map(e => [e.name, e]));
const OTHER = { Br: 'Bromine', Po: 'Polonium', Fl: 'Flerovium' };

// hand-written notes for the wrong choices (formulas use the app's NH4^+ style)
const AUTHORED = {
  i1: { 2: 'Valency 2 would need a charge of 2+, like Mg^2+.', 3: 'Valency 3 would need a charge of 3+, like Al^3+.', 0: 'Valency 0 is for atoms that do not form ions, like the noble gases. Na^+ has a charge, so its valency is not 0.' },
  i2: { Ammonia: 'Ammonia is NH3, a neutral gas with no charge.', 'Nitrate ion': 'Nitrate is NO3^−, made of nitrogen and oxygen.', 'Nitride ion': 'Nitride is N^3−, a single nitrogen atom that has gained three electrons.' },
  i3: { 'Ca^+': 'Calcium loses two electrons, not one, so its charge is 2+.', 'Ca^2−': 'A minus sign means electrons were gained. Metals like calcium lose electrons and become positive.', 'C^2+': 'C is carbon. The symbol of calcium is Ca.' },
  i4: { 1: 'The charge is 2−, so the valency is 2, not 1.', 3: 'Nothing in sulphate gives 3. Read the charge: 2−.', 4: '4 is the number of oxygen atoms, not the valency.' },
  i5: { Chlorine: 'Chlorine is the element itself (Cl2 gas). Its ion gets the ending -ide.', 'Chlorate ion': 'Chlorate is ClO3^−, which also contains oxygen.', 'Chloro ion': 'There is no ion called chloro ion. A single non-metal ion ends in -ide.' },
  i6: { 'OH^+': 'Hydroxide has a negative charge, not a positive one.', 'H^+': 'H^+ is the hydrogen ion. Hydroxide has oxygen too.', 'O^2−': 'O^2− is the oxide ion. Hydroxide is oxygen and hydrogen together: OH^−.' },
  i7: { 1: 'Al^3+ has a charge of 3+, so its valency is 3, not 1.', 2: 'Al^3+ has a charge of 3+, so its valency is 3, not 2.', 4: 'Aluminium does not form a 4+ ion. Its charge is 3+.' },
  i8: { 'Carbon dioxide': 'Carbon dioxide is CO2, a neutral gas, not an ion.', 'Carbide ion': 'A carbide ion is carbon alone, with no oxygen.', 'Hydrogen carbonate ion': 'Hydrogen carbonate is HCO3^−. It has hydrogen and a charge of 1−.' },
  i9: { 'NO2^−': 'NO2^− is the nitrite ion, with only two oxygen atoms.', 'NO3^2−': 'Nitrate has a charge of 1−, not 2−.', 'N^3−': 'N^3− is the nitride ion, with no oxygen.' },
  i10: { Anion: 'Anions are negative ions. Mg^2+ has a plus sign, so it is a cation.' },
  i11: { 1: 'Phosphate has a charge of 3−, so its valency is 3, not 1.', 2: 'Phosphate has a charge of 3−, so its valency is 3, not 2.', 4: '4 is the number of oxygen atoms, not the valency.' },
  i12: { 'Zn^+': 'Zinc loses two electrons, so its charge is 2+, not 1+.', 'Zn^3+': 'Zinc does not form a 3+ ion. Its valency is 2.', 'Zn^2−': 'Zinc is a metal. Metals lose electrons and become positive, so the sign is plus.' },
  i13: { Oxygen: 'Oxygen is the element itself (O2 gas), not the ion.', Ozone: 'Ozone is O3, a molecule of three oxygen atoms with no charge.', 'Hydroxide ion': 'Hydroxide is OH^−. It has hydrogen too and a charge of 1−.' },
  i14: { 'SO3^2−': 'SO3^2− is the sulphite ion, with three oxygen atoms.', 'S^2−': 'S^2− is the sulphide ion, with no oxygen.', 'SO4^−': 'Sulphate has a charge of 2−, not 1−.' },
  i15: { 2: 'Valency 2 would need a charge of 2+. K^+ has 1+.', 3: 'Valency 3 would need a charge of 3+. K^+ has 1+.', 0: 'K^+ has a charge, so its valency is not 0.' },
  i16: { 'Phosphide ion': 'Phosphide is P^3−, phosphorus alone with no oxygen.', Phosphorus: 'Phosphorus is the element itself, not an ion.', 'Phosphite ion': 'Phosphite has one oxygen atom less than phosphate.' },
  i17: { 'Na^+': 'Na^+ is made of only one atom (sodium), so it is a simple ion.', 'Cl^−': 'Cl^− is made of only one atom (chlorine), so it is a simple ion.', 'Mg^2+': 'Mg^2+ is made of only one atom (magnesium), so it is a simple ion.' },
  i18: { NH3: 'NH3 is ammonia, a neutral molecule with no charge.', 'NH4^−': 'The ammonium ion is positive: NH4^+.', 'N^3−': 'N^3− is the nitride ion.' },
  i19: { 2: 'The charge is only 1−, so the valency is 1.', 3: 'The 3 counts the oxygen atoms. It is not the valency.', 4: 'Nothing in NO3^− gives 4. Read the charge: 1−.' },
  i20: { 'OH^−': 'OH^− has a charge of 1−, so its valency is 1.', 'NO3^−': 'NO3^− has a charge of 1−, so its valency is 1.', 'Al^3+': 'Al^3+ has a charge of 3+, so its valency is 3.' },
  l1: { 'Joseph Proust': 'Proust gave the law of constant proportions.', 'John Dalton': 'Dalton gave the atomic theory.', Berzelius: 'Berzelius suggested writing elements as letter symbols.' },
  l3: { 'More than 152.36 g': 'Nothing new enters a closed flask, so the mass cannot increase.', 'Less than 152.36 g': 'Nothing escapes from a closed flask, so the mass cannot decrease.', '0 g': 'Matter never disappears. The flask and everything in it still have mass.' },
  l5: { 'Antoine Lavoisier': 'Lavoisier gave the law of conservation of mass.', 'John Dalton': 'Dalton gave the atomic theory.', Avogadro: 'Avogadro is known for the Avogadro number and his law about gases.' },
  l6: { '2 : 1': '2 : 1 is the ratio of the number of atoms in H2O, not of their mass.', '1 : 16': 'One oxygen atom weighs 16, but water has two hydrogen atoms: 2 : 16, which is 1 : 8.', '8 : 1': 'This is upside down. Oxygen is the heavier part, so H : O is 1 : 8.' },
  l8: { False: 'Dalton said all matter is made of tiny particles called atoms, so the statement is true.' },
  l9: { True: 'Atoms are never created or destroyed in a chemical reaction, so the statement is false.' },
  l10: { False: 'Dalton said atoms of one element are identical in mass and properties, so the statement is true.' },
  l11: { False: 'Atoms do combine in small whole-number ratios, so the statement is true.' },
};

const ATOMS = { Monoatomic: 1, Diatomic: 2, Triatomic: 3, 'Tetra-atomic': 4 };
const MOL_ATOMS = { Ar: 1, Cl2: 2, O3: 3, P4: 4 };

function elementNote(item, opt) {
  const el = BY_Z[item.z];
  if (item.tpl === 'Element with atomic number {z} is') {
    const o = BY_NAME[opt];
    return o ? t('{name} is element number {z}, not {target}.', { name: t(opt), z: o.z, target: item.z }) : null;
  }
  if (item.tpl === 'Symbol of {name}') {
    const a = item.a;
    if (opt.toLowerCase() === a.toLowerCase()) {
      if (opt.length === 1) return t('A one-letter symbol is always a capital letter: {a}.', { a });
      if (opt === opt.toUpperCase()) return t('Only the first letter is a capital. The second letter is always small: {a}.', { a });
      if (opt === opt.toLowerCase()) return t('A symbol always starts with a capital letter: {a}.', { a });
      return t('The capital and small letters are the wrong way round. The right way is {a}.', { a });
    }
    const other = BY_SYM[opt]?.name || OTHER[opt];
    if (other) return t('{sym} is the symbol of {name}, a different element.', { sym: opt, name: t(other) });
    return t('{sym} is not the symbol of any element. {name} is written {a}.', { sym: opt, name: t(el.name), a });
  }
  if (item.tpl === 'Atomic number of {name}') {
    const n = +opt;
    if (n === Math.round(el.mass)) return t('{n} is the atomic mass of {name}, not its atomic number.', { n, name: t(el.name) });
    if (BY_Z[n]) return t('{n} is the atomic number of {other}.', { n, other: t(BY_Z[n].name) });
    return null;
  }
  if (item.tpl === '{name} is the symbol of') {
    const o = BY_NAME[opt];
    return o ? t('The symbol of {name} is {sym}, not {s}.', { name: t(opt), sym: o.sym, s: item.vars.name }) : null;
  }
  return null;
}

/** The note for one answer choice of a question. */
export function optionNote(item, opt) {
  if (opt === item.a) return t(item.w);
  const authored = AUTHORED[item.id]?.[opt];
  if (authored) return t(authored);
  if (item.id?.startsWith('e')) { const n = elementNote(item, opt); if (n) return n; }
  if (item.kind === 'Atomicity' && ATOMS[opt]) {
    const mol = item.stage?.mol;
    return t('{opt} means {n} atom(s) in each molecule. {mol} has {m}.', { opt: t(opt), n: ATOMS[opt], mol, m: MOL_ATOMS[mol] });
  }
  return t('This is not correct. The right answer is {a}.', { a: t(item.a) });
}

/** Every answer choice with right/wrong and its note, in the given order. */
export function explainAll(item, order) {
  return order.map(opt => ({ opt, ok: opt === item.a, note: optionNote(item, opt) }));
}

/** The question in the current language. */
export function questionText(item) {
  if (!item.tpl) return t(item.q);
  const vars = {};
  for (const k in item.vars) vars[k] = typeof item.vars[k] === 'string' ? t(item.vars[k]) : item.vars[k];
  return t(item.tpl, vars);
}
