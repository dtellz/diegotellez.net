# diegotellez.net

Personal portfolio and **The Living Atlas**, an explorable 3D résumé. Static HTML, CSS, and JavaScript, with Three.js 0.186.1 bundled locally. No application framework, CDN calls, analytics, hosted forms or backend.

## Run locally

```sh
npm run build
npm run dev
```

Open `http://127.0.0.1:4173`. No `npm install` is needed: the small build script uses Node’s standard library, and the browser’s Three.js modules are checked into `assets/vendor/three/`.

`npm run preview` serves the final `_site/` output instead. Stop an existing server on port 4173 before starting another.

## What is included

- `/`: portfolio, interactive terrain sculpture, selected work, software-focused career, and email contact.
- `/cv/`: a Three.js world with seven distinctive career landmarks, orbit controls, keyboard/touch movement, direct chapter navigation, detailed career panels, three challenges, collectible engine fragments, and local progress. Sound is opt-in. A low-power mode reduces rendering cost.
- `/resume/`: the complete, accessible, printable text résumé. Maritime experience is inside a closed optional “Before software” disclosure.
- `/assets/Diego-Tellez-CV.pdf`: the exact PDF supplied by Diego, unchanged. SHA-256: `b0e2f9a2ac3ebb9d1142f156e30590569396ff783f23491087b63d41bb9f8f32`.
- `/.well-known/profile.json`: the canonical, structured professional profile for recruiter agents.
- `/llms.txt`: a text version for automated readers, generated from the same profile.
- A custom ring-alignment puzzle before the normal PDF download.

The structured profile is discoverable through HTML `<link rel="alternate">` metadata and `robots.txt`; it is not placed in the visual navigation. It is public, not secret.

## Update content

Edit `.well-known/profile.json`, then run `npm run build`. This regenerates `resume/index.html` and `llms.txt` and prepares `_site/`. The readable résumé is fully present in the HTML and works without JavaScript.

The homepage’s editorial copy is in `index.html`. The atlas chapter narratives and landmark locations are in `assets/js/chapters.js`; they refer to the profile’s role IDs for detailed experience. Scene geometry, materials, lighting, movement, and rendering are in `assets/js/world.js`. UI and progression are in `assets/js/experience.js`.

Replace `assets/Diego-Tellez-CV.pdf` when the original CV changes. The build copies this file without modifying or regenerating it.

## GitHub Pages deployment

`.github/workflows/deploy.yml` runs on **every push to `master`** and supports manual dispatch. It builds an explicit allowlist of public files, uploads `_site/`, and deploys with the official GitHub Pages actions. It does not run or install tests.


## Puzzle limitations

The “true north” puzzle is a custom interaction, not a security boundary. On static hosting, the PDF, puzzle code, and validation logic are public. A bot or AI can inspect or solve the puzzle; no browser-only implementation can promise otherwise. The puzzle has no timer and supports keyboard and screen-reader controls. The full text résumé and structured profile stay available without it.

Do not put confidential material behind this gate. A server-validated challenge could deter simple automation but still would not establish an absolute human-only guarantee.
