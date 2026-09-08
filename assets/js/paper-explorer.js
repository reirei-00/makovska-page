(function () {
  var before = document.getElementById('sce-before');
  if (!before) return;
  var after = document.getElementById('sce-after');
  var degraded = document.getElementById('sce-degraded');
  var language = document.documentElement.lang;
  var decimal = new Intl.NumberFormat(language, {minimumFractionDigits: 3, maximumFractionDigits: 3});
  var percent = new Intl.NumberFormat(language, {style: 'percent', maximumFractionDigits: 1});
  function update() {
    var b = Number(before.value), d = Number(degraded.value);
    after.max = String(100 - d);
    after.value = String(Math.min(Number(after.value), 100 - d));
    var a = Number(after.value);
    var suppression = Math.max(b - a, 0) / Math.max(b, 1);
    var degradation = d / 100;
    [['before', b], ['after', a], ['degraded', d]].forEach(function (entry) {
      document.getElementById('value-' + entry[0]).textContent = entry[1];
    });
    document.getElementById('sce-suppression').textContent = percent.format(suppression);
    document.getElementById('sce-degradation').textContent = percent.format(degradation);
    document.getElementById('sce-result').textContent = decimal.format(suppression * Math.pow(1 - degradation, 2));
  }
  [before, after, degraded].forEach(function (input) {
    input.disabled = false;
    input.addEventListener('input', update);
  });
  update();
})();
