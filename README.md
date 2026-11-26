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
- Music and sound effects are generated in the browser, so there are no audio files and they work offline. The device voice also works offline. Each has an on/off button, and there is a full-screen button for the board.
- Direct links for teachers: `/#elements`, `/#latin`, `/#ions`, `/#cross`, `/#laws`, `/#lab`

## Two ways to play (Element Quiz, Ions, Laws & Masses)
- **Play while you learn:** instant feedback. After every answer, each choice (A, B, C, D) is explained in text and read aloud one by one, with the line being read highlighted. A wrong answer still has to be corrected by tapping the right one, with no points.
- **Test your knowledge:** one pick per question, no hints and no right/wrong shown. At the end a review screen lists every question with the student's answer, the correct answer and an explanation of every choice, right and wrong. **Listen to all explanations** reads the whole review aloud, card by card.
- Latin Names and Criss-Cross always play in learn mode, with every step narrated.

## Learning with audio
- Every game has **Listen: how to play** and **Learn the topic first**: a short narrated lesson (5–6 slides) on the topic before playing.
- Questions and answer choices are read aloud, with a replay button on each question. Symbols are spelled out with capital and small letters (so "Mn" is not heard as "Mg").
- Ravi's tour, the home belt, the Element Lab and every feedback message are spoken too. Reading aloud and speed can be changed in **Settings** (gear button).

## Telugu (తెలుగు)
- The **EN / తె** button in the top bar switches every screen, question, explanation and lesson between English and Telugu. The choice is remembered.
- Built-in Telugu text is in `src/i18n/te.json` (691 lines, keyed by the English text). It uses the AP SCERT Class IX terms (మూలకం, పరమాణు సంఖ్య, సంయోజకత, అయాను…). Chemical symbols and formulas stay as they are. **It was machine-written, so a Telugu-medium teacher should read through it.** Corrections go straight into that file.
- Optionally, Settings → Bhashini → *Bhashini machine translation* swaps the built-in text for Bhashini translations (cached in the browser).

## Voices: device, ElevenLabs, Bhashini
| Engine | English | Telugu | Needs |
|---|---|---|---|
| Device voice | ✓ | only if the device has a Telugu voice (most Windows PCs do not) | nothing |
| ElevenLabs | ✓ | ✓ with `eleven_v3` / `eleven_v4` / `eleven_v4_turbo` models | API key |
| Bhashini (MeitY) | – | ✓ | ULCA user ID + API key from bhashini.gov.in |

**Auto** (the default) uses Bhashini, then ElevenLabs, then the device voice for Telugu, and ElevenLabs (if set up) or the device voice for English. Clips are cached in the browser so each line is downloaded once.

Keys can be entered in **Settings** (kept only in that browser), or set once on the server so students never see them:

```
ELEVENLABS_API_KEY=...
BHASHINI_USER_ID=...
BHASHINI_API_KEY=...
BHASHINI_PIPELINE_ID=64392f96daac500b55c543cd   # optional
```

Put them in Vercel (steps below), or in `.env.local` when running on your own computer. The serverless functions in `api/` (`eleven.js`, `bhashini.js`, `status.js`) call ElevenLabs and Bhashini, so the keys never reach the page.

### Adding the keys in Vercel (step by step)
1. Get the keys:
   - **ElevenLabs:** sign in at elevenlabs.io → your profile → **API Keys** → *Create API key*. Copy it.
   - **Bhashini:** sign in at bhashini.gov.in → **My Profile** → note the **User ID**, then generate a **ULCA API key**. Copy both.
2. Open vercel.com → your **smart-science-lab** project → **Settings** → **Environment Variables**.
3. Add each variable: type the **Key** (for example `ELEVENLABS_API_KEY`), paste the **Value**, tick **Production**, **Preview** and **Development**, and click **Save**. Repeat for:

   | Key | Value |
   |---|---|
   | `ELEVENLABS_API_KEY` | your ElevenLabs API key |
   | `BHASHINI_USER_ID` | your Bhashini user ID |
   | `BHASHINI_API_KEY` | your Bhashini ULCA API key |
   | `BHASHINI_PIPELINE_ID` | optional, leave out to use `64392f96daac500b55c543cd` |

   You can add only ElevenLabs, only Bhashini, or both.
4. Go to **Deployments**, open the menu (⋯) on the latest deployment and click **Redeploy**. New variables only reach a new deployment.
5. Check it: open the site → gear button (**Settings**). ElevenLabs and Bhashini should show **Ready (server key)** instead of *Not set up*. Switch to తెలుగు and press **Test the voice**.

With the CLI instead: `npx vercel env add ELEVENLABS_API_KEY` (it asks for the value and the environments), then `npx vercel --prod`.

### Keys on your own computer (npm run dev)
Copy `.env.example` to `.env.local`, fill in the values and restart `npm run dev`; Vite runs the same `api/` functions locally.

**Never commit real keys.** `.env`, `.env.local` and every other `.env.*` file are in `.gitignore`; only the empty `.env.example` template is in the repository. If a key is ever pushed by mistake, delete it in ElevenLabs / Bhashini and create a new one.

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

## Guided tour with Ravi
On a first visit, Ravi (the lab buddy) rolls onto the home page and walks the students through it: the game belt, the ring colours, the five games, the Element Lab, the no-points retry rule and the controls. A spotlight frames each part, a dotted arrow links his speech bubble to it, and he points at it while he talks (spoken aloud when the voice is on). **Skip tour** works at any time, the **Guide** button in the top bar replays it, and the browser remembers when it has been seen.

Ravi is drawn entirely in SVG code (`src/tour/ravi.js`) as a jointed puppet: hips, knees, ankles, shoulders, elbows, wrists and neck all turn on their real joints, so he can wave, point at any spot on the screen, hop, roll in, blink, talk and look around (`src/tour/mascot.js`, animated with GSAP). The tour steps are in `src/tour/steps.js`.

## Tech
- Vite + plain JavaScript for the games, and [Three.js](https://threejs.org) for all 3D: one WebGL canvas draws the space background and every 3D stage.
- React 19 + TypeScript + Tailwind CSS v4 with the shadcn/ui structure (`components.json`, `src/components/ui`, `src/lib/utils.ts`, theme tokens in `src/index.css`) for the home belt. React only loads on the home page.
- Icons are [Lucide](https://lucide.dev). The fonts are Geist, Geist Mono and Noto Sans Telugu.

```
src/
  components/ui/   sushi-conveyor-menu.tsx (shadcn-style component)
  home/            Home.tsx (games on the belt)
  data/            elements.js (1–30), questions.js (all 100 questions),
                   notes.js (why each answer choice is right or wrong), lessons.js (topic lessons, how to play)
  i18n/            te.json (Telugu text)
  three/           engine.js, models.js, plates.js, textures.js
  games/           quiz.js (Games 1, 3, 5), latin.js, cross.js, lab.js, session.js
  index.css        Tailwind + shadcn theme (light and dark)
  style.css        styles for the game screens
  theme.js         light / dark toggle
  i18n.js          English / Telugu switch, t()
  speech.js        device, ElevenLabs and Bhashini voices; narrate.js reads lines aloud
  settings.js, settingsPanel.js   voice, keys and language settings
  audio.js, fx.js, main.js
api/               eleven.js, bhashini.js, status.js (Vercel serverless functions)
```
