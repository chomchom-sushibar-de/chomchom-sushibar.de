import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function formatErrors(errors = []) {
  return errors.map((error) => `${error.instancePath || "/"} ${error.message}`).join("\n");
}

export async function validateJsonFile(root, dataFile, schemaFile) {
  const [data, schema] = await Promise.all([
    readJson(resolve(root, dataFile)),
    readJson(resolve(root, schemaFile))
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  if (!validate(data)) {
    throw new Error(`${dataFile} does not match ${schemaFile}:\n${formatErrors(validate.errors)}`);
  }
  return data;
}

function assertUnique(values, label) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

function assertOrdered(values, label) {
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] !== index + 1) {
      throw new Error(`${label} must be contiguous and match array order (expected ${index + 1}, got ${values[index]}).`);
    }
  }
}

export async function validateMenu(root) {
  const menu = await validateJsonFile(root, "data/menu.v1.json", "schemas/menu.v1.schema.json");
  const categoryIds = menu.categories.map((category) => category.id);
  const items = menu.categories.flatMap((category) => category.items.map((item) => ({ ...item, categoryId: category.id })));
  assertUnique(categoryIds, "category id");
  assertOrdered(menu.categories.map((category) => category.sort), "Category sort values");
  assertUnique(items.map((item) => item.id), "item id");
  assertUnique(items.map((item) => item.visibleNumber), "visible menu number");

  for (const category of menu.categories) {
    assertOrdered(category.items.map((item) => item.sort), `Item sort values in ${category.id}`);
    if (Boolean(category.note) !== Boolean(category.notePosition)) {
      throw new Error(`Category ${category.id} must define note and notePosition together.`);
    }
    for (const item of category.items) {
      if (item.prices.eveningPrefix && !item.prices.eveningCents) {
        throw new Error(`Item ${item.id} has an eveningPrefix without eveningCents.`);
      }
    }
  }

  const knownIds = new Set(items.map((item) => item.id));
  for (const [group, ids] of Object.entries(menu.suggestions)) {
    for (const id of ids) {
      if (!knownIds.has(id)) throw new Error(`Suggestion ${group} references missing item id ${id}.`);
    }
  }

  for (const source of menu.source.files) {
    const bytes = await readFile(resolve(root, source.path));
    const actual = createHash("sha256").update(bytes).digest("hex");
    if (actual !== source.sha256) {
      throw new Error(`Source checksum mismatch for ${source.path}: expected ${source.sha256}, got ${actual}.`);
    }
  }

  return menu;
}

export async function validateSite(root) {
  const site = await validateJsonFile(root, "data/site.json", "schemas/site.schema.json");
  const openGroups = [site.hours.weekday, site.hours.sundayHolidays];
  const allDays = openGroups.flatMap((group) => group.schemaDays);
  assertUnique(allDays, "opening-hours schema day");

  const minutes = (value) => {
    const [hour, minute] = value.split(":").map(Number);
    return hour * 60 + minute;
  };
  for (const group of openGroups) {
    let previousClose = -1;
    for (const period of group.periods) {
      const opens = minutes(period.opens);
      const closes = minutes(period.closes);
      if (opens >= closes) throw new Error(`Opening-hours period ${period.opens}–${period.closes} must close after it opens.`);
      if (opens < previousClose) throw new Error(`Opening-hours periods must be ordered and may not overlap.`);
      previousClose = closes;
    }
  }
  return site;
}
