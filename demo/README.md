# Demo — static PWA (Week 3)

Open `index.html` (or serve this folder with any static host) and paste a
link or a whole chat message. The demo imports `../core/clean-share.js`
directly — it does not duplicate the cleaning logic.

- `index.html` / `app.js` / `style.css` — the demo page
- `sw.js` / `manifest.json` / `icon.svg` — offline PWA (works offline after first load)
- `i18n/en.json` — every UI string, so translators can add a language by adding one file
- `clean-whatsapp-link.html`, `remove-utm-from-link.html`,
  `wa-me-link-generator.html` — small per-intent pages linking to the demo

Privacy: nothing is uploaded. The demo makes no network requests of its
own — check your browser's DevTools Network tab.
