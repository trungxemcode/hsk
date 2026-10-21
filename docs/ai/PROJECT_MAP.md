# HSK Project Map — Verified Entry Points

Source: HSK repository on GitHub `main`. Verified against release 2.16 (2026-10-16); re-check code touched by later commits. Read only the section relevant to the task.

## App and UX
| Area | Primary files | Boundaries |
| --- | --- | --- |
| Entry/shell | `index.html`, `loader.js`, `app.js` | Static HTML, CSS, vanilla JS; no frontend build required |
| Navigation | `studio.js`, `studio-layout.css` | Existing panels, sidebar, mobile routes |
| Home 2.16 | `home-overview.js/css`, `docs/OVERVIEW-2.16.md` | Single learning CTA, 2×2 shortcuts, real progress and compact vocabulary. Daily-word summary has persistent 8px vertical / 12px horizontal padding so purple press/focus never hugs the text (2.18). |
| Mobile | `mobile-ux.js/css`, `mobile-layout.js/css`, `mobile-dock.js` | Focus modes, original fixed quiz/exam/SRS actions, in-place lesson word popover, grouped account controls and notebook hierarchy. Landscape phone navigation sits on the right with safe areas on both edges; dock buttons include label padding. See `docs/MOBILE-FLOW-2.19.md`. |
| Shared press surfaces | `ui-buttons.css`, `tools/check-shared-press-ui.cjs` | Framed disclosures keep body padding while their headers fill the closed frame, match its corners and retain text inset. Browser regression checks geometry and toggles across 15 routes in both themes and phone portrait/landscape/desktop. |
| Gemini key pool | `server/gemini-keys.mjs`, `server/ai-control.mjs` | Up to ten server Secrets; centralized atomic round robin, hashed key IDs and shared cooldowns. Max two sequential Gemini attempts per prompt, within existing provider deadlines and auth/budget gates. Legacy single-key configuration remains supported. Setup in `server/README.md`. |
| Visual tokens | `style.css`, `ui-buttons.css` | Neutral buttons, purple active state; light/dark. `accent-ink` separates readable purple text from filled-button color; progress track/fill have dark roles. Lesson badges, account calendar and links pair dark surfaces with readable text. `tools/check-dark-contrast-ui.cjs` checks real route text at phone/desktop widths. Disclosure press states follow their parent card radius; no global overflow clipping. |
| HSK target/filter | `planner.js`, `planner-core.js`, `studio.js` | Learning goal and vocabulary search filter are intentionally independent |

## Đọc thực tế thử nghiệm HSK 3.3.0
- 3.3.3: bộ chọn 5 thể loại (dialogue/story/news/email/explainer); cache v3, lịch sử và bài gần nhất tách theo loại (bài cũ mặc định dialogue). Prompt có mục tiêu độ dài theo HSK, pinyin/dịch Việt và câu hỏi dựa trên văn bản; kiểm tra đoạn/lựa chọn trùng và độ dài trước khi lưu. Đây là kiểm tra cấu trúc, không thay thế kiểm định ngữ nghĩa. Không đổi key/cấu hình xKiro, quota, auth hay tiến độ.
- Sửa 3.3.2: payload từ vựng dùng `requestWords` (20 mục, Han ≤12, nghĩa ≤80), giữ nguyên dữ liệu gốc và validator máy chủ. Trạng thái chờ inline có nút hủy; hủy được cả lúc Firebase token chưa trả, chặn ghi cache/lịch sử từ phản hồi cũ. Adapter xKiro đã có; secret `SECONDARY_AI_API_KEY` chưa được cài tại thời điểm kiểm tra 17/10/2026. Xem `server/README.md` để cấu hình an toàn.
- Route đọc và Worker API được lập trình trên nhánh tính năng: `real-reading.js/css`, `real-reading-variety-core.js`, `server/reading-service.mjs`, `server/translator-worker.mjs`; hướng dẫn và giới hạn tại `docs/ai/REAL_READING_IMPLEMENTED_3_3_0.md`. **Chưa xác nhận triển khai Worker live và đồng bộ lịch sử đa thiết bị.**

