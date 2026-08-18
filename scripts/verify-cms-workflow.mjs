import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import {
  ALLOWED_CMS_PATHS,
  forbiddenCmsPaths,
  isCmsPullRequest,
} from "./lib/cms-safety.mjs";
import { validateMenu, validateSite } from "./lib/validate-data.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const paths = {
  config: "admin/config.yml",
  adminIndex: "admin/index.html",
  menu: "data/menu.v1.json",
  site: "data/site.json",
  pagesWorkflow: ".github/workflows/pages.yml",
  qualityWorkflow: ".github/workflows/quality.yml",
  duplicateCmsWorkflow: ".github/workflows/cms-pr.yml",
};
const allowedCmsPaths = ALLOWED_CMS_PATHS;

const [configSource, adminIndex, pagesSource, qualitySource] = await Promise.all([
  readFile(resolve(root, paths.config), "utf8"),
  readFile(resolve(root, paths.adminIndex), "utf8"),
  readFile(resolve(root, paths.pagesWorkflow), "utf8"),
  readFile(resolve(root, paths.qualityWorkflow), "utf8"),
]);
const config = YAML.parse(configSource);
const pages = YAML.parse(pagesSource);
const quality = YAML.parse(qualitySource);

assert.deepEqual(
  {
    name: config.backend?.name,
    repo: config.backend?.repo,
    branch: config.backend?.branch,
    baseUrl: config.backend?.base_url,
    authEndpoint: config.backend?.auth_endpoint,
    squashMerges: config.backend?.squash_merges,
    openAuthoring: config.backend?.open_authoring,
    labelPrefix: config.backend?.cms_label_prefix,
    publishMode: config.publish_mode,
    previewLinks: config.show_preview_links,
  },
  {
    name: "github",
    repo: "chomchom-sushibar-de/chomchom-sushibar.de",
    branch: "main",
    baseUrl: "https://chomchom-cms-auth.chomchom-cms-auth.workers.dev",
    authEndpoint: "auth",
    squashMerges: true,
    openAuthoring: true,
    labelPrefix: "decap-cms/",
    publishMode: "editorial_workflow",
    previewLinks: false,
  },
  "Decap must use the reviewed GitHub editorial/Open-Authoring settings",
);
assert.equal(config.media_folder, "img", "media_folder must remain img");
assert.equal(config.public_folder, "img", "public_folder must remain img");

const managedFiles = (config.collections ?? [])
  .flatMap((collection) => collection.files ?? [])
  .map((entry) => entry.file)
  .sort();
assert.deepEqual(
  managedFiles,
  [...allowedCmsPaths].sort(),
  "CMS collections must be allowlisted to the two canonical JSON sources",
);
assert.equal(
  (config.collections ?? []).some((collection) => "folder" in collection),
  false,
  "CMS must not expose a folder collection",
);

assert.match(
  adminIndex,
  /src="https:\/\/unpkg\.com\/decap-cms@3\.15\.1\/dist\/decap-cms\.js"/,
  "admin/index.html must load exactly Decap CMS 3.15.1",
);
assert.doesNotMatch(
  adminIndex,
  /decap-cms@(?:\^|~|latest)/,
  "admin/index.html must not use a floating Decap version",
);
assert.match(adminIndex, /integrity="sha384-[^"]+"/, "the pinned Decap script must retain SRI");
assert.match(adminIndex, /crossorigin="anonymous"/, "the pinned Decap script must use anonymous CORS for SRI");

await Promise.all([validateMenu(root), validateSite(root)]);

assert.deepEqual(Object.keys(pages.on ?? {}), ["push"], "Pages must only have a push trigger");
assert.deepEqual(pages.on.push?.branches, ["main"], "Pages must only run for main pushes");
assert.equal("pull_request" in (pages.on ?? {}), false, "Pages must not deploy pull requests");
assert.equal("workflow_dispatch" in (pages.on ?? {}), false, "Pages must not support manual production runs");
const pagesSteps = pages.jobs?.deploy?.steps ?? [];
const pagesArtifact = pagesSteps.find((step) => String(step.uses ?? "").startsWith("actions/upload-pages-artifact@"));
assert.equal(pagesArtifact?.with?.path, "dist", "Pages must upload only the validated dist artifact");
assert.equal(
  pagesSteps.some((step) => String(step.uses ?? "").startsWith("actions/deploy-pages@")),
  true,
  "Pages must retain the deployment step",
);

assert.equal("pull_request_target" in (quality.on ?? {}), false, "PR checks must not use pull_request_target");
assert.deepEqual(quality.on?.pull_request?.branches, ["main"], "quality checks must target main pull requests");
assert.deepEqual(quality.permissions, { contents: "read" }, "PR workflow permissions must remain read-only");
const combinedJob = quality.jobs?.verify;
assert.equal(combinedJob?.name, "Combined quality and CMS safety", "the required check name must remain stable");
const combinedRuns = (combinedJob?.steps ?? []).map((step) => step.run ?? "").join("\n");
assert.match(combinedRuns, /node scripts\/verify-cms-workflow\.mjs/, "combined check must validate CMS safety");
assert.match(combinedRuns, /npm audit --audit-level=high/, "combined check must audit dependencies");
assert.match(combinedRuns, /npm run release:check/, "combined check must run the complete release suite");
assert.match(combinedRuns, /git diff --check/, "combined check must reject malformed PR diffs");
assert.doesNotMatch(qualitySource, /actions\/deploy-pages@/, "PR checks must never deploy Pages");

let duplicateCmsWorkflowExists = true;
try {
  await access(resolve(root, paths.duplicateCmsWorkflow));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  duplicateCmsWorkflowExists = false;
}
assert.equal(duplicateCmsWorkflowExists, false, "CMS safety must stay in the combined check, not a duplicate workflow");

const baseSha = process.env.BASE_SHA?.trim();
const headSha = process.env.HEAD_SHA?.trim();
const headRef = process.env.PR_HEAD_REF?.trim() ?? "";
const labels = (process.env.PR_LABELS ?? "").split(",").map((label) => label.trim()).filter(Boolean);
const cmsPullRequest = isCmsPullRequest(headRef, labels, config.backend.cms_label_prefix);

if (cmsPullRequest) {
  assert.ok(baseSha && headSha, "CMS pull requests require BASE_SHA and HEAD_SHA for path validation");
  const changedPaths = execFileSync(
    "git",
    ["diff", "--name-only", `${baseSha}...${headSha}`],
    { cwd: root, encoding: "utf8" },
  ).trim().split(/\r?\n/).filter(Boolean);
  assert.ok(changedPaths.length > 0, "CMS pull request must contain an allowlisted data change");
  const forbiddenPaths = forbiddenCmsPaths(changedPaths);
  assert.deepEqual(
    forbiddenPaths,
    [],
    `CMS pull requests may only change ${allowedCmsPaths.join(" and ")}`,
  );
}

console.log(
  `CMS editorial settings, ${allowedCmsPaths.length}-path allowlist, canonical data and Pages boundary are valid${cmsPullRequest ? " for this CMS pull request" : ""}.`,
);
