import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { attr, descendants, first, isElement, parseHtmlFile } from "../helpers/html.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const publicPages = ["index.html", "speisekarte.html", "kontakt.html", "aussenbereich.html", "impressum.html", "datenschutz.html", "404.html"];
const marketingPages = new Set(["index.html", "speisekarte.html", "kontakt.html", "aussenbereich.html"]);

function elements(document, tagName) {
  return descendants(document, (node) => node.tagName === tagName);
}

function relTokens(node) {
  return new Set((attr(node, "rel") || "").split(/\s+/).filter(Boolean));
}

function localTarget(page, raw) {
  let withoutHash = raw.split("#", 1)[0].split("?", 1)[0];
  if (withoutHash.startsWith("/chomchom-sushibar.de/")) withoutHash = withoutHash.slice("/chomchom-sushibar.de/".length);
  if (!withoutHash) return resolve(root, page);
  return resolve(root, dirname(page), decodeURIComponent(withoutHash));
}

test("public HTML is parseable, bilingual, noindexed, and keyboard-oriented", async () => {
  for (const page of publicPages) {
    const { source, document, errors } = await parseHtmlFile(resolve(root, page));
    assert.deepEqual(errors, [], `${page} contains HTML parse errors`);
    const html = first(document, (node) => node.tagName === "html");
    assert.equal(attr(html, "lang"), "de", `${page} must declare the source language`);
    const titles = elements(document, "title");
    assert.equal(titles.length, 1, `${page} needs one title`);
    assert.ok(attr(titles[0], "data-en"), `${page} needs an English title`);
    const main = first(document, (node) => node.tagName === "main");
    assert.equal(attr(main, "id"), "main-content", `${page} needs a main target`);
    assert.equal(elements(main, "h1").length, 1, `${page} needs exactly one h1 inside main`);
    const skip = first(document, (node) => isElement(node, "a", "skip-link"));
    assert.equal(attr(skip, "href"), "#main-content", `${page} needs a skip link`);
    const robots = first(document, (node) => node.tagName === "meta" && attr(node, "name") === "robots");
    assert.match(attr(robots, "content"), /noindex/, `${page} must remain excluded while gated`);
    const csp = first(document, (node) => node.tagName === "meta" && attr(node, "http-equiv") === "Content-Security-Policy");
    assert.ok(csp, `${page} needs a CSP boundary`);
    assert.match(attr(csp, "content"), /default-src 'self'/);
    assert.ok(source.indexOf("Content-Security-Policy") < source.indexOf('src="gate.js"'), `${page} must install CSP before scripts`);
    assert.equal(elements(document, "base").length, 0, `${page} may not hard-code a deployment base`);
    assert.equal(elements(document, "link").filter((node) => relTokens(node).has("canonical")).length, 0, `${page} must not guess a canonical before domain approval`);
    assert.equal(elements(document, "meta").filter((node) => attr(node, "property") === "og:url").length, 0, `${page} must not guess an OpenGraph URL`);
    if (marketingPages.has(page)) {
      const description = first(document, (node) => node.tagName === "meta" && attr(node, "name") === "description");
      assert.ok(attr(description, "content"));
      assert.ok(attr(description, "data-en-content"));
      for (const property of ["og:type", "og:title", "og:description", "og:locale"]) {
        const entries = elements(document, "meta").filter((node) => attr(node, "property") === property);
        assert.equal(entries.length, 1, `${page} needs exactly one ${property}`);
        assert.ok(attr(entries[0], "content"), `${page} ${property} must not be empty`);
        if (property !== "og:type") assert.ok(attr(entries[0], "data-en-content"), `${page} ${property} needs an English value`);
      }
    }
    for (const node of descendants(document, (candidate) => Array.isArray(candidate.attrs))) {
      for (const entry of node.attrs || []) {
        if (entry.name.startsWith("data-en")) assert.notEqual(entry.value.trim(), "", `${page} has an empty ${entry.name}`);
      }
    }
    const ids = descendants(document, (node) => attr(node, "id") !== undefined).map((node) => attr(node, "id"));
    assert.equal(new Set(ids).size, ids.length, `${page} has duplicate IDs`);
    ids.forEach((id) => assert.match(id, /^[A-Za-z][A-Za-z0-9_:.\-]*$/, `${page} has invalid id ${id}`));
    for (const button of elements(document, "button")) {
      assert.equal(attr(button, "type"), "button", `${page} button needs an explicit non-submit type`);
    }
  }
});

