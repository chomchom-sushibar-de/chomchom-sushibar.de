# TODO

This file is the authoritative repository task list. `README.md` links here rather
than maintaining a competing launch checklist.

## Now

- [ ] Review and merge Draft PR #2
  (`security/cms-editorial-pr-workflow`), resolving its overlap with Draft PR #1
  without broadening CMS scope or losing safeguards.
- [ ] After the check has run on GitHub, activate a no-bypass ruleset for `main`
  requiring a pull request, one approval, fresh approval after changes, resolved
  conversations, and `CMS editorial safety`.
- [ ] Audit the external OAuth worker's source/deployment, OAuth scopes, callback,
  origins, token handling and logging without recording credentials.
- [ ] Run the synthetic CMS PR acceptance test from `docs/CMS_WORKFLOW.md`; close
  the PR without merging and verify that `main` and Pages did not change.
- [ ] Obtain operator approval for content, menu, hours, and photographs.
- [ ] Compare current in-restaurant prices and dishes with the November 2025 menu
  source before public launch.

## Next

- [ ] Add approved current restaurant/food photography where needed.
- [ ] After approval, add the custom domain in Pages, create `CNAME`, and update DNS
  for `chomchom-sushibar.de`.
- [ ] Remove `gate.js`, its includes, and preview-gate CSS after public-release approval.

## Later

- [ ] Periodically revalidate hours, menu prices, and external CMS editing.

## Blocked

- [ ] Public domain cutover and preview-gate removal are blocked on operator approval.

## Recently completed

- [x] Prepare Decap Editorial Workflow and Open Authoring on an isolated branch.
- [x] Add read-only CMS PR checks and remove manual Pages deployment.
- [x] Document authentication, permission, branching, PR, review, merge, Pages,
  media and ruleset boundaries without secrets or personal email addresses.
- [x] Add a prominent, bilingual Google-review presentation to the homepage.
- [x] Link `website made by itmitalles.de` from every public-page footer.
- [x] Contact the operator and prepare a reviewable draft.
- [x] Deploy a successful GitHub Pages preview.
- [x] Replace the old root handoff with `.agent/` state and tasks.
