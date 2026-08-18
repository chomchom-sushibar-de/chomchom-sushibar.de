import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const configPath = "admin/config.yml";
const adminIndexPath = "admin/index.html";
const siteDataPath = "data/site.json";
const pagesWorkflowPath = ".github/workflows/pages.yml";

const [config, adminIndex, siteDataSource, pagesWorkflow] = await Promise.all([
  readFile(configPath, "utf8"),
  readFile(adminIndexPath, "utf8"),
  readFile(siteDataPath, "utf8"),
  readFile(pagesWorkflowPath, "utf8"),
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function requireScalar(source, key, value, scope) {
  const keyPattern = new RegExp(`^[ \\t]*${escapeRegExp(key)}:`, "gm");
  assert.equal(
    [...source.matchAll(keyPattern)].length,
    1,
    `${scope} must contain ${key} exactly once`,
  );
  const pattern = new RegExp(
    `^[ \\t]*${escapeRegExp(key)}:[ \\t]*["']?${escapeRegExp(value)}["']?[ \\t]*(?:#.*)?$`,
    "m",
  );
  assert.match(source, pattern, `${scope} must set ${key} to ${value}`);
}

function requireTopLevelScalar(source, key, value) {
  const keyPattern = new RegExp(`^${escapeRegExp(key)}:`, "gm");
  assert.equal(
    [...source.matchAll(keyPattern)].length,
    1,
    `config must contain top-level ${key} exactly once`,
  );
  const pattern = new RegExp(
    `^${escapeRegExp(key)}:[ \\t]*["']?${escapeRegExp(value)}["']?[ \\t]*(?:#.*)?$`,
    "m",
  );
  assert.match(source, pattern, `config must set top-level ${key} to ${value}`);
}

function topLevelBlock(source, key) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => line === `${key}:`);
  assert.notEqual(start, -1, `Missing top-level ${key} block`);

  const block = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line && !/^\s/.test(line)) break;
    block.push(line);
  }
  return block.join("\n");
}

const backend = topLevelBlock(config, "backend");
requireScalar(backend, "name", "github", "backend");
requireScalar(
  backend,
  "repo",
  "chomchom-sushibar-de/chomchom-sushibar.de",
  "backend",
);
requireScalar(backend, "branch", "main", "backend");
requireScalar(
  backend,
  "base_url",
  "https://chomchom-cms-auth.chomchom-cms-auth.workers.dev",
  "backend",
);
requireScalar(backend, "auth_endpoint", "auth", "backend");
requireScalar(backend, "squash_merges", "true", "backend");
requireScalar(backend, "open_authoring", "true", "backend");
requireScalar(backend, "cms_label_prefix", "decap-cms/", "backend");

requireTopLevelScalar(config, "publish_mode", "editorial_workflow");
requireTopLevelScalar(config, "show_preview_links", "false");
requireTopLevelScalar(config, "media_folder", "img");
requireTopLevelScalar(config, "public_folder", "img");

const managedFiles = [
  ...config.matchAll(/^[ \t]+file:[ \t]*["']?([^"'\s#]+)["']?[ \t]*$/gm),
].map((match) => match[1]);
assert.deepEqual(
  managedFiles,
  [siteDataPath],
  "Decap CMS must remain scoped to data/site.json",
);
assert.doesNotMatch(
  config,
  /^[ \t]+folder:[ \t]*/m,
  "Decap CMS must not expose a folder collection",
);

assert.match(
  adminIndex,
  /src="https:\/\/unpkg\.com\/decap-cms@3\.15\.1\/dist\/decap-cms\.js"/,
  "admin/index.html must load the reviewed Decap CMS 3.15.1 release",
);
assert.doesNotMatch(
  adminIndex,
  /decap-cms@\^/,
  "admin/index.html must not load a floating Decap CMS version range",
);

const siteData = JSON.parse(siteDataSource);
assert.deepEqual(
  Object.keys(siteData).sort(),
  ["announcement", "hours"],
  "data/site.json must contain only announcement and hours",
);
assert.equal(typeof siteData.announcement, "string", "announcement must be a string");
assert.equal(
  siteData.hours && typeof siteData.hours === "object" && !Array.isArray(siteData.hours),
  true,
  "hours must be an object",
);

const expectedHourFields = [
  "footer_line1",
  "footer_line2",
  "footer_line3",
  "footer_line4",
];
assert.deepEqual(
  Object.keys(siteData.hours).sort(),
  expectedHourFields,
  "hours must keep the four approved footer fields",
);
for (const field of expectedHourFields) {
  assert.equal(typeof siteData.hours[field], "string", `${field} must be a string`);
  assert.notEqual(siteData.hours[field].trim(), "", `${field} must not be empty`);
}

assert.match(
  pagesWorkflow,
  /^on:\s*\n\s{2}push:\s*\n\s{4}branches:\s*\[main\]\s*$/m,
  "Pages must trigger on pushes to main",
);
assert.doesNotMatch(
  pagesWorkflow,
  /^\s*workflow_dispatch\s*:/m,
  "Pages must not support manual deployment",
);
assert.doesNotMatch(
  pagesWorkflow,
  /^\s*pull_request(?:_target)?\s*:/m,
  "Pages must not deploy pull requests",
);
assert.match(
  pagesWorkflow,
  /uses:\s*actions\/deploy-pages@v4/,
  "Pages must use the Pages deployment action",
);

console.log("CMS editorial workflow, content shape, and Pages boundary are valid.");
