import { readFile } from "node:fs/promises";
import { parse, parseFragment } from "parse5";

export function attr(node, name) {
  return node.attrs?.find((entry) => entry.name === name)?.value;
}

export function classes(node) {
  return new Set((attr(node, "class") || "").split(/\s+/).filter(Boolean));
}

export function descendants(node, predicate, result = []) {
  if (predicate(node)) result.push(node);
  for (const child of node.childNodes || []) descendants(child, predicate, result);
  return result;
}

export function first(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.childNodes || []) {
    const found = first(child, predicate);
    if (found) return found;
  }
  return null;
}

export function normalizedText(node, shouldSkip = () => false) {
  if (!node || shouldSkip(node)) return "";
  if (node.nodeName === "#text") return node.value;
  return (node.childNodes || [])
    .map((child) => normalizedText(child, shouldSkip))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export function isElement(node, tagName, className) {
  return node.tagName === tagName && (!className || classes(node).has(className));
}

export function translatedFragment(node) {
  const html = attr(node, "data-en-html");
  return html === undefined ? null : parseFragment(html);
}

export async function parseHtmlFile(path) {
  const errors = [];
  const source = await readFile(path, "utf8");
  const document = parse(source, {
    sourceCodeLocationInfo: true,
    onParseError: (error) => errors.push(error)
  });
  return { source, document, errors };
}
