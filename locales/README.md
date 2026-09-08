# Website languages

The English pages are the source for the Ukrainian (`/uk/`) and Taiwan Traditional Chinese (`/zh-tw/`, language code `zh-Hant-TW`) versions. All four sections have matching translated pages. Shared assets and the English CV stay in their existing locations.

To update content:

1. Edit the English page.
2. Add or revise its wording in `locales/translations.json`. Keys are English text with whitespace normalized to single spaces. Keep original publication titles, author names, and bibliographic citations unchanged.
3. Run `python3 scripts/build_locales.py`.
4. Run `python3 scripts/check_locales.py`.

Do not edit generated Ukrainian or Chinese HTML directly. The builder refuses missing translations and adds language navigation, localized metadata, and reciprocal `hreflang` links. Language switching preserves the current section anchor. The downloadable CV is identified as English in both translations.

Interactive strings live in `assets/js/copy.js` and `assets/js/kaleidoscope.js`. Chinese prose uses Traditional characters and Taiwan terminology. A fluent Taiwan reader's editorial review is welcome before formal publication.

## Paper explainers

Every catalogue entry has a generated page under `research/<slug>/`, with matching Ukrainian and Traditional Chinese routes. Edit the explanations, diagram labels, findings, and limitations in `data/papers.json`; edit shared explainer labels in `data/paper-ui.json`. Each localized string contains `en`, `uk`, and `zh-Hant-TW` values. These files feed the same build and validation commands above.

`scripts/build_papers.py` reuses titles, authors, dates, resource links, and citations from the English Research catalogue. It generates the English source in memory before `build_locales.py` validates every translation and writes all pages. Do not edit generated paper pages directly. Keep each explanation's source URL and section references with its content.

Diagrams use accessible HTML/CSS and a small decorative SVG network. Chart values come from the cited papers. LENS's optional score explorer uses explicitly hypothetical counts and works with keyboard input; all explanations remain readable without JavaScript. Its behavior lives in `assets/js/paper-explorer.js`.
