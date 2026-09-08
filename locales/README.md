# Website languages

The English pages are the source for the Ukrainian (`/uk/`) and Taiwan Traditional Chinese (`/zh-tw/`, language code `zh-Hant-TW`) versions. All four sections have matching translated pages. Shared assets and the English CV stay in their existing locations.

To update content:

1. Edit the English page.
2. Add or revise its wording in `locales/translations.json`. Keys are English text with whitespace normalized to single spaces. Keep original publication titles, author names, and bibliographic citations unchanged.
3. Run `python3 scripts/build_locales.py`.
4. Run `python3 scripts/check_locales.py`.

Do not edit generated Ukrainian or Chinese HTML directly. The builder refuses missing translations and adds language navigation, localized metadata, and reciprocal `hreflang` links. Language switching preserves the current section anchor. The downloadable CV is identified as English in both translations.

The builder also generates all three landing-page redirects. Every page carries the same `site-version` stamp, and internal page links include that release version. Assets use a hash of their contents in the `v` query parameter. This prevents navigation from mixing cached pages, styles, animations, or downloads from different updates. Canonical and alternate-language URLs stay clean for search engines. Version values are generated automatically; rebuild after changing an asset, and do not edit these values by hand.

The checker verifies page and asset versions, checks that every local link stays inside the website, and rejects extra HTML pages outside the current route list. Paper-specific links in Teaching and Talks & Media open the paper explainers; the catalogue remains the destination for “All research” links.

## Visual style

The shared layout follows a personal research notebook: a reading column, serif headings, handwritten dates, purple ink accents, and unboxed sections. Desktop navigation includes selected papers and their publication dates; paper explainers also have a margin for contents and related work. On smaller screens navigation moves above the text, and the existing links within the paper remain available.

`scripts/build_locales.py` generates the selected-paper margin, small pixel sprout, and common font imports inside removable `notebook-nav` and locale blocks. `scripts/build_papers.py` generates the paper margin. Keep those generated elements out of manually edited source markup. The ASCII garden and individual paper animations remain the site's own artwork.

Interactive strings live in `assets/js/copy.js` and `assets/js/kaleidoscope.js`. Chinese prose uses Traditional characters and Taiwan terminology. A fluent Taiwan reader's editorial review is welcome before formal publication.

## Paper explainers

Every catalogue entry has a generated page under `research/<slug>/`, with matching Ukrainian and Traditional Chinese routes. Edit the explanations, diagram labels, and findings in `data/papers.json`; edit shared explainer labels in `data/paper-ui.json`. Each localized string contains `en`, `uk`, and `zh-Hant-TW` values. These files feed the same build and validation commands above.

`scripts/build_papers.py` reuses titles, authors, dates, resource links, and citations from the English Research catalogue. It generates the English source in memory before `build_locales.py` validates every translation and writes all pages. Do not edit generated paper pages directly. Keep each explanation's source URL and section references with its content.

Diagrams use accessible HTML/CSS with SVG illustrations and connectors. The Wikipedia comparison diagram joins two parallel sources before the overlap analysis and candidate signals; its labels come from the paper's translated steps. Chart values come from the cited papers. LENS's optional score explorer uses explicitly hypothetical counts and works with keyboard input; all explanations remain readable without JavaScript. Its behavior lives in `assets/js/paper-explorer.js`.

The decorative ASCII scenes use `assets/js/paper-ink.js` and `assets/css/paper-ink.css`. Their pause/play labels are in `data/paper-ui.json`; their compact static drawings are in `data/ink-fallbacks.json`. The builder includes the appropriate scene for each paper. Keep these drawings separate from bibliographic citations and research figures.

The About page's garden lives in `assets/js/garden.js` and `assets/css/garden.css`. It grows with the furthest scroll position reached, accompanies the reader along the bottom edge, and returns to the document above the footer. Both kinds of animation support reduced motion, a keyboard-accessible pause control, and static content without JavaScript.
