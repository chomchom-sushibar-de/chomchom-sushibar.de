# Current State

## Project goal

Maintain a fast bilingual static website and gated preview for Chom Chom Sushibar,
including restaurant information, a canonical menu and a local telephone-order
preparation helper.

## Current status

- Default branch `main` at `3dda2a6` is integrated into
  `agent/chomchom-quality-and-menu-model`, the branch of Draft PR #1.
- Draft PR #1 is the single consolidation target for the website/menu/quality work
  and the applicable CMS security controls from Draft PR #2.
- PR #2 is closed as superseded with an audit comment linking to the combined PR;
  its branch remains available for comparison history.
- The current `main` menu introduction remains authoritative: its labeled
  information rows and removal of the decorative side artwork are preserved.
- `data/menu.v1.json` and `data/site.json` are the only CMS-managed sources.
  Generated HTML and `dist/` are build outputs, not CMS write targets.
- Decap 3.15.1 is pinned with SRI and configured for Editorial Workflow, Open
  Authoring, squash merges, the `decap-cms/` label prefix and no preview links.
- Pull-request CI combines schema/generator, browser, axe, visual, Lighthouse,
  dependency, CMS allowlist and Pages-boundary checks with read-only permissions.
- Pages has no PR or manual trigger and deploys only validated `dist/` after a push
  to `main`.
- The site remains `noindex`, has no `CNAME` or sitemap, and retains the client-side
  preview gate. It is not approved for public release.

## Verification status

- The combined branch passes 15 static/schema/generator/CMS tests and 70 Playwright
  tests across five viewports, including axe and all visual baselines.
- Lighthouse cold medians pass: home performance 0.99, accessibility 0.98, best
  practices 1.00 and LCP 1.95 s; menu performance 0.96, accessibility 0.98, best
  practices 1.00 and LCP 2.33 s; CLS is 0 for both.
- `npm audit --audit-level=high` reports zero vulnerabilities. Gitleaks 8.30.1
  reports no leaks in the complete repository history, `dist/` or the generated
  reports.
- `release:check` builds `dist/` with technical status `ready`; `git diff --check`
  is clean. GitHub run `32319631371` passed before ruleset activation and closure
  of PR #2; the final documentation-only head must pass the same check again.
- Active ruleset `Protect main with reviewed combined quality` (ID `21067484`)
  applies to `main` with no bypass actors. It requires a pull request, one fresh
  approval from someone other than the last pusher, resolved conversations and the
  up-to-date GitHub Actions check; branch deletion and force-pushes are blocked.
- GitHub Actions run `32319631371` passed `Combined quality and CMS safety` on the
  published combined head before ruleset activation.

## External blockers

- Current prices, dishes, opening hours, photographs and all public copy still need
  explicit operator confirmation.
- CMS login and the external OAuth worker have not been operationally audited.
- A synthetic CMS PR using `TESTENTWURF - NICHT VERÖFFENTLICHEN` has not been
  created and closed; the restaurant editor's inability to merge directly is not
  yet proven.
- Physical-device review and public-domain cutover remain unapproved.
- The standalone Decap Media Library is outside Editorial Workflow in the pinned
  version and must remain blocked by the no-bypass `main` ruleset.

## Next recommended tasks

1. Keep the combined PR #1 in Draft and verify its final documentation-only head.
2. Audit the OAuth worker, obtain operator approvals and run the unmerged synthetic
   CMS acceptance test.
3. Keep PR #1 in Draft until every onsite gate is confirmed.

## Relevant files

- `admin/config.yml`, `admin/index.html`, `docs/CMS_WORKFLOW.md`
- `.github/workflows/quality.yml`, `.github/workflows/pages.yml`
- `scripts/verify-cms-workflow.mjs`, `scripts/build-site.mjs`
- `data/menu.v1.json`, `data/site.json`, `schemas/`, `tests/`
- `README.md`, `.agent/DECISIONS.md`, `.agent/ARCHITECTURE.md`

## Last handoff

2026-08-20: published the combined Draft PR #1, passed its fresh combined Actions
run, activated no-bypass ruleset `21067484`, and closed PR #2 as superseded. No
merge, Pages deployment, domain change or public release was performed.
