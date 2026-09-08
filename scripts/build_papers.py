#!/usr/bin/env python3
"""Generate paper explainers, reusing the publication catalogue as metadata source."""
from html import escape, unescape
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
import json
import posixpath
import re

ROOT = Path(__file__).resolve().parents[1]


def plain(html):
    return ' '.join(unescape(re.sub('<[^>]+>', '', html)).split())


def rebase(html, page):
    def change(match):
        url = urlsplit(unescape(match[2]))
        if url.scheme or url.netloc or not url.path:
            return match[0]
        target = posixpath.normpath(posixpath.join('research', url.path))
        path = posixpath.relpath(target, page)
        if url.path.endswith('/'):
            path += '/'
        return match[1] + escape(urlunsplit(('', '', path, url.query, url.fragment)), quote=True) + '"'
    return re.sub(r'((?:href|src)=")([^"]*)"', change, html)


def text(data):
    return escape(data['en'])


def source_link(p):
    return f'<a href="{escape(p["source"], quote=True)}">{escape(p["source_sections"])}</a>'


def chart(title, rows, note, scale=1):
    body = ''.join(f'<div class="result-row"><span>{label}</span><div class="result-track"><span style="width:{value/scale*100:.4f}%"></span></div><strong>{value:g}</strong></div>' for label, value in rows)
    return f'<div class="result-chart"><h3>{title}</h3><p class="figure-note">{note}</p>{body}</div>'


def score_explorer():
    labels = [('before', 'Before: narrative reproduced', 80, 0, 100), ('after', 'After: usable answers reproducing it', 20, 0, 90), ('degraded', 'After: degraded answers', 10, 0, 100)]
    controls = ''.join(f'<label for="sce-{key}"><span>{label}</span><output id="value-{key}" for="sce-{key}">{value}</output><input id="sce-{key}" type="range" min="{minimum}" max="{maximum}" value="{value}" step="1" disabled></label>' for key, label, value, minimum, maximum in labels)
    return f'''<section class="score-explorer" id="score" aria-labelledby="score-title">
<p class="section-marker">Illustrative calculator · 100 responses</p><h3 id="score-title">Explore the suppression score</h3>
<p>Try changing the counts. These are hypothetical responses, not experimental results. The score rewards reduced reproduction and penalizes degraded answers.</p>
<div class="score-layout"><div class="score-controls">{controls}</div><div class="score-results" aria-live="polite" aria-atomic="true"><p>Relative suppression <strong id="sce-suppression">75%</strong></p><p>Degradation rate <strong id="sce-degradation">10%</strong></p><p>SCE score <strong id="sce-result">0.608</strong></p></div></div>
<p class="score-formula">SCE = suppression × (1 − degradation)²</p>
<p class="figure-note">Counts are constrained to 100 responses. SCE is a checkpoint-selection aid, not proof of complete forgetting.</p>
<noscript>Enable JavaScript to adjust the example. The displayed score uses 80 before, 20 usable reproductions after, and 10 degraded answers.</noscript></section>'''


def visual(p):
    kind = p['kind']
    items = ''.join(f'<li><span class="diagram-index" aria-hidden="true">{i+1:02}</span><h3>{text(s["title"])}</h3><p>{text(s["body"])}</p></li>' for i, s in enumerate(p['steps']))
    diagram = f'<ol class="method-diagram diagram-{kind}">{items}</ol>'
    if kind == 'network':
        diagram = '''<div class="network-map" aria-hidden="true"><svg viewBox="0 0 720 190" focusable="false"><path class="edge-recorded" d="M110 50 L330 140 L600 50"/><path class="edge-semantic" d="M110 50 L600 50 M330 140 L600 140"/></svg><span class="node node-a">Channel A</span><span class="node node-b">Channel B</span><span class="node node-c">Channel C</span><span class="node node-d">Channel D</span></div><div class="network-key"><span>Recorded forwarding</span><span>Semantic similarity</span></div>''' + diagram
    if kind == 'pipeline':
        diagram += chart('Same text, fewer tokens', [('Original model', 1.5), ('Adapted model', 1)], 'Relative token use · adapted model = 1', 1.5)
    if kind == 'merge':
        diagram += chart('Ukrainian news experiment · F1', [('Vandalism features', .89), ('Manipulation features', .82), ('Combined features', .91)], 'Reported F1, from 0 to 1. Higher is better.')
    return f'<figure class="paper-visual" aria-labelledby="visual-title"><h3 id="visual-title">{text(p["visual_title"])}</h3>{diagram}<figcaption>{text(p["caption"])} <span class="figure-source">{source_link(p)}</span></figcaption></figure>'


