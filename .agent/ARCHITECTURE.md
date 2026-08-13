# Architecture

## Overview

The repository builds a static multi-page DE/EN restaurant preview for GitHub
Pages. There is no application server, database, order API or payment integration.

## Public components

- Root HTML pages: home, menu, outdoor area, contact, legal/privacy and 404.
- `styles.css`: established responsive/theme presentation and accessible states.
- `script.js`: theme/navigation plus validated announcement/hour projections.
- `i18n.js`: DE/EN DOM translation and persisted language preference.
- `order.js`: local stable-ID cart, suggestions, integer-cent totals and telephone
  summary.
- `gate.js`: temporary client-side preview presentation only.
- `404-base.js`: makes the Pages 404 work from nested paths.

## Canonical data and generation

- `data/menu.v1.json` + `schemas/menu.v1.schema.json`: canonical bilingual menu,
  stable IDs, availability and integer-cent prices.
- `scripts/generate-menu.mjs`: generates marked menu HTML, Menu JSON-LD and order
  data in `speisekarte.html`.
- `data/site.json` + `schemas/site.schema.json`: bilingual announcement and one
  normalized schedule.
- `scripts/generate-site.mjs`: keeps Restaurant JSON-LD hours synchronized.
- `script.js` projects the normalized schedule into hero, contact, footer and legal
  views without duplicating editable times.

## CMS boundary

`admin/` loads a pinned Decap client. Editorial changes target only the two JSON
data files. Schema/semantic checks and generators run in CI and before deployment.
The external GitHub-auth worker is operationally separate; no credentials are
stored here and the public site does not depend on CMS availability.

## Build, tests and deployment

- `package.json` and the lockfile define Node-based validation without converting
  the public site to an application framework.
- Static tests cover schemas, migration equality, generated roundtrips, HTML,
  assets, links and preview boundaries.
- Playwright covers five viewports in DE/EN, order/gate/navigation flows, axe and
  committed visual snapshots.
- Lighthouse checks home/menu budgets; `release:check` emits ignored machine
  reports and keeps external approvals marked blocked.
- `scripts/build-site.mjs` creates `dist/`; the Pages workflow uploads only that
  validated artifact from `main`.

## Persistence and privacy

Language, theme, cart and preview convenience state live in browser storage. The
telephone helper never submits selections or personal data. Public flows load only
same-origin assets; Google reviews are an explicit outbound link, not an embedded
runtime service.
