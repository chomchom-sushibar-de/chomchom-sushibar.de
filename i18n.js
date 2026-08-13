(function () {
  "use strict";

  var LANG_KEY = "chomchom-lang";
  var ATTRS = ["alt", "title", "placeholder", "content", "aria-label"];

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch (error) { return null; }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (error) {}
  }

  function storageRemove(key) {
    try { localStorage.removeItem(key); } catch (error) {}
  }

  function toCamel(s) {
    return s.replace(/-([a-z0-9])/g, function (_, c) { return c.toUpperCase(); });
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function detectDefault() {
    var nav = (navigator.language || "de").toLowerCase();
    return nav.indexOf("de") === 0 ? "de" : "en";
  }

  function applyLang(lang) {
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-en]").forEach(function (el) {
      if (el.dataset.deText === undefined) el.dataset.deText = el.textContent;
      el.textContent = lang === "en" ? el.dataset.en : el.dataset.deText;
    });

    document.querySelectorAll("[data-en-html]").forEach(function (el) {
      if (el.dataset.deHtml === undefined) el.dataset.deHtml = el.innerHTML;
      el.innerHTML = lang === "en" ? el.dataset.enHtml : el.dataset.deHtml;
    });

    ATTRS.forEach(function (attr) {
      var camel = capitalize(toCamel(attr));
      var cacheKey = "de" + camel;
      var enKey = "en" + camel;
      document.querySelectorAll("[data-en-" + attr + "]").forEach(function (el) {
        if (el.dataset[cacheKey] === undefined) el.dataset[cacheKey] = el.getAttribute(attr);
        el.setAttribute(attr, lang === "en" ? el.dataset[enKey] : el.dataset[cacheKey]);
      });
    });

    document.querySelectorAll(".lang-toggle button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang));
    });

    document.dispatchEvent(new CustomEvent("chomchom:langchange", { detail: { lang: lang } }));
  }

  var lang = storageGet(LANG_KEY);
  if (lang !== "de" && lang !== "en") {
    storageRemove(LANG_KEY);
    lang = detectDefault();
  }
  applyLang(lang);

  document.querySelectorAll(".lang-toggle button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (btn.dataset.lang === lang) return;
      lang = btn.dataset.lang;
      storageSet(LANG_KEY, lang);
      applyLang(lang);
    });
  });

  window.chomchomLang = {
    get: function () { return lang; },
    reapply: function () { applyLang(lang); }
  };
})();
