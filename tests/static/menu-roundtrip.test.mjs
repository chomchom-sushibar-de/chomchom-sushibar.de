import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parseFragment } from "parse5";
import { attr, classes, descendants, first, isElement, normalizedText, parseHtmlFile } from "../helpers/html.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function localizedParts(node) {
  const skipInline = (candidate) => candidate.tagName === "em" || candidate.tagName === "small" || classes(candidate).has("tag");
  const de = normalizedText(node, skipInline);
  const deQualifier = normalizedText(first(node, (candidate) => candidate.tagName === "em"));
  const deDetail = normalizedText(first(node, (candidate) => candidate.tagName === "small"));
  const enHtmlValue = attr(node, "data-en-html");
  const enFragment = enHtmlValue === undefined ? null : parseFragment(enHtmlValue);
  const en = enFragment
    ? normalizedText(enFragment, skipInline)
    : (attr(node, "data-en") ?? de).replace(/\s+/g, " ").trim();
  const enQualifier = enFragment ? normalizedText(first(enFragment, (candidate) => candidate.tagName === "em")) : deQualifier;
  const enDetail = enFragment ? normalizedText(first(enFragment, (candidate) => candidate.tagName === "small")) : deDetail;
  return {
    text: { de, en },
    ...(deQualifier || enQualifier ? { qualifier: { de: deQualifier || de, en: enQualifier || en } } : {}),
    ...(deDetail || enDetail ? { detail: { de: deDetail || de, en: enDetail || en } } : {})
  };
}

function localizedText(node) {
  const de = normalizedText(node);
  const en = attr(node, "data-en") ?? (attr(node, "data-en-html") ? normalizedText(parseFragment(attr(node, "data-en-html"))) : de);
  return { de, en: en.replace(/\s+/g, " ").trim() };
}

function tags(node) {
  return descendants(node, (candidate) => classes(candidate).has("tag")).map((tag) => {
    const de = normalizedText(tag);
    return {
      kind: classes(tag).has("scharf") ? "spicy" : "vegetarian",
      text: { de, en: attr(tag, "data-en") || de }
    };
  });
}

function priceCents(node, skipEvening = false) {
  const text = normalizedText(node, (candidate) => skipEvening && classes(candidate).has("abend"));
  const match = text.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:[.,]\d{2})?)\s*€/);
  assert.ok(match, `Could not parse price from ${text}`);
  const [whole, fraction = "00"] = match[1].replace(/\./g, "").replace(",", ".").split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

function projectCanonical(menu, availableOnly = false) {
  return {
    categories: menu.categories.map((category) => ({
      id: category.id,
      sort: category.sort,
      name: category.name,
      ...(category.detail ? { detail: category.detail } : {}),
      ...(category.tags ? { tags: category.tags } : {}),
      ...(category.note ? { note: category.note } : {}),
      ...(category.notePosition ? { notePosition: category.notePosition } : {}),
      items: category.items
        .filter((item) => !availableOnly || item.available)
        .map(({ id, available, ...item }) => item)
    }))
  };
}

