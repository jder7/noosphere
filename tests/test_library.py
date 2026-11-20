"""Validate generated pages and their links: python3 -m unittest discover -s tests."""
import json
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import unittest
import tempfile
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from build import convert


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids, self.refs = [], []
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag in {'a', 'link', 'script', 'img'}:
            ref = attrs.get('href') or attrs.get('src')
            if ref:
                self.refs.append(ref)


class LibraryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = json.loads((ROOT / 'catalog.json').read_text())
        cls.pages = {p: Page(p) for p in (ROOT / 'books').glob('*/*.html')}

    def test_catalog_matches_registered_books_and_editions(self):
        registry = json.loads((ROOT / 'library.json').read_text())
        self.assertEqual([b['id'] for b in registry], [b['id'] for b in self.catalog])
        for book in self.catalog:
            self.assertTrue(book['url'].startswith('books/en/'))
            sources = list((ROOT / 'content' / book['id']).glob('book-*.md'))
            self.assertEqual(len(sources), len(book['editions']))
            for edition in book['editions']:
                self.assertTrue((ROOT / edition['url']).is_file())
                for url in edition['downloads'].values():
                    self.assertTrue((ROOT / url).is_file())
            page = self.pages[ROOT / book['url']]
            for chapter in book['chapters']:
                self.assertIn(chapter['id'], page.ids)

    def test_every_local_link_and_fragment_resolves(self):
        for path, page in self.pages.items():
            duplicates = [id for id, n in Counter(page.ids).items() if n > 1]
            self.assertEqual([], duplicates, str(path))
            for ref in page.refs:
                url = urlsplit(ref)
                if url.scheme or url.netloc:
                    continue
                target = (path.parent / unquote(url.path)).resolve() if url.path else path
                self.assertTrue(target.is_file(), f'{path}: missing {ref}')
                if url.fragment and target in self.pages:
                    self.assertIn(unquote(url.fragment), self.pages[target].ids, f'{path}: broken {ref}')

    def test_section_ids_match_translations_and_special_edition(self):
        for slug, languages in [('tao-te-ching', ['en','ro','zh']), ('esoteric-christianity', ['en','ro']), ('knowledge-of-reality', ['en','ro']), ('philosophers-stone', ['en','ro'])]:
            sets = [{id for id in self.pages[ROOT / f'books/{lang}/{slug}.html'].ids if id.startswith('section')} for lang in languages]
            for ids in sets[1:]:
                self.assertEqual(sets[0], ids, slug)
        annotated = self.pages[ROOT / 'books/en/tao-te-ching-annotated.html']
        for id in self.pages[ROOT / 'books/en/tao-te-ching.html'].ids:
            if id.startswith('section'):
                self.assertIn(id, annotated.ids)
        self.assertIn('section1-1', annotated.ids)

    def test_heading_conversion_separates_publication_notes_and_keeps_explicit_ids(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'book-en.md'
            path.write_text('# Work\n\n## 1 Chapter\n\n### 1.1 Opening\n\n[Opening](#opening)\n\n<h2 style="text-align:center">2 Second chapter</h2>\n\n## Publication notes\n\n### 1\n\nAttribution.\n\n## Foreword {#section-foreword}\n')
            body, headings = convert(path)
            ids = {h['id'] for h in headings}
            self.assertTrue({'section1', 'section1-1', 'section2', 'publication-note1', 'section-foreword'} <= ids)
            self.assertIn('href="#section1-1"', body)

    def test_downloads_are_only_supplied_formats(self):
        for book in self.catalog:
            for edition in book['editions']:
                self.assertIn('md', edition['downloads'])
                self.assertTrue(set(edition['downloads']) <= {'md','pdf','docx'})
        book = next(b for b in self.catalog if b['id']=='esoteric-christianity')
        ro = next(ed for ed in book['editions'] if ed['language']=='ro')
        self.assertIn('pdf', ro['downloads'])


if __name__ == '__main__':
    unittest.main()
