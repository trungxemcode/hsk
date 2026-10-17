## Lesson section dropdown - 3.3.7 (2026-10-17)
- User requested a dropdown rather than horizontally hidden lesson pills on phones. lessons.js renders a labelled native select for all four original sections; desktop buttons and all handlers/footer navigation remain. Mobile CSS removes sticky positioning so expanding mastery details pushes the picker down and scrolling cannot overlay reading text. Completion evidence remains visible in option labels.
- Removed obsolete mobile pill auto-centering. Updated browser interaction tests to use the visible mobile control without weakening protected feature contracts. New check-lesson-picker-ui.cjs covers four sections, expansion/scroll geometry, unchanged progress, desktop and light/dark. Added to feature-preservation CI.
- Validation: feature preservation40/131 PASS; feature runtime390/1440 PASS; lesson-mini DOM and speech DOM PASS; mobile-flow browser320/390/1440 PASS; dedicated lesson-picker browser320/390/430/1440 light/dark PASS. PWA3.3.7 prepared. No AI/backend/data contracts changed. PR/CI status recorded in task response.

## AI task roles - 3.3.6 (2026-10-17)
- AI_TASK_ROUTING=true: xKiro first for dictionary, short/basic translation, basic lesson/sentence questions and HSK1-4 dialogue/story/email generation. Gemini first for OCR/handwriting, plan analysis, HSK5-6 translation/tutoring/reading, long inputs/history, complex-language questions, news/explainers and large dictionary batches. Classification is a server heuristic, not proof of task difficulty.
- xKiro deadlines: text10s, reading18s; then Gemini25s. Heavy Gemini deadlines: text15s, reading25s; text-only xKiro fallback25s. At most two sequential providers; cancellation/refusal never crosses. Image routes stay Gemini-only.
- Both providers must satisfy response schema; reading must also pass the existing structural/length/quiz validator before being accepted. Invalid xKiro output falls back to Gemini with the original grounded prompt. This is structural validation, not factual certification. Existing auth/cache/global and user budget gates remain.
- Successful responses expose X-HSK-AI-Provider (gemini/xkiro); no credentials or prompts logged. Feature flag false restores Gemini-first routing. Worker-only change; no frontend/PWA change.
- Validation: full server suite141/141 before final classifier/header refinements; rerun focused tests after those refinements. No live deployment or live new-router tests yet. Branch feature/ai-task-roles from12ce49c. Production still3.3.5 until explicit merge/release authorization.
# HSK Cross-AI Handoff

## Faster failover — 3.3.5 (2026-10-17)
- Base8efd831. User requests less than15s and explicitly permits real quota tests. Shared AI_TIMEOUTS: primary text6s, reading12s, backup25s. Same sequential/no safety/image crossover protections; no credential or UI changes.
- Live browser currently guest; no configured local provider keys. Do not extract Cloudflare secrets, browser tokens or weaken Firebase for live testing. Real authenticated measurement requires normal app sign-in. Automated tests mock vendor behavior and do not establish real latency.

## Text AI failover — 3.3.4 (2026-10-17)
- Base74342f0. Shared adapter now covers text routes, not just reading: provider errors/network/invalid JSON/schema/truncation trigger one sequential backup. Primary15s/reading30s; backup25s; caller abort never launches backup. Keep Firebase, quotas, validators, safety refusals, original success settings and credential configuration. Image routes explicitly remain Gemini-only because configured backup is text.
- Cloudflare secret names checked: SECONDARY_AI_API_KEY is now installed; no values accessed. Real authenticated provider quality/quota not tested. Tests use mocks, including503, timeout/stalledbody, cancellation, no recursive retry and no safety/image/auth crossover. All130 server tests passed, including bundled authenticated dictionary503→backup integration. Worker-only release, no frontend/PWA asset change.

## Reading genres and quality — 3.3.3 (2026-10-17)
- Base main 921650a. Add dialogue, story, educational news, email/message and short explainer selector. Scope cache/history/reopen by genre; preserve legacy dialogue. Responsive selector spans the mobile row.
- Genre-specific source-grounded prompt, HSK length targets (learning guidance, not official test standards), natural lesson vocabulary, faithful pinyin/Vietnamese and three grounded questions. Reject too-short, duplicate paragraphs/questions/options. Fiction/news attribution remains honest. No automatic paid retry, secret/config, auth, budget or mastery changes.
- Source: real-reading.js/css, variety core, server reading service/cache key/Worker revision and generated bundle. Tests cover all five genres, invalid genres, cache isolation, history and UI transport at 320/390/1440. Provider output is mocked; live authenticated generation not verified.
- Full server suite: 124 passed. Release/CI/deployment must be checked before marking published.

## Reading request fix — 3.3.2 (2026-10-17)
- Base a154353, main already includes reading + budget/xKiro configuration. Reproduced real standard-3-01 meanings longer than the server's 80-character bound; old frontend sent them unmodified and received 400 before AI generation.
- Normalize request-only vocabulary (20 unique supported Han, mean <=80); preserve dictionary data and strict server validation. Inline status/cancel replaces blocking reading overlay; Firebase-token wait is abortable and stale/account-switched responses cannot write cache. Changes of level/topic/navigation cancel the request.
- Existing xKiro adapter is enabled only when a real SECONDARY_AI_API_KEY secret is installed. Wrangler secret list currently has only GEMINI_API_KEY and FIREBASE_API_KEY. Do not reuse an exposed chat key or claim real fallback tested. Document secure installation; retain global/user AI budget and single sequential fallback. Extend provider retry statuses to 500/504 and show missing-backup/quota errors clearly.
- Focused tests passed with actual HSK3 app vocabulary and the Worker validator at 320/390/1440; cancellation during a never-resolving token, HTTP 400 and loading cleanup covered. Provider tests are mocked. Full CI, worker deployment and Pages verification pending.

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