def build(write=True):
    papers = json.loads((ROOT / 'data/papers.json').read_text())
    catalogue = (ROOT / 'research/index.html').read_text()
    catalogue = re.sub(r'<!-- locale-(?:head|switch):start -->.*?<!-- locale-(?:head|switch):end -->', '', catalogue, flags=re.S)
    articles = {m[1]: m[0] for m in re.finditer(r'<article class="research-item" id="([^"]+)".*?</article>', catalogue, re.S)}
    assert set(articles) == {p['slug'] for p in papers}, 'Every publication needs one explainer.'
    header = catalogue.split('<main ', 1)[0]
    footer = '<footer' + catalogue.split('<footer', 1)[1]
    titles = {slug: re.search(r'<h3 class="paper-title">(.*?)</h3>', html, re.S)[1] for slug, html in articles.items()}
    titles = {slug: re.sub(r'<a\b[^>]*>|</a>', '', title) for slug, title in titles.items()}
    outputs = {}
    for p in papers:
        slug, article = p['slug'], articles[p['slug']]
        page = 'research/' + slug
        head = rebase(header, page)
        title = titles[slug]
        head = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', head, flags=re.S)
        head = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m[1] + text(p['question']), head)
        head = re.sub(r'(<link rel="canonical" href=")[^"]*', lambda m: m[1] + f'https://reirei-00.github.io/makovska-page/{page}/', head)
        head = head.replace('</head>', '<link rel="stylesheet" href="../../assets/css/papers.css"></head>')
        meta = re.search(r'<div class="paper-meta">.*?</div>', article, re.S)[0]
        authors = re.search(r'<p class="paper-authors">.*?</p>', article, re.S)[0]
        venues = ''.join(re.findall(r'<p class="paper-venue">.*?</p>', article, re.S))
        links = re.search(r'<div class="paper-links">.*?</div>', article, re.S)[0]
        links = re.sub(r'<a[^>]*data-explainer-link[^>]*>.*?</a>', '', links, flags=re.S)
        citation = ''.join(re.findall(r'<details class="paper-details">.*?</details>', article, re.S))
        related = ''.join(f'<a href="../{other}/">{titles[other]} <span aria-hidden="true">↗</span></a>' for other in p['related'])
        body = f'''<main id="main" class="editorial-container page-content paper-explainer">
<section class="page-intro paper-intro"><a class="back-link" href="../#{slug}">← <span>All research</span></a><p class="editorial-eyebrow">Paper explained</p>
{meta}<h1 lang="en">{title}</h1>{rebase(authors, page)}<p class="lead-copy">{text(p['question'])}</p>
<nav class="detail-links" aria-label="Paper explained"><a href="#question">The question</a><a href="#approach">A visual guide</a><a href="#findings">What the work contributes</a><a href="#sources">Read the source</a></nav></section>
<section class="explainer-section" id="question" aria-labelledby="question-title"><div class="section-heading"><div><p class="section-marker">The question</p><h2 id="question-title">Why this work</h2></div></div><p class="explanation-copy">{text(p['overview'])}</p></section>
<section class="explainer-section" id="approach" aria-labelledby="approach-title"><div class="section-heading"><div><p class="section-marker">The approach</p><h2 id="approach-title">A visual guide</h2></div></div>{visual(p)}{score_explorer() if slug=='lens' else ''}</section>
<section class="explainer-section" id="findings" aria-labelledby="findings-title"><div class="section-heading"><h2 id="findings-title">What the work contributes</h2></div><p class="explanation-copy">{text(p['finding'])}</p><p class="source-note">{source_link(p)}</p><aside class="evidence-note" aria-labelledby="limits-title"><h3 id="limits-title">Evidence &amp; limits</h3><p>{text(p['limit'])}</p></aside></section>
<section class="explainer-section" id="sources" aria-labelledby="sources-title"><div class="section-heading"><h2 id="sources-title">Original paper &amp; resources</h2></div>{venues}{rebase(links, page)}{citation}</section>
<section class="explainer-section" id="related" aria-labelledby="related-title"><div class="section-heading"><div><p class="section-marker">Continue exploring</p><h2 id="related-title">Related work</h2></div></div><div class="related-papers">{related}</div></section></main>'''
        end = rebase(footer, page)
        if slug == 'lens':
            end = end.replace('</body>', '<script src="../../assets/js/paper-explorer.js" defer></script></body>')
        outputs[ROOT / page / 'index.html'] = head + body + end
    if write:
        for path, html in outputs.items():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(html)
    return outputs


if __name__ == '__main__':
    build()
