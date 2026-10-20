## Alternating Chinese/Vietnamese word pairs — 2026-10-18
- Base main947f550 (3.4.7). Word study now alternates Chinese word -> spoken Vietnamese meaning, repeated as three complete pairs, before stroke demos/examples. Examples remain Chinese -> Vietnamese meaning -> silent karaoke. Per-slide audio completion, slow pacing, stroke repetitions, pause and mastery behavior retained.
- guidedShow v4 matches the expanded sequence. Core and browser regression assert the exact six-utterance language/text prefix; no repeated Chinese block before the first Vietnamese meaning. Validation/PR/deployment status in response.

## Repeated word audio and spoken Vietnamese meanings — 2026-10-18
- Base main d421475 (3.4.6). Presentation word audio now repeats3 times with a1.4s gap before pace scaling, then reads Vietnamese meaning, shows3-pass strokes and starts examples. Example/context order: Chinese model -> Vietnamese meaning -> silent karaoke learner turn. Long meanings use bounded Vietnamese speech chunks and are gated on actual audio completion.
- Device speech explicitly selects vi-VN for meanings and Mandarin otherwise, never a Chinese fallback for Vietnamese. Missing Vietnamese voice pauses with an actionable notice. Shared speech defaults remain Mandarin0.85 and no inter-chunk gap; presentation opts into language/rate/gaps. Completion callbacks are one-shot; stop cancels pending repetitions and stale endings cannot replay audio.
- guidedShow v3 matches the changed sequence; no learner mastery/history migration. Core/speech tests cover repeat count, bilingual sequence/voice selection, gaps and cancellation. Browser presentation test verifies three Mandarin reads before Vietnamese word meaning, stroke passes, Vietnamese example meaning before silent karaoke, full playback and viewport/pause cleanup. Full server/DOM/runtime/release checks before PR; CI/deployment state in final response.

## Slower guided study, stroke demos and read-along — 2026-10-18
- Base main 4d0bc3d (3.4.5). Default presentation pace is Chậm0.75, with Rất chậm0.65/Vừa1 and no fast setting. Word/meaning dwell minimum6.5s before pace scaling; default short meaning stays8.67s. Presentation voice uses0.6 default; other speech keeps0.85.
- Each distinct Han character in a word has a dedicated three-pass HanziWriter stroke slide at slow speed with gaps. Uses the existing HSKWritingPractice.characterData starter/CDN/cache loader. Missing data gives a visible timed static fallback; no fake strokes. Async completion guards prevent stale animations moving a paused/closed session.
- Every spoken example/context line now has a subsequent silent Bạn đọc theo slide:2.5s preparation, paced character highlight, generous reading time tied to length/model duration, then a quiet gap before meaning. This is a timing guide, without microphone capture or pronunciation grading. Pause freezes highlight; resume restarts that learner turn. guidedShow version2 avoids resuming an old frame ID against the changed sequence; learner mastery/SRS data preserved.
- Core/speech tests assert sequence, pacing, three loops and unchanged speech defaults. Presentation browser test exercises real stroke SVG/three completed animations plus karaoke/no overlapping model voice, pause and full automatic completion. Existing Học viết regression, full server suite and release checks run before PR. Report CI/merge state in response.

## Hands-free guided presentation — 2026-10-18
- Base main 7e92c0a, preserving dark-contrast 3.4.4 and the earlier non-floating toolbar fix. Học tự động now opens a full-viewport top-layer dialog and starts Mandarin playback. One word, then its meaning and each supplied example/meaning, then the next word; dialogue/reading/grammar follow as bounded slides.
- Speech onend controls advancement, a stalled/error voice pauses visibly, pause resumes the same slide, background/account/route exits cancel playback, timers and optional screen wake lock. iPhone uses CSS viewport fallback; supported browsers request native fullscreen. `guidedShow` resume is independent of the original `guided` step record.
- Học từng chặng retains original checks, retry review and completion controls. Passive playback does not mark words/SRS/completion or award answer evidence.
- Targeted core/legacy guided/browser presentation tests and full177 server tests pass. Runtime390/1440 and feature contracts43/145 pass. New test covers speech ordering, late callbacks, hands-free finish and viewport fit at320/390/430/1440 plus landscape568x320/844x390, both themes. Voice is mocked; physical iPhone audio/fullscreen remains device-dependent. PR/CI state reported in response.

