import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateMenu } from "./lib/validate-data.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = resolve(root, "speisekarte.html");
const check = process.argv.includes("--check");
const MENU_START = "      <!-- GENERATED:MENU:START -->";
const MENU_END = "      <!-- GENERATED:MENU:END -->";
const LD_START = "<!-- GENERATED:MENU-JSON-LD:START -->";
const LD_END = "<!-- GENERATED:MENU-JSON-LD:END -->";
const ORDER_START = "<!-- GENERATED:ORDER-DATA:START -->";
const ORDER_END = "<!-- GENERATED:ORDER-DATA:END -->";

function escapeText(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value) {
  return escapeText(value).replace(/"/g, "&quot;");
}

function translationAttribute(de, en, html = false) {
  if (de === en) return "";
  return ` data-en${html ? "-html" : ""}="${escapeAttr(en)}"`;
}

function tagHtml(tag) {
  const className = tag.kind === "spicy" ? "tag scharf" : "tag";
  return `<span class="${className}"${translationAttribute(tag.text.de, tag.text.en)}>${escapeText(tag.text.de)}</span>`;
}

function localizedInline(value, options = {}) {
  const { qualifier, tags = [], detail = false } = options;
  const deSuffix = qualifier ? ` <em>${escapeText(qualifier.de)}</em>` : "";
  const enSuffix = qualifier ? ` <em>${escapeText(qualifier.en)}</em>` : "";
  const tagSuffixDe = tags.length ? ` ${tags.map(tagHtml).join(" ")}` : "";
  const tagSuffixEn = tags.length
    ? ` ${tags.map((tag) => `<span class="${tag.kind === "spicy" ? "tag scharf" : "tag"}">${escapeText(tag.text.en)}</span>`).join(" ")}`
    : "";
  const deHtml = `${escapeText(value.de)}${deSuffix}${tagSuffixDe}`;
  const enHtml = `${escapeText(value.en)}${enSuffix}${tagSuffixEn}`;
  if (qualifier || tags.length || detail) {
    return { content: deHtml, attr: deHtml === enHtml ? "" : ` data-en-html="${escapeAttr(enHtml)}"` };
  }
  return { content: escapeText(value.de), attr: translationAttribute(value.de, value.en) };
}

function formatCents(cents, locale = "de") {
  const whole = Math.floor(cents / 100);
  const fraction = String(cents % 100).padStart(2, "0");
  return `${whole}${locale === "en" ? "." : ","}${fraction} €`;
}

function formatOfferPrice(cents) {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

function renderPrice(prices) {
  let evening = "";
  if (prices.eveningCents) {
    const de = `${prices.eveningPrefix ? `${prices.eveningPrefix.de} ` : ""}${formatCents(prices.eveningCents)}`;
    const en = `${prices.eveningPrefix ? `${prices.eveningPrefix.en} ` : ""}${formatCents(prices.eveningCents, "en")}`;
    evening = `<span class="abend"${prices.eveningPrefix ? translationAttribute(de, en) : ""}>${escapeText(de)}</span>`;
  }
  return `<span class="price">${formatCents(prices.dayCents)}${evening}</span>`;
}

function renderItem(item, categoryId) {
  const name = localizedInline(item.name, { qualifier: item.qualifier, tags: item.tags });
  const description = item.description
    ? `<div class="desc"${translationAttribute(item.description.de, item.description.en)}>${escapeText(item.description.de)}</div>`
    : "";
  const evening = item.prices.eveningCents ? ` data-evening-cents="${item.prices.eveningCents}"` : "";
  return `          <div class="menu-item" data-item-id="${item.id}" data-category-id="${categoryId}" data-visible-number="${escapeAttr(item.visibleNumber)}" data-day-cents="${item.prices.dayCents}"${evening}><span class="num">${escapeText(item.visibleNumber)}</span><div class="info"><span class="name"${name.attr}>${name.content}</span>${description}</div>${renderPrice(item.prices)}</div>`;
}

function renderCategory(category) {
  const heading = localizedInline(category.name, { detail: Boolean(category.detail), tags: category.tags });
  const detailDe = category.detail ? ` <small>${escapeText(category.detail.de)}</small>` : "";
  const detailEn = category.detail ? ` <small>${escapeText(category.detail.en)}</small>` : "";
  if (category.detail) {
    heading.content = `${escapeText(category.name.de)}${detailDe}${category.tags?.length ? ` ${category.tags.map(tagHtml).join(" ")}` : ""}`;
    const enHtml = `${escapeText(category.name.en)}${detailEn}${category.tags?.length ? ` ${category.tags.map((tag) => `<span class="${tag.kind === "spicy" ? "tag scharf" : "tag"}">${escapeText(tag.text.en)}</span>`).join(" ")}` : ""}`;
    heading.attr = heading.content === enHtml ? "" : ` data-en-html="${escapeAttr(enHtml)}"`;
  }
  const note = category.note
    ? `        <p class="category-note"${translationAttribute(category.note.de, category.note.en)}>${escapeText(category.note.de)}</p>\n`
    : "";
  const items = category.items.filter((item) => item.available).map((item) => renderItem(item, category.id)).join("\n");
  const beforeNote = category.notePosition === "before-items" ? note : "";
  const afterNote = category.notePosition === "after-items" ? note : "";
  return [
    `      <div class="menu-category" id="${category.id}">`,
    `        <h2${heading.attr}>${heading.content}</h2>`,
    beforeNote.trimEnd(),
    "        <div class=\"menu-list\">",
    items,
    "        </div>",
    afterNote.trimEnd(),
    "      </div>"
  ].filter(Boolean).join("\n");
}

function replaceGenerated(source, start, end, content, fallbackStart, fallbackEnd) {
  const existingStart = source.indexOf(start);
  const existingEnd = source.indexOf(end);
  if (existingStart !== -1 && existingEnd !== -1 && existingEnd > existingStart) {
    return `${source.slice(0, existingStart)}${start}\n${content}\n${end}${source.slice(existingEnd + end.length)}`;
  }
  if (!fallbackStart || !fallbackEnd) throw new Error(`Missing generated markers ${start} / ${end}.`);
  const from = source.indexOf(fallbackStart);
  const to = source.indexOf(fallbackEnd);
  if (from === -1 || to === -1) throw new Error(`Could not find initial insertion bounds for ${start}.`);
  if (fallbackStart === fallbackEnd && from === to) {
    return `${source.slice(0, from)}${start}\n${content}\n${end}\n${source.slice(from)}`;
  }
  if (to <= from) throw new Error(`Could not find initial insertion bounds for ${start}.`);
  return `${source.slice(0, from)}${start}\n${content}\n${end}\n\n${source.slice(to)}`;
}

function buildMenuJsonLd(menu) {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "Speisekarte – Chôm Chôm Sushibar",
    inLanguage: ["de", "en"],
    hasMenuSection: menu.categories.map((category) => ({
      "@type": "MenuSection",
      name: category.name.de,
      alternateName: category.name.en,
      hasMenuItem: category.items.filter((item) => item.available).map((item) => ({
        "@type": "MenuItem",
        identifier: item.id,
        name: item.name.de,
        alternateName: item.name.en,
        ...(item.description ? { description: item.description.de } : {}),
        offers: [
          {
            "@type": "Offer",
            priceCurrency: menu.currency,
            price: formatOfferPrice(item.prices.dayCents)
          },
          ...(item.prices.eveningCents
            ? [{
                "@type": "Offer",
                priceCurrency: menu.currency,
                price: formatOfferPrice(item.prices.eveningCents)
              }]
            : [])
        ]
      }))
    }))
  };
}

function buildOrderData(menu) {
  return {
    schemaVersion: menu.schemaVersion,
    contentVersion: menu.contentVersion,
    defaultPriceMode: menu.priceModes.default,
    suggestions: menu.suggestions,
    categories: menu.categories.map((category) => ({ id: category.id, sort: category.sort })),
    items: menu.categories.flatMap((category) => category.items.map((item) => ({
      id: item.id,
      visibleNumber: item.visibleNumber,
      categoryId: category.id,
      sort: item.sort,
      name: item.name,
      prices: item.prices,
      available: item.available
    })))
  };
}

const menu = await validateMenu(root);
const categoriesHtml = menu.categories.map(renderCategory).join("\n\n");
const jsonLd = `  <script type="application/ld+json" id="menu-structured-data">\n${JSON.stringify(buildMenuJsonLd(menu), null, 2).split("\n").map((line) => `  ${line}`).join("\n")}\n  </script>`;
const orderData = `<script type="application/json" id="menu-order-data">${JSON.stringify(buildOrderData(menu))}</script>`;

let html = await readFile(htmlPath, "utf8");
html = replaceGenerated(
  html,
  MENU_START,
  MENU_END,
  categoriesHtml,
  '      <div class="menu-category" id="sushi-menues">',
  '      <div class="menu-pdf-links">'
);
html = replaceGenerated(html, LD_START, LD_END, jsonLd, "</head>", "</head>");
html = replaceGenerated(html, ORDER_START, ORDER_END, orderData, '<script src="order.js"></script>', '<script src="order.js"></script>');

const current = await readFile(htmlPath, "utf8");
if (check) {
  if (html !== current) {
    throw new Error("speisekarte.html is not synchronized with data/menu.v1.json; run npm run menu:generate.");
  }
  console.log(`Menu HTML is synchronized (${menu.categories.length} categories, ${menu.categories.flatMap((category) => category.items).length} dishes).`);
} else {
  await writeFile(htmlPath, html);
  console.log(`Generated menu HTML from data/menu.v1.json (${menu.categories.length} categories).`);
}
