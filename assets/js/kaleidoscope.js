(function () {
  var trigger = document.querySelector("[data-kaleidoscope-open]");
  var dialog = document.querySelector("[data-kaleidoscope-dialog]");
  var words = document.querySelector("[data-kaleidoscope-words]");
  var pageRegions = document.querySelectorAll(".page-shell");
  var closeControls = document.querySelectorAll("[data-kaleidoscope-close]");
  var lastFocusedElement = null;
  var vocabulary = {
    en: { terms: ["memory", "erasure", "consent", "trace", "narrative", "Ukraine", "unlearn", "represent"], core: "remember" },
    uk: { terms: ["пам’ять", "стирання", "згода", "слід", "наратив", "Україна", "забути", "представити"], core: "пам’ятати" },
    "zh-Hant-TW": { terms: ["記憶", "抹除", "同意", "痕跡", "敘事", "烏克蘭", "遺忘", "呈現"], core: "記住" }
  };
  var wordsForLanguage = vocabulary[document.documentElement.lang] || vocabulary.en;
  var terms = wordsForLanguage.terms;

  if (!pageRegions.length) {
    pageRegions = document.querySelectorAll("body > header, body > main, body > footer");
  }

  if (!trigger || !dialog || !words || !pageRegions.length) return;

  function buildKaleidoscope() {
    var fragment = document.createDocumentFragment();
    var sector;
    var ring;

    while (words.firstChild) words.removeChild(words.firstChild);

    for (ring = 0; ring < 3; ring += 1) {
      for (sector = 0; sector < 8; sector += 1) {
        var angle = sector * 45 + (ring % 2 ? 22.5 : 0);
        var radians = (angle * Math.PI) / 180;
        var radius = 17 + ring * 13;
        var x = 50 + Math.cos(radians) * radius;
        var y = 50 + Math.sin(radians) * radius;
        var word = document.createElement("span");

        word.className = "kaleidoscope-word";
        word.textContent = terms[(sector + ring * 3) % terms.length];
        word.style.setProperty("--x", x + "%");
        word.style.setProperty("--y", y + "%");
        word.style.setProperty("--rotation", angle + 90 + "deg");
        word.style.setProperty("--opacity", String(0.94 - ring * 0.18));
        word.style.setProperty("--delay", String((sector + ring) * -170) + "ms");
        fragment.appendChild(word);
      }
    }

    var core = document.createElement("span");
    core.className = "kaleidoscope-core";
    core.textContent = wordsForLanguage.core;
    fragment.appendChild(core);
    words.appendChild(fragment);
  }

  function openKaleidoscope() {
    lastFocusedElement = document.activeElement;
    buildKaleidoscope();
    dialog.hidden = false;
    dialog.setAttribute("aria-hidden", "false");
    pageRegions.forEach(function (region) {
      region.setAttribute("aria-hidden", "true");
      region.inert = true;
    });
    document.body.classList.add("has-kaleidoscope");
    dialog.querySelector(".kaleidoscope-close").focus();
  }

  function closeKaleidoscope() {
    if (dialog.hidden) return;
    dialog.hidden = true;
    dialog.setAttribute("aria-hidden", "true");
    pageRegions.forEach(function (region) {
      region.removeAttribute("aria-hidden");
      region.inert = false;
    });
    document.body.classList.remove("has-kaleidoscope");
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  trigger.addEventListener("click", openKaleidoscope);
  closeControls.forEach(function (control) {
    control.addEventListener("click", closeKaleidoscope);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeKaleidoscope();
    if (event.key === "Tab" && !dialog.hidden) {
      // The close button is the dialog's only keyboard control.
      event.preventDefault();
      dialog.querySelector(".kaleidoscope-close").focus();
    }
  });
})();