test("all local links and delivered resources resolve", async () => {
  const pageIds = new Map();
  for (const page of publicPages) {
    const { document } = await parseHtmlFile(resolve(root, page));
    pageIds.set(page, new Set(descendants(document, (node) => attr(node, "id") !== undefined).map((node) => attr(node, "id"))));
  }
  for (const page of publicPages) {
    const { document } = await parseHtmlFile(resolve(root, page));
    const references = descendants(document, (node) => attr(node, "href") || attr(node, "src"));
    for (const node of references) {
      const raw = attr(node, "href") || attr(node, "src");
      if (/^(?:https?:|tel:|mailto:|data:)/.test(raw)) continue;
      const target = localTarget(page, raw);
      await assert.doesNotReject(access(target), `${page}: missing ${raw}`);
      const fragment = raw.includes("#") ? raw.slice(raw.indexOf("#") + 1) : "";
      if (fragment && extname(target) === ".html") {
        const relative = target.slice(root.length + 1);
        assert.ok(pageIds.get(relative)?.has(decodeURIComponent(fragment)), `${page}: missing fragment ${raw}`);
      }
    }
    const responsiveSources = descendants(document, (node) => attr(node, "srcset"));
    for (const node of responsiveSources) {
      for (const candidate of attr(node, "srcset").split(",")) {
        const raw = candidate.trim().split(/\s+/, 1)[0];
        await assert.doesNotReject(access(localTarget(page, raw)), `${page}: missing responsive image ${raw}`);
      }
    }
  }
});

test("images reserve layout space and defer below-the-fold media", async () => {
  for (const page of publicPages) {
    const { document } = await parseHtmlFile(resolve(root, page));
    for (const image of elements(document, "img")) {
      assert.notEqual(attr(image, "alt"), undefined, `${page}: image needs alt text`);
      assert.match(attr(image, "width") || "", /^\d+$/, `${page}: image needs intrinsic width`);
      assert.match(attr(image, "height") || "", /^\d+$/, `${page}: image needs intrinsic height`);
      const eager = (attr(image, "class") || "").includes("brand-mark") || attr(image, "fetchpriority") === "high";
      if (!eager) assert.equal(attr(image, "loading"), "lazy", `${page}: below-fold image should be lazy`);
    }
  }
});

test("new-window links and external links declare their relationship", async () => {
  for (const page of publicPages) {
    const { document } = await parseHtmlFile(resolve(root, page));
    for (const link of elements(document, "a")) {
      const href = attr(link, "href") || "";
      const rel = relTokens(link);
      if (attr(link, "target") === "_blank") {
        assert.ok(rel.has("noopener") && rel.has("noreferrer"), `${page}: ${href} needs noopener noreferrer`);
      } else if (/^https?:/.test(href)) {
        assert.ok(rel.has("external"), `${page}: ${href} needs rel=external`);
      }
    }
  }
});

test("preview crawler controls and release boundaries are explicit", async () => {
  assert.equal(await readFile(resolve(root, "robots.txt"), "utf8"), "User-agent: *\nDisallow: /\n");
  await assert.rejects(access(resolve(root, "CNAME")));
  await assert.rejects(access(resolve(root, "sitemap.xml")));
  const css = await readFile(resolve(root, "styles.css"), "utf8");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /:focus-visible/);
});
