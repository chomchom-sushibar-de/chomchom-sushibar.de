# Current State

## Project goal

Maintain a fast bilingual website and preview for Chom Chom Sushibar, including
restaurant information, menu, contact, and a phone-order preparation helper.

## Current status

- Default branch: `main`; inspected base commit: `235c522`.
- The static DE/EN site, menu, order helper, preview gate, and Decap CMS settings
  editor are implemented.
- The Pages workflow for `235c522` completed successfully on 2026-08-13 and serves
  the repository preview at the organization GitHub Pages URL.
- On 2026-08-13, `chomchom-sushibar.de` resolved to a non-GitHub host and the Pages
  configuration had no custom domain. The new site is therefore not verified as
  production at the public domain.
- No open GitHub issues were found during this handoff.

## Working

- Static multi-page site with automatic/manual DE/EN selection and theme choice.
- The homepage presents the Google rating in the hero and a dedicated bilingual
  review section with a direct Google Maps link.
- All seven public pages show the linked footer credit `website made by
  itmitalles.de`.
- Menu cart stored in browser `localStorage`; completion produces a telephone-order
  summary rather than a server-side order.
- `data/site.json` supplies announcements and footer hours.
- Decap CMS is configured to edit that settings file through GitHub.
- GitHub Pages preview deployment succeeds.

## Active work

No implementation workstream is recorded. The project remains a gated preview
pending operator approval and domain cutover.

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

## Next recommended tasks

1. Obtain operator approval and validate menu/hours against current source material.
2. After approval, configure the custom domain and DNS for GitHub Pages.
3. Remove the preview gate as part of the approved public launch.

## Relevant files

- `404.html`, `aussenbereich.html`, `datenschutz.html`, `impressum.html`
- `index.html`, `kontakt.html`, `speisekarte.html`, `styles.css`
- `script.js`, `i18n.js`, `order.js`, `gate.js`
- `data/site.json`, `admin/config.yml`, `admin/index.html`
- `README.md`, `.github/workflows/pages.yml`

## Validation

- `for file in script.js i18n.js order.js gate.js; do node --check "$file"; done`
- `python3 -m json.tool data/site.json`
- `git diff --check`
- Browser review in DE/EN at representative mobile and desktop sizes

## Last handoff

2026-08-13: added the Google-review presentation, responsive navigation fixes, and
the linked `itmitalles.de` footer credit on all public pages; migrated the finished
work from the conflicting legacy `TODO.md` into this handoff.
