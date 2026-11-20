# Noösphere — The Living Scriptorium

A static, multilingual book library with an immersive archive and a focused reading experience.

Noösphere separates book content from presentation. Markdown editions become standalone HTML readers with shareable section links, while a shared visual theme connects the archive, volume details, and book pages. The interface is in English; each book can have multiple translations and special editions.

**Status:** Early development, preparing for a public open-source release. See [License and content attribution](#license-and-content-attribution) for the current licensing status.

## Features

- An interactive crystalline archive with a details screen for each book.
- Continuous reading with a collapsible table of contents.
- Separate HTML pages for each language and edition, with direct section links.
- Language switching that follows the current section when an equivalent is available.
- Dark and parchment reading surfaces, adjustable font size, and locally saved reading preferences.
- Downloads of supplied Markdown, PDF, and DOCX editions.
- Static hosting with no runtime backend, JavaScript framework, or database.

## Getting started

### Run locally

You need Git to clone the repository and Python 3 to run the example server. Generated HTML is included, so Pandoc is only needed when rebuilding books.

```sh
git clone https://github.com/jder7/noosphere.git
cd noosphere
python3 -m http.server 8000
```

Open [localhost:8000](http://localhost:8000). Select a focused volume, open its details, and choose **Read book**, a translation, or a section from its contents.

Each reader contains the complete book text in its HTML document. JavaScript adds reading controls and navigation enhancements; text loading does not depend on an API.

### Build from source

Requirements:

- Python **3.10 or later**; no third-party Python packages are required.
- [Pandoc **3.x**](https://pandoc.org/installing.html) for Markdown conversion.
- Node.js to run the optional JavaScript syntax checks below.

From the repository root:

```sh
python3 scripts/build.py
```

The build generates HTML readers and catalogs. It preserves source editions and supplied downloads. PDF and DOCX generation, automatic source monitoring, and conversion of other formats are outside the current scope.

### Verify changes

```sh
python3 -m unittest discover -s tests
node --check app.js
node --check reader.js
```

The tests check catalog consistency, local files and fragment links, section identifiers across translations, heading conversion, and available downloads. For interface changes, also check desktop and mobile layouts, direct section navigation, language switching, reading controls, and return navigation.

## Available books

| Work | Standard editions | Special editions |
| --- | --- | --- |
| Tao Te Ching | English, Romanian, Chinese | Annotated English |
| Esoteric Christianity | English, Romanian | — |
| The Knowledge of Reality | English, Romanian | — |
| The Philosopher’s Stone | English, Romanian | — |

Available download formats vary by edition. A missing PDF or DOCX is omitted from the interface.

## Project structure

```text
noosphere/
├── index.html           # Archive and volume details shell
├── app.js               # Archive interactions and catalog presentation
├── styles.css           # Shared visual theme
├── reader.js            # Reader navigation and preferences
├── reader.css           # Continuous reading layout
├── assets/              # Atmospheric artwork
├── library.json         # Editable book metadata and edition labels
├── content/             # Source Markdown and supplied PDF/DOCX files
│   └── <book-id>/
│       ├── book-en.md
│       ├── book-ro.md
│       └── book-en-annotated.md
├── templates/
│   └── book.html        # Shared HTML reader template
├── scripts/
│   └── build.py         # Content import and static generation
├── tests/               # Build output and navigation checks
├── books/               # Generated readers, grouped by language
├── catalog.json         # Generated catalog data
├── catalog.js           # Generated browser catalog
├── .nojekyll            # Static publishing without Jekyll processing
└── AGENTS.md            # Instructions for coding and content agents
```

Edit `library.json`, `content/`, and shared presentation files. Rebuild rather than editing `books/`, `catalog.json`, or `catalog.js` directly. Include regenerated output with changes to its source.

## Adding books and translations

This workflow applies to human contributors and content agents.

1. **Register the work** in `library.json`. Copy an existing record and provide a unique, stable kebab-case `id`, an English `title` and `summary`, `author`, `tradition`, `source`, `era`, the native `original` title and its `lang`, and the visual fields `glow` and `glyph`. Available glyphs are `vesica`, `lotus`, `wheel`, `star`, `rings`, `orbits`, `triad`, `cross`, `seed-of-life`, and `borromean`. Set `verse: true` to preserve source line breaks.
2. **Add source editions** under `content/<book-id>/`. Every work requires `book-en.md`. Translations use filenames such as `book-ro.md` or `book-zh.md`, with lowercase two- or three-letter language codes. To support another language, add its English display name to `LANGUAGES` in `scripts/build.py` and the language-name map in `app.js`. Application controls remain English.
3. **Register special editions**, if present. For example, `book-en-annotated.md` requires `"specialEditions": {"annotated": "Annotated edition"}` in the work's metadata. Special editions remain grouped under the parent work and receive their own URLs.
4. **Include supplied downloads** alongside the matching Markdown, using the same filename stem: `book-ro.pdf`, for example. Add only formats provided for that edition. The project generates HTML only.
5. **Preserve the edition's text and attribution**, including footnotes, annotations, publication notes, and known source information. Do not invent missing credits or bibliographic facts. Raw HTML is preserved during conversion, so review imported content and exclude scripts and event handlers.
6. **Build and verify**, using the commands above. Review a direct section link, a language switch, the volume details, and any supplied downloads before submitting the change.

### Import from an external directory

If editions are already organized into matching per-book folders, register their works in `library.json`, then run:

```sh
python3 scripts/build.py --import-from /path/to/reference/books
```

The importer copies `.md`, `.pdf`, and `.docx` files for registered works into `content/` and rebuilds the HTML. It overwrites matching local files, leaves other local files in place, and does not modify the reference directory. Review local edits before importing.

To retire an edition, remove its source files from `content/` and rebuild. The builder removes obsolete generated reader pages. The ignored `to-be-imported/` folder may hold local source references; it is not required to build or run the project.

## URLs and section links

Readers follow this convention:

```text
books/<language>/<book-id>[-<variant>].html#<section-id>
```

Examples:

```text
books/en/tao-te-ching.html#section1-1
books/ro/tao-te-ching.html#section1-1
books/en/tao-te-ching-annotated.html#section1-1
books/en/knowledge-of-reality.html#section1-1
```

Numbered headings such as `1.1` become `#section1-1`; Roman chapter headings such as `CHAPTER I` become `#section1`. Tao's chapter IDs run from `#section1-1` to `#section1-37`, then from `#section2-38` to `#section2-81`, across its translations and annotated edition. Unnumbered headings use Pandoc-generated identifiers unless an explicit ID is supplied.

Use explicit IDs for headings that need stable links or matching anchors across translations:

```md
## Foreword {#section-foreword}
### 1.1 The opening section {#section1-1}
```

Preserve IDs when revising or translating content. Footnote links remain navigable, and relative Markdown links to other imported books become HTML reader links. When switching editions, an unavailable section falls back to its nearest numbered parent, then to the beginning of the book.

## Deployment

Publish the repository root as a static site. The generated readers and catalogs are included, so the hosting environment does not need Python or Pandoc.

For GitHub Pages, use [branch publishing](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) with the repository root as the publishing source. The included `.nojekyll` file disables Jekyll processing. Relative links support both domain-root hosting and project paths such as `/noosphere/`.

Rebuild and verify content or template changes before publishing. No automated deployment workflow is currently included.

## Contributing

Bug reports, accessibility improvements, reader enhancements, documentation fixes, and well-attributed editions are welcome.

- Use [issues](https://github.com/jder7/noosphere/issues) to report bugs or discuss substantial changes. For bugs, include reproduction steps, the affected URL, browser, expected behavior, and actual behavior.
- Keep pull requests focused, describe their purpose, and include the relevant verification results. Include screenshots for visible interface changes.
- Follow the content workflow above when adding books or translations, and include the edition's source, attribution, and applicable permission or license information.
- Keep book content separate from shared presentation code and preserve existing public section links.

Coding agents should also follow [AGENTS.md](AGENTS.md).

## License and content attribution

A software license has **not yet been added** to this repository. The intended open-source release still needs an explicit license for the project code.

Book texts, translations, annotations, downloadable editions, and artwork have separate provenance and may carry their own terms. Their inclusion does not assign them a common project license. Preserve the notices supplied with each edition and consult its publication notes for attribution and source details.

In particular, the supplied Laurency editions contain copyright and “all rights reserved” notices. A future software license must distinguish project code from third-party content; this README does not establish permission to redistribute those editions or relicense them.
