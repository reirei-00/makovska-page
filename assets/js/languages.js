(function () {
  // Preserve the current section when switching to the equivalent page.
  document.querySelectorAll('[data-language-link]').forEach(function (link) {
    function updateHash() {
      var url = new URL(link.getAttribute('href'), window.location.href);
      url.hash = window.location.hash;
      link.href = url.href;
    }
    updateHash();
    window.addEventListener('hashchange', updateHash);
  });
})();
