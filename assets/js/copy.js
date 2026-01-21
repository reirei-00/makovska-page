(function () {
  function setFeedback(btn, message) {
    var original = btn.getAttribute("data-original-label");
    if (!original) {
      btn.setAttribute("data-original-label", btn.textContent);
      original = btn.textContent;
    }
    btn.textContent = message;
    btn.disabled = true;
    setTimeout(function () {
      btn.textContent = original;
      btn.disabled = false;
    }, 1400);
  }

  function copyTextById(id, btn) {
    var el = document.getElementById(id);
    if (!el) return;
    var text = el.innerText || el.textContent || "";
    if (!navigator.clipboard) {
      var range = document.createRange();
      range.selectNode(el);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      try {
        document.execCommand("copy");
        if (btn) setFeedback(btn, "Copied!");
      } catch (err) {
        if (btn) setFeedback(btn, "Copy failed");
      }
      selection.removeAllRanges();
      return;
    }
    navigator.clipboard.writeText(text).then(
      function () {
        if (btn) setFeedback(btn, "Copied!");
      },
      function () {
        if (btn) setFeedback(btn, "Copy failed");
      }
    );
  }

  function copyTextValue(text) {
    return new Promise(function (resolve, reject) {
      if (!text) {
        reject();
        return;
      }
      if (!navigator.clipboard) {
        var temp = document.createElement("textarea");
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        try {
          document.execCommand("copy");
          document.body.removeChild(temp);
          resolve();
        } catch (err) {
          document.body.removeChild(temp);
          reject();
        }
        return;
      }
      navigator.clipboard.writeText(text).then(resolve, reject);
    });
  }

  function setIconFeedback(el) {
    var original = el.getAttribute("data-original-text");
    if (!original) {
      el.setAttribute("data-original-text", el.textContent);
      original = el.textContent;
    }
    el.textContent = "✓";
    el.classList.add("copied");
    setTimeout(function () {
      el.textContent = original;
      el.classList.remove("copied");
    }, 1400);
  }

  function setInlineFeedback(el, message) {
    var original = el.getAttribute("data-original-text");
    if (!original) {
      el.setAttribute("data-original-text", el.textContent);
      original = el.textContent;
    }
    el.textContent = message;
    el.classList.add("copied");
    setTimeout(function () {
      el.textContent = original;
      el.classList.remove("copied");
    }, 1400);
  }

  var buttons = document.querySelectorAll("[data-copy-target]");
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var target = btn.getAttribute("data-copy-target");
      if (target) copyTextById(target, btn);
    });
  });

  var inlineCopy = document.querySelectorAll("[data-copy]");
  inlineCopy.forEach(function (el) {
    el.addEventListener("click", function () {
      var text = el.getAttribute("data-copy");
      var role = el.getAttribute("data-copy-role") || "text";
      var icons = el.parentElement
        ? el.parentElement.querySelectorAll('[data-copy-role="icon"][data-copy="' + text + '"]')
        : [];
      copyTextValue(text).then(
        function () {
          if (role === "icon") {
            setIconFeedback(el);
          } else {
            setInlineFeedback(el, "Copied!");
          }
          icons.forEach(function (icon) {
            setIconFeedback(icon);
          });
        },
        function () {
          if (role === "icon") {
            setIconFeedback(el);
          } else {
            setInlineFeedback(el, "Copy failed");
          }
        }
      );
    });
  });
})();
