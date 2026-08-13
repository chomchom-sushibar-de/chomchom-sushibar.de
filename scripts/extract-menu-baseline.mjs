import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse, parseFragment } from "parse5";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = resolve(root, "speisekarte.html");
const baselinePath = resolve(root, "tests/fixtures/menu-pre-migration.v1.json");
const menuPath = resolve(root, "data/menu.v1.json");
const force = process.argv.includes("--force");
const contentVersion = "2025-11";

function attr(node, name) {
  return node.attrs?.find((entry) => entry.name === name)?.value;
}

function classes(node) {
  return new Set((attr(node, "class") || "").split(/\s+/).filter(Boolean));
}

function isElement(node, tagName, className) {
  return node.tagName === tagName && (!className || classes(node).has(className));
}

function descendants(node, predicate, result = []) {
  if (predicate(node)) result.push(node);
  for (const child of node.childNodes || []) descendants(child, predicate, result);
  return result;
}

function first(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.childNodes || []) {
    const found = first(child, predicate);
    if (found) return found;
  }
  return null;
}

function normalizedText(node, shouldSkip = () => false) {
  if (!node || shouldSkip(node)) return "";
  if (node.nodeName === "#text") return node.value;
  return (node.childNodes || [])
    .map((child) => normalizedText(child, shouldSkip))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function translatedFragment(node) {
  const html = attr(node, "data-en-html");
  return html === undefined ? null : parseFragment(html);
}

function localizedParts(node) {
  const skipInline = (candidate) =>
    candidate.tagName === "em" || candidate.tagName === "small" || classes(candidate).has("tag");
  const de = normalizedText(node, skipInline);
  const deQualifier = normalizedText(first(node, (candidate) => candidate.tagName === "em"));
  const deDetail = normalizedText(first(node, (candidate) => candidate.tagName === "small"));
  const enHtml = translatedFragment(node);
  const enPlain = attr(node, "data-en");
  const en = enHtml
    ? normalizedText(enHtml, skipInline)
    : enPlain === undefined
      ? de
      : enPlain.replace(/\s+/g, " ").trim();
  const enQualifier = enHtml
    ? normalizedText(first(enHtml, (candidate) => candidate.tagName === "em"))
    : deQualifier;
  const enDetail = enHtml
    ? normalizedText(first(enHtml, (candidate) => candidate.tagName === "small"))
    : deDetail;
  return {
    text: { de, en },
    ...(deQualifier || enQualifier
      ? { qualifier: { de: deQualifier || de, en: enQualifier || en } }
      : {}),
    ...(deDetail || enDetail ? { detail: { de: deDetail || de, en: enDetail || en } } : {})
  };
}

function localizedText(node) {
  if (!node) return null;
  const de = normalizedText(node);
  const en = attr(node, "data-en") ?? (attr(node, "data-en-html")
    ? normalizedText(parseFragment(attr(node, "data-en-html")))
    : de);
  return { de, en: en.replace(/\s+/g, " ").trim() };
}

function localizedTags(node) {
  return descendants(node, (candidate) => classes(candidate).has("tag")).map((tag) => {
    const de = normalizedText(tag);
    return {
      kind: classes(tag).has("scharf") ? "spicy" : "vegetarian",
      text: { de, en: attr(tag, "data-en") || de }
    };
  });
}

function centsFrom(node, shouldSkip = () => false) {
  const value = normalizedText(node, shouldSkip);
  const match = value.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:[.,]\d{2})?)\s*€/);
  if (!match) throw new Error(`Price not found in: ${value}`);
  const normalized = match[1].replace(/\./g, "").replace(",", ".");
  const [whole, fraction = "00"] = normalized.split(".");
  return Number.parseInt(whole, 10) * 100 + Number.parseInt(fraction.padEnd(2, "0"), 10);
}

