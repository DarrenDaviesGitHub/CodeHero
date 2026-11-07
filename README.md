# Code Hero

A neon, rhythm-game-style typing game. Programming keywords from **C#, TypeScript, JavaScript, HTML, CSS, Go and Python** race down a synthwave highway. Type each one before it reaches the strike line, and lightning hits it.

## How to play

| Key | Action |
| --- | --- |
| `Enter` | Start / play again |
| `1`–`7` | Turn languages on or off (intro screen) |
| *letters & symbols* | Type the falling keywords. The first key locks on to the matching word nearest the strike line |
| `Backspace` | Drop the current target and pick another word |
| `Esc` | Pause / resume (from Game Over: back to menu) |
| `Q` | Quit to menu (while paused) |
| `M` | Mute / unmute (not during play) |

- You have **5 lives**. A keyword that reaches the strike line costs one life.
- Clear **10 keywords** to reach the next level: words fall faster, appear more often and get longer or more symbol-heavy (`@keyframes`, `__init__`, `justify-content`…).
- Clear keywords in a row to build a combo. The multiplier goes to 2x at 5, 3x at 10 and 4x at 20. A wrong key or a missed word resets it.
- Matching is case-insensitive. Your high score, language choice and mute setting are saved in your browser.

## Tech

- **React 19** UI (intro, HUD, pause and game-over screens) on top of a **Phaser 4** canvas (highway, keywords, lightning and particles)
- **TypeScript** (strict), **Vite 8**, **Vitest** for unit tests and **oxlint**
- Sound is synthesised with the Web Audio API, and fonts are self-hosted via Fontsource. There are no external network requests, so a strict CSP works.

```
src/
  game/
    logic/        pure, unit-tested rules: keywords, levels, typing engine, scoring
    scenes/       Phaser scenes (Boot, Play)
    WordSprite.ts falling keyword with per-letter highlighting
    effects.ts    lightning, sparks, shockwaves, floating text
    audio.ts      Web Audio synth: SFX + background beat
    events.ts     typed event bus between React and Phaser
  ui/             React components
```

## Scripts

```bash
npm install
npm run dev        # start the dev server
npm test           # unit tests
npm run lint
npm run build      # type-check + production build to dist/
npm run preview    # serve dist/ with the production security headers
```

## Security notes

- No `eval`, no `dangerouslySetInnerHTML` and no third-party scripts or CDNs.
- `vite preview` sends a strict Content-Security-Policy and related headers (see `vite.config.ts`). Configure the same headers on whichever host serves `dist/`.
- Reads from `localStorage` are wrapped in try/catch and validated.
- The debug handle `window.__codeHeroGame` is only exposed in development builds.
