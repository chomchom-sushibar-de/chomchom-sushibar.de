# Decisions

## 2026-08-13 - Improvements preserve the established website theme

**Decision:** Treat optimization work as non-redesign work. Keep the Chom Chom
visual language and content structure unless a change is explicitly requested.
The homepage request is implemented by content ordering and existing imagery, not
by replacing the theme.

**Reason:** The restaurant identity and subject matter must remain recognizable;
technical quality work does not authorize a new design direction.

## 2026-08-13 - Canonical generated content

**Decision:** Use `data/menu.v1.json` as the source for menu HTML, order-helper data
and Menu JSON-LD. Use one normalized schedule in `data/site.json` for all visible
hours and Restaurant JSON-LD.

**Reason:** Duplicated menu and hour values could drift across HTML, scripts, CMS
and structured data.

**Consequences:** Schema and semantic validation run before generation/deployment.
Menu prices remain integer cents. Operator-authorized data changes go through an
editorial pull request and regenerate the static artifact.

## 2026-08-13 - Generated Pages artifact and explicit readiness split

**Decision:** Pages publishes only `dist/` after tests, browser checks and
Lighthouse budgets. Each page uses three cache/storage-reset samples with a
deterministic German, light-theme preview state. Performance and LCP use the median;
accessibility, best practices, CLS and transfer size retain conservative worst-case
gates. Automated readiness records technical results separately from external
approvals.

**Reason:** A technically valid preview must not imply operator approval, domain
readiness or production CMS verification. A fixed initial language avoids measuring
a synthetic German-to-English layout shift, while multiple cold samples avoid a
noisy single CI measurement.

## 2026-08-13 - Canonical generated content and deterministic quality gate

**Decision:** Keep the delivered site framework-free and static, while using
versioned JSON sources, schemas, deterministic generators, and a Node/Playwright CI
harness during development and deployment.

**Reason:** Menu data, order-helper data, visible HTML, and structured metadata must
not drift, and future edits must fail before deployment when they violate content,
language, money, link, accessibility, or preview invariants.

**Consequences:** `data/menu.v1.json` is the menu authority; `data/site.json` is the
announcement/opening-hours authority. Generated HTML is committed for Pages
resilience, regenerated in CI, and only an allowlisted `dist/` is deployed.

## 2026-08-13 - Preserve migration evidence without freezing future menu updates

**Decision:** Keep an immutable structural snapshot of the pre-migration menu and
require exact equality while the canonical content version matches it. Always
roundtrip generated consumers against the current canonical model.

**Reason:** The initial migration needs auditable proof of zero dish/price/text
drift, while later operator-authorized menu revisions must remain possible.

**Consequences:** Ordinary updates increment `contentVersion`; the migration
fixture is never regenerated merely to make a new menu pass.

## 2026-08-13 - Structured CMS editing with an external auth boundary

**Decision:** Decap uses the editorial workflow for announcements, a normalized
opening-hours schedule, menu entries, and availability. Integrity metadata and
generator configuration remain hidden, and CI is the authoritative validation
boundary.

**Reason:** Operators need controlled content updates without free-form HTML or
repository credentials, while the public static site must not depend on CMS uptime.

**Consequences:** The external authentication runtime remains explicitly unverified
until a real editorial PR is tested; no token or worker configuration belongs here.

## 2026-08-13 - Static site with phone-order assistance

**Decision:** Keep the public site static. The menu helper stores selections in the
browser and prepares a list for a telephone call; it does not place or pay for an
online order.

**Reason:** This supports the restaurant's existing telephone workflow without a
transaction backend.

**Consequences:** Do not describe the feature as online ordering, and keep prices
clearly subject to operator verification.

## 2026-08-11 - Narrow GitHub-backed CMS boundary

**Decision:** Use Decap CMS for validated `data/site.json` settings and the canonical
menu/availability model, with GitHub as the content store and an external auth
endpoint.

**Reason:** Routine small updates should not require editing page source.

**Consequences:** The public site stays static; edits use the editorial workflow;
CMS/auth availability is an external operational dependency and credentials never
belong in this repository.

## 2026-08-13 - Repository task authority

**Decision:** `.agent/TODO.md` is the only launch and maintenance task list.

**Reason:** The former root handoff and README checklist would otherwise compete.
