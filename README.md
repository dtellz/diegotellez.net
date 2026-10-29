# diegotellez.net

Personal portfolio built with static HTML, CSS and JavaScript, without an application framework, CDN calls, analytics, hosted forms or backend.

## Run locally

```sh
npm run build
npm run dev
```

Open `http://127.0.0.1:4173`. No `npm install` is needed: the build scripts use Node’s standard library.

`npm run preview` serves the final `_site/` output instead. Stop an existing server on port 4173 before starting another.

## What is included

- `/`: engineering portfolio, production experience, selected AI products, engineering approach and email contact.
- `/blog/`: engineering articles, with a dedicated page for each post.
- `/cv/`: a redirect to `/resume/` for existing links.
- `/resume/`: the complete, accessible, printable text résumé. Maritime experience is inside a closed optional “Before software” disclosure.
- `/assets/Diego-Tellez-CV.pdf`: the exact PDF supplied by Diego, unchanged. SHA-256: `b0e2f9a2ac3ebb9d1142f156e30590569396ff783f23491087b63d41bb9f8f32`.
- `/.well-known/profile.json`: the canonical, structured professional profile for recruiter agents.
- `/llms.txt`: a text version for automated readers, generated from the same profile.
- `/404.html`: a missing-page view using the shared site design.

The structured profile is discoverable through HTML `<link rel="alternate">` metadata and `robots.txt`; it is not placed in the visual navigation. It is public, not secret.
