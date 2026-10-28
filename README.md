# diegotellez.net

AI-native software engineering portfolio with a readable résumé and direct PDF download. The site emphasizes systems, technical judgment, applied AI, verification and ownership of outcomes. All pages share the same typography, navigation and light/dark theme. Built with static HTML, CSS and JavaScript, without an application framework, CDN calls, analytics, hosted forms or backend.

## Run locally

```sh
npm run build
npm run dev
```

Open `http://127.0.0.1:4173`. No `npm install` is needed: the build scripts use Node’s standard library.

`npm run preview` serves the final `_site/` output instead. Stop an existing server on port 4173 before starting another.

## What is included

- `/`: engineering portfolio, production experience, selected AI products, engineering approach and email contact.
- `/cv/`: a redirect to `/resume/` for existing links.
- `/resume/`: the complete, accessible, printable text résumé. Maritime experience is inside a closed optional “Before software” disclosure.
- `/assets/Diego-Tellez-CV.pdf`: the exact PDF supplied by Diego, unchanged. SHA-256: `b0e2f9a2ac3ebb9d1142f156e30590569396ff783f23491087b63d41bb9f8f32`.
- `/.well-known/profile.json`: the canonical, structured professional profile for recruiter agents.
- `/llms.txt`: a text version for automated readers, generated from the same profile.
- `/404.html`: a missing-page view using the shared site design.

The structured profile is discoverable through HTML `<link rel="alternate">` metadata and `robots.txt`; it is not placed in the visual navigation. It is public, not secret.

## Update content

Edit `.well-known/profile.json`, then run `npm run build`. This regenerates the homepage shell, `resume/index.html`, `llms.txt`, `404.html` and the `/cv/` redirect before preparing `_site/`. The readable résumé is fully present in the HTML and works without JavaScript.

The homepage’s editorial copy is in `index.html`. Shared page structure is generated from `scripts/layout.mjs`, with common styles in `assets/css/landing.css` and interactions in `assets/js/landing.js`. The résumé adds `assets/css/resume.css` for its content and print layout. Edit the shared shell in the generator so future builds preserve changes across pages.

PDF links download the original CV directly. The site has no game renderer or download puzzle.

Replace `assets/Diego-Tellez-CV.pdf` when the original CV changes. The build copies this file without modifying or regenerating it.

## GitHub Pages deployment

`.github/workflows/deploy.yml` runs on **every push to `master`** and supports manual dispatch. It builds an explicit allowlist of public files, uploads `_site/` and deploys with the official GitHub Pages actions. It does not run or install tests.
