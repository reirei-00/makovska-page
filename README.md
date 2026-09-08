# Viktoriia Makovska’s website

[Live website](https://reirei-00.github.io/makovska-page/about/)

The site is static HTML, CSS, and JavaScript. GitHub Pages publishes `main` from the repository root; `.nojekyll` keeps the files unchanged.

## Editing

- The English About, Research catalogue, Teaching, and Talks & Media pages are the source pages.
- `data/papers.json` contains the paper explanations and their translated labels.
- `assets/css/site.css` supplies the shared design. `garden.css`, `papers.css`, and `paper-ink.css` handle the garden and paper visuals.
- `assets/cv/viktoriia_makovska_cv.pdf` is the current CV. Presentation slides are in `assets/slides/`.
- Ukrainian and Taiwan Traditional Chinese pages, paper explainers, and landing-page redirects are generated. See [the maintenance guide](locales/README.md).

After editing content or assets:

```sh
python3 scripts/build_locales.py
python3 scripts/check_locales.py
```

Commit the source changes and regenerated pages together. The build adds versioned navigation and asset URLs so readers receive a consistent release. A successful check covers all 45 pages, local links, language routes, citations, and cache versions.

Local design experiments belong in `.local-serve/`, which is excluded from Git. Retired designs and downloads remain available in Git history rather than the published tree.
