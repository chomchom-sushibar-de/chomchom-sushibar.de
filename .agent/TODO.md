# TODO

This file is the authoritative repository task list. Automated technical checks do
not complete externally owned launch decisions.

## Now

- [ ] Obtain operator approval for public copy, business/legal facts, menu, hours
  and every photograph.
- [ ] Compare current in-restaurant dishes and prices with the documented November
  2025 source revision.
- [ ] Review the generated and visual diffs in Draft PR #1 before merge.

## Next

- [ ] Exercise Decap authentication and one complete editorial pull request against
  the production auth service.
- [ ] Check the preview on representative physical iOS and Android devices.
- [ ] Add further food photography only when the operator supplies or approves it.

## Approved public launch only

- [ ] Configure the custom domain and DNS, then add the approved `CNAME`.
- [ ] Add canonical/`og:url` metadata, sitemap and public crawler policy for the
  confirmed domain.
- [ ] Remove `gate.js`, its HTML includes and preview CSS after release approval.

## Blocked

- [ ] Public domain cutover, indexability and gate removal are blocked on explicit
  operator launch approval.
- [ ] Production CMS runtime verification depends on the external auth service.

## Recently completed

- [x] Restore a food-first homepage and demote the large review-card presentation.
- [x] Introduce the canonical bilingual menu model without changing menu content.
- [x] Generate menu HTML, order data and JSON-LD from one validated source.
- [x] Normalize site hours and derive browser views plus Restaurant JSON-LD.
- [x] Harden the local telephone helper and its accessibility behavior.
- [x] Extend Decap to menu availability with editorial/schema safeguards.
- [x] Add static, browser, axe, visual, Lighthouse and readiness automation.
- [x] Build and deploy only a validated `dist/` artifact.
- [x] Push the workstream and open Draft PR #1 with required quality CI.
