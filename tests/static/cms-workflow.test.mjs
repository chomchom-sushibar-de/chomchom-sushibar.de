import assert from "node:assert/strict";
import test from "node:test";
import {
  ALLOWED_CMS_PATHS,
  forbiddenCmsPaths,
  isCmsPullRequest,
} from "../../scripts/lib/cms-safety.mjs";

test("CMS allowlist contains only the canonical JSON sources", () => {
  assert.deepEqual(ALLOWED_CMS_PATHS, ["data/menu.v1.json", "data/site.json"]);
  assert.deepEqual(forbiddenCmsPaths(ALLOWED_CMS_PATHS), []);
});

test("CMS allowlist rejects code, workflows, markup, legal text and images", () => {
  const forbidden = [
    ".github/workflows/pages.yml",
    "script.js",
    "styles.css",
    "index.html",
    "datenschutz.html",
    "img/example.jpg",
  ];
  assert.deepEqual(forbiddenCmsPaths([...ALLOWED_CMS_PATHS, ...forbidden]), forbidden);
});

test("CMS pull requests are recognized by branch or configured label prefix", () => {
  assert.equal(isCmsPullRequest("cms/testentwurf", []), true);
  assert.equal(isCmsPullRequest("contributor/change", ["decap-cms/draft"]), true);
  assert.equal(isCmsPullRequest("agent/site-quality", ["documentation"]), false);
});
