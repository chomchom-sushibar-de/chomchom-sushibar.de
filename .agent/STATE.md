# Current State

## Project goal

Maintain a fast bilingual static website and gated preview for Chom Chom Sushibar,
including restaurant information, a canonical menu and a local telephone-order
preparation helper.

## Current status

- Workstream branch: `agent/chomchom-quality-and-menu-model`; base commit:
  `fec93d7`.
- Draft pull request: `#1`,
  `https://github.com/chomchom-sushibar-de/chomchom-sushibar.de/pull/1`.
- The homepage is food-first again: an existing dish photo is the hero, all three
  existing food-photo cards immediately follow, and Google reviews are a compact
  secondary section below the restaurant ambience.
- `data/menu.v1.json` is the versioned source for menu HTML, Menu JSON-LD and the
  telephone helper. Migration checks preserve all 20 categories and 138 dishes
  from the pre-migration snapshot.
- `data/site.json` contains one normalized bilingual schedule. Browser views and
  Restaurant JSON-LD are derived from it without changing the verified values.
- The local order helper uses stable IDs and integer cents, migrates/normalizes old
  carts, enforces limits and provides an accessible telephone summary.
- Decap uses an editorial workflow and is scoped to site settings and menu data.
  Schema validation is the deployment boundary; the external auth runtime is not
  verified here.
- Pull-request CI and Pages deployment run reproducible Node/browser checks,
  Lighthouse budgets and a generated `dist/` build.
- The site remains `noindex`, has no `CNAME` or sitemap, and retains the client-side
  preview gate. The gate is presentation, not access control.

## Verified locally

- Static/schema/generator suite: 12/12 passing.
- Playwright: 70/70 passing in DE/EN at 320x568, 390x844, 412x915, 768x1024 and
  1440x900, including axe and visual baselines.
- Lighthouse three-run cold median: home performance 0.99, accessibility 0.98,
  best practices 1.00, LCP 1.95 s, worst-case CLS 0; menu performance 0.95,
  accessibility 0.98, best practices 1.00, LCP 2.78 s, worst-case CLS 0.
- Dependency audit: zero reported vulnerabilities at `high` threshold.

## Known external blockers

- Operator approval of public copy, business/legal facts, menu, current prices,
  hours and every photograph is not recorded.
- Menu content still documents the November 2025 source revision and may be stale.
- The public domain has not been cut over to this Pages deployment.
- Decap authentication has not been exercised against the production worker.
- Physical iOS/Android review has not been completed.

## Next recommended tasks

1. Review and merge the quality branch only after CI and operator review.
2. Verify current menu/prices, hours and photographs with the operator.
3. Only after explicit launch approval: configure domain/DNS, add canonical/crawler
   metadata and remove the preview gate.

## Relevant files

- `data/menu.v1.json`, `data/site.json`, `schemas/`
- `scripts/`, `package.json`, `playwright.config.mjs`, `tests/`
- `admin/config.yml`, `.github/workflows/`
- `index.html`, `speisekarte.html`, `order.js`, `script.js`, `styles.css`
- `docs/VERIFICATION_MATRIX.md`, `docs/MENU_DATA_MODEL.md`,
  `docs/RELEASE_CHECKLIST.md`, `docs/NICE_TO_HAVE.md`

## Last handoff

2026-08-13: completed and published the canonical data, CI/test and readiness
workstream as Draft PR #1; restored food as the homepage focus without changing
the established visual theme or adding new external imagery.
