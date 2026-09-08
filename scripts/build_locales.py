#!/usr/bin/env python3
"""Build static Ukrainian and Taiwan Traditional Chinese pages from English HTML.

Run after English content changes. Missing translations fail the build so updates
cannot silently leave untranslated prose in the localized site.
"""
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
import json
import posixpath
import re

ROOT = Path(__file__).resolve().parents[1]
PAPER_DATA = json.loads((ROOT / 'data/papers.json').read_text())
PAGES = ('about', 'research', 'teaching', 'media') + tuple('research/' + p['slug'] for p in PAPER_DATA)
LANGUAGES = {'en': '', 'uk': 'uk', 'zh-Hant-TW': 'zh-tw'}
LABELS = {'en': 'English', 'uk': 'Українська', 'zh-Hant-TW': '繁體中文（台灣）'}
NAV_LABELS = {'en': 'Language', 'uk': 'Мова', 'zh-Hant-TW': '語言'}
BASE = 'https://reirei-00.github.io/makovska-page/'
TRANSLATIONS = json.loads((ROOT / 'locales/translations.json').read_text())


def add_translations(value):
    if isinstance(value, dict):
        if set(('en', 'uk', 'zh-Hant-TW')) <= value.keys():
            TRANSLATIONS[' '.join(value['en'].split())] = {lang: value[lang] for lang in ('uk', 'zh-Hant-TW')}
        else:
            for child in value.values():
                add_translations(child)
    elif isinstance(value, list):
        for child in value:
            add_translations(child)


add_translations(PAPER_DATA)
add_translations(json.loads((ROOT / 'data/paper-ui.json').read_text()))
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}


def normalize(value):
    return ' '.join(value.split())


def route(lang, page):
    return '/'.join(filter(None, (LANGUAGES[lang], page))) + '/'


def relative(source, target):
    return posixpath.relpath(target, source) + ('/' if target.endswith('/') else '')


def clean_generated(source):
    return re.sub(r'<!-- locale-(?:head|switch):start -->.*?<!-- locale-(?:head|switch):end -->', '', source, flags=re.S)


def decorate(source, lang, page):
    current = route(lang, page)
    alternates = ''.join(f'<link rel="alternate" hreflang="{code}" href="{BASE}{route(code, page)}">\n' for code in LANGUAGES)
    alternates += f'<link rel="alternate" hreflang="x-default" href="{BASE}{route("en", page)}">\n'
    script = relative(current, 'assets/js/languages.js')
    source = source.replace('</head>', f'<!-- locale-head:start -->\n{alternates}<script src="{script}" defer></script>\n<!-- locale-head:end --></head>', 1)
    links = []
    for code in LANGUAGES:
        active = ' aria-current="true"' if code == lang else ''
        links.append(f'<a href="{relative(current, route(code, page))}" lang="{code}" hreflang="{code}" data-language-link{active}>{LABELS[code]}</a>')
    nav = f'<!-- locale-switch:start --><nav class="language-switch" aria-label="{NAV_LABELS[lang]}">' + ''.join(links) + '</nav><!-- locale-switch:end -->'
    assert '</div></header>' in source
    return source.replace('</div></header>', nav + '</div></header>', 1)


