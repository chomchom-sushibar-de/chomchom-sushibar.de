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

- The pre-consolidation PR #1 baseline passed 12 static tests, 70 Playwright tests,
  Lighthouse budgets and a high-severity dependency audit.
- The combined branch still requires the complete local suite and a successful
  final GitHub check before ruleset activation or closure of PR #2.
- On 2026-08-20 GitHub reported no branch protection and no repository ruleset for
  `main`; direct pushes therefore remain possible until the planned ruleset exists.

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

1. Finish and verify the combined Draft PR #1 without content drift.
2. After its final combined check passes, activate the no-bypass `main` ruleset and
   close PR #2 as superseded.
3. Audit the OAuth worker, obtain operator approvals and run the unmerged synthetic
   CMS acceptance test.
4. Keep PR #1 in Draft until every onsite gate is confirmed.

## Relevant files

- `admin/config.yml`, `admin/index.html`, `docs/CMS_WORKFLOW.md`
- `.github/workflows/quality.yml`, `.github/workflows/pages.yml`
- `scripts/verify-cms-workflow.mjs`, `scripts/build-site.mjs`
- `data/menu.v1.json`, `data/site.json`, `schemas/`, `tests/`
- `README.md`, `.agent/DECISIONS.md`, `.agent/ARCHITECTURE.md`

## Last handoff

2026-08-20: integrated current `main` into Draft PR #1 locally and began the
targeted PR #2 security port. No remote branch or pull request has been changed yet.
