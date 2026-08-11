/* TEMPORÄR: Seite ist noch nicht fertig für die Öffentlichkeit.
   Entfernen: <script src="gate.js"> aus allen HTML-Dateien löschen,
   den .pin-gate*-CSS-Block aus styles.css löschen, diese Datei löschen. */
(function () {
  var PIN = '8104';
  var KEY = 'site-unlocked';

  function isUnlocked() {
    try { return localStorage.getItem(KEY) === 'true'; } catch (e) { return false; }
  }

  if (isUnlocked()) return;

  document.documentElement.setAttribute('data-locked', 'true');

  document.addEventListener('DOMContentLoaded', function () {
    if (isUnlocked()) return;

    var gate = document.createElement('div');
    gate.className = 'pin-gate';
    gate.innerHTML =
      '<form class="pin-gate-card">' +
        '<p class="eyebrow">Bald verfügbar</p>' +
        '<h1>Diese Seite ist noch in Arbeit.</h1>' +
        '<p>Bitte PIN eingeben, um die Vorschau zu sehen.</p>' +
        '<input type="password" inputmode="numeric" autocomplete="off" class="pin-gate-input" aria-label="PIN" placeholder="PIN">' +
        '<button type="submit" class="btn btn-primary">Freischalten</button>' +
        '<p class="pin-gate-error" hidden>Falsche PIN, bitte erneut versuchen.</p>' +
      '</form>';
    document.body.prepend(gate);

    var form = gate.querySelector('form');
    var input = gate.querySelector('.pin-gate-input');
    var error = gate.querySelector('.pin-gate-error');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (input.value.trim() === PIN) {
        try { localStorage.setItem(KEY, 'true'); } catch (e) {}
        document.documentElement.removeAttribute('data-locked');
        gate.remove();
      } else {
        error.hidden = false;
        input.value = '';
        input.focus();
      }
    });

    input.focus();
  });
})();