## Đề xuất chưa triển khai
- **Đọc thực tế & Kịch bản theo HSK:** đặc tả kiến trúc, nguồn đã kiểm tra, UX tối giản, API/trust boundary, tests và checklist triển khai trong `docs/ai/REAL_READING_DESIGN_3_2_1.md`. Cơ chế AI chọn bài mới, chống trùng và đọc không giới hạn một bài chuẩn: `docs/ai/REAL_READING_VARIETY_3_2_1.md`, core `real-reading-variety-core.js`, test `tools/check-real-reading-variety.cjs`. Chưa có route/API sản xuất.

## Learning and accounts
| Feature | Primary files | Notes |
| --- | --- | --- |
| Flashcards and SRS | `app.js`, `words.js`, `lessons.js` | Preserve existing storage keys and review semantics |
| Lessons and content | `lessons.js`, `lessons-data.json`, `lesson-content-hsk1.json` ... `hsk6.json` | Curriculum/progress preserved. `lesson-guided-core.js`, `lesson-guided.js/css`: Học tự động opens a viewport-filling dialog (native fullscreen when supported) with one word/example/meaning at a time, three stroke-animation passes via the existing writing-data cache with Mandarin repeating until all characters finish, then exactly three Vietnamese word-meaning readings, then examples with Chinese model → spoken Vietnamese meaning → silent karaoke learner turn; audio/stroke completion barrier, 300ms transition pauses (400ms at default speed), Vietnamese quality preference with persisted voice picker/preview, pause/resume, speed, screen wake lock when available and cleanup on navigation/background. Long source text is paginated, not discarded. `guidedShow` v6 stores playback position separately; no microphone capture or pronunciation grading. Học từng chặng retains the original guided sequence, quiz gates and wrong-answer review; actual checks reuse contentEvidence, passive playback never grants mastery. UI tests: `check-guided-presentation-ui.cjs` and `check-lesson-guided-ui.cjs`. |
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
| Gemini server | `server/translator-worker.mjs`, `server/translator-worker-bundled.mjs`, `server/ai-backup.mjs`, `server/README.md` | 3.3.5: sequential text failover on provider/network/malformed output; shared AI_TIMEOUTS primary6s (reading12s), backup25s within route deadline. No image-to-text-model fallback or safety bypass. Separate Cloudflare deployment; no API secrets in repo |
| Voice precache bridge | `server/voice-tts.mjs`, `server/voice-tts.test.mjs`, `server/voice-bundle.test.mjs`, `tools/voice-cache-apps-script/Code.gs`, `WarmBatch.gs` | Worker3.5.2: authenticated Apps Script identity → Gemini Kore Mandarin audio. Explicit Mandarin prompt with literal-transcript retry for HTTP200/OTHER or missing audio; max two generations within80s. Refusals never retried; decoded PCM/WAV, rate, channel, size and multipart audio validated before returning to Drive. Warm-up checkpoints each phrase and backs off1–60min on transient errors without disabling the queue or losing its cursor. Backend fix; app voice controls remain unchanged. |

## Offline release and regression
- Offline/PWA: `offline.js`, `offline-worker.js`, `OneSignalSDKWorker.js`, `app-version.json`, `build-version.py`. Updating app assets requires a new PWA release/version and correct SHA-256 hashes so installed phones update.
- CI: `.github/workflows/studio-ui.yml`, `mobile-dock.yml`, `update-notifications.yml`.
- Tests: `node --test server/*.test.mjs`, targeted `tools/check-*-dom.cjs` and Playwright `tools/check-*-ui.cjs`; key responsive/goal/home/loading tests listed in `AGENTS.md`.
- Browser CI mocks transport; it is not evidence of working real Gemini, real Firebase or physical iPhone devices.

