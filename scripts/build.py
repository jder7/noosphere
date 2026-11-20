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
import xml.etree.ElementTree as ET

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


def sitemap_xml(catalog, site_url):
    parsed = urlsplit(site_url)
    if parsed.scheme not in {'http', 'https'} or not parsed.netloc or parsed.query or parsed.fragment:
        raise ValueError('site.json url must be an absolute HTTP(S) URL without a query or fragment')
    base = site_url.rstrip('/') + '/'
    namespace = 'http://www.sitemaps.org/schemas/sitemap/0.9'
    ET.register_namespace('', namespace)
    root = ET.Element(f'{{{namespace}}}urlset')
    paths = [''] + [ed['url'] for book in catalog for ed in book['editions']]
    for path in paths:
        entry = ET.SubElement(root, f'{{{namespace}}}url')
        ET.SubElement(entry, f'{{{namespace}}}loc').text = base + path
    ET.indent(root, space='  ')
    return ET.tostring(root, encoding='utf-8', xml_declaration=True).decode() + '\n'


def seo_head(title, description, url, data, alternatives=()):
    image = json.loads((ROOT / 'site.json').read_text())['url'].rstrip('/') + '/assets/share.png'
    tags = [f'<link rel="canonical" href="{e(url)}">']
    for language, target in alternatives:
        tags.append(f'<link rel="alternate" hreflang="{e(language)}" href="{e(target)}">')
    for key, value in {'og:type': 'website', 'og:site_name': 'Noösphere', 'og:title': title,
                       'og:description': description, 'og:url': url, 'og:image': image,
                       'og:image:width': '1200', 'og:image:height': '630',
                       'og:image:alt': 'Noösphere — The Living Scriptorium'}.items():
        tags.append(f'<meta property="{key}" content="{e(value)}">')
    tags.append('<meta name="twitter:card" content="summary_large_image">')
    payload = json.dumps(data, ensure_ascii=False).replace('<', '\\u003c')
    tags.append(f'<script type="application/ld+json">{payload}</script>')
    return '\n'.join(tags)


def replace_generated(text, name, content):
    start, end = f'<!-- BEGIN {name} -->', f'<!-- END {name} -->'
    return re.sub(re.escape(start) + r'.*?' + re.escape(end),
                  lambda _: start + '\n' + content + '\n' + end, text, flags=re.S)


def build(import_from=None):
    if not shutil.which('pandoc'):
        raise SystemExit('Pandoc 3.x is required. See README.md for setup.')
    base = json.loads((ROOT / 'site.json').read_text())['url'].rstrip('/') + '/'
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
            language_name = LANGUAGES.get(lang, lang)
            page_title = f'{book["title"]} — {language_name} · {edition["label"]} · Noösphere'
            description = f'Read {book["title"]} in {language_name} ({edition["label"].lower()}). {book["summary"]}'
            url = base + edition['url']
            alternates = [(ed['language'], base + ed['url']) for ed in alternatives]
            fallback = next((ed for ed in alternatives if ed['language'] == 'en'), None)
            if fallback:
                alternates.append(('x-default', base + fallback['url']))
            data = {'@context': 'https://schema.org', '@type': 'Book', 'name': book['title'],
                    'url': url, 'inLanguage': lang, 'bookEdition': edition['label']}
            if book.get('author') and 'traditional attribution' not in book['author']:
                data['author'] = {'@type': 'Person', 'name': book['author']}
            page = template.substitute(page_title=e(page_title), seo=seo_head(page_title, description, url, data, alternates), title=e(book['title']), label=e(edition['label']), author=e(book['author']),
                                       description=e(description), language=e(lang), direction='rtl' if lang in {'ar', 'he', 'fa', 'ur'} else 'ltr',
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
    site = json.loads((ROOT / 'site.json').read_text())
    (ROOT / 'sitemap.xml').write_text(sitemap_xml(catalog, site['url']))
    rows = []
    for book in catalog:
        links = ' · '.join(f'<a href="{e(ed["url"])}">{e(LANGUAGES.get(ed["language"], ed["language"]))}{" — " + e(ed["label"]) if ed["variant"] else ""}</a>' for ed in book['editions'])
        rows.append(f'<li class="tunnel-card" style="--aura:{e(book["glow"])}"><div class="tunnel-depth" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="tunnel-content"><h3><a href="{e(book["url"])}">{e(book["title"])}</a></h3><p class="collection-author">{e(book["author"])}</p><p>{e(book["summary"])}</p><nav aria-label="{e(book["title"])} editions">{links}</nav></div></li>')
    index = ROOT / 'index.html'
    text = replace_generated(index.read_text(), 'COLLECTION', '\n'.join(rows))
    title = 'Noösphere — The Living Scriptorium'
    description = 'Explore works on ancient wisdom, consciousness, and reality in the multilingual Noösphere library.'
    text = replace_generated(text, 'SEO', seo_head(title, description, base, {'@context': 'https://schema.org', '@type': 'WebSite', 'name': 'Noösphere', 'url': base}))
    index.write_text(text)
    (ROOT / 'robots.txt').write_text(f'User-agent: *\nAllow: /\n\nSitemap: {base}sitemap.xml\n')
    print(f'Built {len(expected)} HTML editions for {len(catalog)} books. Supplied downloads preserved.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--import-from', type=Path, help='Copy supplied editions for registered books before building')
    build(parser.parse_args().import_from)
