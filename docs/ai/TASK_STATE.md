# HSK Cross-AI Handoff

## Verified checkpoint — 2026-10-16
- GitHub `https://github.com/trungxemcode/hsk`, `main` is the source of truth.
- Working checkout: `C:\Users\LENOVO\hsk`; secondary checkout: `C:\New folder\hsk`.
- Both were fast-forwarded to GitHub commit `5ced4dc`, app release 2.16. Do not assume that commit remains latest: always check Git status and remote before working.
- Codex, Antigravity, Gemini and Claude share the root `AGENTS.md` and focused architecture `docs/ai/PROJECT_MAP.md` through small agent-specific entry files.
- Secondary checkout originally contained untracked private/local Serena and Codex notes; preserve them in a separate backup instead of overwriting them. `.serena/` is local and may contain stale notes.

## Current work
- Consolidate a short shared AI context. No application logic or PWA assets need changing.
- Shared context is committed to `main`, then mirrored into the secondary checkout after its original local AI notes are archived outside the repository. Verify Git on every new session; these directories can diverge again after future edits.
- Follow-on tasks must be requested by the user; no pending feature is implied.

## Handoff template (replace this section only when work actually starts)
- Goal:
- Feature paths touched:
- Decisions and constraints:
- Completed work:
- Tests and actual results:
- Open issues / next safe action:

Do not store secrets, API keys, personal data, or entire chat logs. This file is a checkpoint, never a substitute for checking actual code or Git state.