## AI account quotas - server3.3.9 (2026-10-17)
- User authorizes normal accounts50/day:35 non-reading AI queries plus15 reading-generation reservations. Defaults and Wrangler vars updated. Existing same-day total/reading counters preserved; query usage derives from total minus reading. Global protections remain for ordinary accounts.
- ADMIN_UIDS matches the existing account-config admin UID. Reserve bypass uses only the UID from Firebase accounts:lookup; no client/token role flag is trusted. Admin reservations bypass all app budget caps without consuming ordinary-account counters; verified admin also bypasses per-isolate cooldown. Provider limits and reading generation locks remain.
- Quota errors distinguish user-reading/user-query/user-total and global minute/day. Reading cache/reopen stays free. Worker bundle synchronized. No frontend/PWA changes.
- Focused34 server tests PASS, including35+15 independent quotas, admin beyond exhausted global/user limits, no counter consumption, forged admin flag and Firebase UID mismatch. Feature preservation validation before PR. Not deployed yet.

## Real-reading quiz feedback - 3.3.8 (2026-10-17)
- User screenshot shows score2/3 but all explanation strings begin with Đúng. Grading was correct; pre-generated explanationVi was displayed as a learner verdict.
- real-reading.js now renders per-question verdict from selected index vs answerIndex, chosen/correct option text and answer-key explanation. Strip leading Đúng vì/Sai vì boilerplate from cached AI explanations. No new provider calls or scoring/history changes.
- Focused existing reading UI regression deliberately answers question1 incorrectly with an AI explanation starting Đúng vì; assert2/3, exactly one wrong verdict, correct options and two correct verdicts. User requested limited testing. Feature contract and PWA checksum checks retained.

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

## Reading latency optimization — Worker 3.4.2
- Goal: reduce real AI reading wait without removing learning fields, validators, provider fallback or quotas.
- Verified baseline: HSK3 story 21,095 ms = source 115 ms + xKiro timeout 18,000 ms + Gemini 2,980 ms. Gemini-first baseline 3,436 ms.
- Final: Gemini-first for all reading; bounded 30-minute per-handler cache of verified public source text; explicit primary-Hanzi length/chunk instructions; exact quiz schema; sanitized provider/key timing. Default Gemini reasoning/output-token ceiling retained.
- Tests: 164 server tests pass; feature runtime passes 390/1440; append-only guard preserves all 41 baseline groups, adds performance group (42/139); PWA check confirms backend-only, no asset download needed.
- Live tests use a temporary guarded fixed-input benchmark; remove it and restore approved main Worker after testing. No benchmark endpoint, token, credentials or generated passages belong in git. New Worker needs an explicit merge and normal deployment before rollout.

## AI anti-abuse — Worker 3.5.1
- User explicitly requires admin exemption from limits. Exempt only Firebase-verified ADMIN_UIDS; do not trust role flags in ID-token claims or request bodies.
- Added atomic cross-Worker per-account lease/dedup, 3s request/10s reading pacing, email verification, trusted-account-age starter cap 10+3 for first 24h, manual pause and scoped 8x5xx/2min breaker (60s). Admin skips all of these and regular counters.
- Query/reading outputs, storage keys, provider rotation/fallback and budgets 35+15 for established regular accounts preserved. No private response cache, raw UID or prompts in abuse state/logs.
- Mocked integration exercises concurrency, forged admin, cancellation, stale locks, missing binding and admin parallel readings. No live-user data modified or real provider quota spent for guard tests.
- Needs PR/CI and explicit merge/deploy. No new secrets, bindings, migrations or PWA release required. IP/CAPTCHA layer not introduced in this priority implementation.
- Validation: all 175 server tests pass; preservation 43 groups/143 guards and backend-only PWA guard pass. Browser runtime passes at 390px and 1440px after restoring the transient Chromium test dependency; PR CI still must pass before merge.
## Dark contrast repair — 2026-10-18
- Based on latest main ae27bda (PWA 3.4.3), preserving the guided-toolbar fix. User requests contrast repair across dark mode, not only lesson screenshot.
- Reproduced lesson-number contrast 1.61:1; also found light calendar dots, dark about links and low-contrast purple Study4/game labels. Paired badge/calendar surfaces and text; shared accent-ink keeps readable dark text independent of the existing purple button fill. Shared dark progress track/fill covers WebKit and Firefox.
- Added browser regression for 17 routes, expanded practice, lesson badges and all four lesson sections at 320/390/1440. External APIs mocked; no account/progress/provider behavior changes. Verification/PR status reported in final response.

