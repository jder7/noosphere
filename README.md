# NOÖSPHERE — The Living Scriptorium

A working immersive HTML/CSS/JavaScript design prototype based on the **Alien Noosphere** visual concept (jade, amethyst, crystalline codices, sacred-geometry neural network).

## Experience

**1 — Archive:** A spatial field of seven floating transparent books. Scroll/touch-swipe or use Left/Right/Up/Down arrows to move through books. Click a distant book to focus it. Click the focused book, or `Enter this volume`, to inspect it. A bottom row of symbols supports direct selection.

**2 — Volume:** An enlarged physical codex with original-script title, a short bibliographic introduction, four selectable chapters, and functional demonstration PDF/MD/DOCX downloads. `Return to the field` goes to the archive.

**3 — Reader:** A single framed page per viewport, vertical scroll-snap page turning, collapsible left contents, direct chapter navigation, dark/parchment reading surface, font resizing, and sample English/Romanian language switching. Escape returns to the volume; the reader also has a route directly to the archive.

The visual environment uses the supplied/generated Alien Noosphere design image as an atmospheric reference, with live geometry and dimensional book models built from CSS/SVG. No JS framework, WebGL, or build step is required.

## Files

- `index.html`, `styles.css`, `app.js` — the editable prototype.
- `assets/noosphere-environment.webp`, `assets/neural-atmosphere.webp` — atmospheric art crops.
- `catalog.json` — a separate data seed for future backend/catalog integration (demo catalog is currently defined in `app.js`).
- `editions/` — 7 × PDF, Markdown, DOCX downloadable **example documents**.

Open `index.html` in a browser. The separately supplied standalone HTML packages all assets and sample downloads into one file for offline testing. Web fonts are optional; system fonts are fallbacks.

## Publication limitation

**All reading passages and downloadable editions are explicitly sample/demo content.** They are not authentic sacred texts, translations, or reliable academic editions. A published library must replace them with verified and properly licensed texts. It should keep distinct records for work, original language, translation language, translator, publication date, source, and rights. For multilingual production use proper fonts and `lang` / `dir` per edition (especially Arabic and Hebrew).

## Browser QA

Tested on desktop and mobile Chromium: archive wheel focus, selection, detail, page navigation, collapsed table of contents, reader mode switching, responsive layouts, and return routes. Keyboard interactions and reduced-motion settings are supported.
