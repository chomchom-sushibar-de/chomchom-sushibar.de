import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { validateMenu, validateSite } from "../../scripts/lib/validate-data.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

test("site and menu JSON match their schemas and semantic invariants", async () => {
  const [site, menu] = await Promise.all([validateSite(root), validateMenu(root)]);
  assert.equal(menu.categories.length, 20);
  assert.equal(menu.categories.flatMap((category) => category.items).length, 138);
  assert.deepEqual(Object.keys(site.hours), ["weekday", "sundayHolidays", "saturday"]);
  const html = await readFile(resolve(root, "index.html"), "utf8");
  const match = html.match(/<script type="application\/ld\+json" id="restaurant-structured-data">([\s\S]*?)<\/script>/);
  assert.ok(match, "restaurant structured data must exist");
  const structured = JSON.parse(match[1]);
  const expected = [site.hours.weekday, site.hours.sundayHolidays].flatMap((group) =>
    group.periods.map((period) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: group.schemaDays,
      opens: period.opens,
      closes: period.closes
    }))
  );
  assert.deepEqual(structured.openingHoursSpecification, expected);
});

test("Decap configuration is parseable, review-based, and scoped", async () => {
  const config = parseYaml(await readFile(resolve(root, "admin/config.yml"), "utf8"));
  assert.equal(config.publish_mode, "editorial_workflow");
  assert.equal(config.backend.name, "github");
  assert.equal(config.backend.branch, "main");
  assert.match(config.backend.base_url, /^https:\/\//);
  const managedFiles = config.collections.flatMap((collection) => collection.files || []).map((entry) => entry.file).sort();
  assert.deepEqual(managedFiles, ["data/menu.v1.json", "data/site.json"]);
  const menuFile = config.collections.flatMap((collection) => collection.files || []).find((entry) => entry.file === "data/menu.v1.json");
  const siteFile = config.collections.flatMap((collection) => collection.files || []).find((entry) => entry.file === "data/site.json");
  const hoursField = siteFile.fields.find((field) => field.name === "hours");
  assert.deepEqual(hoursField.fields.map((field) => field.name), ["weekday", "sundayHolidays", "saturday"]);
  assert.deepEqual(menuFile.fields.map((field) => field.name), [
    "schemaVersion",
    "contentVersion",
    "currency",
    "source",
    "priceModes",
    "suggestions",
    "categories"
  ]);
  for (const fieldName of ["schemaVersion", "currency", "source", "priceModes", "suggestions"]) {
    assert.equal(menuFile.fields.find((field) => field.name === fieldName).widget, "hidden", `${fieldName} must survive CMS saves without being operator-editable`);
  }
  assert.equal(JSON.stringify(config).includes("token"), false);
  assert.equal(JSON.stringify(config).includes("password"), false);
});

test("the admin loads one pinned CMS asset with integrity", async () => {
  const html = await readFile(resolve(root, "admin/index.html"), "utf8");
  assert.match(html, /decap-cms@3\.15\.1\/dist\/decap-cms\.js/);
  assert.match(html, /integrity="sha384-[A-Za-z0-9+/=]+"/);
  assert.doesNotMatch(html, /decap-cms@\^|decap-cms@latest/);
});
