# Verification matrix

The public site remains a static, gated DE/EN preview. Automated checks verify
technical behavior; they do not replace operator approval or real-device review.

| Area | Automated evidence | Scope |
| --- | --- | --- |
| Canonical content | `npm run menu:check`, static schema and roundtrip tests | 20 categories, 138 dishes, IDs, visible numbers, order, DE/EN text, tags and integer-cent prices |
| Source integrity | `tests/static/data.test.mjs` | JSON Schema, semantic invariants, PDF hashes, unique IDs/numbers and valid suggestions |
| Site settings | Schema, semantic and generator checks | Announcement and one normalized schedule drive all visible hours and Restaurant JSON-LD; invalid/overlapping periods fail |
| Generated consumers | `tests/static/menu-roundtrip.test.mjs` | Menu HTML, telephone helper data and Menu JSON-LD stay aligned |
| HTML and assets | `tests/static/html.test.mjs` | Parsing, headings, IDs, internal links/fragments, local assets, image dimensions/loading and link relationships |
| Preview boundary | Static and gate E2E tests | `noindex`, restrictive robots file, no sitemap/CNAME, preview gate persistence and keyboard focus |
| Language and theme | `tests/e2e/site.spec.mjs` | DE/EN switch, translated announcement/hours and language/theme persistence |
| Responsive navigation | `tests/e2e/site.spec.mjs` | Narrow mobile, iPhone-like, Android-like, tablet and desktop viewports; open, focus order and Escape |
| Telephone helper | `tests/e2e/order.spec.mjs` | Integer-cent day/evening totals, legacy/corrupt/stale carts, quantity limits, stable IDs, suggestions and phone summary |
| Modal accessibility | Order and axe E2E tests | Initial/return focus, focus trap, Escape, inert background, labels and live updates on language changes |
| Accessibility | `tests/e2e/accessibility.spec.mjs` | Serious/critical axe findings on home/menu in DE/EN and the open order dialog |
| Runtime privacy | E2E request watcher and CSP checks | Public flows make no unplanned third-party requests; external links are not activated by tests |
| Preview SEO | `tests/static/html.test.mjs` | Source language and bilingual title/description/OpenGraph metadata are present; canonical/`og:url`/sitemap remain intentionally absent until domain approval |
| CMS boundary | `tests/static/data.test.mjs` | Editorial workflow, scoped files, hidden invariants, pinned SRI-protected client and absence of credential fields |
| Visual regression | `tests/e2e/visual.spec.mjs` | Home/menu in DE/EN at all five configured viewports |
| Performance | `npm run lighthouse` | Home/menu budgets from three cache/storage-reset DE/light runs: median performance/LCP plus conservative accessibility, best-practices, CLS and transfer-size gates |
| Deployment | `npm run build` and Pages workflow | Validated data is generated first; only `dist/` is uploaded |
| Readiness split | `npm run release:check` | Technical results are machine-readable; external approvals remain `blocked` |

## Reproduce locally

```sh
npm ci
npx playwright install chromium
npm test
npm run lighthouse
npm run release:check
```

`npm run test:visual:update` is intentional baseline maintenance, not a normal
verification command. Review the resulting PNG diff before committing it.

## Manual and external verification still required

- Operator approval of the restaurant facts, menu, prices, hours and photographs.
- Decap authentication against the production worker and a complete editorial PR.
- Physical iOS and Android devices, including phone-call handoff.
- Approved custom domain/DNS, canonical URLs and crawler release.