## AI task routing (3.3.6)
Server ai-backup.mjs: aiTaskRole + createAiRoleFetch select xKiro for routine text, Gemini for all reading generation and heavy/multimodal work (Worker 3.4.2); one sequential fallback, schema/reading validation, X-HSK-AI-Provider response header. AI_TASK_ROUTING controls policy. See ai-roles.test.mjs for routing and safety regression tests.

## AI account quotas (server3.3.9)
server/ai-control.mjs reserve: normal50 total/day,35 queries,15 readings; trusted ADMIN_UIDS exemption. translator-worker.mjs derives UID from verified Firebase lookup and exempts verified admins from cooldown. Existing global ordinary-user caps/cache/auth stay. Wrangler owns limits and UID allowlist; no frontend role flags grant access.

## Reading latency — Worker 3.4.2
Gemini-first reading avoids the measured 18-second xKiro timeout. Source text is verified before a bounded per-handler 30-minute cache; no learner/auth data cached. Existing target lengths/quality checks, 3 questions, pinyin, Vietnamese, Firebase gates, quotas, key rotation and xKiro fallback remain. Sanitized timing callbacks identify original key slots even after deduplication; no keys, prompts or UID logged. Benchmark route is temporary, guarded, and must be removed before completion; never commit it. Backend-only: do not bump PWA or rebuild offline assets.

## AI abuse guard — Worker 3.5.1
`server/ai-control.mjs` abuse-start/finish uses atomic per-account leases, canonical hashes (no private result cache), central 3s/10s pacing and reading/query-specific temporary breakers. `translator-worker.mjs` applies only after Firebase lookup, requires verified email for regular accounts, derives the <24h starter 10+3 budget from Firebase createdAt, releases on all exits/cancel, and fails closed without the coordinator. Trusted ADMIN_UIDS bypass ALL app quotas, pacing, concurrency, verification/starter rules and breakers, including existing reading lock contention. Payload/auth/provider constraints remain. Flags and rollback in server/README.md; tests server/ai-abuse.test.mjs; no PWA or new infrastructure.

## Live FAST voice recovery v2 — 2026-10-21
Production source: archives/voice-auto-cloud-20261021 (PR126 archive; not a frontend deployment). Apps Script verified version26; rollback baseline23. Worker uses native 3.8 Flash/Lite structured speech_metadata, literal Hanzi transcript and short literal legacy fallback, addressing confirmed provider error that the model tried to generate text. All38 bindings preserved. FAST still uses one generator, up to3 sequential successful checkpoints per tick, and up to10 ASR clips within existing runtime; quality gates and real quotas remain.24 focused tests, append-only contracts and390/1440 Chromium checks pass. Live native Lite profile saved3 consecutive WAVs on first attempts in one timer at08:33 VN; those files still require blind double-ASR approval. HSK2-4 currently1029/1044 certified; HOLD_UNCERTAIN0. HSK order2-4 ->1 ->5 ->6. No extra parallel-ASR pipeline deployed.

## Stable cohorts and provider keys - 2026-10-21

The 08H release now holds a durable logical cohort of up to 50 source rows until at least 30 are READY/EXISTING. Physical repair journals remain append-only children of that cohort. A stage tail below 30 must finish all remaining members; REVIEW or changed source identity never counts as verified. Active journals finish before a new cohort opens. HSK order remains 2-4 -> 1 -> 5 -> 6.

Successful TTS key/model and ASR key stay pinned while eligible. Round-robin after each ASR clip and automatic rotation after each AUTO50 journal are removed. Provider/model cooldowns and Retry-After remain authoritative; pronunciation/format failures do not cool another key. Actual TTS chunk slot is recorded in new cache entries; existing READY files stay unchanged. Tien_do shows actual stage, cohort progress and pinned keys; release label rows33-34 are reserved.

Validation: 33 focused tests pass (24 existing plus 9 new policy tests), including actual routing cooldown exclusion, 30-pass barrier, 13-word stage tail, in-flight adoption, source identity, ASR sticky/failover, and cache provenance. Full app contracts and browser runtime must also pass before commit. Production source backup and immutable Apps Script version27/tag run-20261021-0800 remain available.

