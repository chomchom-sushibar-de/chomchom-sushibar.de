# Current State

## Project goal

Maintain a fast bilingual website and preview for Chom Chom Sushibar, including
restaurant information, menu, contact, and a phone-order preparation helper.

## Current status

- Default branch: `main`; security workstream branch:
  `security/cms-editorial-pr-workflow`; verified base commit: `fec93d7`.
- The static DE/EN site, menu, order helper, preview gate, and Decap CMS settings
  editor are implemented.
- The Pages workflow for `fec93d7` completed successfully on 2026-08-13 and serves
  the repository preview at the organization GitHub Pages URL.
- On 2026-08-13, `chomchom-sushibar.de` resolved to a non-GitHub host and the Pages
  configuration had no custom domain. The new site is therefore not verified as
  production at the public domain.
- No open GitHub issues were found during this handoff.
- Decap is configured on the security branch for editorial workflow, squash
  merges and Open Authoring. The client is pinned to 3.15.1.
- The security branch adds a read-only pull-request check and removes manual
  Pages deployment. It does not change `data/site.json` or restaurant content.
- Remote audit on 2026-08-19 found no protection or ruleset on `main`. The only
  visible collaborator has admin/push rights, so direct pushes remain possible
  until an active no-bypass ruleset is configured.
- Draft PR #1 independently changes the CMS and Pages workflow and therefore
  needs explicit conflict resolution that preserves this security boundary.

## Working

- Static multi-page site with automatic/manual DE/EN selection and theme choice.
- The homepage presents the Google rating in the hero and a dedicated bilingual
  review section with a direct Google Maps link.
- All seven public pages show the linked footer credit `website made by
  itmitalles.de`.
- Menu cart stored in browser `localStorage`; completion produces a telephone-order
  summary rather than a server-side order.
- `data/site.json` supplies announcements and footer hours.
- Decap CMS is scoped to that settings file. On the security branch, normal
  saves use `cms/...` branches or Open-Authoring forks.
- GitHub Pages preview deployment succeeds.

## Active work

The CMS editorial security workstream is implemented on its branch and awaits review.
It is not complete operationally until its PR is merged, the `main` ruleset is
active, and a synthetic end-to-end CMS PR is closed without merge.

## Recently completed

- Added the responsive Google-rating and review presentation to the homepage.
- Improved responsive navigation behavior and accessibility state handling.
- Replaced the former plain agency mention with a linked site credit on every page.
- Added the menu selection and call-summary experience.
- Added the Decap CMS settings editor and external GitHub auth endpoint.
- Updated the preview presentation and responsive public pages.

## Known issues

- Operator approval of content, prices, hours, and photographs is not recorded.
- Menu prices were transcribed from November 2025 PDFs and may now be stale.
- The public domain has not been cut over to this GitHub Pages deployment.
- The client-side preview gate is only a visual barrier, not access control.
- The CMS depends on an external auth service whose runtime was not verified here.
- The standalone Decap Media Library attempts a direct publication-branch commit
  in the pinned version. Current CMS fields do not accept media; the `main`
  ruleset must block standalone uploads rather than granting a bypass.
- GitHub Pages is push-to-`main`; only branch rules can guarantee that such a push
  came from an approved pull request.

## Next recommended tasks

1. Review and merge the CMS security workstream without importing excluded
   menu/content changes.
2. Activate and verify a no-bypass `main` ruleset requiring one approval,
   resolved conversations and the `CMS editorial safety` check.
3. Audit the external OAuth worker, then perform the documented synthetic CMS
   PR test and close it without merge.
4. Obtain operator approval and validate menu/hours against current source material.

## Relevant files

- `404.html`, `aussenbereich.html`, `datenschutz.html`, `impressum.html`
- `index.html`, `kontakt.html`, `speisekarte.html`, `styles.css`
- `script.js`, `i18n.js`, `order.js`, `gate.js`
- `data/site.json`, `admin/config.yml`, `admin/index.html`
- `scripts/verify-cms-workflow.mjs`, `docs/CMS_WORKFLOW.md`
- `README.md`, `.github/workflows/cms-pr.yml`, `.github/workflows/pages.yml`

## Validation

- `for file in script.js i18n.js order.js gate.js; do node --check "$file"; done`
- `python3 -m json.tool data/site.json`
- `node scripts/verify-cms-workflow.mjs`
- `git diff --check`
- Browser review in DE/EN at representative mobile and desktop sizes

## Last handoff

2026-08-19: prepared the isolated CMS editorial/PR workflow, pinned Decap 3.15.1,
added PR safety checks, restricted Pages to pushes on `main`, and documented the
unprotected-branch, OAuth and standalone-media boundaries. No restaurant data was
changed.