function slug(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function refuseOverwrite(path) {
  if (force) return;
  try {
    await readFile(path);
    throw new Error(`${path} already exists; pass --force only for an intentional new migration baseline.`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

await refuseOverwrite(baselinePath);
await refuseOverwrite(menuPath);

const sourceHtml = await readFile(htmlPath, "utf8");
const document = parse(sourceHtml);
const categoryNodes = descendants(document, (node) => isElement(node, "div", "menu-category"));

const categories = categoryNodes.map((categoryNode, categoryIndex) => {
  const categoryId = attr(categoryNode, "id");
  const heading = first(categoryNode, (node) => node.parentNode === categoryNode && node.tagName === "h2");
  const note = first(
    categoryNode,
    (node) => node.parentNode === categoryNode && node.tagName === "p" && classes(node).has("category-note")
  );
  const list = first(categoryNode, (node) => node.parentNode === categoryNode && isElement(node, "div", "menu-list"));
  const itemNodes = (list?.childNodes || []).filter((node) => isElement(node, "div", "menu-item"));
  const headingParts = localizedParts(heading);

  return {
    id: categoryId,
    sort: categoryIndex + 1,
    name: headingParts.text,
    ...(headingParts.detail ? { detail: headingParts.detail } : {}),
    ...(localizedTags(heading).length ? { tags: localizedTags(heading) } : {}),
    ...(note ? { note: localizedText(note) } : {}),
    ...(note ? { notePosition: categoryNode.childNodes.indexOf(note) < categoryNode.childNodes.indexOf(list) ? "before-items" : "after-items" } : {}),
    items: itemNodes.map((itemNode, itemIndex) => {
      const numberNode = first(itemNode, (node) => isElement(node, "span", "num"));
      const nameNode = first(itemNode, (node) => isElement(node, "span", "name"));
      const descriptionNode = first(itemNode, (node) => isElement(node, "div", "desc"));
      const priceNode = first(itemNode, (node) => isElement(node, "span", "price"));
      const eveningNode = first(priceNode, (node) => isElement(node, "span", "abend"));
      const eveningText = eveningNode ? normalizedText(eveningNode) : "";
      const eveningPrefixDe = eveningNode
        ? eveningText.replace(/\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})|\d+(?:[.,]\d{2})?)\s*€.*$/, "").trim()
        : "";
      const eveningPrefixEn = eveningNode && attr(eveningNode, "data-en")
        ? attr(eveningNode, "data-en").replace(/\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})|\d+(?:[.,]\d{2})?)\s*€.*$/, "").trim()
        : eveningPrefixDe;
      const visibleNumber = normalizedText(numberNode);
      const nameParts = localizedParts(nameNode);
      return {
        id: `${categoryId}-${slug(visibleNumber)}`,
        visibleNumber,
        sort: itemIndex + 1,
        name: nameParts.text,
        ...(nameParts.qualifier ? { qualifier: nameParts.qualifier } : {}),
        ...(descriptionNode ? { description: localizedText(descriptionNode) } : {}),
        ...(localizedTags(nameNode).length ? { tags: localizedTags(nameNode) } : {}),
        prices: {
          dayCents: centsFrom(priceNode, (node) => classes(node).has("abend")),
          ...(eveningNode ? { eveningCents: centsFrom(eveningNode) } : {}),
          ...(eveningPrefixDe || eveningPrefixEn
            ? { eveningPrefix: { de: eveningPrefixDe, en: eveningPrefixEn } }
            : {})
        },
        available: true
      };
    })
  };
});

const flatItems = categories.flatMap((category) => category.items);
const byNumber = new Map();
for (const item of flatItems) {
  const existing = byNumber.get(item.visibleNumber);
  if (existing) throw new Error(`Duplicate visible number ${item.visibleNumber}: ${existing.id}, ${item.id}`);
  byNumber.set(item.visibleNumber, item);
}

const project = (value) => ({
  categories: value.map((category) => ({
    id: category.id,
    sort: category.sort,
    name: category.name,
    ...(category.detail ? { detail: category.detail } : {}),
    ...(category.tags ? { tags: category.tags } : {}),
    ...(category.note ? { note: category.note } : {}),
    ...(category.notePosition ? { notePosition: category.notePosition } : {}),
    items: category.items.map(({ id, available, ...item }) => item)
  }))
});

const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const baseline = {
  snapshotVersion: 1,
  contentVersion,
  capturedFrom: "speisekarte.html",
  sourceCommit,
  ...project(categories)
};
const menu = {
  schemaVersion: 1,
  contentVersion,
  currency: "EUR",
  source: {
    documentedOrigin: "Repository PDF price lists transferred to speisekarte.html; see README.md",
    asOf: "2025-11",
    files: [
      {
        path: "menu/speisekarte.pdf",
        sha256: "29f337aa13f68ae275ae558116ce81fd8172ac8efded5bf2256917e409c97b15"
      },
      {
        path: "menu/sushi-karte.pdf",
        sha256: "18da0ebffcec5a48d34521967d951034ce43cc8f753a1ac0f3d88077ca99fdbc"
      }
    ],
    migrationBaseline: "tests/fixtures/menu-pre-migration.v1.json"
  },
  priceModes: {
    default: "day",
    supported: ["day", "evening"]
  },
  suggestions: {
    starter: ["11", "2"].map((number) => byNumber.get(number)?.id),
    dessert: ["80"].map((number) => byNumber.get(number)?.id)
  },
  categories
};

if ([...menu.suggestions.starter, ...menu.suggestions.dessert].some((id) => !id)) {
  throw new Error("A legacy suggestion number does not resolve to an existing menu item.");
}

await mkdir(dirname(baselinePath), { recursive: true });
await writeFile(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
await writeFile(menuPath, `${JSON.stringify(menu, null, 2)}\n`);

console.log(`Captured ${categories.length} categories and ${flatItems.length} dishes.`);
console.log(`Baseline: ${baselinePath}`);
console.log(`Canonical model: ${menuPath}`);
