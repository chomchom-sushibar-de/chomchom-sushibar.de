# Repository Agent Guide

## Operating model

The repository is persistent project memory. A chat or agent session is temporary
working memory. Keep durable, verified continuation context in `.agent/`.

Assume the next session has no useful memory of the current conversation.

## Startup

1. Inspect `git status` and preserve unrelated worktree changes.
2. Read `.agent/STATE.md`.
3. Read `.agent/TODO.md` when continuing work.
4. Read `.agent/DECISIONS.md` and `.agent/ARCHITECTURE.md` only when relevant.
5. Inspect recent relevant commits and the specific implementation area required.

For an unspecified continuation request, continue the highest-priority supported
item in `.agent/TODO.md`. Do not redo completed work or invent menu/business facts.

## Project map

- Root HTML files: home, menu, outdoor area, contact, legal/privacy, and 404 pages.
- `styles.css`: shared responsive presentation.
- `script.js`: theme, navigation, announcement, and normalized hours from `data/site.json`.
- `i18n.js`: German/English browser language and manual selection.
- `order.js`: versioned client-side dish selection and telephone-order summary.
- `gate.js`: temporary browser-only preview presentation.
- `admin/`: Decap CMS UI and GitHub-backed configuration for site settings.
- `data/menu.v1.json`: canonical versioned menu source; generated HTML is committed.
- `data/site.json`: canonical editable announcement and opening-hours schedule.
- `schemas/`, `scripts/`, and `tests/`: data contracts, generators/build checks,
  static validation, browser/axe flows, and visual baselines.
- `.github/workflows/pages.yml`: GitHub Pages deployment from `main`.
- `.agent/`: current state, authoritative tasks, decisions, and architecture map.

## Scope and safety

- The delivered site is static HTML/CSS/JavaScript with no application backend.
  A deterministic development/CI build generates committed HTML and `dist/`.
- The preview gate is not authentication. Never describe its embedded value as a
  secret or copy it into agent documents.
- The order helper stores a local selection and prompts a phone call; it is not
  online ordering or payment.
- Preserve German/English parity for every `data-en*` addition.
- Menu prices, dishes, hours, legal data, and photographs require authoritative
  operator confirmation; never guess them.
- Treat the Decap CMS auth service as an external boundary and do not add tokens.

## Context hygiene

- Use targeted `rg`, narrow file reads, focused diffs, and scoped history.
- Inspect only affected menu sections rather than loading the entire menu by default.
- Avoid giant logs, binary media reads, and unnecessary rereads.
- Run syntax and data checks before broad browser testing.
- Use isolated or subagent investigations, where supported, only for large
  independent explorations.
- Put durable verified findings in `.agent/STATE.md`, not only in chat.

## Validation

- Run `npm run test:static` for schemas, semantic invariants, syntax, HTML, links,
  assets, bilingual metadata, and generator roundtrips.
- Run `npm run test:e2e` for all five viewport projects, axe coverage, interaction
  flows, and visual baselines.
- Run `npm run lighthouse` for reproducible performance/accessibility budgets.
- Run `npm run release:check` before publication; it builds `dist/` and records the
  technical/external readiness split.
- Run `git diff --check` and inspect the focused final diff.
- Verify deployment, CMS auth, physical devices, operator approval, and domain
  state separately; repository automation cannot approve these boundaries.

## Handoff

Before ending substantial work:

1. Validate the coherent change.
2. Update `.agent/STATE.md` with verified reality.
3. Update `.agent/TODO.md`; it is the only repository task authority.
4. Record durable decisions only when actually made.
5. Update architecture only when the implemented structure changed.

At roughly 50-70% visible context usage, prefer reaching a coherent stopping point,
updating the handoff, and continuing in a fresh session. Do not interrupt an atomic
change merely to satisfy a percentage.

Inspect the final diff so a fresh Codex or Claude Code session can continue without
this conversation.
