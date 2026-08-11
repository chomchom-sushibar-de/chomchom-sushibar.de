(function () {
  "use strict";

  var root = document.documentElement;
  var STORAGE_KEY = "chomchom-theme";

  function applyTheme(pref) {
    if (pref === "light" || pref === "dark") {
      root.setAttribute("data-theme", pref);
    } else {
      root.removeAttribute("data-theme");
    }
    document.querySelectorAll(".theme-toggle button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.theme === (pref || "system")));
    });
  }

  var stored = localStorage.getItem(STORAGE_KEY);
  applyTheme(stored);

  document.querySelectorAll(".theme-toggle button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var choice = btn.dataset.theme;
      if (choice === "system") {
        localStorage.removeItem(STORAGE_KEY);
        applyTheme(null);
      } else {
        localStorage.setItem(STORAGE_KEY, choice);
        applyTheme(choice);
      }
    });
  });

  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.querySelector(".main-nav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var open = mainNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  fetch("data/site.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.announcement) {
        var bar = document.getElementById("site-announcement");
        if (bar) {
          bar.textContent = data.announcement;
          bar.hidden = false;
        }
      }
      document.querySelectorAll("[data-hours]").forEach(function (el) {
        var val = data.hours && data.hours[el.getAttribute("data-hours")];
        if (val) {
          el.dataset.deText = val;
          if (!el.dataset.en) el.textContent = val;
        }
      });
      if (window.chomchomLang) window.chomchomLang.reapply();
    })
    .catch(function () {});
})();
