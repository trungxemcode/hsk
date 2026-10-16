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

## UI follow-up — rounded press states (2.17)
- Fix: `ui-buttons.css` summaries use the same shared radius tokens as their frames; standalone summaries use the button radius. Expanded framed headers keep rounded top corners. Native rectangular tap highlight is disabled; keyboard outline, geometry and handlers remain intact. No global overflow clipping or learning-data changes.
- Tests: press shape at 320/390/1440 light/dark, mobile UX and 552 responsive cases pass locally. Full Studio CI passed on application commit `81e0c45`; the follow-up commit changes only this handoff to preserve the concurrent workspace-consolidation notes.
- Release: PWA metadata bumped to 2.17. Verify Pages and asset hashes after merge. Windows checkout/configuration was not modified by this cloud task.
