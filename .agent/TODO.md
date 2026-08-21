# TODO

This file is the authoritative repository task list. Automated technical checks do
not complete externally owned launch decisions.

## Now

- [x] Finish the targeted PR #2 security port into Draft PR #1 and run the complete
  local validation suite without changing restaurant content.
- [x] Push the combined Draft PR #1 and require a successful final combined check.
- [x] Only after that check succeeds, activate a no-bypass `main` ruleset requiring
  pull requests, one fresh approval, resolved conversations and the combined check.
- [x] Comment on and close PR #2 as superseded after verifying every applicable
  security change exists in PR #1.
- [ ] Audit the external OAuth worker without recording credentials.
- [ ] Obtain operator approval for copy, legal/business facts, current menu/prices,
  opening hours and every photograph.
- [ ] Run the documented synthetic CMS PR and close it without merge; verify the
  restaurant editor cannot merge directly and `main`/Pages remain unchanged.

## Next

- [ ] Check the preview on representative physical iOS and Android devices.
- [ ] Add further food photography only when the operator supplies or approves it.

## Approved public launch only

- [ ] Configure the custom domain and DNS, then add the approved `CNAME`.
- [ ] Add canonical/`og:url` metadata, sitemap and public crawler policy for the
  confirmed domain.
- [ ] Remove `gate.js`, its HTML includes and preview CSS after release approval.

## Blocked

- [ ] PR #1 must remain Draft until prices, opening hours, photographs, operator
  approval, CMS login, the synthetic CMS PR and editor permissions are confirmed.
- [ ] Public domain cutover, indexability and gate removal are blocked on explicit
  operator launch approval.
- [ ] Production CMS verification depends on the external OAuth service.

## Recently completed

- [x] Simplify the order-helper call action and replace the Wan-Tan add-on prompt
  with the requested localized Bananen-Dessert suggestion.
- [x] Activate verified `main` ruleset `21067484` with an empty bypass list.
- [x] Close PR #2 as superseded while retaining its branch for audit history.
- [x] Pass 15 static/CMS tests, 70 Playwright tests, Lighthouse, dependency audit,
  release build, whitespace validation and Gitleaks on the combined branch.
- [x] Merge current `main` into PR #1 without losing its menu-introduction update.
- [x] Compare PR #1, PR #2 and current `main` per file.
- [x] Restore a food-first homepage and add the canonical menu/quality harness.
- [x] Build and deploy only a validated `dist/` artifact.
- [x] Prepare Decap Editorial Workflow and document its external boundaries.
