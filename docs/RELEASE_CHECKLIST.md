# Release checklist

The preview must not be described as publicly released until every external item
below is confirmed. The browser PIN is presentation only, not access control.

## Technical checks

- [ ] `npm ci` completes from the committed lockfile.
- [ ] `npm audit --audit-level=high` reports no blocking vulnerability.
- [ ] `npm test` passes static, roundtrip, browser, accessibility and visual tests.
- [ ] `npm run lighthouse` passes the committed budgets.
- [ ] `npm run build` creates a self-contained `dist/` artifact.
- [ ] `npm run release:check` reports `technical.status` as `ready`.
- [ ] The preview gate and `noindex` controls remain present.
- [ ] No `CNAME`, sitemap, canonical domain or guessed `og:url` is present.
- [ ] The Pages and pull-request quality workflows are green.

## External approval — currently blocked

- [ ] The operator approves all public copy, legal/business facts and phone details.
- [ ] The operator verifies every dish and price against the current in-restaurant menu.
- [ ] The operator verifies opening hours, including holidays.
- [ ] The operator approves every published photograph.
- [ ] Decap login, editorial PR creation and save behavior are verified in production.
- [ ] Representative physical iOS and Android devices are checked.
- [ ] The custom domain and DNS change are explicitly approved.

## Approved public launch only

- [ ] Configure the custom domain and DNS.
- [ ] Add the approved `CNAME`.
- [ ] Add canonical/`og:url` metadata and a sitemap for the real domain.
- [ ] Change robots/indexing controls from preview to public policy.
- [ ] Remove `gate.js`, its HTML includes and the preview-gate CSS.
- [ ] Re-run the complete technical suite and verify the public URL.
