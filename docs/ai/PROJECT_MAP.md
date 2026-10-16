# HSK Project Map — Verified Entry Points

Source: HSK repository on GitHub `main`. Verified against release 2.16 (2026-10-16); re-check code touched by later commits. Read only the section relevant to the task.

## App and UX
| Area | Primary files | Boundaries |
| --- | --- | --- |
| Entry/shell | `index.html`, `loader.js`, `app.js` | Static HTML, CSS, vanilla JS; no frontend build required |
| Navigation | `studio.js`, `studio-layout.css` | Existing panels, sidebar, mobile routes |
| Home 2.16 | `home-overview.js/css`, `docs/OVERVIEW-2.16.md` | Single learning CTA, 2×2 shortcuts, real progress and compact vocabulary. Daily-word summary has persistent 8px vertical / 12px horizontal padding so purple press/focus never hugs the text (2.18). |
| Mobile | `mobile-ux.js/css`, `mobile-layout.js/css`, `mobile-dock.js` | Focus modes, original fixed quiz/exam/SRS actions, in-place lesson word popover, grouped account controls and notebook hierarchy. See `docs/MOBILE-FLOW-2.19.md`. |
| Visual tokens | `style.css`, `ui-buttons.css` | Neutral buttons, purple active state; light/dark. Disclosure press states follow their parent card radius, standalone summaries use the button radius; no global overflow clipping (2.17). |
| HSK target/filter | `planner.js`, `planner-core.js`, `studio.js` | Learning goal and vocabulary search filter are intentionally independent |

## Learning and accounts
| Feature | Primary files | Notes |
| --- | --- | --- |
| Flashcards and SRS | `app.js`, `words.js`, `lessons.js` | Preserve existing storage keys and review semantics |
| Lessons and content | `lessons.js`, `lessons-data.json`, `lesson-content-hsk1.json` ... `hsk6.json` | Curriculum, progress and reading content. Mobile evidence chips read existing mastery; tappable lesson vocabulary preserves sentence text and speech. |
| Tests/exams | `lesson-mini.js`, `exam.js`, `exam-core.js`, `exam-bank.js` | Existing question/score behavior |
| Practice games | `practice-games-core.js`, `practice-games.js/css`, `studio.js` | Two independent Luyện & Ôn modes: shuffled Hán–pinyin–meaning triples and sentence-word ordering from existing checked examples. Session-only scoring; no SRS writes. Browser/core checks in `tools/check-practice-games-*`. |
| Mixed practice + Study4 | `practice-selector.js/css`, `study4-practice.js`, `studio.js` | First Luyện & Ôn screen: two initially collapsed, scoped multi-select groups (Luyện: 10 modes; Ôn: SRS + mistakes). Start buttons are inside each disclosure and scroll normally, never sticky. Existing choice storage and sequential session handlers retained. Study4 public exam/listening catalog opens sourced official test pages in a new tab; no private Study4 question/audio files have been imported. Import requires licensed export/API or verified assets. Test: `tools/check-practice-picker-ui.cjs`. |
| Placement feedback | `placement.js/css`, `placement-core.js` | Adaptive screen + evidence stopping at the failed level and its predecessor; 8–16 fresh probes, at most 52 total. Strong/weak skill evidence must be clear across both levels; guessed/ambiguous results extend testing, exhausted bank yields an explicit provisional result, live AI can prioritize the next skill only. Legacy reports/drafts remain supported. Evidence-based strengths, weaknesses, uncertain/untested skills; optional authenticated AI via existing `/lesson-ask`, in-memory owner/report cache, abort on close/account change. Roadmap repairs earliest actual gap; scoring and report storage unchanged. Tests: `server/placement.test.mjs`, `tools/check-placement-feedback-ui.cjs`. |
| Study planner | `planner.js`, `planner-core.js` | Actual plan, time and mastery stats |
| Vocabulary notebook | `notebook.js/css`, `notebook-factory.js/css`, `notebook-tools-core.js` | CRUD, saved entries, import/export, exercises, AI stories |
| Auth and sync | `account.js`, `account-core.js`, `study-sync.js`, `study-sync-core.js`, `firestore.rules` | Local-first and per-account isolation |

## Handwriting, AI and server
| Feature | Primary files | Boundary |
| --- | --- | --- |
| Offline handwriting | `handwriting.js` -> `handwriting-worker.js` -> `handwriting-core.js` | Strokes normalized to 32×32 bitmap; matching independent of stroke order |
| Personal handwriting | `handwriting-learning.js`, `content/handwriting-personal-components.md` | Uses confirmed whole-character samples; cross-character component reuse **not implemented** |
| Optional neural model | `handwriting-neural.js`, `handwriting-neural-core.js` | On-device model; personal examples do not retrain weights |
| Online handwriting AI | `handwriting.js::recognizeWithAI` | Authenticated `/handwriting-recognize` |
| Image OCR | `ocr.js` | Separate image/crop and `/ocr` path |
| Translation / lesson chat | `translator.js`, `lesson-chat.js` | Authenticated server-mediated Gemini |
| AI learning review / story | `ai-coach.js`, `planner.js`, `notebook-factory.js` | Cancellable authenticated requests |
| Adaptive AI loading | `mobile-ux.js::HSKLoading.showAI` | Request lifetime controls visibility; no fake percentage |
| Gemini server | `server/translator-worker.mjs`, `server/translator-worker-bundled.mjs`, `server/README.md` | Separate Cloudflare deployment; no API secrets in repo |

## Offline release and regression
- Offline/PWA: `offline.js`, `offline-worker.js`, `OneSignalSDKWorker.js`, `app-version.json`, `build-version.py`. Updating app assets requires a new PWA release/version and correct SHA-256 hashes so installed phones update.
- CI: `.github/workflows/studio-ui.yml`, `mobile-dock.yml`, `update-notifications.yml`.
- Tests: `node --test server/*.test.mjs`, targeted `tools/check-*-dom.cjs` and Playwright `tools/check-*-ui.cjs`; key responsive/goal/home/loading tests listed in `AGENTS.md`.
- Browser CI mocks transport; it is not evidence of working real Gemini, real Firebase or physical iPhone devices.