## Combined guided word playback — 3.4.9
- User requests shorter idle pauses, simultaneous writing/pronunciation and a different Vietnamese voice. Three word rounds now animate all Han characters while speaking Mandarin, then speak Vietnamese; advance only when both animation and audio end. No separate trailing stroke phase. Silent karaoke and legacy gated mode retained; no mastery writes.
- Remove minimum spoken-slide dwell; transition 300ms at normal / 400ms default, karaoke lead 900ms. Silent content still has text-based dwell. Vietnamese prefers named Natural/Enhanced/Premium/Neural voices, then online; user may preview/select an actual installed voice and save its URI locally. Device voice inventory limits available quality; no external TTS service or credentials added.
- Resume schema v5 because frame sequence changed; all existing lesson, SRS and account storage retained. Voice settings pause playback and require explicit resume. Required CI and Pages verification must pass before rollout.

## Stroke-length pronunciation — 3.4.10
- User replaces three bilingual word pairs: Mandarin now repeats without a read-count cap throughout the existing three stroke passes; after every Han character finishes all passes, finish the current pronunciation and read the Vietnamese meaning exactly three times before examples. Example/grammar speech and silent karaoke unchanged.
- Explicit per-epoch repeat timer cancels on pause/navigation and on animation completion. Missing stroke data falls back to one pronunciation then three meanings. Resume schema v6 for revised sequence; no mastery/SRS changes. Browser test holds a multi-Han animation open for more than five readings, pauses queued repeats, checks every character/pass barrier and exactly three Vietnamese meanings.

## Gemini TTS incomplete output repair — Worker 3.5.2
- Base main06fc85d (PR108), not the unfinished Gemini-voice checkout from earlier in this thread. Windows canonical checkout was also at06fc85d. Preserve Google-verified /voice-precache and existing 9 server-side keys; no key transfers or new frontend provider integration.
- Live reproduction: current Vietnamese instruction returned HTTP200, finishReason OTHER and zero audio parts, causing cloudflare_tts_502_invalid_tts_audio. Explicit English instruction targeting Mandarin returned proper audio/L16;codec=pcm;rate=24000. Use that instruction and retry incomplete non-refusal output only once within80s; never retry safety blocks.
- Validate actual decoded PCM bytes, supported rate/channels/MIME, size and all audio parts; normalize base64 whitespace and join PCM parts. Safe categorical failures distinguish incomplete generation, refusal and invalid bytes without logging content/tokens/audio.
- Real Apps Script→Worker→Gemini→Drive/Sheets probes:2/4/22-character clips created35130/60090/192570-byte WAV24kHz with correct RIFF/data lengths; every second call cached=true and byte-identical. Warm-up initially advanced4 phrases then hit another empty generation. Literal-transcript second attempt plus Apps Script retryable categories and checkpointed1–60min backoff prevent permanently disabling the queue on transient errors. Safety/configuration faults still pause without skipping items.
- Track the reusable Code.gs/WarmBatch.gs sources and regression tests in Git, without storage IDs, Setup.gs, corpus, OAuth or secret files. Signed-byte WAV headers, unchanged key custody and cache reuse retained. Full197 server tests and browser feature runtime390/1440 pass. Temporary fixed-phrase probes must be removed after verification. Backend-only; app stays3.4.10.