## Picker fix — 2.25
- `practice-selector.js/css`: restore separate Luyện and Ôn choosers with identical scoped multi-select/clear/all/start interactions. Both initially closed; opening one closes the other. Existing SRS/mistake routes and all 12 modes preserved, 10+2. Existing per-account choice key retained.
- Move each Start row inside its disclosure and remove sticky positioning so it cannot cover option tiles. Group closes on launch; session controls continue using original routes. No learning/SRS data-contract change.
- Narrow browser checks passed at 320/390/1440 in light/dark: review sequence, independent choices, closed actions, actual content scroll, progress unchanged by navigation, icons and source links. Mobile UX regression passed. Studio workflow/Pages must pass for release.
- Source base: `5687be3`. Canonical Windows checkout/tooling untouched.

## Assessment feedback — 2.26
- `placement-core.js`: read-only diagnosis by skill, confident vs fragile recall and untested audio. Roadmap chooses earliest actual gap even at a passed level; never treats unavailable listening as a mistake. Level scoring unchanged.
- `placement.js/css`: strengths/weaknesses and question evidence before route CTA, explicit rationale, AI synthesis on existing authenticated lesson-ask endpoint. Same original start/continue/planner handlers. Guest/offline feedback remains useful; no fabricated AI output. Abort/stale-owner guards and bounded in-memory cache, no report/SRS storage changes or new Worker deployment.
- Narrow unit, placement DOM/browser and real route-activation tests passed locally. New feedback browser test mocks AI transport and covers payload grounding, skipped listening, retry/cache, no data writes, owner isolation and light/dark at 320/390/1440. Full CI and Pages required for release; provider response quality not verified using a real user token.
- Base `22818f3`; canonical Windows checkout/tooling untouched.
- CI caught a native dialog lifecycle race on rapid close/reopen: ignore a queued old close event when the dialog is already open again, so it cannot invalidate the new analysis or resumed session. Browser regression now closes/reopens in one event-loop turn before exercising AI retry.

## Adaptive placement — 3.1.1
- User version policy: first three-part release 3.1.1; patch for same-feature changes, minor for major additions, major 3 changes only on explicit request. Builder accepts X.Y.Z; no downgrade comparison depends on label.
- `placement-core.js`: preserve 36 initial items and add 48 separate original verification items (8/level). After a failed block, cut higher levels and choose 12 new items from the boundary pair, balanced by skill and real weak evidence. 24–48 answers total; aggregate evidence includes probe answers, no fabricated precision or hearing penalties.
- `placement.js`: instant local progression, at most two authenticated live AI requests to prioritize the next skill within the fixed pool; never replace visible items or change the ceiling/answers. Pause/resume, stale-account cancellation and offline fallback remain. Existing reports/legacy drafts work; new adaptive metadata uses the same storage/sync contracts.
- Narrow checks: 12 core tests and placement DOM pass; browser confirms HSK4 cutoff, unique HSK3/4 probes, bounded AI priority, no answer leak, exact reload and no mastery writes at 320/390/1440. Existing placement/feedback/route checks must pass with full CI. AI transport is mocked; no new Worker deployment required.
- Base 738ca6a; canonical Windows tooling untouched.

## Evidence-based placement stopping — 3.1.2
- New sessions use stopMode=evidence; old fixed-12 drafts/reports remain valid. Boundary verification checks every skill at both levels, minimum 8 new questions; clear strong/weak evidence stops early. Correct guesses cannot establish strength. Unavailable listening remains unassessed.
- Up to 16 unique boundary probes (52 total at HSK6). If ambiguity remains after exhausting the vetted bank, explicitly show a provisional result; never loop/reuse questions or claim certainty. No percentage confidence is fabricated. AI remains a bounded skill-priority helper, not a stopping authority.
- Draft/report validators support variable lengths and validate stop reason from actual answers. Pause/reload and sync contracts retained.
- Local checks: all 103 server tests, placement DOM, placement browser and adaptive browser (320/390/1440) pass. Full Studio CI and Pages verification required. Base 8b7a615; Windows tooling untouched.

## Guided lesson mode — 3.2.1
- Optional Học tự động entry inside every lesson; existing four-section flow preserved. Deterministic content-grounded plan, new words before their contexts, dialogue pairs/reading paragraphs, linked grammar, recall and existing lesson checks; no new provider/API dependency.
- Auto advance has slow/normal/fast pacing; optional Mandarin speech waits for audio completion. Quiz steps require a real choice and manual continuation; wrong answers get a review stop. Visibility/pagehide/account changes pause/stop playback. Store guided stage within existing lesson record; explicit read confirmation only, actual content checks retain existing streak rules. No word mastery or SRS generated by viewing.
- New core tests inspect all 146 sequences; new browser check exercises entry, timers/pause/resume, answer gates, wrong-answer review, actual evidence writes and 320/390/1440 light/dark. Existing all-146 reading DOM regression passes. Full CI and Pages must pass before release. Base 24983d6, Windows checkout/tooling untouched.
- CI mobile-dock test was stale: it tapped the intentionally hidden legacy review/practice lists. Updated only the test to open the current practice mode picker, assert legacy lists stay hidden, then retain actual CDP touch-scroll/dock-position checks. It passes locally at 320/390 portrait and landscape rail. No navigation app logic changed.
