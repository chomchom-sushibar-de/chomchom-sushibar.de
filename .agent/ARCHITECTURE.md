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
- `admin/`: Decap CMS UI/config for the settings file.

## Data flow and persistence

The browser loads static files and fetches `data/site.json`. Language, theme, cart,
and preview convenience state are stored in `localStorage`. No selection is sent to
an application backend; the user completes the flow by calling the restaurant.

Decap CMS authenticates through an external service and writes approved settings
changes back to GitHub. Git history is the persistence layer for CMS-managed data.

## Deployment

`.github/workflows/pages.yml` uploads the repository root from `main`. The preview
is live on the organization Pages URL; the custom restaurant domain is not yet
configured for this deployment as of the last handoff.

## Testing

Use JavaScript syntax checks, JSON validation, link/asset checks, DE/EN browser
review, and focused tests of cart persistence and telephone-summary behavior.