## Live voice ASR recovery — 2026-10-20
- Production hid upstream ASR failures behind generic 503. A real saved clip exposed HTTP404/model_unavailable for Gemini2.5 Flash; hardcoded2.5 Flash-Lite also remained in both verification routes. Dedicated HSK_VOICE_ASR_MODEL binding was previously ignored.
- Deployed actual current Worker module with configured ASR model gemini-3.5-flash-lite, model-specific key pool for both verify routes (including slot0), two blind passes, structured JSON, minimal thinking and1024 output tokens. Safe upstream status/reason/retry metadata; no audio, expected words or credentials in logs/provider prompts.
- Exact current standalone deployment is server/voice-worker-recovery.mjs with server/wrangler.voice-recovery.jsonc. This snapshot preserves other live app changes absent from this branch's older modular Worker. Do not deploy the older translator-worker-bundled.mjs over production. Integrate recovery changes into canonical modular sources before rebuilding the old deployment target.
- Apps Script reset stale model-failure cooldowns exactly once and distinguishes unverified audio from provider outage. Stored masters and two-pass Hanzi+pinyin matching remain mandatory.
- Real existing batch resumed: READY clips include 陪,破,巧克力,甚至,生意; mismatches remain RECHECK. Full52-segment batch not yet complete. Heartbeat resumed without provider error/retry delay.
- Narrow ASR/AutoCycle regression suite and append-only preservation guard pass. Browser runtime remains blocked by missing Playwright Chromium binary; no frontend changes. Keep branch unmerged pending review.

Canonical Windows modular sources have now been reconciled without replacing prior dirty edits; bundle rebuilt and17 voice/auth/TTS/partial regressions pass. tools/voice-asr-source-recovery.patch records only these source edits against the live-source baseline; retain recovery snapshot for production provenance. PR123 is draft; browser runtime requires Playwright installation.

## Main progress tab refresh 2026-10-20
Tien_do now follows the active vocabulary auto50 scheduler instead of disabled legacy warm status. VoiceProgress.gs counts unique committed READY cache keys with file IDs; reports retry/review queue counts, active phase, current error/retry deadline and last completed batch. Existing hskVocabTick trigger wraps the worker in finally so early returns/errors refresh the dashboard; legacy hskWarmProgress delegates while auto50 is active. No generation/retry/trigger settings changed. Deployed31 Apps Script files; real timer updated893/11281 and current double-ASR phase with cleared stale503. Regression covers dedup/valid file, current states, no properties mutations and finally; feature preservation44/159 passes.

## Third-check homophone acceptance 2026-10-20
Owner requests strict Hanzi+pinyin on checks1/2; only check3 may accept homophone Hanzi when both independent ASR pinyin strings exactly equal the stored expected marked pinyin. ThirdPassPinyin.gs implements this fallback after strict matching fails; clip ordinal must be in bounds and segment count equal job count, duplicate mappings remain rejected. No tone stripping, tone-sandhi expansion or neutral-tone substitution. Existing masters are reused. Deployed33 Apps Script files; unit cases plus actual verification-tick harness verify first2 RECHECK then third READY, wrong/missing tones and ambiguous segmentation rejection. Preservation44/159 passes.

## Auto50 quality integration - 20 October 2026
- Compared the live Apps Script pull with the private trial. New logical batches opt into dictionary-style generation; exact stable per-chunk boundaries are retained through master assembly. Existing active journals and saved files retain legacy synthesis. Only unsegmentable chunks requeue, with original WAVs retained.
- Checks 1/2 use source Hanzi and marked pinyin. Check 3 can use source or the trial curated common-reading map; homophones require exact position. Passing clips stay committed; failed words carry reason/model into the next logical batch. No private trial audio/results imported.
- Model quality history records finalized generated clips by actual model, excludes existing-cache hits, is idempotent and bounded to 12 batches. Route keeps provider cooldowns and same-tick failover, with aggregate status and legacy status fallback.
- Deployment snapshot/rollback: C:/Users/LENOVO/hsk-auto-quality-integration-20261020/live-before-push. Applied via clasp at 21:05 VN. Worker was not redeployed; source now retains the already-live opt-in dictionary prompt to avoid a future regression. QualityTrial.js and corpus unchanged; normal queue resumes after finite private trial as before.
- Validation: 73 Apps Script/Worker tests passed; feature contract 45 capabilities/163 guards and browser runtime 390/1440 passed. All 38 deployed files matched readback hashes. Full server suite: 204/206; two unchanged warm-up fixtures lack sheet.getParent (also fail on baseline). Live new-profile yield has not yet been measured; 35/50 is a target, not a guaranteed acceptance threshold.
