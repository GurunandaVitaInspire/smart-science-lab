// The first 30 elements: data for the 3D models, the Element Lab and Game 1.
// look.kind: gas (glowing discharge tube), cloud (coloured gas in a flask),
// metal (shiny nugget), soft (alkali metal block), crystal, graphite, lumps
// cat: category used for colours in the Element Lab

export const CATS = {
  nonmetal: { label: 'Non-metal', color: '#22d3ee' },
  noble: { label: 'Noble gas', color: '#c084fc' },
  alkali: { label: 'Alkali metal', color: '#fb7185' },
  alkaline: { label: 'Alkaline earth metal', color: '#fb923c' },
  metalloid: { label: 'Metalloid', color: '#2dd4bf' },
  post: { label: 'Metal', color: '#94a3b8' },
  halogen: { label: 'Halogen', color: '#a3e635' },
  transition: { label: 'Transition metal', color: '#facc15' },
};

// [Z, symbol, name, mass, cat, state, period, group, look, fact]
const RAW = [
  [1, 'H', 'Hydrogen', 1, 'nonmetal', 'Gas', 1, 1, { kind: 'gas', color: '#ff7ce5' }, 'The lightest element. Stars like our Sun are mostly hydrogen!'],
  [2, 'He', 'Helium', 4, 'noble', 'Gas', 1, 18, { kind: 'gas', color: '#ffb27a' }, 'Lighter than air, so helium balloons float up.'],
  [3, 'Li', 'Lithium', 7, 'alkali', 'Solid', 2, 1, { kind: 'soft', color: '#c9ccd1', rough: 0.42 }, 'The lightest metal. It powers the battery in your phone.'],
  [4, 'Be', 'Beryllium', 9, 'alkaline', 'Solid', 2, 2, { kind: 'metal', color: '#a6adb4', rough: 0.35 }, 'A light, strong metal used in space telescopes.'],
  [5, 'B', 'Boron', 11, 'metalloid', 'Solid', 2, 13, { kind: 'crystal', color: '#3d3733', metal: 0.6, rough: 0.25 }, 'Boron is used to make heat-proof glass for labs.'],
  [6, 'C', 'Carbon', 12, 'nonmetal', 'Solid', 2, 14, { kind: 'graphite', color: '#202124' }, 'Pencil lead (graphite) and diamond are both pure carbon!'],
  [7, 'N', 'Nitrogen', 14, 'nonmetal', 'Gas', 2, 15, { kind: 'gas', color: '#b98cff' }, 'About 78% of the air we breathe is nitrogen.'],
  [8, 'O', 'Oxygen', 16, 'nonmetal', 'Gas', 2, 16, { kind: 'gas', color: '#8fd3ff' }, 'We need oxygen to breathe. Fire needs it to burn.'],
  [9, 'F', 'Fluorine', 19, 'halogen', 'Gas', 2, 17, { kind: 'cloud', color: '#f1ef7c' }, 'Fluoride in toothpaste keeps your teeth strong.'],
  [10, 'Ne', 'Neon', 20, 'noble', 'Gas', 2, 18, { kind: 'gas', color: '#ff4d1a' }, 'Neon gives the bright red-orange glow of neon signs.'],
  [11, 'Na', 'Sodium', 23, 'alkali', 'Solid', 3, 1, { kind: 'soft', color: '#d7d6cf', rough: 0.38 }, 'So soft you can cut it with a knife. Kept under oil!'],
  [12, 'Mg', 'Magnesium', 24, 'alkaline', 'Solid', 3, 2, { kind: 'metal', color: '#dfe2e6', rough: 0.22 }, 'Burns with a dazzling white flame, used in fireworks.'],
  [13, 'Al', 'Aluminium', 27, 'post', 'Solid', 3, 13, { kind: 'metal', color: '#d3d8de', rough: 0.2 }, 'Light and shiny: used for foil, cans and aeroplanes.'],
  [14, 'Si', 'Silicon', 28, 'metalloid', 'Solid', 3, 14, { kind: 'crystal', color: '#6c7a8c', metal: 0.85, rough: 0.15 }, 'Computer chips are made from silicon.'],
  [15, 'P', 'Phosphorus', 31, 'nonmetal', 'Solid', 3, 15, { kind: 'lumps', color: '#b3362b' }, 'Red phosphorus is on the side of every matchbox.'],
  [16, 'S', 'Sulphur', 32, 'nonmetal', 'Solid', 3, 16, { kind: 'crystal', color: '#f4d82a', metal: 0, rough: 0.35 }, 'A bright yellow solid found near volcanoes.'],
  [17, 'Cl', 'Chlorine', 35.5, 'halogen', 'Gas', 3, 17, { kind: 'cloud', color: '#b5e24a' }, 'A yellow-green gas used to make drinking water safe.'],
  [18, 'Ar', 'Argon', 40, 'noble', 'Gas', 3, 18, { kind: 'gas', color: '#a66bff' }, 'Argon fills light bulbs so the filament does not burn.'],
  [19, 'K', 'Potassium', 39, 'alkali', 'Solid', 4, 1, { kind: 'soft', color: '#cfd0d4', rough: 0.4 }, 'Bananas are rich in potassium, good for your muscles.'],
  [20, 'Ca', 'Calcium', 40, 'alkaline', 'Solid', 4, 2, { kind: 'metal', color: '#cbc7bd', rough: 0.4 }, 'Your bones and teeth are full of calcium.'],
  [21, 'Sc', 'Scandium', 45, 'transition', 'Solid', 4, 3, { kind: 'metal', color: '#d6d6d2', rough: 0.25 }, 'Mixed with aluminium to make strong bicycle frames.'],
  [22, 'Ti', 'Titanium', 48, 'transition', 'Solid', 4, 4, { kind: 'metal', color: '#8f949b', rough: 0.3 }, 'Strong and light, used in jets and bone implants.'],
  [23, 'V', 'Vanadium', 51, 'transition', 'Solid', 4, 5, { kind: 'metal', color: '#a3aab5', rough: 0.25 }, 'Added to steel to make super-strong tools.'],
  [24, 'Cr', 'Chromium', 52, 'transition', 'Solid', 4, 6, { kind: 'metal', color: '#eef2f5', rough: 0.06 }, 'Gives the mirror-like shine to chrome-plated parts.'],
  [25, 'Mn', 'Manganese', 55, 'transition', 'Solid', 4, 7, { kind: 'metal', color: '#aaa69f', rough: 0.35 }, 'Used to make steel tough, like in railway tracks.'],
  [26, 'Fe', 'Iron', 56, 'transition', 'Solid', 4, 8, { kind: 'metal', color: '#8b8e93', rough: 0.38 }, 'Iron in your blood carries oxygen around your body.'],
  [27, 'Co', 'Cobalt', 59, 'transition', 'Solid', 4, 9, { kind: 'metal', color: '#a8afbe', rough: 0.2 }, 'Gives glass and pottery a deep blue colour.'],
  [28, 'Ni', 'Nickel', 59, 'transition', 'Solid', 4, 10, { kind: 'metal', color: '#c6c0b2', rough: 0.2 }, 'Used in coins and in stainless steel.'],
  [29, 'Cu', 'Copper', 63.5, 'transition', 'Solid', 4, 11, { kind: 'metal', color: '#d0773a', rough: 0.18 }, 'Carries electricity in almost every wire at home.'],
  [30, 'Zn', 'Zinc', 65, 'transition', 'Solid', 4, 12, { kind: 'metal', color: '#bcc5ce', rough: 0.3 }, 'A zinc coating stops iron from rusting.'],
];

