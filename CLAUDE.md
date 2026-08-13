# Claude Code Guide

Read `AGENTS.md` first. It is the repository-local operating guide.

## Continuation startup

1. Inspect `git status` and recent relevant commits.
2. Read `.agent/STATE.md`.
3. Read `.agent/TODO.md`.
4. Demand-load `.agent/DECISIONS.md` and `.agent/ARCHITECTURE.md` only when needed.
5. Continue the highest-priority unfinished task unless the user specifies another.

Do not guess menu, legal, hours, or launch facts. The preview gate is client-side
presentation, not security; do not copy its embedded value into handoff material.

## Useful commands

```bash
for file in script.js i18n.js order.js gate.js; do node --check "$file"; done
python3 -m json.tool data/site.json
python3 -m http.server 8000
git diff --check
```

There is no dependency installation or build command. The repository root deploys
through GitHub Pages; Decap CMS is an external GitHub-backed editing path.

Before finishing substantial work, validate and update the affected `.agent/`
files. Assume the next session has no useful memory of this conversation.