class Translator(HTMLParser):
    def __init__(self, lang, page):
        super().__init__(convert_charrefs=True)
        self.lang, self.page = lang, page
        self.output, self.stack, self.missing = [], [], set()

    def translated(self, value):
        key = normalize(value)
        if key in TRANSLATIONS:
            return TRANSLATIONS[key][self.lang]
        if re.search(r'[A-Za-z]', key):
            self.missing.add(key)
        return value

    def url(self, value):
        u = urlsplit(value)
        if u.scheme or u.netloc or not u.path:
            return value
        target = posixpath.normpath(posixpath.join(self.page, u.path))
        if target in PAGES or target.removesuffix('/index.html') in PAGES:
            target = route(self.lang, target.removesuffix('/index.html'))
        path = relative(route(self.lang, self.page), target)
        return urlunsplit(('', '', path, u.query, u.fragment))

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        parent_protected = any(protected for _, protected in self.stack)
        protected = parent_protected or tag in ('pre', 'script', 'style') or 'paper-authors' in data.get('class', '')
        if tag == 'html':
            data['lang'] = self.lang
        if tag == 'link' and data.get('rel') == 'canonical':
            data['href'] = BASE + route(self.lang, self.page)
        for key, value in list(data.items()):
            if value is None:
                continue
            if key in ('href', 'src'):
                data[key] = self.url(value)
            elif key in ('aria-label', 'alt', 'title') or (tag == 'meta' and key == 'content' and data.get('name') == 'description'):
                data[key] = self.translated(value)
        # Bibliographic strings remain the original, copyable source text.
        if tag == 'pre' or 'paper-authors' in data.get('class', ''):
            data['lang'] = 'en'
        self.output.append('<' + tag + ''.join(' ' + k if v is None else f' {k}="{escape(v, quote=True)}"' for k, v in data.items()) + '>')
        if tag not in VOID:
            self.stack.append((tag, protected))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        self.output.append(f'</{tag}>')
        for i in range(len(self.stack)-1, -1, -1):
            if self.stack[i][0] == tag:
                self.stack = self.stack[:i]
                break

    def handle_data(self, value):
        if not value.strip():
            self.output.append(value)
            return
        if any(protected for _, protected in self.stack):
            self.output.append(value if self.stack[-1][0] in ('script', 'style') else escape(value, quote=False))
            return
        translated = self.translated(value)
        if translated != value:
            leading = re.match(r'^\s*', value).group()
            trailing = re.search(r'\s*$', value).group()
            translated = leading + translated + trailing
        # English paper and proceedings titles keep their source language marker.
        key = normalize(value)
        if key in TRANSLATIONS and all(v == key for v in TRANSLATIONS[key].values()) and len(key.split()) > 5 and re.search('[a-z]', key) and self.stack[-1][0] != 'title':
            translated = '<span lang="en">' + escape(translated, quote=False) + '</span>'
            self.output.append(translated)
        else:
            self.output.append(escape(translated, quote=False))

    def handle_decl(self, decl):
        self.output.append(f'<!{decl}>')

    def handle_comment(self, comment):
        self.output.append(f'<!--{comment}-->')


def main():
    from build_papers import build
    paper_sources = build(write=False)
    rendered = {}
    for page in PAGES:
        path = ROOT / page / 'index.html'
        source = clean_generated(paper_sources[path] if path in paper_sources else path.read_text())
        rendered[ROOT / page / 'index.html'] = decorate(source, 'en', page)
        for lang in ('uk', 'zh-Hant-TW'):
            parser = Translator(lang, page)
            parser.feed(source)
            if parser.missing:
                raise SystemExit(f'Missing {lang} translations in {page}: {sorted(parser.missing)}')
            translated = ''.join(parser.output)
            if lang == 'uk':
                # The Ukrainian heading already contains the event's original title.
                translated = re.sub(r'<p class="original-title" lang="uk">.*?</p>', '', translated, flags=re.S)
            rendered[ROOT / LANGUAGES[lang] / page / 'index.html'] = decorate(translated, lang, page)
    for lang in ('uk', 'zh-Hant-TW'):
        label = 'Відкрити сайт Вікторії Маковської' if lang == 'uk' else '前往 Viktoriia Makovska 的網站'
        rendered[ROOT / LANGUAGES[lang] / 'index.html'] = f'<!DOCTYPE html>\n<html lang="{lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="refresh" content="0; url=about/"><link rel="canonical" href="{BASE}{route(lang, "about")}"><title>{label}</title></head><body><p><a href="about/">{label}</a></p></body></html>\n'
    for path, content in rendered.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
    print(f'Built {len(rendered)} pages, including language landing pages.')


if __name__ == '__main__':
    main()
