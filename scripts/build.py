#!/usr/bin/env python3
"""Build static readers from repository-owned Markdown. Requires Pandoc 3.x."""
import argparse
import html
import json
from pathlib import Path
import re
import shutil
import subprocess
from urllib.parse import urlsplit, unquote
from string import Template

ROOT = Path(__file__).resolve().parents[1]
LANGUAGES = {'en': 'English', 'ro': 'Romanian', 'zh': 'Chinese'}


def pandoc(args, text):
    return subprocess.run(['pandoc', *args], input=text, text=True,
                          capture_output=True, check=True).stdout


def plain(value):
    if isinstance(value, list):
        return ''.join(plain(v) for v in value)
    if isinstance(value, dict):
        if value.get('t') == 'Str':
            return value['c']
        if value.get('t') in {'Space', 'SoftBreak', 'LineBreak'}:
            return ' '
        return plain(value.get('c', []))
    return ''


def walk(value):
    if isinstance(value, dict):
        yield value
        yield from walk(value.get('c', []))
    elif isinstance(value, list):
        for item in value:
            yield from walk(item)


def convert(path, verse=False):
    reader = 'markdown+raw_html' + ('+hard_line_breaks' if verse else '')
    source = path.read_text()
    explicit_ids = set(re.findall(r'\{#([^\s}]+)', source))
    # Normalize standalone styled HTML headings in the supplied Markdown, in
    # memory only. They otherwise bypass Markdown heading IDs and the contents.
    source = re.sub(r'^<h([1-6])\b[^>]*>(.*?)</h\1>\s*$',
                    lambda m: '\n' + '#' * int(m[1]) + ' ' + html.unescape(re.sub(r'<[^>]+>', '', m[2])) + '\n',
                    source, flags=re.M)
    ast = json.loads(pandoc(['-f', reader, '-t', 'json'], source))
    headings, replacements, used = [], {}, set()
    chapter = 0
    publication_notes = False
    for node in walk(ast['blocks']):
        if node['t'] != 'Header':
            continue
        level, attrs, inlines = node['c']
        old = attrs[0]
        title = plain(inlines).strip()
        if level == 2:
            publication_notes = title.casefold() in {'publication notes', 'note de publicare'}
        number = re.match(r'^(\d+(?:\.\d+)*)(?:\s|$)', title)
        roman = re.match(r'^(?:CHAPTER|CAPITOLUL)\s+([IVXLCDM]+)\b', title, re.I)
        if old in explicit_ids:
            anchor = old
        elif publication_notes and number:
            anchor = 'publication-note' + number[1].replace('.', '-')
        elif path.parent.name == 'tao-te-ching' and number:
            n = int(number[1])
            anchor = f'section{1 if n <= 37 else 2}-{n}'
        elif number:
            anchor = 'section' + number[1].replace('.', '-')
        elif roman:
            chapter += 1
            anchor = f'section{chapter}'
        else:
            anchor = old
        if anchor in used:
            raise ValueError(f'{path}: duplicate heading anchor {anchor}; give the heading an explicit unique ID')
        used.add(anchor)
        attrs[0] = anchor
        replacements[old] = anchor
        if level > 1 and not re.fullmatch(r'(?:Note|Nota)\s+\d+', title, re.I):
            headings.append({'id': anchor, 'title': title, 'level': level})
    for node in walk(ast['blocks']):
        if node['t'] == 'Link':
            target = node['c'][-1]
            if target[0].startswith('#') and target[0][1:] in replacements:
                target[0] = '#' + replacements[target[0][1:]]
            elif not urlsplit(target[0]).scheme and not target[0].startswith('#'):
                ref = urlsplit(target[0])
                source_target = (path.parent / unquote(ref.path)).resolve()
                if source_target.is_relative_to(ROOT / 'content') and source_target.suffix == '.md':
                    match = re.fullmatch(r'book-([a-z]{2,3})(?:-([a-z0-9-]+))?\.md', source_target.name)
                    if match:
                        language, variant = match.groups()
                        slug = source_target.parent.name
                        stem = slug + (f'-{variant}' if variant else '')
                        target[0] = f'../../books/{language}/{stem}.html'
                        # The supplied link label often identifies a numbered section.
                        section = re.search(r'§(\d+(?:\.\d+)*)', plain(node['c'][-2]))
                        if section:
                            target[0] += '#section' + section[1].replace('.', '-')
                        elif ref.fragment:
                            target[0] += '#' + ref.fragment
    output = pandoc(['-f', 'json', '-t', 'html5', '--wrap=none'], json.dumps(ast))
    return output, headings


def e(value):
    return html.escape(str(value), quote=True)


