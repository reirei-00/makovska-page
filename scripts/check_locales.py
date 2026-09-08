#!/usr/bin/env python3
"""Check locale navigation, portable URLs, anchors, and unchanged citations."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, unquote, urljoin, urlsplit
import hashlib
import posixpath
import re

from build_locales import BASE, LANGUAGES, PAGES, PAPER_DATA, route

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.tags, self.ids, self.citations = [], [], {}
        self.pre = None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'pre' and 'paper-citation' in attrs.get('class', '').split():
            self.pre = attrs.get('id')
            self.citations[self.pre] = ''

    def handle_endtag(self, tag):
        if tag == 'pre':
            self.pre = None

    def handle_data(self, text):
        if self.pre is not None:
            self.citations[self.pre] += text


def main():
    files = [ROOT / route(lang, page) / 'index.html'
             for lang in LANGUAGES for page in PAGES]
    files += [ROOT / prefix / 'index.html' for prefix in LANGUAGES.values()]
    docs = {path: Page(path.read_text()) for path in files}
    versions = []
    for path, doc in docs.items():
        stamps = [attrs.get('content', '') for tag, attrs in doc.tags if tag == 'meta' and attrs.get('name') == 'site-version']
        assert len(stamps) == 1 and re.fullmatch('[a-f0-9]{12}', stamps[0]), path
        versions.append(stamps[0])
    assert len(set(versions)) == 1, 'Every page must belong to the same release.'
    release = versions[0]
    assert {path.resolve() for path in ROOT.rglob('*.html') if not any(part.startswith('.') for part in path.relative_to(ROOT).parts)} == set(docs), 'Unexpected HTML pages outside the current site.'
    references = 0
    for path, doc in docs.items():
        assert all(n == 1 for n in Counter(doc.ids).values()), path
        for tag, attrs in doc.tags:
            for attr in ('aria-labelledby', 'aria-describedby'):
                for identifier in attrs.get(attr, '').split():
                    assert identifier in doc.ids, (path, attr, identifier)
            if 'data-copy-target' in attrs:
                assert attrs['data-copy-target'] in doc.ids, path
            for attr in ('href', 'src'):
                ref = attrs.get(attr)
                if not ref:
                    continue
                url = urlsplit(ref)
                if url.scheme or url.netloc:
                    continue
                assert not url.path.startswith('/'), (path, ref)
                target = (path.parent / unquote(url.path)).resolve() if url.path else path
                if target.is_dir():
                    target /= 'index.html'
                assert target.exists(), (path, ref)
                if url.path and target in docs:
                    assert parse_qs(url.query).get('v') == [release], (path, ref, 'Stale page version')
                elif target.is_relative_to(ROOT / 'assets'):
                    version = hashlib.sha256(target.read_bytes()).hexdigest()[:12]
                    assert parse_qs(url.query).get('v') == [version], (path, ref, 'Stale asset version')
                if url.fragment and target in docs:
                    assert unquote(url.fragment) in docs[target].ids, (path, ref)
                for prefix in ('/', '/makovska-page/'):
                    current = 'https://test.invalid' + prefix + str(path.relative_to(ROOT))
                    resolved = urlsplit(urljoin(current, ref)).path
                    if resolved.endswith('/'):
                        resolved += 'index.html'
                    expected = posixpath.normpath(prefix + str(target.relative_to(ROOT)))
                    assert resolved == expected, (path, ref, resolved, expected)
                references += 1
    for lang in LANGUAGES:
        for page in PAGES:
            path = ROOT / route(lang, page) / 'index.html'
            doc = docs[path]
            assert sum(tag == 'h1' for tag, _ in doc.tags) == 1, path
            assert sum(tag == 'main' for tag, _ in doc.tags) == 1, path
            assert ('html', {'lang': lang}) in doc.tags, path
            assert any(t == 'a' and a.get('class') == 'skip-link' and a.get('href') == '#main' for t, a in doc.tags), path
            assert sum(a.get('aria-current') == 'page' for _, a in doc.tags) == 1, path
            assert any(t == 'meta' and a.get('name') == 'description' and a.get('content') for t, a in doc.tags), path
            canonical = [a['href'] for t, a in doc.tags if t == 'link' and a.get('rel') == 'canonical']
            assert canonical == [BASE + route(lang, page)], path
            alternates = {a['hreflang']: a['href'] for t, a in doc.tags if t == 'link' and a.get('rel') == 'alternate'}
            expected = {code: BASE + route(code, page) for code in LANGUAGES}
            expected['x-default'] = BASE + route('en', page)
            assert alternates == expected, path
            switches = [a for _, a in doc.tags if 'data-language-link' in a]
            assert len(switches) == 3, path
            assert [a['lang'] for a in switches if a.get('aria-current') == 'true'] == [lang], path
            for a in switches:
                assert (path.parent / urlsplit(a['href']).path).resolve() == ROOT / route(a['lang'], page), path
            original = docs[ROOT / page / 'index.html']
            assert doc.citations == original.citations, path
            assert set(doc.ids) == set(original.ids), path
            dates = lambda p: [a.get('datetime') for t, a in p.tags if t == 'time']
            assert dates(doc) == dates(original), path
            for tag, attrs in doc.tags:
                if tag != 'a' or 'data-language-link' in attrs:
                    continue
                ref = attrs.get('href', '')
                if not ref or urlsplit(ref).scheme or ref.startswith('#'):
                    continue
                target = (path.parent / urlsplit(ref).path).resolve()
                relative_target = target.relative_to(ROOT).as_posix().removesuffix('/index.html')
                for prefix in ('uk/', 'zh-tw/'):
                    if relative_target.startswith(prefix):
                        relative_target = relative_target[len(prefix):]
                        break
                if relative_target in PAGES:
                    assert target == ROOT / route(lang, relative_target), (path, ref)
    for lang in LANGUAGES:
        catalogue = docs[ROOT / route(lang, 'research') / 'index.html']
        assert sum('data-explainer-link' in a for _, a in catalogue.tags) == len(PAPER_DATA)
        for paper in PAPER_DATA:
            path = ROOT / route(lang, 'research/' + paper['slug']) / 'index.html'
            doc = docs[path]
            assert sum(t == 'figure' and a.get('class') == 'paper-visual' for t, a in doc.tags) == 1, path
            assert all(catalogue.citations.get(key) == value for key, value in doc.citations.items()), path
            assert doc.citations, path
    print(f'PASS: {len(docs)} pages; {references} local references; current page/asset versions, locale routes, metadata, anchors, publication dates, and unchanged citations.')


if __name__ == '__main__':
    main()
