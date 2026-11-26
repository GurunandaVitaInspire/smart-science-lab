// Short narrated lessons for each topic (Class IX, Atoms and Molecules), plus "how to play".
// Each slide is read aloud; formulas use the app's NH4^+ style.

export const LESSONS = {
  elements: [
    { title: 'What is an element?', text: 'An element is a pure substance made of only one kind of atom. Hydrogen, oxygen, iron and gold are elements. Scientists know 118 elements, and in this game you will learn the first 30.' },
    { title: 'Atomic number', text: 'Every atom has protons in its centre, called the nucleus. The number of protons is the atomic number. Hydrogen has 1 proton, so its atomic number is 1. Carbon has 6, so its atomic number is 6.' },
    { title: 'Atomic number is not atomic mass', text: 'Do not mix up atomic number and atomic mass. Carbon has atomic number 6 but atomic mass 12, because the mass also counts the neutrons. Many trick answers in this game are atomic masses.' },
    { title: 'Symbols', text: 'Each element has a short symbol of one or two letters. The first letter is always a capital letter. The second letter is always small. So sodium is capital N, small a: Na. Never NA or na.' },
    { title: 'Symbols that look alike', text: 'Be careful: Co is cobalt, but CO with two capitals is carbon monoxide, a compound of carbon and oxygen. Mg is magnesium and Mn is manganese. One small letter changes the element.' },
    { title: 'Let us play', text: 'Read each question, look at the real element in 3D, and pick the answer. After each answer you will see the atom of that element, with its protons, neutrons and electrons.' },
  ],
  latin: [
    { title: 'Why some symbols look strange', text: 'Most symbols come from the English name, like O for oxygen. But some come from old Latin names. That is why the symbol of sodium is Na and the symbol of iron is Fe.' },
    { title: 'Five Latin names, part one', text: 'Gold is Aurum, so its symbol is Au. Silver is Argentum, Ag. Iron is Ferrum, Fe. Sodium is Natrium, Na. Potassium is Kalium, K.' },
    { title: 'Five Latin names, part two', text: 'Copper is Cuprum, Cu. Mercury is Hydrargyrum, Hg. Lead is Plumbum, Pb. Tin is Stannum, Sn. Tungsten is Wolfram, W.' },
    { title: 'A memory trick', text: 'Plumbers once worked with lead pipes, which is why lead is Plumbum. Ferrum gives us the word ferrous. Look for these links and the symbols become easy.' },
    { title: 'Let us play', text: 'Drag each Latin name to its element, or tap a name and then tap the box. A wrong drop jumps back and the right box glows.' },
  ],
  ions: [
    { title: 'What is an ion?', text: 'An ion is an atom or a group of atoms that carries an electric charge. Atoms become ions when they lose or gain electrons.' },
    { title: 'Cations and anions', text: 'When an atom loses electrons it becomes positive. A positive ion is a cation, like Na^+ and Mg^2+. When an atom gains electrons it becomes negative. A negative ion is an anion, like Cl^− and O^2−.' },
    { title: 'Valency', text: 'The valency of an ion is the size of its charge. Na^+ has valency 1, Ca^2+ has valency 2 and Al^3+ has valency 3. The sign does not matter for valency, only the number.' },
    { title: 'Polyatomic ions', text: 'Some ions are groups of atoms that stay together and share one charge. These are polyatomic ions: NH4^+ ammonium, OH^− hydroxide, NO3^− nitrate, SO4^2− sulphate, CO3^2− carbonate and PO4^3− phosphate.' },
    { title: 'A common trap', text: 'In NO3^− the 3 tells you there are three oxygen atoms. It is not the charge. The charge is 1−, so the valency of nitrate is 1. Always read the charge.' },
    { title: 'Names that end in -ide', text: 'A single non-metal ion gets the ending -ide. Chlorine becomes chloride, oxygen becomes oxide. Groups with oxygen often end in -ate, like nitrate and sulphate.' },
  ],
  cross: [
    { title: 'Building a formula', text: 'A compound has no overall charge. So the positive and negative ions must balance. The criss-cross method finds how many of each ion we need.' },
    { title: 'Step one: write the ions', text: 'Write the cation first and the anion second, with their valencies. For aluminium oxide: Al^3+ has valency 3 and O^2− has valency 2.' },
    { title: 'Step two: cross over', text: 'Move each valency across to the other ion and write it below. The 3 of aluminium goes under oxygen, and the 2 of oxygen goes under aluminium. We get Al2O3.' },
    { title: 'Step three: brackets', text: 'If a group of atoms like OH or SO4 is taken two or three times, put it in brackets: Ca(OH)2. A group taken only once needs no brackets.' },
    { title: 'Step four: cut down', text: 'If both numbers are the same, cut them down. Calcium oxide gives Ca2O2, which becomes CaO. The number 1 is never written.' },
    { title: 'Let us play', text: 'Drag each valency number across, add brackets or cut down when needed, then tap Formula ready.' },
  ],
  laws: [
    { title: 'Law of conservation of mass', text: 'Antoine Lavoisier showed that mass is neither created nor destroyed in a chemical reaction. The total mass of the products equals the total mass of the reactants.' },
    { title: 'Law of constant proportions', text: 'Joseph Proust showed that a compound always has its elements in the same ratio by mass. In water, hydrogen and oxygen are always in the ratio 1 : 8 by mass, wherever the water comes from.' },
    { title: 'Dalton\'s atomic theory', text: 'John Dalton said: all matter is made of tiny particles called atoms. Atoms cannot be created or destroyed in a reaction. Atoms of one element are identical. Atoms combine in small whole-number ratios to form compounds.' },
    { title: 'Atomicity', text: 'Atomicity is the number of atoms in one molecule of an element. Argon has 1, so it is monoatomic. Chlorine Cl2 is diatomic, ozone O3 is triatomic, and phosphorus P4 is tetra-atomic.' },
    { title: 'Molecular mass', text: 'To find the molecular mass, add the masses of all the atoms. Water H2O is 1 plus 1 plus 16, which is 18 u. Carbon dioxide CO2 is 12 plus 16 plus 16, which is 44 u.' },
    { title: 'Let us play', text: 'Answer the questions. Some use a number keypad: type the number and press Check. Atomic masses are shown with each question.' },
  ],
};

export const HOW = {
  elements: ['Read the question about the element.', 'Tap the right answer. Watch the capital and small letters.', 'Answer to see the atom of the element in 3D.'],
  latin: ['Drag a Latin name to its element.', 'Or tap a name, then tap the box.', 'Finish a board to win glitter stars.'],
  ions: ['Find the valency, name or formula of the ion.', 'Red glow is a positive ion (cation), blue glow a negative ion (anion).', 'Spin the 3D ion to see its atoms.'],
  cross: ['Drag each valency number across to the other ion.', 'Add brackets for a group taken 2 or 3 times. Cut down if both numbers are the same.', 'Tap "Formula ready" to make the compound.'],
  laws: ['Answer questions on the laws of chemistry.', 'Some questions use a number keypad.', 'Atomic masses are shown on the 3D models.'],
};

export const MODES = {
  learn: { title: 'Play while you learn', text: 'Get help at every question. After each answer, every choice is explained, aloud and in writing.' },
  test: { title: 'Test your knowledge', text: 'Choose one answer for each question with no hints. At the end, every answer is explained, right and wrong.' },
};
