# Architecture

## Overview

The repository is a static multi-page DE/EN restaurant site hosted through GitHub
Pages. There is no application server, order API, database, or payment integration.

## Components

- Root HTML pages: home, menu, outdoor area, contact, legal/privacy, and 404.
- `styles.css`: shared responsive and theme styling.
- `script.js`: navigation/theme plus announcement and hours loading.
- `i18n.js`: DE/EN state and DOM translation.
- `order.js`: local cart, suggestions, totals, and phone-call summary.
- `gate.js`: temporary preview presentation only.
- `data/site.json`: small editable content source.
- `admin/`: pinned Decap CMS UI/config for the settings file; normal saves use
  Editorial Workflow branches or Open-Authoring forks.

## Data flow and persistence

The browser loads static files and fetches `data/site.json`. Language, theme, cart,
and preview convenience state are stored in `localStorage`. No selection is sent to
an application backend; the user completes the flow by calling the restaurant.

Decap CMS authenticates through an unverified external service and proposes
settings changes through GitHub pull requests. A GitHub ruleset, not the OAuth
worker or CMS UI, is the authoritative review/direct-push boundary. The standalone
Media Library is outside the editorial entry path and must be blocked by that
ruleset.

## Deployment

`.github/workflows/cms-pr.yml` validates CMS configuration, managed data shape,
JavaScript syntax, PR diff whitespace and the deployment boundary with read-only
permissions. `.github/workflows/pages.yml` has no PR or manual trigger and uploads
the repository root only after a push to `main`. A required no-bypass ruleset is
needed to make every such push an approved merge. The preview is live on the
organization Pages URL; the custom restaurant domain is not yet configured.

## Testing

Use `scripts/verify-cms-workflow.mjs`, JavaScript syntax checks, JSON validation,
link/asset checks, DE/EN browser review, and focused tests of cart persistence and
telephone-summary behavior.
