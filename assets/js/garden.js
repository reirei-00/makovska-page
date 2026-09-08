/* A small ASCII wildflower garden. No libraries, timers, or network requests. */
(() => {
  'use strict';
  const garden = document.querySelector('[data-garden]');
  if (!garden) return;
  const dock = document.querySelector('[data-garden-dock]');
  const art = garden.querySelector('[data-garden-art]');
  const toggle = garden.querySelector('[data-garden-toggle]');
  const pauseLabel = toggle.querySelector('[data-garden-pause]');
  const playLabel = toggle.querySelector('[data-garden-play]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let playing = !reduced.matches;
  try { if (sessionStorage.getItem('garden-paused') === 'true') playing = false; } catch (_) { /* Storage is optional. */ }
  let elapsed = 0, frame = 0, previous = null, lastPaint = -Infinity, visible = true;
  let progress = reduced.matches ? 1 : 0, explored = progress, compact = false, scrollFrame = 0;
  let cols = 80;
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  const hash = (x, y, seed) => { const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453; return n - Math.floor(n); };

  function draw() {
    const rows = compact ? 12 : 27, ground = compact ? 9 : 22;
    const growthProgress = progress;
    const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ char: ' ', tone: '' })));
    function put(x, y, char, tone = '') {
      x = Math.round(x); y = Math.round(y);
      if (grid[y]?.[x]) grid[y][x] = { char, tone };
    }
    function word(x, y, text, tone = '') { [...text].forEach((char, i) => put(x + i, y, char, tone)); }
    function sprite(x, y, lines, tone = '') {
      lines.forEach((line, i) => [...line].forEach((char, j) => { if (char !== ' ') put(x + j, y + i, char, tone); }));
    }
    const narrow = cols < 55;
    const plants = narrow ? [
      { x: .16, height: 10, kind: 'daisy' }, { x: .50, height: 13, kind: 'lavender' }, { x: .83, height: 9, kind: 'tulip' }
    ] : [
      { x: .13, height: 10, kind: 'daisy' }, { x: .31, height: 13, kind: 'lavender' }, { x: .53, height: 12, kind: 'cosmos' },
      { x: .74, height: 8, kind: 'tulip' }, { x: .89, height: 12, kind: 'daisy' }
    ];
    for (let x = 1; x < cols - 1; x++) {
      put(x, ground, x % 17 === 0 ? '.' : x % 11 === 0 ? ' ' : '_', 'earth');
      if (hash(x, 0, 3) > .81) put(x, ground + 2, hash(x, 0, 6) > .5 ? '.' : ',', 'earth');
      if (x % 16 === 7) put(x, ground - 1, 'o', 'earth');
    }
    const grasses = narrow ? [.31, .68] : [.05, .23, .43, .63, .82, .96];
    grasses.forEach((p, i) => {
      if (growthProgress < i * .11) return;
      const x = Math.round(p * (cols - 1));
      word(x - 1, ground - 1, Math.sin(elapsed * .65 + i) > 0 ? '\\|/' : '\\|,');
      put(x, ground - 2, '|');
      if (i % 2 === 0) { put(x - 2, ground - 2, '/'); put(x - 2, ground - 3, "'"); }
    });
    plants.forEach((plant, i) => {
      const x = Math.round(plant.x * (cols - 1));
      const growth = clamp((growthProgress - i * .12) / .48, 0, 1);
      if (growth === 0 && i > 0) { put(x, ground, '.', 'earth'); return; }
      const maxHeight = compact ? Math.round(plant.height * .35) : plant.height;
      const height = Math.round(1 + (maxHeight - 1) * growth);
      const breeze = Math.sin(elapsed * .57 + i * .7) * 1.15 + Math.sin(elapsed * .23 + i) * .35;
      const stem = t => x + Math.round(breeze * (t / maxHeight) ** 1.6);
      for (let t = 0; t < height; t++) {
        const sx = stem(t), y = ground - 1 - t;
        if (!compact && (t === 3 + i % 2 || t === 7 + i % 2)) {
          const left = (t < 6) === (i % 2 === 0);
          if (plant.kind === 'lavender') {
            if (left) { word(sx - 4, y - 1, '(__'); put(sx - 1, y, '\\'); }
            else { word(sx + 2, y - 1, '__)'); put(sx + 1, y, '/'); }
          } else if (left) sprite(sx - 5, y - 2, [' .-. ', '(__/ ', '    \\']);
          else sprite(sx + 1, y - 2, [' .-. ', ' \\__)', '/    ']);
        }
        if (compact && t === 2) word(sx - 1, y, '\\|/');
        const next = stem(Math.min(t + 1, height - 1));
        put(sx, y, next === sx ? '|' : next > sx ? '/' : '\\');
      }
      const tx = stem(height - 1), top = ground - height;
      if (growth < .75) {
        word(tx - 1, top - 1, growth < .35 ? '\\|/' : '(o)', growth < .35 ? '' : 'bloom');
      } else if (compact) {
        sprite(tx - 1, top - 2, plant.kind === 'lavender' ? [':*:', '(*)', ' | '] : plant.kind === 'tulip' ? ['\\_/', ' | '] : ['_._', '(o)', ' | '], 'bloom');
      } else if (plant.kind === 'lavender') {
        for (let f = 0; f < 5; f++) word(tx - 1, top - f, f % 2 ? '(*)' : ':*:', 'bloom');
        put(tx, top - 5, "'", 'bloom');
      } else if (plant.kind === 'tulip') {
        sprite(tx - 3, top - 3, ["\\`-'-/", ' \\ / ', '  V| '], 'bloom'); put(tx, top - 1, '|');
      } else if (plant.kind === 'cosmos') {
        sprite(tx - 4, top - 4, ['  .   .  ', " ( `.' ) ", '(  (o)  )', ' (_ . _) ', "   `|'   "], 'bloom');
      } else {
        sprite(tx - 3, top - 4, ['  _ _  ', ' (_|_) ', '(_(@)_)', '  (_)  ', '   |   '], 'bloom');
      }
      sprite(x - 2, ground + 1, growth < .4 ? ['  |  '] : ['  |  ', i % 2 ? ' /|  ' : '  |\\ ', i % 2 ? '/ |\\ ' : ' /| \\', i % 2 ? "  ' `" : "' '  "], 'earth');
    });
    const butterflyX = Math.round(4 + ((Math.sin(elapsed * .19 - .7) + 1) / 2) * (cols - 12));
    if (growthProgress > .82) sprite(butterflyX, compact ? 0 : 1, Math.floor(elapsed * 2) % 2 ? ['>i<', ' v '] : ['\\ /', '>i<'], 'bloom');
    garden.dataset.growth = growthProgress.toFixed(3);

    const fragment = document.createDocumentFragment();
    grid.forEach((row, index) => {
      let text = '', tone = row[0].tone;
      function flush() {
        if (!text) return;
        if (!tone) fragment.appendChild(document.createTextNode(text));
        else { const span = document.createElement('span'); span.className = `garden-${tone}`; span.textContent = text; fragment.appendChild(span); }
        text = '';
      }
      row.forEach(cell => { if (cell.tone !== tone) { flush(); tone = cell.tone; } text += cell.char; });
      flush();
      if (index < rows - 1) fragment.appendChild(document.createTextNode('\n'));
    });
    art.replaceChildren(fragment);
  }

  function measure() {
    const size = parseFloat(getComputedStyle(art).fontSize);
    cols = clamp(Math.floor(art.clientWidth / (size * .61)) - 1, 28, 126);
    draw();
  }
  function tick(now) {
    frame = 0;
    if (!garden.isConnected || !playing || !visible || document.hidden) return;
    if (previous !== null) elapsed += Math.min((now - previous) / 1000, .12);
    previous = now;
    progress += (explored - progress) * .09;
    if (now - lastPaint >= 120) { draw(); lastPaint = now; }
    frame = requestAnimationFrame(tick);
  }
  function syncMotion() {
    cancelAnimationFrame(frame); frame = 0; previous = null; lastPaint = -Infinity;
    pauseLabel.hidden = !playing; playLabel.hidden = playing;
    if (playing && visible && !document.hidden) frame = requestAnimationFrame(tick);
  }
  toggle.addEventListener('click', () => {
    playing = !playing;
    try { sessionStorage.setItem('garden-paused', String(!playing)); } catch (_) { /* Storage is optional. */ }
    syncMotion();
  });
  reduced.addEventListener('change', () => { if (reduced.matches) { playing = false; syncMotion(); draw(); } });
  document.addEventListener('visibilitychange', syncMotion);
  function updateExploration() {
    scrollFrame = 0;
    const top = dock.getBoundingClientRect().top;
    const travel = Math.max(1, top + window.scrollY - window.innerHeight);
    explored = Math.max(explored, clamp(window.scrollY / travel, 0, 1));
    const nextCompact = top > window.innerHeight - 327;
    if (nextCompact !== compact) {
      compact = nextCompact; garden.dataset.floating = String(compact); measure();
    }
    visible = compact || (top < window.innerHeight && top + 327 > 0);
    if (playing && visible && !frame) syncMotion();
  }
  function scheduleExploration() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateExploration);
  }
  window.addEventListener('scroll', scheduleExploration, { passive: true });
  window.addEventListener('resize', scheduleExploration);
  const observer = new IntersectionObserver(entries => { visible = compact || entries[0].isIntersecting; syncMotion(); });
  observer.observe(garden);
  const resize = new ResizeObserver(measure); resize.observe(art);
  document.fonts.ready.then(measure);
  toggle.hidden = false;
  document.documentElement.classList.add('garden-enabled');
  updateExploration(); measure(); syncMotion();
})();
