# HSK Cross-AI Handoff

## Verified checkpoint — 2026-10-16
- GitHub `https://github.com/trungxemcode/hsk`, `main` is the source of truth.
- Working checkout: `C:\Users\LENOVO\hsk`; secondary checkout: `C:\New folder\hsk`.
- Both were fast-forwarded to GitHub commit `5ced4dc`, app release 2.16. Do not assume that commit remains latest: always check Git status and remote before working.
- Codex, Antigravity, Gemini and Claude share the root `AGENTS.md` and focused architecture `docs/ai/PROJECT_MAP.md` through small agent-specific entry files.
- Secondary checkout originally contained untracked private/local Serena and Codex notes; preserve them in a separate backup instead of overwriting them. `.serena/` is local and may contain stale notes.

## Current work
- Goal: fix square purple press/focus backgrounds in rounded disclosure controls (release 2.17).
- Paths: `ui-buttons.css`, `tools/check-press-shape-ui.cjs`, UI workflow and generated PWA release metadata.
- Fix: standalone summaries use the shared button radius; framed summaries use the same radius token as their card, with square lower corners only while expanded. Disable native rectangular tap highlight, retain keyboard outline, geometry and all handlers. Do not globally clip details or change learning data.
- Verified locally: press shape at 320/390/1440 light/dark; mobile UX at 360/390 and desktop; design-token guard. CI must pass before merge, then verify Pages release and asset hashes.
- Source baseline: GitHub `58f781c`. This cloud snapshot has no `.git`; use GitHub feature branch/PR and SHA leases. Windows checkouts were not modified in this task.

## Handoff template (replace this section only when work actually starts)
- Goal:
- Feature paths touched:
- Decisions and constraints:
- Completed work:
- Tests and actual results:
- Open issues / next safe action:

Do not store secrets, API keys, personal data, or entire chat logs. This file is a checkpoint, never a substitute for checking actual code or Git state.
