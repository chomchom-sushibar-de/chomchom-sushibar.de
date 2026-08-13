# Canonical menu data model

`data/menu.v1.json` is the single source of truth for the visible menu, Menu
JSON-LD and the local telephone-selection helper. Its contract is defined by
`schemas/menu.v1.schema.json` and additional semantic checks in
`scripts/lib/validate-data.mjs`.

## Core rules

- `schemaVersion` identifies the data contract; `contentVersion` identifies the
  operator-confirmed menu revision.
- Category and item IDs are stable machine identifiers. Visible menu numbers are
  preserved separately and must also be unique.
- German and English strings are explicit. Missing language data fails validation;
  no translation is generated automatically.
- Prices are positive integer cents. Browser totals multiply and add cents only;
  formatting happens at the display boundary.
- `dayCents` is the lunch or single price. `eveningCents` is optional and is used
  only where the pre-migration menu already had a separate evening value.
- `available: false` removes an item from generated public menu/structured data and
  prevents it from being selected without deleting its stable record.
- Suggestion groups contain existing stable item IDs and are validated before a
  build can proceed.
- `source` records the documented repository origin, immutable migration fixture
  and SHA-256 checksums of the two source PDFs.

## Generated outputs

`npm run menu:generate` validates the model and rewrites marked regions in
`speisekarte.html`:

1. the bilingual menu markup;
2. Menu JSON-LD;
3. the minimal JSON payload consumed by `order.js`.

`npm run menu:check` fails if a committed generated region is stale. The Pages
build always runs generation before creating `dist/`, so an editorial CMS change
cannot deploy stale HTML.

## Migration proof

`tests/fixtures/menu-pre-migration.v1.json` is the immutable structural snapshot
captured before generation was introduced. While the canonical `contentVersion`
matches that snapshot version, tests require exact equality for categories,
numbers, ordering, text, qualifiers, notes, tags and prices. Independently, every
generated page is always roundtripped against the current canonical model. This
preserves migration evidence without freezing later operator-authorized updates.
The baseline must not be regenerated for an ordinary menu edit.

## Editing workflow

1. Obtain an authoritative menu update from the operator.
2. Edit `data/menu.v1.json` directly or through the scoped Decap collection.
3. Increment `contentVersion` only for a confirmed content revision.
4. If the authority/date/source files changed, have a maintainer update the hidden
   `source` metadata and checksums in the same reviewed pull request.
5. Run `npm run menu:generate` and `npm test`.
6. Review both canonical and generated diffs in an editorial pull request.

Decap exposes menu entries and availability, while source metadata, price-mode
configuration and suggestion IDs remain hidden and preserved. CI is the final
schema boundary. The external Decap authentication runtime is not verified by the
repository.
