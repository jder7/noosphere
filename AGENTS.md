# Library maintenance

Follow the global git rules.

## Project overview

Noösphere — The Living Scriptorium is a static multilingual book library built with HTML, CSS, and JavaScript. Readers browse a crystalline archive, open a volume's details, and read its full text on a separate themed HTML page. Book URLs include the translation language and support direct section links; application controls remain English. Python and Pandoc generate HTML from Markdown, while supplied MD/PDF/DOCX editions are available as downloads. The site supports GitHub Pages hosting without a runtime backend.

## Project structure

- `index.html`, `app.js` — archive and volume details interface.
- `styles.css`, `assets/` — shared theme, artwork, site mark, and generated book favicons.
- `glyphs.json` — shared editable book glyph definitions; `glyphs.js` is generated.
- `reader.js`, `reader.css` — continuous reader navigation and controls.
- `library.json` — editable book metadata and special-edition labels.
- `site.json` — published base URL used to generate `sitemap.xml`.
- `content/<book-id>/` — source Markdown translations and supplied downloads.
- `templates/book.html` — shared template for every HTML edition.
- `scripts/build.py` — builds readers and catalogs from the source content.
- `books/<language>/*.html`, `catalog.json`, `catalog.js` — generated static output.
- `tests/` — content, navigation, and link validation.
- `to-be-imported/` — local references to external edition sources; not a build dependency.
- `README.md` — setup, build commands, and the detailed content import workflow.

## Adding content

Use the agent workflow in README.md. Edit `library.json` and `content/`, then run `python3 scripts/build.py`. Do not hand-edit generated `books/`, `catalog.json`, `catalog.js`, `glyphs.js`, `sitemap.xml`, or `assets/icons/`. Keep design changes in the shared template, CSS, or JavaScript rather than individual books.

- Every work needs a standard English Markdown edition. Book languages belong in the URL; app controls remain English.
- Copy supplied sources into this repository. Never modify the external reference location.
- Generate HTML only. Link MD/PDF/DOCX downloads only when the corresponding supplied files exist. Other format conversion is out of scope.
- Keep special editions attached to their parent work and give them a distinct variant filename and URL.
- Preserve section IDs across translations and revisions, source footnote links, annotations, and edition attribution. Do not invent text, translations, or publication metadata.
- Raw HTML in source editions is trusted content: review it before importing. Never add scripts or event handlers to book content.

## Verification

Run `python3 -m unittest discover -s tests`, `node --check app.js`, and `node --check reader.js` after building. Check direct section navigation, language switching, supplied downloads, archive return navigation, and the mobile reader when changing templates or navigation. Keep relative paths working under a GitHub Pages project prefix.
