(function () {
  "use strict";

  var menuDataEl = document.getElementById("menu-order-data");
  var menuList = document.querySelector(".menu-list");
  if (!menuDataEl || !menuList) return;

  var CART_VERSION = 2;
  var STORAGE_KEY = "chomchom-cart-v2";
  var LEGACY_STORAGE_KEY = "chomchom-cart";
  var MAX_QTY = 20;
  var MAX_TOTAL_QTY = 100;
  var PHONE = "+498104888476";
  var PHONE_DISPLAY = "08104 888 476";
  var STARTER_CATEGORIES = ["suppen", "vorspeisen", "salate"];
  var DESSERT_CATEGORIES = ["desserts"];

  var STRINGS = {
    de: {
      less: "Weniger",
      more: "Mehr",
      quantity: "Menge",
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
      totalDay: "Ca. Gesamtsumme (Mittag): ",
      totalEvening: "Ca. Gesamtsumme (Abend): ",
      disclaimer: "Unverbindliche Preisübersicht · Bestellung ausschließlich telefonisch · nur Barzahlung vor Ort.",
      back: "Zurück zur Karte",
      callNow: "Jetzt anrufen · ",
      maxReached: "Maximale Menge erreicht"
    },
    en: {
      less: "Less",
      more: "More",
      quantity: "Quantity",
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
      totalDay: "Approx. total (lunch): ",
      totalEvening: "Approx. total (evening): ",
      disclaimer: "Non-binding price estimate · orders are placed by phone only · cash only on site.",
      back: "Back to menu",
      callNow: "Call now · ",
      maxReached: "Maximum quantity reached"
    }
  };

  function currentLang() {
    return (window.chomchomLang && window.chomchomLang.get()) || "de";
  }

  function t() {
    return STRINGS[currentLang()] || STRINGS.de;
  }

  function readMenuData() {
    try {
      var parsed = JSON.parse(menuDataEl.textContent);
      if (!parsed || parsed.schemaVersion !== 1 || !Array.isArray(parsed.items)) return null;
      return parsed;
    } catch (error) {
      return null;
    }
  }

  var menu = readMenuData();
  if (!menu) return;

  var itemsById = Object.create(null);
  var idsByNumber = Object.create(null);
  var itemOrder = [];
  menu.items.forEach(function (item, index) {
    if (!item || typeof item.id !== "string" || !item.available) return;
    item._order = index;
    itemsById[item.id] = item;
    idsByNumber[item.visibleNumber] = item.id;
    itemOrder.push(item.id);
  });

  var cart = Object.create(null);
  var priceMode = menu.defaultPriceMode === "evening" ? "evening" : "day";

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function storageRemove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {}
  }

  function boundedQty(value, room) {
    if (!Number.isInteger(value) || value <= 0) return 0;
    return Math.min(value, MAX_QTY, room);
  }

  function normalizeItems(candidate) {
    var normalized = Object.create(null);
    var total = 0;
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return normalized;
    Object.keys(candidate).forEach(function (id) {
      if (!itemsById[id] || total >= MAX_TOTAL_QTY) return;
      var qty = boundedQty(candidate[id], MAX_TOTAL_QTY - total);
      if (!qty) return;
      normalized[id] = qty;
      total += qty;
    });
    return normalized;
  }

  function readVersionedCart() {
    var raw = storageGet(STORAGE_KEY);
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== CART_VERSION) return null;
      return normalizeItems(parsed.items);
    } catch (error) {
      return null;
    }
  }

  function migrateLegacyCart() {
    var raw = storageGet(LEGACY_STORAGE_KEY);
    if (!raw) return Object.create(null);
    var migrated = Object.create(null);
    var total = 0;
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return migrated;
      Object.keys(parsed).forEach(function (legacyKey) {
        var entry = parsed[legacyKey];
        if (!entry || typeof entry !== "object") return;
        var visibleNumber = typeof entry.num === "string" ? entry.num : legacyKey;
        var id = idsByNumber[visibleNumber];
        if (!id || total >= MAX_TOTAL_QTY) return;
        var qty = boundedQty(entry.qty, MAX_TOTAL_QTY - total);
        if (!qty) return;
        migrated[id] = Math.min((migrated[id] || 0) + qty, MAX_QTY);
        total += qty;
      });
      if (saveCart(migrated)) storageRemove(LEGACY_STORAGE_KEY);
    } catch (error) {}
    return migrated;
  }

  function saveCart(nextCart) {
    var value = nextCart || cart;
    return storageSet(STORAGE_KEY, JSON.stringify({
      version: CART_VERSION,
      contentVersion: menu.contentVersion,
      items: value
    }));
  }

  function loadCart() {
    var versioned = readVersionedCart();
    cart = versioned === null ? migrateLegacyCart() : versioned;
    saveCart();
  }

  function totalQuantity() {
    return Object.keys(cart).reduce(function (sum, id) { return sum + cart[id]; }, 0);
  }

  function itemPriceCents(item) {
    if (priceMode === "evening" && Number.isInteger(item.prices.eveningCents)) {
      return item.prices.eveningCents;
    }
    return item.prices.dayCents;
  }

  function formatPrice(cents) {
    var whole = Math.floor(cents / 100);
    var fraction = String(cents % 100).padStart(2, "0");
    return whole + "," + fraction + " €";
  }

  function cartEntries() {
    return itemOrder
      .filter(function (id) { return cart[id] > 0 && itemsById[id]; })
      .map(function (id) { return { item: itemsById[id], qty: cart[id] }; });
  }

  function cartTotals() {
    var entries = cartEntries();
    var count = entries.reduce(function (sum, entry) { return sum + entry.qty; }, 0);
    var totalCents = entries.reduce(function (sum, entry) {
      return sum + entry.qty * itemPriceCents(entry.item);
    }, 0);
    return { entries: entries, count: count, totalCents: totalCents };
  }

  var renderers = [];
  document.querySelectorAll(".menu-item[data-item-id]").forEach(function (itemEl) {
    var id = itemEl.dataset.itemId;
    var item = itemsById[id];
    if (!item) return;

    var stepper = document.createElement("div");
    stepper.className = "qty-stepper";
    var minus = document.createElement("button");
    minus.type = "button";
    minus.className = "qty-btn qty-minus";
    minus.textContent = "−";
    var value = document.createElement("output");
    value.className = "qty-value";
    value.setAttribute("aria-live", "polite");
    var plus = document.createElement("button");
    plus.type = "button";
    plus.className = "qty-btn qty-plus";
    plus.textContent = "+";
    stepper.append(minus, value, plus);
    itemEl.appendChild(stepper);

    function render() {
      var qty = cart[id] || 0;
      var name = item.name[currentLang()] || item.name.de;
      value.textContent = String(qty);
      value.setAttribute("aria-label", t().quantity + " " + name + ": " + qty);
      minus.disabled = qty === 0;
      plus.disabled = qty >= MAX_QTY || totalQuantity() >= MAX_TOTAL_QTY;
      minus.setAttribute("aria-label", t().less + " " + name);
      plus.setAttribute("aria-label", (plus.disabled ? t().maxReached + ": " : t().more + " ") + name);
      itemEl.classList.toggle("in-cart", qty > 0);
    }

    minus.addEventListener("click", function () {
      if (!cart[id]) return;
      cart[id] -= 1;
      if (cart[id] <= 0) delete cart[id];
      saveCart();
      renderAll();
    });

    plus.addEventListener("click", function () {
      addToCart(id);
    });

    renderers.push(render);
  });

  var bar = document.getElementById("order-bar");
  var barSummary = document.getElementById("order-bar-summary");
  var barBtn = document.getElementById("order-bar-btn");
  var modal = document.getElementById("order-modal");
  var modalPanel = modal.querySelector(".order-modal-panel");
  var modalBody = document.getElementById("order-modal-body");
  var priceModeInputs = document.querySelectorAll('input[name="price-mode"]');
  var currentStep = null;
  var modalOpener = null;
  var inerted = [];

  function updateBar() {
    var totals = cartTotals();
    if (totals.count === 0) {
      bar.hidden = true;
      document.body.classList.remove("has-order-bar");
      return;
    }
    bar.hidden = false;
    document.body.classList.add("has-order-bar");
    barSummary.textContent = totals.count + " " + (totals.count === 1 ? t().dish : t().dishes) + " · " + t().approx + " " + formatPrice(totals.totalCents);
  }

  function renderAll() {
    renderers.forEach(function (render) { render(); });
    updateBar();
  }

  function addToCart(id) {
    if (!itemsById[id] || totalQuantity() >= MAX_TOTAL_QTY) return;
    var current = cart[id] || 0;
    if (current >= MAX_QTY) return;
    cart[id] = current + 1;
    saveCart();
    renderAll();
  }

  function hasCategory(entries, categoryIds) {
    return entries.some(function (entry) { return categoryIds.indexOf(entry.item.categoryId) !== -1; });
  }

  function node(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function button(text, className) {
    var element = node("button", className, text);
    element.type = "button";
    return element;
  }

  function setBackgroundInert(inert) {
    if (inert) {
      inerted = Array.from(document.body.children).filter(function (child) { return child !== modal; });
      inerted.forEach(function (child) { child.inert = true; });
    } else {
      inerted.forEach(function (child) { child.inert = false; });
      inerted = [];
    }
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    setBackgroundInert(false);
    if (modalOpener && document.contains(modalOpener)) modalOpener.focus();
    modalOpener = null;
  }

  function openModal() {
    modalOpener = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    setBackgroundInert(true);
    currentStep = null;
    renderModal();
    modal.querySelector(".order-modal-close").focus();
  }

  function renderModal(step) {
    var totals = cartTotals();
    if (totals.count === 0) {
      closeModal();
      return;
    }
    var needsStarter = !hasCategory(totals.entries, STARTER_CATEGORIES);
    var needsDessert = !hasCategory(totals.entries, DESSERT_CATEGORIES);
    if (!step) step = needsStarter || needsDessert ? "nudge" : "summary";
    currentStep = step;
    modalBody.replaceChildren();

    var title = node("h2", null, step === "nudge" ? t().nudgeTitle : t().summaryTitle);
    title.id = "order-modal-title";
    modalBody.appendChild(title);

    if (step === "nudge") {
      modalBody.appendChild(node("p", null, t().nudgeQuestion));
      var chips = node("div", "suggestion-chips");
      var suggestionIds = [];
      if (needsStarter) suggestionIds = suggestionIds.concat(menu.suggestions.starter);
      if (needsDessert) suggestionIds = suggestionIds.concat(menu.suggestions.dessert);
      suggestionIds.forEach(function (id) {
        var item = itemsById[id];
        if (!item) return;
        var chip = button("+ " + (item.name[currentLang()] || item.name.de), "suggestion-chip");
        chip.dataset.suggestId = id;
        chips.appendChild(chip);
      });
      modalBody.appendChild(chips);
      var nudgeActions = node("div", "order-modal-actions");
      var close = button(t().continueSelecting, "btn btn-ghost");
      close.dataset.close = "";
      var continueButton = button(t().noThanksContinue, "btn btn-primary");
      continueButton.addEventListener("click", function () {
        renderModal("summary");
        modalPanel.focus();
      });
      nudgeActions.append(close, continueButton);
      modalBody.appendChild(nudgeActions);
      return;
    }

    modalBody.appendChild(node("p", null, t().summaryIntro));
    var list = node("ul", "order-summary-list");
    totals.entries.forEach(function (entry) {
      var row = node("li");
      row.append(
        node("span", "order-row-num", t().numLabel + " " + entry.item.visibleNumber),
        node("span", "order-row-name", entry.item.name[currentLang()] || entry.item.name.de),
        node("span", "order-row-qty", "×" + entry.qty)
      );
      list.appendChild(row);
    });
    modalBody.appendChild(list);
    var total = node("p", "order-total");
    total.appendChild(document.createTextNode((priceMode === "evening" ? t().totalEvening : t().totalDay) + formatPrice(totals.totalCents)));
    var small = node("small", null, t().disclaimer);
    total.append(document.createElement("br"), small);
    modalBody.appendChild(total);
    var thanks = node("p", "order-thanks", "Cảm ơn! Danke! ");
    var emoji = node("span", null, "😊");
    emoji.setAttribute("aria-hidden", "true");
    thanks.appendChild(emoji);
    modalBody.appendChild(thanks);
    var actions = node("div", "order-modal-actions");
    var back = button(t().back, "btn btn-ghost");
    back.dataset.close = "";
    var call = node("a", "btn btn-primary");
    call.href = "tel:" + PHONE;
    call.appendChild(document.createTextNode(t().callNow));
    call.appendChild(node("span", "phone-number", PHONE_DISPLAY));
    actions.append(back, call);
    modalBody.appendChild(actions);
  }

  function focusableElements() {
    return Array.from(modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(function (element) { return element.offsetParent !== null; });
  }

  barBtn.addEventListener("click", openModal);
  modal.addEventListener("click", function (event) {
    var suggestion = event.target.closest("[data-suggest-id]");
    if (suggestion) {
      addToCart(suggestion.dataset.suggestId);
      renderModal();
      modal.querySelector(".order-modal-close").focus();
      return;
    }
    if (event.target.closest("[data-close]")) closeModal();
  });

  document.addEventListener("keydown", function (event) {
    if (modal.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== "Tab") return;
    var focusable = focusableElements();
    if (!focusable.length) {
      event.preventDefault();
      modalPanel.focus();
      return;
    }
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  priceModeInputs.forEach(function (input) {
    input.checked = input.value === priceMode;
    input.addEventListener("change", function () {
      if (!input.checked || (input.value !== "day" && input.value !== "evening")) return;
      priceMode = input.value;
      updateBar();
      if (!modal.hidden) renderModal(currentStep);
    });
  });

  document.addEventListener("chomchom:langchange", function () {
    renderAll();
    if (!modal.hidden) renderModal(currentStep);
  });

  window.addEventListener("storage", function (event) {
    if (event.key !== STORAGE_KEY) return;
    var synced = readVersionedCart();
    if (synced === null) return;
    cart = synced;
    renderAll();
    if (!modal.hidden) renderModal(currentStep);
  });

  loadCart();
  renderAll();
})();