function projectGenerated(document) {
  const categoryNodes = descendants(document, (node) => isElement(node, "div", "menu-category"));
  return {
    categories: categoryNodes.map((categoryNode, categoryIndex) => {
      const heading = first(categoryNode, (node) => node.parentNode === categoryNode && node.tagName === "h2");
      const note = first(categoryNode, (node) => node.parentNode === categoryNode && isElement(node, "p", "category-note"));
      const list = first(categoryNode, (node) => node.parentNode === categoryNode && isElement(node, "div", "menu-list"));
      const headingParts = localizedParts(heading);
      const itemNodes = (list.childNodes || []).filter((node) => isElement(node, "div", "menu-item"));
      return {
        id: attr(categoryNode, "id"),
        sort: categoryIndex + 1,
        name: headingParts.text,
        ...(headingParts.detail ? { detail: headingParts.detail } : {}),
        ...(tags(heading).length ? { tags: tags(heading) } : {}),
        ...(note ? { note: localizedText(note) } : {}),
        ...(note ? { notePosition: categoryNode.childNodes.indexOf(note) < categoryNode.childNodes.indexOf(list) ? "before-items" : "after-items" } : {}),
        items: itemNodes.map((itemNode, itemIndex) => {
          const number = first(itemNode, (node) => isElement(node, "span", "num"));
          const name = first(itemNode, (node) => isElement(node, "span", "name"));
          const description = first(itemNode, (node) => isElement(node, "div", "desc"));
          const price = first(itemNode, (node) => isElement(node, "span", "price"));
          const evening = first(price, (node) => isElement(node, "span", "abend"));
          const nameParts = localizedParts(name);
          const eveningText = evening ? normalizedText(evening) : "";
          const prefixDe = evening ? eveningText.replace(/\s*(\d+(?:[.,]\d{2}))\s*€.*$/, "").trim() : "";
          const prefixEn = evening && attr(evening, "data-en")
            ? attr(evening, "data-en").replace(/\s*(\d+(?:[.,]\d{2}))\s*€.*$/, "").trim()
            : prefixDe;
          return {
            visibleNumber: normalizedText(number),
            sort: itemIndex + 1,
            name: nameParts.text,
            ...(nameParts.qualifier ? { qualifier: nameParts.qualifier } : {}),
            ...(description ? { description: localizedText(description) } : {}),
            ...(tags(name).length ? { tags: tags(name) } : {}),
            prices: {
              dayCents: priceCents(price, true),
              ...(evening ? { eveningCents: priceCents(evening) } : {}),
              ...(prefixDe || prefixEn ? { eveningPrefix: { de: prefixDe, en: prefixEn } } : {})
            }
          };
        })
      };
    })
  };
}

test("the migrated content version is exactly equal to the pre-migration snapshot", async () => {
  const [baseline, menu] = await Promise.all([
    readFile(resolve(root, "tests/fixtures/menu-pre-migration.v1.json"), "utf8").then(JSON.parse),
    readFile(resolve(root, "data/menu.v1.json"), "utf8").then(JSON.parse)
  ]);
  assert.match(baseline.sourceCommit, /^[a-f0-9]{40}$/);
  assert.equal(baseline.snapshotVersion, 1);
  if (menu.contentVersion === baseline.contentVersion) {
    assert.deepEqual(projectCanonical(menu), { categories: baseline.categories });
  }
});

test("generated static menu roundtrips numbers, text, ordering, tags, and prices", async () => {
  const [menu, parsed] = await Promise.all([
    readFile(resolve(root, "data/menu.v1.json"), "utf8").then(JSON.parse),
    parseHtmlFile(resolve(root, "speisekarte.html"))
  ]);
  assert.deepEqual(projectGenerated(parsed.document), projectCanonical(menu, true));
});

test("generated browser and structured data reference the same stable items", async () => {
  const { document } = await parseHtmlFile(resolve(root, "speisekarte.html"));
  const orderNode = first(document, (node) => attr(node, "id") === "menu-order-data");
  const structuredNode = first(document, (node) => attr(node, "id") === "menu-structured-data");
  const order = JSON.parse(normalizedText(orderNode));
  const structured = JSON.parse(normalizedText(structuredNode));
  const allOrderIds = order.items.map((item) => item.id);
  const orderIds = order.items.filter((item) => item.available).map((item) => item.id);
  const structuredItems = structured.hasMenuSection.flatMap((section) => section.hasMenuItem);
  const structuredIds = structuredItems.map((item) => item.identifier);
  const domIds = descendants(document, (node) => isElement(node, "div", "menu-item")).map((node) => attr(node, "data-item-id"));
  assert.deepEqual(domIds, orderIds);
  assert.deepEqual(structuredIds, orderIds);
  for (const item of order.items.filter((candidate) => candidate.available)) {
    const structuredItem = structuredItems.find((candidate) => candidate.identifier === item.id);
    const expectedPrices = [item.prices.dayCents, item.prices.eveningCents]
      .filter(Number.isInteger)
      .map((cents) => `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`);
    assert.deepEqual(structuredItem.offers.map((offer) => offer.price), expectedPrices);
    structuredItem.offers.forEach((offer) => assert.equal(offer.availability, undefined));
  }
  for (const ids of Object.values(order.suggestions)) ids.forEach((id) => assert.ok(allOrderIds.includes(id)));
});