// Electron shells (K, L, M, N). For Z > 20 the M shell keeps filling.
const SHELLS = {
  21: [2, 8, 9, 2], 22: [2, 8, 10, 2], 23: [2, 8, 11, 2], 24: [2, 8, 13, 1], 25: [2, 8, 13, 2],
  26: [2, 8, 14, 2], 27: [2, 8, 15, 2], 28: [2, 8, 16, 2], 29: [2, 8, 18, 1], 30: [2, 8, 18, 2],
};
function shellsFor(z) {
  if (SHELLS[z]) return SHELLS[z];
  const caps = [2, 8, 8, 2];
  const out = [];
  let left = z;
  for (const c of caps) {
    if (left <= 0) break;
    out.push(Math.min(c, left));
    left -= c;
  }
  return out;
}

export const ELEMENTS = RAW.map(([z, sym, name, mass, cat, state, period, group, look, fact]) => ({
  z, sym, name, mass, cat, state, period, group, look, fact,
  shells: shellsFor(z),
  neutrons: Math.round(mass) - z,
}));

export const BY_SYM = Object.fromEntries(ELEMENTS.map(e => [e.sym, e]));
export const BY_Z = Object.fromEntries(ELEMENTS.map(e => [e.z, e]));

// Extra metals used in the Latin names game (not in 1 to 30)
export const EXTRA_METALS = {
  Ag: { sym: 'Ag', name: 'Silver', look: { kind: 'metal', color: '#e9ebee', rough: 0.08 } },
  Au: { sym: 'Au', name: 'Gold', look: { kind: 'metal', color: '#ffc94a', rough: 0.12 } },
  Hg: { sym: 'Hg', name: 'Mercury', look: { kind: 'liquid', color: '#dfe3e8' } },
  Pb: { sym: 'Pb', name: 'Lead', look: { kind: 'metal', color: '#6f7685', rough: 0.45 } },
  Sn: { sym: 'Sn', name: 'Tin', look: { kind: 'metal', color: '#d9dcdf', rough: 0.25 } },
  W: { sym: 'W', name: 'Tungsten', look: { kind: 'metal', color: '#8d9096', rough: 0.3 } },
};

export function lookFor(sym) {
  return (BY_SYM[sym] || EXTRA_METALS[sym]).look;
}
