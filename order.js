(function () {
  "use strict";

  var menuList = document.querySelector(".menu-list");
  if (!menuList) return;

  var STORAGE_KEY = "chomchom-cart";
  var PHONE = "+498104888476";
  var PHONE_DISPLAY = "08104 888 476";
  var STARTER_CATEGORIES = ["suppen", "vorspeisen", "salate"];
  var DESSERT_CATEGORIES = ["desserts"];
  var SUGGESTIONS = {
    starter: ["11", "2"],
    dessert: ["80"]
  };

  var STRINGS = {
    de: {
      less: "Weniger",
      more: "Mehr",
      dish: "Gericht",
      dishes: "Gerichte",
      approx: "ca.",
      nudgeTitle: "Noch etwas dazu?",
      nudgeQuestion: "Wie wäre es noch mit einer Kleinigkeit dazu?",
      continueSelecting: "Weiter auswählen",
      noThanksContinue: "Nein danke, weiter",
      summaryTitle: "Diese Nummern durchgeben",
      summaryIntro: "Rufen Sie uns an und nennen Sie einfach diese Nummern mit Menge:",
      numLabel: "Nr.",
      total: "Ca. Gesamtsumme: ",
      disclaimer: "Abendpreise können abweichen · nur Barzahlung vor Ort.",
      back: "Zurück zur Karte",
      callNow: "Jetzt anrufen · "
    },
    en: {
      less: "Less",
      more: "More",
      dish: "dish",
      dishes: "dishes",
      approx: "approx.",
      nudgeTitle: "Anything else?",
      nudgeQuestion: "How about adding a little something?",
      continueSelecting: "Keep browsing",
      noThanksContinue: "No thanks, continue",
      summaryTitle: "Read out these numbers",
      summaryIntro: "Call us and simply read out these numbers with quantities:",
      numLabel: "No.",
      total: "Approx. total: ",
      disclaimer: "Evening prices may differ · cash only on site.",
      back: "Back to menu",
      callNow: "Call now · "
    }
  };

  function lang() {
    return (window.chomchomLang && window.chomchomLang.get()) || "de";
  }

  function t() {
    return STRINGS[lang()] || STRINGS.de;
  }

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
  var ariaRenderers = [];
  var itemsByNum = {};

  Array.prototype.forEach.call(document.querySelectorAll(".menu-item"), function (el) {
    var numEl = el.querySelector(".num");
    var nameEl = el.querySelector(".name");
    var priceEl = el.querySelector(".price");
    if (!numEl || !nameEl || !priceEl) return;

    var num = numEl.textContent.trim();
    var price = parsePrice(priceEl);
    var categoryEl = el.closest(".menu-category");
    var categoryId = categoryEl ? categoryEl.id : "";

    var stepper = document.createElement("div");
    stepper.className = "qty-stepper";
    stepper.innerHTML =
      '<button type="button" class="qty-btn qty-minus">−</button>' +
      '<span class="qty-value">0</span>' +
      '<button type="button" class="qty-btn qty-plus">+</button>';
    el.appendChild(stepper);

    var valueEl = stepper.querySelector(".qty-value");
    var minusBtn = stepper.querySelector(".qty-minus");
    var plusBtn = stepper.querySelector(".qty-plus");

    function updateAria() {
      var currentName = parseName(nameEl);
      minusBtn.setAttribute("aria-label", t().less + " " + currentName);
      plusBtn.setAttribute("aria-label", t().more + " " + currentName);
    }
    updateAria();
    ariaRenderers.push(updateAria);

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
      addToCart(num);
    });

    itemsByNum[num] = { nameEl: nameEl, price: price, category: categoryId, render: render };
    renderers.push(render);
  });

  function addToCart(num) {
    var item = itemsByNum[num];
    if (!item) return;
    if (!cart[num]) {
      cart[num] = { num: num, name: parseName(item.nameEl), price: item.price, category: item.category, qty: 0 };
    }
    cart[num].qty += 1;
    saveCart();
    item.render();
    updateBar();
  }

  loadCart();
  renderers.forEach(function (render) { render(); });

  var bar = document.getElementById("order-bar");
  var barSummary = document.getElementById("order-bar-summary");
  var barBtn = document.getElementById("order-bar-btn");
  var modal = document.getElementById("order-modal");
  var modalBody = document.getElementById("order-modal-body");
  var currentStep = null;

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
    var s = t();
    var tot = cartTotals();
    if (tot.count === 0) {
      bar.hidden = true;
      document.body.classList.remove("has-order-bar");
      return;
    }
    bar.hidden = false;
    document.body.classList.add("has-order-bar");
    barSummary.textContent = tot.count + " " + (tot.count === 1 ? s.dish : s.dishes) + " · " + s.approx + " " + formatPrice(tot.total);
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function openModal() {
    modal.hidden = false;
    document.body.classList.add("modal-open");
    currentStep = null;
    renderModal();
  }

  function renderModal(step) {
    var s = t();
    var tot = cartTotals();
    if (tot.count === 0) {
      closeModal();
      return;
    }

    var needsStarter = !hasCategory(tot.entries, STARTER_CATEGORIES);
    var needsDessert = !hasCategory(tot.entries, DESSERT_CATEGORIES);

    if (!step) step = needsStarter || needsDessert ? "nudge" : "summary";
    currentStep = step;

    if (step === "nudge") {
      var suggestNums = [];
      if (needsStarter) suggestNums = suggestNums.concat(SUGGESTIONS.starter);
      if (needsDessert) suggestNums = suggestNums.concat(SUGGESTIONS.dessert);
      var chips = suggestNums
        .filter(function (num) { return itemsByNum[num]; })
        .map(function (num) {
          var name = parseName(itemsByNum[num].nameEl);
          return '<button type="button" class="suggestion-chip" data-suggest-num="' + num + '">+ ' + name + "</button>";
        })
        .join("");
      modalBody.innerHTML =
        "<h3>" + s.nudgeTitle + "</h3>" +
        "<p>" + s.nudgeQuestion + "</p>" +
        '<div class="suggestion-chips">' + chips + "</div>" +
        '<div class="order-modal-actions">' +
        '<button type="button" class="btn btn-ghost" data-close>' + s.continueSelecting + "</button>" +
        '<button type="button" class="btn btn-primary" id="order-modal-continue">' + s.noThanksContinue + "</button>" +
        "</div>";
      document.getElementById("order-modal-continue").addEventListener("click", function () {
        renderModal("summary");
      });
    } else {
      var rows = tot.entries
        .map(function (e) {
          var liveName = itemsByNum[e.num] ? parseName(itemsByNum[e.num].nameEl) : e.name;
          return (
            '<li><span class="order-row-num">' + s.numLabel + " " + e.num + "</span>" +
            '<span class="order-row-name">' + liveName + "</span>" +
            '<span class="order-row-qty">×' + e.qty + "</span></li>"
          );
        })
        .join("");
      modalBody.innerHTML =
        "<h3>" + s.summaryTitle + "</h3>" +
        "<p>" + s.summaryIntro + "</p>" +
        '<ul class="order-summary-list">' + rows + "</ul>" +
        '<p class="order-total">' + s.total + formatPrice(tot.total) +
        "<br><small>" + s.disclaimer + "</small></p>" +
        '<p class="order-thanks">Cảm ơn! Danke! <span aria-hidden="true">😊</span></p>' +
        '<div class="order-modal-actions">' +
        '<button type="button" class="btn btn-ghost" data-close>' + s.back + "</button>" +
        '<a class="btn btn-primary" href="tel:' + PHONE + '">' + s.callNow + '<span style="white-space:nowrap">' + PHONE_DISPLAY + "</span></a>" +
        "</div>";
    }
  }

  barBtn.addEventListener("click", openModal);

  modal.addEventListener("click", function (e) {
    var suggestBtn = e.target.closest("[data-suggest-num]");
    if (suggestBtn) {
      addToCart(suggestBtn.dataset.suggestNum);
      renderModal();
      return;
    }
    if (e.target.closest("[data-close]")) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  document.addEventListener("chomchom:langchange", function () {
    ariaRenderers.forEach(function (fn) { fn(); });
    updateBar();
    if (!modal.hidden) renderModal(currentStep);
  });

  updateBar();
})();
