(function () {
  "use strict";

  var root = document.documentElement;
  var STORAGE_KEY = "chomchom-theme";

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch (error) { return null; }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (error) {}
  }

  function storageRemove(key) {
    try { localStorage.removeItem(key); } catch (error) {}
  }

  function localized(de, en) {
    return { de: de, en: en };
  }

  function validLocalized(value) {
    return value && typeof value.de === "string" && typeof value.en === "string";
  }

  function validPeriod(value) {
    var time = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/;
    return value && time.test(value.opens) && time.test(value.closes);
  }

  function range(period, spaced) {
    return period.opens + (spaced ? " – " : "–") + period.closes;
  }

  function buildHoursViews(hours) {
    var weekday = hours && hours.weekday;
    var sunday = hours && hours.sundayHolidays;
    var saturday = hours && hours.saturday;
    if (!weekday || !sunday || !saturday ||
        !Array.isArray(weekday.periods) || weekday.periods.length !== 2 ||
        !Array.isArray(sunday.periods) || sunday.periods.length !== 1 ||
        !weekday.periods.every(validPeriod) || !sunday.periods.every(validPeriod) ||
        ![weekday.shortLabel, weekday.tableLabel, weekday.legalLabel,
          sunday.shortLabel, sunday.tableLabel, sunday.legalLabel,
          saturday.shortLabel, saturday.tableLabel, saturday.legalLabel,
          saturday.status, saturday.inlineStatus].every(validLocalized)) return null;

    var lunch = weekday.periods[0];
    var dinner = weekday.periods[1];
    var sundayPeriod = sunday.periods[0];
    var compactLunch = range(lunch, false);
    var compactDinner = range(dinner, false);
    var compactSunday = range(sundayPeriod, false);
    return {
      footer_line1: localized(weekday.shortLabel.de + " " + compactLunch + " Uhr", weekday.shortLabel.en + " " + compactLunch),
      footer_line2: localized(weekday.shortLabel.de + " " + compactDinner + " Uhr", weekday.shortLabel.en + " " + compactDinner),
      footer_line3: localized(sunday.shortLabel.de + " " + compactSunday + " Uhr", sunday.shortLabel.en + " " + compactSunday),
      footer_line4: localized(saturday.tableLabel.de + " " + saturday.inlineStatus.de, saturday.tableLabel.en + " " + saturday.inlineStatus.en),
      hero_weekday_label: weekday.shortLabel,
      hero_weekday_ranges: localized(compactLunch + " & " + compactDinner, compactLunch + " & " + compactDinner),
      hero_sunday_label: sunday.shortLabel,
      hero_sunday_range: localized(compactSunday + " Uhr", compactSunday),
      hero_saturday_label: saturday.tableLabel,
      hero_saturday_status: saturday.status,
      contact_summary: localized(
        weekday.shortLabel.de + " " + compactLunch + " & " + compactDinner + ", " + sunday.shortLabel.de + " " + compactSunday + ", " + saturday.shortLabel.de + " " + saturday.inlineStatus.de,
        weekday.shortLabel.en + " " + compactLunch + " & " + compactDinner + ", " + sunday.shortLabel.en + " " + compactSunday + ", " + saturday.shortLabel.en + " " + saturday.inlineStatus.en
      ),
      contact_weekday_label: weekday.tableLabel,
      contact_weekday_lunch: localized(range(lunch, true) + " Uhr", range(lunch, true)),
      contact_weekday_dinner: localized(range(dinner, true) + " Uhr", range(dinner, true)),
      contact_sunday_label: sunday.tableLabel,
      contact_sunday_range: localized(range(sundayPeriod, true) + " Uhr", range(sundayPeriod, true)),
      contact_saturday_label: saturday.tableLabel,
      contact_saturday_status: saturday.status,
      legal_lines: localized(
        weekday.legalLabel.de + " " + compactLunch + " und " + compactDinner + " Uhr\n" + sunday.legalLabel.de + " " + compactSunday + " Uhr\n" + saturday.legalLabel.de + " " + saturday.inlineStatus.de,
        weekday.legalLabel.en + " " + compactLunch + " and " + compactDinner + "\n" + sunday.legalLabel.en + " " + compactSunday + "\n" + saturday.legalLabel.en + " " + saturday.inlineStatus.en
      )
    };
  }

  function setLocalizedText(element, value) {
    element.dataset.deText = value.de;
    element.dataset.en = value.en;
    element.textContent = value.de;
  }

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

  var stored = storageGet(STORAGE_KEY);
  if (stored !== "light" && stored !== "dark") {
    stored = null;
    storageRemove(STORAGE_KEY);
  }
  applyTheme(stored);

  document.querySelectorAll(".theme-toggle button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var choice = btn.dataset.theme;
      if (choice === "system") {
        storageRemove(STORAGE_KEY);
        applyTheme(null);
      } else {
        storageSet(STORAGE_KEY, choice);
        applyTheme(choice);
      }
    });
  });

  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.querySelector(".main-nav");
  if (navToggle && mainNav) {
    function setNav(open) {
      mainNav.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      var isEnglish = document.documentElement.lang === "en";
      navToggle.setAttribute("aria-label", open
        ? (isEnglish ? "Close menu" : "Menü schließen")
        : (isEnglish ? "Open menu" : "Menü öffnen"));
    }

    navToggle.addEventListener("click", function () {
      var open = !mainNav.classList.contains("open");
      setNav(open);
    });
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setNav(false);
      });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && mainNav.classList.contains("open")) {
        setNav(false);
        navToggle.focus();
      }
    });
    document.addEventListener("chomchom:langchange", function () {
      setNav(mainNav.classList.contains("open"));
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1020) setNav(false);
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  fetch("data/site.json", { credentials: "same-origin" })
    .then(function (r) {
      if (!r.ok) throw new Error("Site data request failed");
      return r.json();
    })
    .then(function (data) {
      var announcement = data && data.announcement;
      var bar = document.getElementById("site-announcement");
      if (bar && announcement && typeof announcement.de === "string" && typeof announcement.en === "string") {
        bar.dataset.deText = announcement.de;
        bar.dataset.en = announcement.en;
        bar.textContent = announcement.de;
        bar.hidden = announcement.de === "" && announcement.en === "";
      }
      var hourViews = buildHoursViews(data.hours);
      if (hourViews) {
        document.querySelectorAll("[data-hours]").forEach(function (el) {
          var value = hourViews[el.getAttribute("data-hours")];
          if (value) setLocalizedText(el, value);
        });
      }
      if (window.chomchomLang) window.chomchomLang.reapply();
    })
    .catch(function () {});
})();