def build(import_from=None):
    if not shutil.which('pandoc'):
        raise SystemExit('Pandoc 3.x is required. See README.md for setup.')
    books = json.loads((ROOT / 'library.json').read_text())
    template = Template((ROOT / 'templates/book.html').read_text())
    glyphs = json.loads((ROOT / 'glyphs.json').read_text())
    (ROOT / 'glyphs.js').write_text('// Generated from glyphs.json by scripts/build.py.\nwindow.NOOSPHERE_GLYPHS = ' + json.dumps(glyphs, ensure_ascii=False, indent=2) + ';\n')
    icons = ROOT / 'assets' / 'icons'
    icons.mkdir(exist_ok=True)
    catalog, expected = [], set()
    for book in books:
        slug = book['id']
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug):
            raise ValueError(f'Invalid book ID: {slug}')
        motif = glyphs[book['glyph']]
        icon = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140" fill="none" stroke="{e(book["glow"])}" stroke-width="4" stroke-linejoin="round"><circle cx="70" cy="70" r="60" stroke-opacity=".45"/>{motif}</svg>\n'
        (icons / f'{slug}.svg').write_text(icon)
        folder = ROOT / 'content' / slug
        if import_from:
            source = import_from / slug
            if not source.is_dir():
                raise ValueError(f'Missing reference folder: {source}')
            folder.mkdir(parents=True, exist_ok=True)
            for file in source.iterdir():
                if file.suffix in {'.md', '.pdf', '.docx'}:
                    shutil.copy2(file, folder / file.name)
        editions = []
        for path in sorted(folder.glob('book-*.md')):
            match = re.fullmatch(r'book-([a-z]{2,3})(?:-([a-z0-9-]+))?\.md', path.name)
            if not match:
                raise ValueError(f'Invalid edition filename: {path}')
            language, variant = match.groups()
            if variant and variant not in book.get('specialEditions', {}):
                raise ValueError(f'{slug}: add a label for special edition {variant} to library.json')
            stem = slug + (f'-{variant}' if variant else '')
            body, headings = convert(path, book.get('verse', False))
            downloads = {ext: f'content/{slug}/{path.stem}.{ext}'
                         for ext in ('md', 'pdf', 'docx') if path.with_suffix('.' + ext).exists()}
            editions.append(dict(language=language, variant=variant, label=book.get('specialEditions', {}).get(variant, 'Standard edition'),
                                 url=f'books/{language}/{stem}.html', downloads=downloads, headings=headings, body=body))
        default = next((ed for ed in editions if ed['language'] == 'en' and not ed['variant']), None)
        if not default:
            raise ValueError(f'{slug}: a standard English edition book-en.md is required')
        for edition in editions:
            lang = edition['language']
            alternatives = [ed for ed in editions if ed['variant'] == edition['variant']]
            options = ''.join(f'<option value="../../{e(ed["url"])}"{ " selected" if ed is edition else ""}>{e(LANGUAGES.get(ed["language"], ed["language"]))}</option>' for ed in alternatives)
            toc = ''.join(f'<a class="toc-jump toc-level-{min(h["level"], 4)}" href="#{e(h["id"])}">{e(h["title"])}</a>' for h in edition['headings'])
            special = ''.join(f'<a href="../../{e(ed["url"])}" data-edition-link>{e(ed["label"])} · {e(LANGUAGES.get(ed["language"], ed["language"]))}</a>' for ed in editions if ed['language'] == lang and ed is not edition)
            download_links = ''.join(f'<a href="../../{e(url)}" download>{ext.upper()}</a>' for ext, url in edition['downloads'].items())
            page = template.substitute(title=e(book['title']), label=e(edition['label']), author=e(book['author']),
                                       description=e(book['summary']), language=e(lang), direction='rtl' if lang in {'ar', 'he', 'fa', 'ur'} else 'ltr',
                                       slug=e(slug), accent=e(book['glow']), options=options, toc=toc, body=edition['body'],
                                       special=f'<div class="edition-links"><h3>Other editions</h3>{special}</div>' if special else '', downloads=download_links)
            target = ROOT / edition['url']
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(page)
            expected.add(target.resolve())
        record = {k: v for k, v in book.items() if k not in {'verse', 'specialEditions'}}
        record['dir'] = 'ltr'
        record['editions'] = [{k: v for k, v in ed.items() if k not in {'body', 'headings'}} for ed in editions]
        record['chapters'] = default['headings']
        record['url'] = default['url']
        record['downloads'] = default['downloads']
        catalog.append(record)
    # books/ contains generated reader pages only; remove obsolete generated editions.
    for path in (ROOT / 'books').glob('*/*.html'):
        if path.resolve() not in expected:
            path.unlink()
    payload = json.dumps(catalog, ensure_ascii=False, indent=2) + '\n'
    (ROOT / 'catalog.json').write_text(payload)
    (ROOT / 'catalog.js').write_text('// Generated by scripts/build.py; edit library.json and content/ instead.\nwindow.NOOSPHERE_CATALOG = ' + payload.rstrip() + ';\n')
    print(f'Built {len(expected)} HTML editions for {len(catalog)} books. Supplied downloads preserved.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--import-from', type=Path, help='Copy supplied editions for registered books before building')
    build(parser.parse_args().import_from)
