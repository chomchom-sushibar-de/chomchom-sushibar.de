/* TEMPORARY preview presentation. This client-side gate is not access control. */
(function () {
  "use strict";

  var PIN = "82054";
  var KEY = "site-unlocked";
  var STRINGS = {
    de: {
      eyebrow: "Bald verfügbar",
      title: "Diese Seite ist noch in Arbeit.",
      prompt: "Bitte PIN eingeben, um die Vorschau zu sehen.",
      pin: "PIN",
      unlock: "Freischalten",
      error: "Falsche PIN, bitte erneut versuchen."
    },
    en: {
      eyebrow: "Coming soon",
      title: "This website is still in progress.",
      prompt: "Enter the PIN to view the preview.",
      pin: "PIN",
      unlock: "Unlock preview",
      error: "Incorrect PIN. Please try again."
    }
  };

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch (error) { return null; }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (error) {}
  }

  function language() {
    var stored = storageGet("chomchom-lang");
    if (stored === "de" || stored === "en") return stored;
    return (navigator.language || "de").toLowerCase().indexOf("de") === 0 ? "de" : "en";
  }

  function isUnlocked() {
    return storageGet(KEY) === "true";
  }

  if (isUnlocked()) return;
  document.documentElement.setAttribute("data-locked", "true");

  document.addEventListener("DOMContentLoaded", function () {
    if (isUnlocked()) return;
    var copy = STRINGS[language()];
    var gate = document.createElement("div");
    gate.className = "pin-gate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "pin-gate-title");

    var form = document.createElement("form");
    form.className = "pin-gate-card";
    var eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = copy.eyebrow;
    var title = document.createElement("h1");
    title.id = "pin-gate-title";
    title.textContent = copy.title;
    var prompt = document.createElement("p");
    prompt.textContent = copy.prompt;
    var input = document.createElement("input");
    input.type = "password";
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.className = "pin-gate-input";
    input.setAttribute("aria-label", copy.pin);
    input.placeholder = copy.pin;
    var submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "btn btn-primary";
    submit.textContent = copy.unlock;
    var error = document.createElement("p");
    error.className = "pin-gate-error";
    error.setAttribute("role", "alert");
    error.hidden = true;
    error.textContent = copy.error;
    form.append(eyebrow, title, prompt, input, submit, error);
    gate.appendChild(form);
    document.body.prepend(gate);

    function focusPage() {
      var main = document.querySelector("main");
      if (!main) return;
      main.setAttribute("tabindex", "-1");
      main.focus();
      main.addEventListener("blur", function () { main.removeAttribute("tabindex"); }, { once: true });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (input.value.trim() === PIN) {
        storageSet(KEY, "true");
        document.documentElement.removeAttribute("data-locked");
        gate.remove();
        focusPage();
      } else {
        error.hidden = false;
        input.value = "";
        input.focus();
      }
    });
    input.addEventListener("input", function () { error.hidden = true; });
    gate.addEventListener("keydown", function (event) {
      if (event.key !== "Tab") return;
      if (event.shiftKey && document.activeElement === input) {
        event.preventDefault();
        submit.focus();
      } else if (!event.shiftKey && document.activeElement === submit) {
        event.preventDefault();
        input.focus();
      }
    });
    input.focus();
  });
})();
