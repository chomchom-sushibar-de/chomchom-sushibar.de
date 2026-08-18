# Decisions

## 2026-08-19 - CMS publication requires layered GitHub enforcement

**Decision:** Use Decap Editorial Workflow with Open Authoring for normal entry
saves, but treat a no-bypass `main` ruleset with required review and CI as the
authoritative publication control. Pages has no manual trigger and deploys only
after a push to `main`.

**Reason:** CMS configuration controls expected editor behavior but cannot remove
GitHub push rights. Decap 3.15.1 also sends standalone Media Library writes through
the direct media backend rather than the editorial entry path.

**Consequences:** Pin Decap 3.15.1, keep CMS scope at `data/site.json`, do not use
the standalone Media Library, and require GitHub to reject every direct `main`
write. The external OAuth worker and an unmerged synthetic CMS PR remain separate
operational verification boundaries.

## 2026-08-13 - Static site with phone-order assistance

**Decision:** Keep the public site static. The menu helper stores selections in the
browser and prepares a list for a telephone call; it does not place or pay for an
online order.

**Reason:** This supports the restaurant's existing telephone workflow without a
transaction backend.

**Consequences:** Do not describe the feature as online ordering, and keep prices
clearly subject to operator verification.

## 2026-08-11 - Narrow GitHub-backed CMS scope

**Decision:** Use Decap CMS only for `data/site.json` announcements and footer hours,
with GitHub as the content store and an external auth endpoint.

**Reason:** Routine small updates should not require editing page source.

**Consequences:** The public site stays static; CMS/auth availability is an external
operational dependency and credentials never belong in this repository.

## 2026-08-13 - Repository task authority

**Decision:** `.agent/TODO.md` is the only launch and maintenance task list.

**Reason:** The former root handoff and README checklist would otherwise compete.
