# Smart Science Lab · Atoms & Molecules (Class IX)

3D chemistry games for digital boards and phones. There are 5 games and 100 questions, taken from *AtomsMolecules-List-of-Questions.pdf*, plus a 3D Element Lab for elements 1 to 30.

| Game | What the child does | Count |
|---|---|---|
| 1 · Element Quiz | Name, symbol and atomic number of elements 1–30 (capital / small letter traps) | 30 |
| 2 · Latin Names | Drag each Latin name to its element (2 boards of 5) | 10 pairs |
| 3 · Ions | Valency, name and formula of 14 ions | 20 |
| 4 · Criss-Cross | Drag valencies across, add brackets, cut down, build the formula | 20 |
| 5 · Laws & Masses | Conservation, proportions, Dalton, atomicity, molecular mass (number keypad) | 20 |
| Element Lab | Spin elements 1–30 in 3D: real look or Bohr atom model | 30 |

## How it plays
- **Right first time:** you get points, a sound, a voice cheer ("Brilliant!"), a particle burst, a shockwave and the 3D reveal. Getting 3 or 5 in a row gives a streak banner, a glitter rain, bonus points, and the music gets livelier.
- **Wrong:** the button shakes, the right answer glows with a 👆 and the explanation is shown. The child then taps the right answer themselves to learn it. They get **no points** for that question.
- Questions and options are shuffled every time. Each game offers a **Quick round (10)** or a **Full game**.
- Stars per game: at least 90% right first time gives ★★★, 70% gives ★★, 40% gives ★. Best scores are saved in the browser.
- Every 3D model follows the cursor or finger. Drag to spin it, tap to "poke" it, and scroll to zoom in the Lab.
- Music, sound effects and voice are all generated in the browser, so there are no audio files and they work offline. Each has an on/off button, and there is a full-screen button for the board.
- Direct links for teachers: `/#elements`, `/#latin`, `/#ions`, `/#cross`, `/#laws`, `/#lab`

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173 (also on your LAN for testing on a phone)
npm run build      # production files in dist/
```

## Deploy to Vercel
1. Push this folder to a GitHub repository.
2. In Vercel: **Add New → Project → Import** the repository.
3. Vercel detects **Vite** automatically (build `npm run build`, output `dist`, both also set in `vercel.json`). Click **Deploy**.

Or from this folder with the CLI: `npx vercel` (preview) and then `npx vercel --prod`.

## Home page
The home page is a conveyor belt (the `SushiConveyorMenu` component from 21st.dev, in `src/components/ui/sushi-conveyor-menu.tsx`, unchanged). Each game is a plate going round. The plate pictures are drawn at start-up from the game's own 3D model on a ceramic dish (`src/three/plates.js`), so no image files are needed. The plate ring colour shows difficulty: Explore, Warm-up, Practice, Tricky, Challenge. Hover stops the belt, a flick spins it, and clicking a plate opens it. **Play** then asks for a quick round or the full game.

The sun/moon button switches between dark and light themes, and the choice is remembered.

## Tech
- Vite + plain JavaScript for the games, and [Three.js](https://threejs.org) for all 3D: one WebGL canvas draws the space background and every 3D stage.
- React 19 + TypeScript + Tailwind CSS v4 with the shadcn/ui structure (`components.json`, `src/components/ui`, `src/lib/utils.ts`, theme tokens in `src/index.css`) for the home belt. React only loads on the home page.
- Icons are [Lucide](https://lucide.dev). The fonts are Geist and Geist Mono.

```
src/
  components/ui/   sushi-conveyor-menu.tsx (shadcn-style component)
  home/            Home.tsx (games on the belt)
  data/            elements.js (1–30), questions.js (all 100 questions)
  three/           engine.js, models.js, plates.js, textures.js
  games/           quiz.js (Games 1, 3, 5), latin.js, cross.js, lab.js, session.js
  index.css        Tailwind + shadcn theme (light and dark)
  style.css        styles for the game screens
  theme.js         light / dark toggle
  audio.js, fx.js, main.js
```
