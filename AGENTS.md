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
- `script.js`: theme, navigation, announcement, and hours from `data/site.json`.
- `i18n.js`: German/English browser language and manual selection.
- `order.js`: client-side dish selection and telephone-order summary.
- `gate.js`: temporary browser-only preview presentation.
- `admin/`: Decap CMS UI and GitHub-backed configuration for site settings.
- `data/site.json`: editable announcement and hours.
- `.github/workflows/pages.yml`: GitHub Pages deployment from `main`.
- `.agent/`: current state, authoritative tasks, decisions, and architecture map.

## Scope and safety

- The site is static HTML/CSS/JavaScript with no build step or application backend.
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

- Run `for file in script.js i18n.js order.js gate.js; do node --check "$file"; done`.
- Validate `data/site.json` with `python3 -m json.tool data/site.json`.
- Run `git diff --check`.
- Confirm changed links, scripts, PDFs, and images exist.
- For UI changes, serve with `python3 -m http.server 8000` and inspect affected
  mobile and desktop paths in both languages.
- Verify deployment and domain state separately from manifests when it matters.

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