Release evidence: Apps Script version29 pushed as36 production files; immutable version27 and original release tag retained. All33 focused tests,46 capability/168 contract guards and Chromium390/1440 pass. Live09:01 VN retained TTS key7 for consecutive saved chunks; one12-word tail cohort is active. Provider model cooldown may change models on the same key. ASR sticky behavior is covered by tests; live confirmation follows when the master reaches ASR. Original user release label is preserved.

## Full 50-word masters and Gemini text adjudication - 2026-10-21

Owner replaces the earlier chunked/cohort flow: reserve 50 unresolved source entries, generate exactly one full master, request pauses and normalize measured inter-word gaps to 1.2 seconds, cut exactly one clip per entry, run two independent blind ASR passes in five-clip requests, then ask Gemini once with the text evidence to adjudicate all entries. Deterministic code validates identity/uniqueness/evidence/schema and performs Drive/Sheet I/O. There is no singleton TTS fallback or local pronunciation matcher in this flow. A stage tail below50 is explicit and never padded with READY words. Existing saved audio/cache, one generator and HSK2-4 ->1 ->5 ->6 remain.

Worker additive batch50 flag accepts bounded12MB masters only on the authorized full-batch route; legacy routes retain10-item/1.5MB limits. Authenticated judge-50 uses the ASR text model; expected answers never enter either ASR prompt. TTS failures with ambiguous outcomes inspect deterministic saved master names rather than issuing another paid request. Key/model Retry-After remains authoritative. Gemini decisions and blind evidence remain auditable. At most25 clips per ASR step; cheap checkpointed phases advance in the same timer instead of waiting one minute per phase.

Rollout first runs an isolated50-word end-to-end probe in a separate Sheet/folder, then activates only after measured50 boundaries and at least30 verified results. Migration requeues only rows parked by the obsolete local matcher once after the probe passes, with a fresh bounded three-master budget; prior refusals/READY remain intact. Legacy sources/contracts stay available for rollback. New tests cover full-master payload, byte bounds, tail, missing boundaries, exact silence, no duplicate paid generation, duplicate/missing evidence, source identity, bounded failures and blind ASR. See final live evidence below.

Final full50 release evidence (Apps Script version31): 49 focused tests PASS, append-only47 capabilities/175 guards PASS, Chromium390/1440 PASS. One isolated50-word TTS master produced2,936,038 raw WAV bytes, exactly50 detected speech regions and measured1.2s normalized gaps; the full probe saved49/50 clips and retained1 unverified item. Real text-model adversarial checks exposed over-permissive neutral-tone and substring matching; strict-tone-v3 explicitly constrains dictionary variants and structurally rejects missing/extra Han syllables and non-unique mappings. The correct canary passes; wrong tone/reading, inconsistent or missing evidence and extra speech do not. Mapping guards downgrade only contested clips and preserve original rejected decisions in the audit result.

Save performance: one cache read per timer, in-memory master/evidence reuse, bounded metadata appends and contiguous clip-checkpoint writes replace repeated full-cache scans per word. Original READY audio remains immutable. Worker source was read back exactly and all38 bindings preserved after each additive deployment. Production resumed the new protocol for the remaining HSK2-4 words; these remain subject to quality checks, not forced approval. Prior versions27/29 and their tags remain rollback anchors; no frontend deployment or main merge.


## One TTS producer and two ASR consumers - 2026-10-21
Owner requests adding parallel verification to the current stable rollback, rather than restoring or fixing another pipeline. archives/voice-parallel-1tts-2asr-20261021 records only changed modules against exact live source hashes. Producer and two batch consumer leases survive interruptions; provider calls release the short commit lock; stale owners, pause and source edits reject writes. Existing matcher, READY files, VN timezone and HSK stage/manual-review behavior remain. A three-master queue bound limits generation ahead. 20 new behavior tests pass; the restored focused suite has the same one pre-existing failure (30/31) before and after. Production rollback snapshot is retained on the authorized desktop; rollout and live evidence are recorded separately.
