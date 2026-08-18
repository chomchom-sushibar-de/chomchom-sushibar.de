export const ALLOWED_CMS_PATHS = Object.freeze([
  "data/menu.v1.json",
  "data/site.json",
]);

export function isCmsPullRequest(headRef, labels, labelPrefix = "decap-cms/") {
  return headRef.startsWith("cms/")
    || labels.some((label) => label.startsWith(labelPrefix));
}

export function forbiddenCmsPaths(changedPaths) {
  return changedPaths.filter((path) => !ALLOWED_CMS_PATHS.includes(path));
}
