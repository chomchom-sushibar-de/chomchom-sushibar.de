(function () {
  "use strict";

  var menuList = document.querySelector(".menu-list");
  if (!menuList) return;

  var STORAGE_KEY = "chomchom-cart";
  var PHONE = "+498104888476";
  var PHONE_DISPLAY = "08104 888 476";
  var STARTER_CATEGORIES = ["suppen", "vorspeisen", "salate"];
  var DESSERT_CATEGORIES = ["desserts"];

  var cart = {};

  function loadCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) cart = JSON.parse(raw);
    } catch (e) {
      cart = {};
    }
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function parsePrice(priceEl) {
    var clone = priceEl.cloneNode(true);
    var abend = clone.querySelector(".abend");
    if (abend) abend.remove();
    var match = clone.textContent.trim().match(/([\d.,]+)\s*€/);
    if (!match) return 0;
    return parseFloat(match[1].replace(/\./g, "").replace(",", "."));
  }

  function parseName(nameEl) {
    var clone = nameEl.cloneNode(true);
    clone.querySelectorAll(".tag").forEach(function (t) { t.remove(); });
    return clone.textContent.trim();
  }

  function formatPrice(value) {
    return value.toFixed(2).replace(".", ",") + " €";
  }

  var renderers = [];

  Array.prototype.forEach.call(document.querySelectorAll(".menu-item"), function (el) {
    var numEl = el.querySelector(".num");
    var nameEl = el.querySelector(".name");
    var priceEl = el.querySelector(".price");
    if (!numEl || !nameEl || !priceEl) return;

    var num = numEl.textContent.trim();
    var name = parseName(nameEl);
    var price = parsePrice(priceEl);
    var categoryEl = el.closest(".menu-category");
    var categoryId = categoryEl ? categoryEl.id : "";

    var stepper = document.createElement("div");
    stepper.className = "qty-stepper";
    stepper.innerHTML =
      '<button type="button" class="qty-btn qty-minus" aria-label="Weniger ' + name + '">−</button>' +
      '<span class="qty-value">0</span>' +
      '<button type="button" class="qty-btn qty-plus" aria-label="Mehr ' + name + '">+</button>';
    el.appendChild(stepper);

    var valueEl = stepper.querySelector(".qty-value");
    var minusBtn = stepper.querySelector(".qty-minus");
    var plusBtn = stepper.querySelector(".qty-plus");

    function render() {
      var qty = (cart[num] && cart[num].qty) || 0;
      valueEl.textContent = qty;
      minusBtn.disabled = qty === 0;
      el.classList.toggle("in-cart", qty > 0);
    }

    minusBtn.addEventListener("click", function () {
      if (!cart[num]) return;
      cart[num].qty -= 1;
      if (cart[num].qty <= 0) delete cart[num];
      saveCart();
      render();
      updateBar();
    });

    plusBtn.addEventListener("click", function () {
      if (!cart[num]) {
        cart[num] = { num: num, name: name, price: price, category: categoryId, qty: 0 };
      }
      cart[num].qty += 1;
      saveCart();
      render();
      updateBar();
    });

    renderers.push(render);
  });

  loadCart();
  renderers.forEach(function (render) { render(); });

  var bar = document.getElementById("order-bar");
  var barSummary = document.getElementById("order-bar-summary");
  var barBtn = document.getElementById("order-bar-btn");
  var modal = document.getElementById("order-modal");
  var modalBody = document.getElementById("order-modal-body");

  function cartEntries() {
    return Object.keys(cart)
      .map(function (k) { return cart[k]; })
      .sort(function (a, b) { return a.num.localeCompare(b.num, "de", { numeric: true }); });
  }

  function cartTotals() {
    var entries = cartEntries();
    var count = entries.reduce(function (sum, e) { return sum + e.qty; }, 0);
    var total = entries.reduce(function (sum, e) { return sum + e.qty * e.price; }, 0);
    return { entries: entries, count: count, total: total };
  }

  function hasCategory(entries, categoryIds) {
    return entries.some(function (e) { return categoryIds.indexOf(e.category) !== -1; });
  }

  function updateBar() {
    var t = cartTotals();
    if (t.count === 0) {
      bar.hidden = true;
      document.body.classList.remove("has-order-bar");
      return;
    }
    bar.hidden = false;
    document.body.classList.add("has-order-bar");
    barSummary.textContent = t.count + (t.count === 1 ? " Gericht" : " Gerichte") + " · ca. " + formatPrice(t.total);
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function openModal() {
    modal.hidden = false;
    document.body.classList.add("modal-open");
    renderModal();
  }

  function renderModal(step) {
    var t = cartTotals();
    if (t.count === 0) {
      closeModal();
      return;
    }

    var needsStarter = !hasCategory(t.entries, STARTER_CATEGORIES);
    var needsDessert = !hasCategory(t.entries, DESSERT_CATEGORIES);

    if (!step) step = needsStarter || needsDessert ? "nudge" : "summary";

    if (step === "nudge") {
      var missing = [];
      if (needsStarter) missing.push('<a href="#vorspeisen" data-close>Vorspeisen &amp; Suppen</a>');
      if (needsDessert) missing.push('<a href="#desserts" data-close>Desserts &amp; Tee</a>');
      modalBody.innerHTML =
        "<h3>Noch etwas dazu?</h3>" +
        "<p>Wie wäre es noch mit " + missing.join(" oder ") + "?</p>" +
        '<div class="order-modal-actions">' +
        '<button type="button" class="btn btn-ghost" data-close>Weiter auswählen</button>' +
        '<button type="button" class="btn btn-primary" id="order-modal-continue">Nein danke, weiter</button>' +
        "</div>";
      document.getElementById("order-modal-continue").addEventListener("click", function () {
        renderModal("summary");
      });
    } else {
      var rows = t.entries
        .map(function (e) {
          return (
            '<li><span class="order-row-num">Nr. ' + e.num + "</span>" +
            '<span class="order-row-name">' + e.name + "</span>" +
            '<span class="order-row-qty">×' + e.qty + "</span></li>"
          );
        })
        .join("");
      modalBody.innerHTML =
        "<h3>Diese Nummern durchgeben</h3>" +
        "<p>Rufen Sie uns an und nennen Sie einfach diese Nummern mit Menge:</p>" +
        '<ul class="order-summary-list">' + rows + "</ul>" +
        '<p class="order-total">Ca. Gesamtsumme: ' + formatPrice(t.total) +
        "<br><small>Abendpreise können abweichen · nur Barzahlung vor Ort.</small></p>" +
        '<div class="order-modal-actions">' +
        '<button type="button" class="btn btn-ghost" data-close>Zurück zur Karte</button>' +
        '<a class="btn btn-primary" href="tel:' + PHONE + '">Jetzt anrufen · ' + PHONE_DISPLAY + "</a>" +
        "</div>";
    }
  }

  barBtn.addEventListener("click", openModal);

  modal.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  updateBar();
})();
