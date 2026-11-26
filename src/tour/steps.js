// What Ravi says on the home page, in order. `target` is a CSS selector to spotlight.
export const HOME_TOUR = [
  { title: "Hi, I'm Ravi!", text: "I'm your lab buddy. Today we will learn Atoms and Molecules by playing games. Let me show you around!" },
  { target: '[data-stage]', title: 'The game belt', text: 'Every plate on this belt is a game. Hover to stop it, flick it to spin, and tap a plate to open it.' },
  { target: '[data-legend]', title: 'Ring colours', text: "The colour of a plate's ring tells you how hard the game is, from Explore to Challenge." },
  { target: '.home-stats', title: 'Five games', text: 'Element Quiz, Latin Names, Ions, Criss-Cross, and Laws and Masses. The stars you win in each game show here.' },
  { target: '[data-tour="lab"]', title: 'Element Lab', text: 'Open the Element Lab to spin all 30 elements in 3D: how they really look, and how their atoms are built.' },
  { title: 'Two ways to play', text: 'Play while you learn explains every answer choice as you go. Test your knowledge lets you answer on your own, then explains every answer at the end.', mood: 'neutral' },
  { target: '.topbar .sound-btns', title: 'Your controls', text: 'Switch between English and Telugu, light and dark, and turn the music, sounds or my voice on and off. The gear opens Settings for voices.' },
  { target: '[data-tour="start"]', title: "Let's play!", text: 'Tap Start with elements, or pick any plate on the belt. You can call me again with the Guide button.', cta: "Let's go" },
];
