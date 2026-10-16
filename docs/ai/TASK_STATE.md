# HSK Cross-AI Handoff

## Verified checkpoint — 2026-10-16
- GitHub `https://github.com/trungxemcode/hsk`, `main` is the source of truth.
- Single local checkout: `C:\Users\LENOVO\hsk`. The older copy at `C:\New folder\hsk` was consolidated into this directory, then retired.
- The last verified app release was 2.16. The last known canonical code commit when consolidating was `58f781c`; do **not** assume it remains latest: check GitHub before work.
- Codex, Antigravity, Gemini and Claude share the root `AGENTS.md` and focused architecture `docs/ai/PROJECT_MAP.md` through small agent-specific entry files.
- Serena project configuration was migrated from the old checkout to `.serena/` in this checkout and is excluded from Git. RTK and Codex configuration reside in the Windows user profile, outside the repository. Earlier AI notes remain in the separate archived backup.

## Current work
- Single-workspace consolidation: canonical Git `main`, Serena configuration local-only, old checkout retired. No app logic or PWA assets changed.
- Do not commit machine-local `.serena/`, RTK, Codex or editor setup. Use tracked shared `AGENTS.md` and `docs/ai/` for portable, compact AI context.
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

## UI follow-up — daily-word spacing (2.18)
- `home-overview.css`: daily-word summary has 8px vertical / 12px horizontal padding in every interaction state. Border-box sizing keeps it inside the existing row; no state-dependent padding or handler/data changes.
- `check-press-shape-ui.cjs` asserts padding and unchanged normal/focused geometry. Home compactness and responsive checks cover the increased content height. PWA release 2.18 must pass CI and Pages verification.

## Mobile flow refinement — 2.19
- Reference adapted to existing routes: keep combined Luyện & Ôn dock, current compact home, existing save sheet, handwriting and AI chat. No new storage keys, scoring, sync or AI transport.
- `mobile-ux.js/css`: flashcard/SRS focus; fixed original quiz/exam/SRS action nodes; grouped account with visible sync status, real error-profile training; notebook meaning on a second row; explicit image lookup action. Original moved controls restore on desktop.
- `lessons.js`: honest mastery chips and in-place vocabulary lookup/save without leaving reading; no completion from opening a popup. SRS remains per-word 3 qualifying passes separated by 24 hours, not a fabricated global day count.
- Validation: new mobile-flow integration, real touch dock scrolling, reading DOM all 146 lessons, goal persistence and 552 responsive/text cases passed locally. Full Studio workflow and Pages must pass before considering release published. External AI/Firebase transport is mocked in integration checks.
- Canonical Windows checkout and tooling untouched. Re-check GitHub head before subsequent edits.
