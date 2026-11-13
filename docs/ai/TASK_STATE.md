# Current task: Pha 5 — Hợp nhất chuẩn hóa phản hồi Hỏi đáp AI (2026-11-13)

Nhánh: `refactor/phase5-next-duplication` (tách từ `main` tại `6068ab0`, cập nhật PWA `5.1.1`).

Thay đổi đã thực hiện (không đổi giao diện, layout, CSS, phân quyền, quota hay luồng nhạc):
1. **Thêm `HSKAIQACore.normalizeAiQaResponse(raw, options)` trong `src/modules/ai-coach/ai-qa-core.js`:**
   - Hợp nhất bước giải nén payload Hỏi đáp AI (`cleanWrapperTags`, `parseJsonLoose`, `unwrapAiQaPayload`), kiểm tra `OUT_OF_SCOPE`, kiểm tra độ dài/rỗng của `answer`, chuẩn hóa `primaryNodeKey` / `nodeLabel` / `coreRuleSummary` (có `fallbackNodeKey`), `explanationStrategyUsed`, `suggestedQuestions` (`kind` / `type`, tối đa 3 câu dài ≥ 4 ký tự), `optionalMicroCheck` và `memoryCandidates` (tối đa 8).
   - Giữ nguyên tùy chọn `rejectMalformedJson` (bắt lỗi JSON hỏng nhưng cho phép văn bản thuần cắt gọn 5000 ký tự) và `incompleteError` theo từng ngữ cảnh gọi.
2. **Tái sử dụng tại hai điểm gọi frontend (`index.html` đã nạp `ai-qa-core.js` trước cả hai module):**
   - `src/modules/ai-coach/ai-provider-picker.js` (`tryDirectAsk`): thay khối tự parse JSON/fenced và chuẩn hóa trường trùng lặp bằng `HSKAIQACore.normalizeAiQaResponse(answerText, { rejectMalformedJson: true, incompleteError: 'Gia sư AI trả về dữ liệu chưa đầy đủ. Hãy thử lại.' })`.
   - `src/modules/ai-coach/ai-qa.js` (`ask`): thay `unwrapAiQaPayload` + kiểm tra rỗng/5000 + dựng `targetNodeKey`/`nodeLabel`/`coreRuleSummary` trùng lặp bằng `HSKAIQACore.normalizeAiQaResponse(data, { incompleteError: 'Câu trả lời chưa đầy đủ. Hãy thử lại.', fallbackNodeKey: 'topic:' + assistantId })`.
3. **Kiểm thử & PWA:**
   - Thêm 3 unit test trong `server/ai-qa-core.test.mjs` (tổng 9/9 pass) và chạy toàn bộ `node --test server/*.test.mjs` (491/491): PASS.
   - `check-ai-qa-ui.cjs`, `check-ai-loading-ui.cjs`, `check-ai-coach-dom.cjs`, `check-pwa-relocation-ui.cjs`, `check-module-loading-ui.cjs`, `check-feature-runtime.cjs`, `check-feature-preservation.py --base origin/main`, `check-pwa-release.py --base origin/main`: PASS (`5.1.1`, 216 assets).

# Previous task (merged PR #409): Pha 4 — Hợp nhất helper tải & xác thực cấu hình AI frontend (2026-11-13)

Nhánh: `refactor/phase4-frontend-ai-config` (tách từ `main` tại `59cc2e6`, cập nhật PWA `4.4.44`).

Thay đổi đã thực hiện (không đổi giao diện, layout, CSS, phân quyền, quota hay luồng nhạc):
1. **Thêm helper dùng chung `src/utils/ai-config.js` (`window.HSKAIConfig`, UMD/IIFE hỗ trợ cả trình duyệt và Node):**
   - Tách `validateTranslationConfig(config)` và `loadTranslationConfig({ url, cache, signal, fetchFn })` để chuẩn hóa việc gọi `fetch('./translation-config.json', { cache: 'no-store' })` và kiểm tra `enabled && typeof endpoint === 'string' && new URL(endpoint).protocol === 'https:'`, trả `null` khi lỗi/chưa bật/không phải `https:`.
   - Nạp `<script src="./src/utils/ai-config.js" defer=""></script>` đầu danh sách script `defer` trong `index.html` (trước các module gọi và trước `loader.js`), đồng thời khai báo trong `tools/pwa-assets.json`.
2. **Áp dụng có chọn lọc cho 6 caller khởi động có hành vi hoàn toàn tương đồng:**
   - `src/modules/ai-coach/ai-qa.js`, `src/modules/ai-coach/ai-teacher.js`, `src/modules/dictionary/open-dictionary.js`, `src/modules/handwriting/handwriting.js`, `src/modules/notebook/notebook-factory.js`, `src/modules/reading/real-reading.js`.
   - Giữ nguyên các caller có ngữ nghĩa riêng hoặc có bài test DOM nạp file đơn lẻ không qua `index.html` (`admin.js`, `music.js`, `music-transcript.js`, `personal-ai-settings.js`, `original-reading.js`, `practice-generator-core.js`, `sentence-editor.js`, `translator.js`, `ocr.js`, `planner.js`, `ai-coach.js`, `placement.js`, `lesson-chat.js`).
3. **Kiểm thử & PWA:**
   - Thêm unit test `server/ai-config.test.mjs` (4 tests); `node --test server/ai-config.test.mjs server/app-helpers.test.mjs server/ai-qa-core.test.mjs` (18/18) và toàn bộ `node --test "server/*.test.mjs"` (488/488): PASS.
   - `check-feature-preservation.py --base origin/main` (98 capabilities; 447 guards), `check-module-loading-ui.cjs` (gzip / no-api / broken-gzip), `check-ai-qa-ui.cjs`, `check-real-reading-ui.cjs`, `check-notebook-factory-ui.cjs`, `check-word-recovery-ui.cjs`, `check-feature-runtime.cjs`, `check-ai-loading-ui.cjs`, `check-home-overview-ui.cjs`, `check-mobile-ux-ui.cjs`, `check-open-dictionary-dom.cjs`, `check-notebook-factory-dom.cjs`, `check-ai-coach-dom.cjs`, `check-placement-dom.cjs`, `check-chat-mobile-ui.cjs`, `check-pwa-relocation-ui.cjs`: PASS.
   - `prepare-pwa-release.py` (`4.4.44`, 216 assets) & `check-pwa-release.py --base origin/main`: PASS.

# Previous task (merged PR #408): Pha 3 — Hợp nhất nạp danh sách model & tổng hợp khả năng AI cá nhân phía Worker (2026-11-13)

Nhánh: `refactor/phase3-duplicate-code` (tách từ `main` tại `edeaa5e`, giữ nguyên bản PWA `4.4.43` vì chỉ sửa `server/` và tài liệu).

Thay đổi đã thực hiện (chỉ phía `server/`, không đổi giao diện, quota, PWA hay hành vi iPhone):
1. **Hợp nhất cơ chế lấy và phân tích `/models` trong `server/personal-ai.mjs`:**
   - Tách `STATIC_PROVIDER_MODELS`, `PROVIDER_MODEL_SPECS` và `fetchProviderModels(...)` dùng chung cho cả `probePersonalAiCapabilities` và `fetchPersonalAiModels`, loại bỏ lặp lại URL, header xác thực và bộ lọc JSON của từng nhà cung cấp (`openai`, `deepseek`, `gemini`, `claude`, `custom`, `fosta`, `chatgpt-cookie`, `muse-cookie`) trong khi giữ nguyên chính sách `redirect` (`manual` khi probe, `follow` khi fetch), bộ lọc probe, thông báo lỗi và bản sao tĩnh.
   - Tách `personalProviderSummary` dùng chung trong `loadAllPersonalProviders` để tránh lặp object tổng hợp nhà cung cấp.
2. **Hợp nhất tổng hợp khả năng AI tài khoản trong `server/translator-worker.mjs` (và đồng bộ `server/translator-worker-bundled.mjs` qua `tools/build-worker-bundle.cjs`):**
   - Tách helper `resolveAccountProviders(uid)` thay cho 2 khối lặp giống hệt nhau tại `/ai-providers` và `/account-role`.
3. **Kiểm thử hồi quy:**
   - Thêm 2 test mới trong `server/personal-ai.test.mjs` kiểm tra `fetchPersonalAiModels` + `probePersonalAiCapabilities` cho các nhà cung cấp (`openai`, `deepseek`, `gemini`, `claude`, `custom`, `chatgpt-cookie`) và tính nhất quán giữa `/ai-providers` với `/account-role`.
   - `node --test server/personal-ai.test.mjs` (16/16), `node --test server/translator-worker.test.mjs` (26/26), `node --test "server/*.test.mjs"` (484/484): PASS.
   - `check-feature-preservation.py --base origin/main` (98 capabilities; 447 guards) & `check-pwa-release.py --base origin/main` (215 assets, 0 client changes): PASS.

# Previous task (merged PR #407): Pha 2 — Dọn dẹp frontend AI (`personal-ai-settings.js` & thinking indicator) (2026-11-13)

Nhánh: `refactor/frontend-ai-settings-and-loading` (tách từ `main` tại `94d010c`, chuẩn bị bản `4.4.43`).

Thay đổi đã thực hiện:
1. **Hợp nhất helper gọi `/personal-ai-settings` trong `src/modules/account/personal-ai-settings.js`:**
   - Gộp logic nạp `./translation-config.json`, lấy `user.getIdToken()`, kiểm tra `https:`, gọi `POST /personal-ai-settings`, xử lý `404` và parse JSON vào `callPersonalAiSettings(op, settings, user, { checkAbort })`.
   - Dùng chung cho cả `fetchSupportedModels` (`op: 'models'`) và `request` (`read/save/remove`), giữ nguyên `requestId` race guard và `lock(true/false)`.
2. **Hợp nhất vòng đời thinking indicator trong `src/modules/ai-coach/ai-qa-core.js`, `ai-qa.js`, `sentence-editor.js`:**
   - Thêm `HSKAIQACore.createThinkingIndicator({ container, insertCard, steps, extraRate, onStart, onTick, onStop })` trong `ai-qa-core.js`.
   - `ai-qa.js` và `sentence-editor.js` dùng chung helper này thay cho 2 bản sao `startThinkingIndicator` / `stopThinkingIndicator` riêng biệt, giữ nguyên bước suy luận, aria-live, timer và hành vi DOM từng màn hình.
3. **Kiểm thử & PWA:**
   - `node --test server/ai-qa-core.test.mjs server/personal-ai.test.mjs`: 20/20 pass.
   - `check-ai-loading-ui.cjs` (390 & 1440), `check-sentence-checker.cjs`, `check-ai-qa-ui.cjs` (390 & 1440), `check-feature-runtime.cjs` (390 & 1440): PASS.
   - `check-feature-preservation.py --base origin/main` (98 capabilities; 447 guards): PASS.
   - `prepare-pwa-release.py` + `check-pwa-release.py --base origin/main`: PASS (`4.4.43`, 215 assets).

# Previous task (merged PR #406): Pha 1 — Hợp nhất fallback Sửa câu & chuẩn hóa URL /models trên Worker (2026-11-13)

Nhánh: `refactor/worker-sentence-fallback-and-models` (tách từ `main` tại `dd4ffbe`, bản `4.4.42`).

Thay đổi đã thực hiện (chỉ phía `server/`, không đổi giao diện/PWA):
1. **Gom fallback Sửa câu trong `server/translator-worker.mjs` (và đồng bộ `server/translator-worker-bundled.mjs`):**
   - Hợp nhất 3 nhánh `hsk-sentence-editor-fallback-to-gemini*` vào helper `runSentenceEditorGeminiFallback` + `extractCandidateText` + cờ `sentenceFallbackUsed`.
   - Khắc phục lỗi `reviewModel` bị giữ lại model riêng cũ (ví dụ `muse-spark`) sau khi fallback sang Gemini, đồng thời dùng đúng `activePayload` cho `modelVersion` và `qaUsage`.
   - Bảo đảm không phát sinh fallback lần 2 khi Gemini fallback lỗi và tôn trọng `controller.signal.aborted`.
2. **Hợp nhất chuẩn hóa `/models` trong `server/personal-ai.mjs`:**
   - Tách `resolveCustomModelsUrl` và `parseOpenAiModelsList` dùng chung cho cả `probePersonalAiCapabilities` và `fetchPersonalAiModels`.
3. **Kiểm thử & Triển khai:**
   - Thêm test trong `server/personal-ai.test.mjs` cho 3 ca: provider riêng thành công, fallback 1 lần khi sai định dạng (kiểm tra `aiSource`), và không fallback lần 2 khi Gemini lỗi.
   - Đạt 482/482 server tests, `check-feature-preservation.py` (98/98) và `check-pwa-release.py`.

# Previous task: Auto-fetch and apply supported AI models for custom/API providers (2026-11-12)

Built the auto-fetch model feature for custom (OpenAI-compatible) and personal AI providers on branch `feat/auto-fetch-custom-models`:
1. **Server (`server/personal-ai.mjs`, `server/translator-worker.mjs`, `server/translator-worker-bundled.mjs`):**
   - Added `fetchPersonalAiModels(config, { fetchFn, signal })` supporting custom OpenAI-compatible endpoints (`/models`), DeepSeek, OpenAI, Gemini, Claude, and FOSTA.
   - Added `op: 'models'` handling to `/personal-ai-settings` route on Cloudflare Worker. Supports explicit API keys or automatically retrieves and decrypts stored credentials if the key field is empty.
   - Deployed Cloudflare Worker immediately: Current Version ID `bd74c6e5-ac05-4d21-a5ad-0fd95e112f32`.
2. **Frontend UI & Interactive Model Picker (`index.html`, `studio-layout.css`, `src/modules/account/personal-ai-settings.js`):**
   - Added "Lấy danh sách model" button next to Model field (`#personalAiFetchModels`).
   - Added interactive model selector card list container (`#personalAiModelListContainer` & `#personalAiModelList`).
   - Cards show model ID (monospace bold), description / developer info, active badge ("Đang dùng"), and "Áp dụng" button.
   - Clicking any model card automatically applies it to `#personalAiModel`, highlights the selection, and updates the status message.
   - Auto-fetches in background when custom endpoint is configured or provider changes; supports on-demand refresh.
   - Direct fetch fallback when CORS is enabled on provider, with secure fallback to Cloudflare Worker `/personal-ai-settings` `op: 'models'`.
3. **Verification & Quality Gates:**
   - 481/481 server tests passed (added new test verifying `op: 'models'` with custom provider and stored credentials).
   - Feature preservation check passed (98 capabilities, 447 guards).
   - Runtime 390px and 1440px checks passed (`tools/check-feature-runtime.cjs`).
   - PWA release prepared and verified: `4.4.42` (`hsk-offline-4-4-42`, 215 assets).
   - All files saved with pure LF line endings.

# Previous task: PWA Asset SHA-256 CRLF line ending mismatch fix (2026-11-12)

Fixed the PWA service worker download failure: `Tệp src/modules/account/personal-ai-settings.js chưa khớp phiên bản sau 3 lần tải`.

Root cause:
- `src/modules/account/personal-ai-settings.js` contained duplicate carriage returns (`\r\r\n` / CR-CR-LF).
- `build-version.py` normalized `\r\n` to `\n` in memory, computing the SHA-256 for the LF version (`d9b4ed...`), while GitHub Pages served the raw git blob containing CRLF (`749f62...`).
- When ServiceWorker `offline-worker.js` digested the downloaded bytes, the hash didn't match `asset.sha256` in `app-version.json`.

Solution & Hardening:
1. Normalized `src/modules/account/personal-ai-settings.js` to pure LF (`\n`, 7132 bytes).
2. Added CRLF-to-LF fallback normalization in `offline-worker.js` during asset verification, immunizing all text files from line ending discrepancies.
3. Updated `build-version.py` and `tools/check-pwa-release.py` with `.replace(b'\r', b'')` safety net.
4. Added `src/**/*.js text eol=lf` to `.gitattributes`.
5. Bumped PWA release to `4.4.41` (`hsk-offline-4-4-41`).
6. All 480 server tests, feature preservation (98 capabilities), sentence editor UI and feature runtime (390px/1440px) passed.
7. Pushed to branch `fix/pwa-asset-hash-mismatch`. PR link: `https://github.com/trungxemcode/hsk/pull/new/fix/pwa-asset-hash-mismatch`.

# Previous task: Universal AI response unwrapping filter & JSX/XML wrapper resilience (2026-11-12)

Resolved the issue where LLM responses wrapped in XML/JSX tags (e.g. `<text preserveWhitespace>{JSON.stringify({primaryNodeKey:...})}</text>`) and unquoted JS object keys caused raw wrapper code to be rendered in the AI Coach chat and sentence editor.

Key enhancements implemented across server and client:
1. **Universal Tag & Wrapper Stripping (`cleanWrapperTags`):**
   - Automatically removes `<text...>`, `<output...>`, `<response...>`, `<result...>`, `<json...>`, `<think...>`, and `<escape...>` tags.
   - Unwraps `{JSON.stringify(...)}` and `JSON.stringify(...)` wrappers.
2. **Robust Multi-Strategy Parser (`parseJsonLoose`, `cleanAndParseAiResponse`, `tryParseJson`):**
   - Strips trailing commas (`,\s*([}\]])` -> `$1`).
   - Quotes unquoted JavaScript keys (`([{,\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:` -> `$1"$2":`).
   - Fixes raw control characters (newlines/tabs inside strings).
   - Balanced brace scanning to recover embedded objects from noisy LLM stream context.
   - Regex fallback extraction for fields like `answer`, `content`, `primaryNodeKey`, `nodeLabel`.
   - Handles nested stringified JSON in `answer` recursively.
   - Maps `type` to `kind` in `suggestedQuestions` chips.
3. **Verification & Deployment:**
   - 480 server tests in `server/*.test.mjs` passed (including new tests for JSX/XML wrappers and unquoted object keys).
   - Sentence editor runtime tests (`tools/check-sentence-checker.cjs`) passed.
   - Runtime 390px and 1440px checks passed (`tools/check-feature-runtime.cjs`).
   - Feature preservation check passed (98 capabilities, 447 guards).
   - PWA release integrity checked with `python tools/check-pwa-release.py` (215 assets verified, 4.4.40).
   - Deployed Cloudflare Worker: `hsk-vietnamese-translator` triggers updated (`Current Version ID: c1e1e103-75bf-439f-a3cb-9cc236cb4ebb`).
   - Pushed commit to `origin/fix/muse-long-response-resilience`.

# Previous task: ChatGPT Cookie mechanism for AI Q&A (2026-11-08)

Implemented the 4-pillar ChatGPT Web Cookie architecture on branch `feat/chatgpt-cookie-ai-qa` based on the design specification:
1. **TLS Impersonation & Stateless Cookie Manager (`server/chatgpt-cookie/core/`, `server/chatgpt-cookie.mjs`):** Exchanges `__Secure-next-auth.session-token` for `accessToken` via `/api/auth/session` (cached 1h with 5m buffer), sends stateless requests (`history_and_training_disabled: true`) to `/backend-api/conversation`, parses SSE streams, and hides temporary conversations (`PATCH is_visible: false`). Supports both shared server cookie (`CHATGPT_SESSION_TOKEN` / `CHATGPT_COOKIE_BRIDGE_URL`) and per-user encrypted cookie (`provider: 'chatgpt-cookie'` in `personal-ai.mjs` / `#personalAiProvider`).
2. **3-Layer AI Guardrail (`server/chatgpt-cookie/security/guardrail.py`, `src/modules/ai-coach/ai-qa-core.js`, `server/chatgpt-cookie.mjs`):** 0ms local cooldown, jailbreak & off-topic regex filtering, Chinese character / HSK keyword validation, document validation (≥10 Chinese characters), and Sandwich Defense (`<student_input>` + `{"error": "OUT_OF_SCOPE"}`).
3. **Local RAG Project Engine (`server/chatgpt-cookie/projects/`, `src/modules/ai-coach/qa-project-sources.js`):** Hybrid Chinese-Vietnamese tokenizer (Vietnamese/Latin words + Han unigrams + Han bigrams), overlapping 400-char chunking, BM25Okapi ranking, and 4-turn sliding window history.
4. **Dynamic Memory Personalization (`server/chatgpt-cookie/personalization/memory_manager.py`, `server/chatgpt-cookie.mjs`):** Injects `<student_memory_profile>` XML and extracts piggyback `memory_update` (`detected_weak_vocab`, `detected_weak_grammar`, `new_personal_fact`) with FIFO bounds and HSK `memoryCandidates` mapping.

# Previous task: AI Q&A tutor and 99% progress boundary (2026-11-06)

Implemented the Tools → `Hỏi đáp AI` route on `feat/ai-tutor-v5-hardening`. The responsive chat acts as an HSK tutor for Chinese questions, study methods and roadmap reviews, reuses the existing authenticated `/lesson-ask` transport, and keeps a bounded per-account local chat history. Each roadmap request sends only a privacy-safe learning snapshot: target HSK, 30-day activity, vocabulary totals, practice aggregates, open mistakes and the existing mastery profile. The Worker has a dedicated `ai-qa` mode and proactive teacher prompt.

The 99% boundary is explicit and evidence-based: at least 20 recent attempts, at least 3 active study days, accuracy ≥99% and no repeated weakness with three or more observed errors. Once reached, the tutor confirms the skill and advances the learner to one next challenge; it does not keep the learner trapped fixing microscopic errors. Near mastery (≥95% with enough attempts) prioritizes only consequential or repeated errors. Source and bundled Worker revisions are synchronized at `hsk-reading-library-4-1-2-r3`; release manifest is `4.2.1-r2`.

Validation on 2026-11-06: AI Q&A refinement adds app-level HSK inheritance, desktop chat typography, borderless overflow actions, intent routing, UID-scoped understanding memory and evidence validation. `node --test server/ai-qa-core.test.mjs server/translator-worker.test.mjs` = 26 passed; `tools/check-ai-qa-ui.cjs` = responsive 390px and 1440px passed; `python tools/check-pwa-release.py` = 207 assets verified; `git diff --check` passes. Changes are still uncommitted and have not been pushed or submitted as a PR.

Implemented the proposal in `E:/download/gemini-code-1793804188754.md` on branch `feat/ai-smart-search`: per-account four-state mastery profile and delta sync, diagnostic probe/tutor loop engine, progressive hints with blind checks, deterministic content gates, delayed retest planner, bounded Worker `micro-tutor-pack` mode, and AI Teacher integration with mastery context and due-ret test banner. Added focused tests and PWA release `4.1.9` with 200 offline assets. Validation: 419 server tests, feature preservation, runtime 390/1440, module loading and PWA release guard pass. No PR/merge performed yet.

# Previous task: mobile animation performance

## 30/10/2026 — faster CI without reduced coverage
PR246 was merged atf998c14 while CI optimization was being prepared. Continue this optimization in ci/parallel-checks worktree hsk-parallel-ci fromf998c14, separate PR. No frontend changes; all21 routes are protected (84 states), no inherited account exemption. Changes to the visual guard/workflow itself force full comparisons so this CI-only PR validates the real matrix rather than reporting not-applicable.
Owner asked to reduce check latency. Baseline run41057146892: visual comparison635s, full job665s; mobile-and-learning442s; Studio serial79 commands remained a long-running bottleneck. Parallelize visual4 scenarios, Studio6 command shards, protected browser3 shards. Exact original79+15 command strings migrated into tools/ci-suites.json and verified against committed workflows. Required names ui-outside-scope/layout/mobile-and-learning become always-running aggregate gates validating all artifacts, exact SHA/base/scope, every test exactly once, all scenarios and all job conclusions. No rendered app changes or release bump. Unit sabotage tests cover dropped/duplicated/stale/failed/incomplete reports plus an actual failed subprocess. Final GitHub timings and results pending.

## 30/10/2026 — GitHub UI scope merge gate
Run41054967723 reduced flags to3 isolated rounded-logo pixels, all geometry/CSS equal, music fixture now passed all4 states. Added isolated bounded edge-sample AA recognition (both images, unchanged8-neighbourhood), no pixel-count allowance or region mask. Exact visible text/SVG/image attributes/font signatures added. Four unit cases include an actual isolated black-dot edit that still fails; browser sabotage tests protect styles, text and SVG. Reanalysis of all80 archived states passes. Final new-head CI remains required.
Owner clarified the unchanged-page rule must be enforced through GitHub Rules. Rule26203862 is ACTIVE, readback verified on main: required GitHub Actions ui-outside-scope, strict base, no bypass; other rules preserved. First run41051582385 flagged17 states. Investigation: most were raster/antialiasing noise (some raw0 vs zero-threshold detector nonzero); music390 light measured tab marker while hidden (0px vs68px). Repair test harness only: documented pixelmatch default perceptual0.1 with ZERO differing meaningful pixels, strict geometry and CSS including gradients/shadows/opacity, stable measurement, real viewport resize on both music builds, geometry JSON artifacts. No app/stylesheet/worker/release changes; scope remains account-only exclusion, normal lessons/music protected. Unit and real-browser sabotage controls detect1px movement, subtle CSS color, radius, gradient and changed text; focused repaired music390 light passes. Full final CI must be checked before reporting green. Public entries/admin fixture covered; authenticated learner dashboards/deeper modal states still need separate review.

## Mobile animation performance (2026-10-26)
Branch `fix/ios-animation-performance-20261026`, candidate 3.20.4. Stop the mobile shell observer self-loop with idempotent hidden setters; ignore independently rendered music/loading mutations. Decorate added controls incrementally instead of scanning the workspace on every text update. Coalesce music drag/scroll work with requestAnimationFrame; avoid playlist decoration on play-state changes and redundant nested menu entrance. Loading stage transitions use cancellable opacity WAAPI instead of forced offsetWidth layout. Audio lifecycle, MediaSession, sources and background playback are unchanged.

Deterministic Chromium touch-viewport check: 30 clock updates went from 32 shell updates / 30 global button scans to 0 / 0; one burst of 10 drag events went from 11 style writes to 2. These are work counts, not physical iPhone FPS. New regression check runs in studio UI CI and is protected in feature contract. Passed mobile UX, loading, feature runtime390/1440, music DOM, design tokens, real AAC background/MediaSession and queue motion390/1440, compact menu390/1440. AAC checks require the Google Chrome headless-shell runtime, since stock Playwright Chromium lacks the fixture codec. Physical iPhone/Safari validation remains outstanding; local WebKit runtime cannot launch without missing system libraries. No live deployment or merge performed.

## AI failure recovery (2026-10-26)
Owner stopped AI music transcription; live `/music-transcript` is disabled before provider/quota/R2 work. Manual LRC/SRT/JSON remains. Actual failures: 2.5 Flash 404/new-user access restriction; Gemini region400; then 3.8 overload503. Main text model stays3.5 Flash-Lite. Google states2.5 remains available to established users, not universally retired.

Branch fix/ai-resilience-20261026 adds classified region400→existing eligible text backup, compatible model fallback for model-access/temporary failure, per-key/model five-minute circuit and 30-second region circuit, no retries of caller400/refusal/cancellation; retains429 Retry-After/daily cooldown. Typed payload/schema stay unchanged. Scope excludes speech/video/audio generation and preserves Gemini-only policy. Logs contain model/status/category/timing only. No historical error-rate percentage established.

Live deploy a3c97ec6-7a41-435f-86b0-5cc6ff200f74 is additive over downloaded source SHA3405ae474e1cd05bc7e4bbbbfb3a1473b6a835f753a8db8d17b1c513981ed389. Six voice functions byte-identical; original class/bindings and voice route retained. Wrapper module is in E:\\download\\HSK-transcript-live-preserved on the authorized device. Canonical GitHub bundle remains separate and must not blindly overwrite live voice patches. Recovery flags true, fallback models3.1 Flash-Lite/3.6 Flash, transcript false. 301 server and12 live-package mocked checks pass; feature-preservation58/270 passes. Browser runtime and PR status should be verified from current results.

Base main9322ad9, live3.18.1. Admin YouTube→GitHub Actions→R2 is verified by run40163262374; importer User-Agent fix #192 merged. User confirmed native R2 background playback on phone.

3.18.2 candidate: main sheet has short actions instead of stacked forms; personal links and owner library imports use subviews, admin YouTube/File tabs, collapsed optional metadata, readable dark labels/white action text, inline personal errors, no stale loading status. Existing playback, queue and owner restrictions are preserved.

Checks: menu/import/native background UI390/1440, feature runtime390/1440, music DOM, token catalog and feature preservation53capabilities/235guards. Screenshots inspected locally. PR/release status should be checked on GitHub before resuming.

Smart music imports (3.18.2): owner import prefills the current YouTube URL. Debounced owner-only oEmbed lookup provides title/channel; existing lesson AI extracts only credits evidenced in the title, never treating channel as performer. Manual edits survive late responses; account changes abort/reset lookup. Composer persists through runner/R2 catalogue. Lookup failure remains nonblocking. Smart UI and metadata authorization tests cover these paths.

3.18.3 candidate: current R2 track menu exposes owner-only delete with confirmation. POST /api/admin/tracks/{sha256.mp3|m4a}/delete verifies Firebase fixed owner, validates audio key and published object, then deletes only that R2 object. UI clears current audio and refreshes local catalogue views after success. Personal history/playlists remain intact (old references become unavailable); previously buffered/cached bytes cannot be remotely revoked. Server and phone/desktop UI tests cover listener denial, cancellation and deletion.

Music name search candidate: public bounded/cached YouTube search through Worker, no cookies. Listener results play/save personal links; owner results prefill existing import, preserving owner-only publication. YouTube HTML parser may need maintenance; upstream failure has explicit link fallback.

Native-only correction: personal YouTube/search selections never mount a YouTube player. Exact video-ID provenance from R2 sourceUrl routes to persistent audio. Unpublished links save personal context and show explicit pending-import status without interrupting current audio. Owner import prefill uses selected source context. Legacy personal embed entry is blocked; no transparent/hidden iframe workaround. Real physical phone background behavior still needs device verification.

Import throughput: prefer source M4A/AAC and publish M4A to avoid MP3 re-encoding when possible; fallback sources transcode to AAC. Fragment concurrency4. Each workflow drains up to3 jobs sequentially with one setup, fresh signed claims per job; no extra fourth claim/lease. Schedule still roughly5min and GitHub can delay it. No dispatch credential added.

Strict no-YouTube-UI instruction also covers study lesson playback: YouTube lesson sources resolve exact video-ID R2 audio through a native adapter, preserving text/segment controls. No YT.Player constructor or iframe API loading remains active. Missing library audio has explicit status instead of embed fallback.

Artwork-only correction: derive R2 track thumbnails from existing sourceUrl video ID for cover, list, mini player, playlist and queue; use default art if source/image missing. Audio routes, playback events, media controls, importer and backend are unchanged.

Music visual polish only: transparent shared header, bounded browse grid for long titles, plain empty/status text, readable queue typography and compact playlist/peek actions. Scoped CSS overrides obsolete redesign surfaces. No application JS, source resolution, audio events or import/backend changes. Surface screenshots390/1440 and playback regression checks cover this update.

Queue interaction polish: measure the visible launcher as sheet origin (bottom inset, width and collapsed translation), keep it during drag/release/cancel. Only queue presentation/gesture functions change; playback and source resolution stay identical. Compact personal/admin search/actions and transparent subheader/optional fields. Browser touch-event checks390/1440 verify finger tracking and anchor geometry, cancel, form sizing and uninterrupted audio.

Music entry/scroll fix: shell retains one pending music route while module loads, exposes busy text, retries on hsk-music-ready and clears intent on another navigation or timeout. Music route resets scroll instantly; startup init does not overwrite an already opened music route. Chill browse scrolls in its own region below a non-sticky header, preserving expanded player layout. No audio playback/source/control changes. Delayed script/30-row scrolling test390/1440 covers first tap and header hit targets.

PR200 expanded with four startup optimizations: independent ordered music load + preload, early shell home, metadata-only public cache with network refresh, local performance marks and long-task samples. Study progress remains inline and AI overlay lifecycle preserved. Existing audio source/playback/MediaSession events are unchanged. Baseline/new controlled CPU4x/data-delay2500ms measurements and cache/security/fallback tests are in check-music-startup-ui.cjs; physical device target iPhone11+/Android4GB+, no physical-device result claimed.

Final startup QA: preserve explicit early account/translator/music route through study init; failed preloads retry with attempt query (WebKit). Startup Chromium AAC and WebKit DOM smoke pass; Windows WebKit decoder unsupported, physical iPhone not tested. Storage migration, SoundCloud, native background and placement route pass390/1440. Placement reload waits for actual plan readiness now that home appears early. PWA3.18.10/186 assets verified; PR200 pending CI, not merged.

WorkBuddy music-browse port candidate3.18.11: base main5a3dae3 (#200 merged). Source C:\Users\LENOVO\hsk\.workbuddy-ai\design\music-browse retained untouched. Isolated branch ui/workbuddy-music. Only presentation adapter/music CSS/canonical tokens plus PWA release/tests/docs. R2 native background, menu, artwork, startup and feature runtime verified390/1440; fluid grid sweep320–1920. Final targeted tests and CI status belong to PR. No merge authorized in this task.

3.18.12 follow-up: directly map supplied WorkBuddy stylesheet declarations to actual browse/hero/list/menu selectors instead of restyling by interpretation. Original transport JS unchanged. Browser chrome theme-color/background follows current app surface. Windows Chromium AAC fixture returned native media error4/NotSupportedError in this session; do not claim AAC regression suite passed. Separate MP3 fixture smoke used only for diagnosis; committed AAC tests are unchanged and CI remains authoritative. Source design remains untouched.

3.18.13 correction after owner visual rejection: use hero markup extracted directly from supplied WorkBuddy index.html, preserving cover wrapper, SVGs and action hierarchy. Header/filter nodes retain handlers but move into supplied sticky-wrap/inner structure; selectors now query panel rather than the former scrollport. Section recent header has source title/count/chevron nodes; playlist title matches source. Existing source/media methods remain unchanged. MP3 presentation smoke390/820/1440 + 41-width sweep, menu/delete390/1440 and DOM/link tests passed. Preserve committed AAC CI checks; Windows AAC decoder issue remains documented. Do not claim all prototype views are a pixel-exact full app replacement.

3.18.14: restore source menu heading/body and indicator/entry/view/equalizer animation. Archive complete unmodified owner prototype in docs/design/music-browse-source.html (reference only, not app/PWA runtime). Review automation scripts/PDF are not app runtime. Source expand button is only data-toast, no full-screen player markup exists in the supplied prototype or sibling design folder; original real full-screen transport retained.
Exact identity: canonicalize only YouTube source videoId to published R2 sourceUrl, dedupe displayed recents and future remembers without name matching or destructive migration. Separate menuSelection from actual playing URL; other-row menu no longer lies about the native audio source. Hero reads duration from native metadata (never range.max=100), initial play resolves the displayed exact track and calls existing openLink synchronously in click. New check-music-selection-ui tests delayed catalogue/alias dedupe/same-name separate IDs/first-click and other-row menu.
Protected functions verified byte-identical to base: mountCloudAudio/native lifecycle, syncBackgroundPlayer, syncMediaSession, requestLinkPlayback. Windows diagnostics use real MP3 explicitly due unsupported local AAC decoder; committed CI defaults retain AAC. Menu/delete, DOM, 41-width UI and source-selection tests passed before final publication; check PR for final CI.

Music sheet source fidelity (2026-10-26): branch fix/music-sheet-source-20261026 from main f6156eb. Source ZIP icons/geometry/system typography, single cancellable view animation, preserve closing geometry, ignore controls during drag capture, remove duplicate chevrons, reserve status space without stale playback pill. UI views390/430/820/1440, menu390/1440, native AAC background/MediaSession, delete auth, queue motion, feature runtime and DOM/link checks pass. Physical iPhone animation requires owner validation. design-qa.md records evidence. No merge authorized for this request.

2026-10-26 unified-music candidate3.19.1: owner chose timestamped LRC/SRT/JSON; stopped all Desktop Commander use at owner request. Local scratch git checkout from main141fb9a. One visible music entry, HSK filter for script-bearing R2 tracks; original study feature/route moved into shared tab, not removed. Read-only selectable cues, native time/gap/seek updates, selection-preserving follow, same audio/MediaSession, existing lesson AI context. Owner attaches scripts to existing songs through the track menu. Sidecar API requires deployment of server/music/cloud-worker.mjs; do not claim live script publication until deployed. No merge or deployment authorized yet. Tests and PR status must be read from actual results.

## Admin transcript / listener cover flip candidate (2026-10-26)
PR #212 is being revised to admin-only generation. The AI Worker verifies fixed OWNER_UID and directly reads/writes the existing R2 bucket; successful generation auto-saves shared draft lyrics. All listeners tap the playing cover to flip to read-only live lyrics and select text for AI lookup. No private scripts, normal-user creation or file/YouTube transcription. Manual owner LRC/SRT/JSON upload stays available. Both updated AI and music Workers need deploying; no deployment/merge performed. Real song accuracy is not yet benchmarked; AI output retains a draft label until admin reviews.

Validation: server suite 290 pass; owner-only creation, R2 autosave/public read, draft labels, deletion/cancellation/concurrent-write protection covered with mocked AI. Admin/listener flip UI and existing lyrics/selection/background checks pass at 390/844/1440. Browser font setup is test-only.

Final checks: existing feature runtime passes at 390/1440; flip screenshots inspected with CJK font; design tokens, 58-feature/270-guard preservation and PWA 190-asset integrity pass. Candidate 3.20.3 remains on PR #212.


## Moah popular 50 (27 Oct 2026)
User confirms download/redistribution permission. Remote manifest at C:/Users/LENOVO/hsk-lyrics/moah-batch-50.json contains 50 popular single songs (mashup removed), descriptions and references. GitHub first import 465821a19453de72a1ff2be5c9160e78 failed; local anonymous yt-dlp with EJS successfully downloaded P9mqCv1yhBE. Private staged R2 importer permits owner-authorized fallback, one audio/Cron then sequential Groq. Never claim 50 ready until staging/import/alignment status is checked. Pinyin restoration is machine-derived, not verified original lyrics; generated and restored drafts retain reviewed=false.

## Moah retry (28 Oct 2026)
All 50 audio tracks are public. The remaining 36 were uploaded as private 60s ASR clips and requeued once; counts are dynamic, inspect live library and private batch status. Fixed collapsed anchor gaps, bounded clip search, resumable 12-line Qwen restoration, description credit removal and literal English. Added verified canonical LRC fallback for repeated ASR omissions: >=98% source phonetics, strong independent audio anchors across recording; only observed original LRC line times, no simulated word times. Production configuration remains music Worker only; PR228 stays unmerged. Never report all scripts complete from queue submission. Current remote operating worktree C:/Users/LENOVO/hsk-moah-batch; private source/candidate/checkpoints C:/Users/LENOVO/hsk-lyrics. Do not commit credentials or preview capability files. Latest checks: 353 server tests, 3 Python tests, 61 features/300 guards, feature runtime390/1440 passed.


2026-10-28 VPS word timing / catalogue refresh: baseline Moah batch50/50 published line scripts (public51 including older song), character audit483/2125 cues; zero fully word-timed songs. Owner requests true word-level completion and live refresh. Work on VPS only. Branch feat/music-word-sync-refresh adds foreground/online/minute metadata refresh with throttle and preserves current lyrics flip/audio and text selection. New browser regression passes390/1440. Word alignment raw checkpoints /home/ubuntu/hsk-alignment/word-sync, hsk-word-align.service; candidates are not publication. Inspect actual services/results before status claims. No fabricated character timings.

## Character karaoke display correction (2026-10-28)
Owner reported whole-line white text on Bích Thượng Quan. Anonymous API confirmed 34 cues and zero character-timed cues. Keep auto-scroll and text selection, but line-only cues retain neutral text and opacity; only observed character onsets light characters. No synthetic interpolation. Add focused 390/844/1440 browser regression. Word enrichment remains partial; do not report all 50 as word-complete.

Khi chọn bài mới có `characters`, tự mở mặt lời/karaoke. Giữ nút quay về ảnh bìa; cập nhật script của cùng bài không ép mở lại nếu người dùng đang xem bìa. Phạm vi căn chữ: toàn bộ 51 bài hiện có, gồm 50 Moah và Bích Thượng Quan cũ. Chỉ hoàn tất khi dữ liệu mốc từng chữ của toàn bộ lời được kiểm chứng; mốc dòng không được tính là hoàn tất.

## Music lyric context and follow performance (2026-10-28)
Owner reported sticky line changes, slow AI and inappropriate HSK1 refusal. Route music selection through the existing general dictionary transport (open-dictionary), retaining sourceId/music scope and selected Hanzi with generated pinyin and at most 600 characters of lyric context. Ordinary lesson requests stay unchanged. Keep 32 in-memory user/context/history-scoped music answers; clear on account changes. Follow the actual media clock with a foreground-only RAF while the lyric face is open; defer line-centering geometry to one frame using element offsets, keeping selection/manual scroll and native audio intact. Focused music UI 390/844/1440 passes. No physical iPhone FPS claim or provider-latency guarantee. Web searches completed for all 51 catalogue titles; metadata-only human Vietsub source index is docs/music-vietsub-sources.json. Full Vietnamese lyric text has not been imported or claimed reviewed; do not substitute generated AI translations.

## 30/10/2026 — Local Site Designer
- Owner requested the custom local editor across all app pages. PR #236 / feat/local-home-designer, isolated worktree feat/local-site-designer, based on main 4efa262. Default app PC/mobile layout unchanged; modifications only apply after explicit local action.
- 44 views, live page adapter, per-page PC/mobile schema 2, v1 Home migration/merge, guarded selectors, undo/redo, CSS ordering without DOM moves. Fixed-position/dialog/player surfaces keep structural order. Admin preview exposes no permissions or backend data.
- Implementation/tests/docs in tools/home-designer, tools/serve-home-designer.py, tools/check-home-designer*.cjs, tools/check-site-designer-ui.cjs, tools/test_home_designer.py, docs/HOME_DESIGNER.md. Browser checks cover real app views and independent edits/reload/apply. No backend deployment or learner data changes. Candidate 3.22.2; not merged.

## 30/10/2026 — two-link cloud UX/UI sync
Owner requested a usable release link plus separate editor link with automatic publishing. Worktree /home/ubuntu/projects/hsk-cloud-designer, feat/cloud-ui-designer, based on PR236 head 8f29817. New independent Cloudflare Worker/UI storage; public Pages gets CSS without reload. No default geometry change; editing UI adds owner login/auto-save state. Preserve all prior local editor workflows. Release candidate 3.23.2. Verify CI/live deployment before claiming two usable links.

Cloud editor deployed and verified over real HTTPS at hsk-ui-designer.trung-hsk668.workers.dev: login dialog visible, state revision 0/CSS empty, account/push disabled, CSP and GitHub release CORS correct; anonymous write returns 401. CLI deployment endpoint unavailable in this session; official direct asset upload API succeeded using tools/deploy-design-editor.py. Release adapter is in PR237; do not claim production sync until Pages serves the merged release. Candidate 3.23.2 keeps localhost/default CI geometry separate via publicOrigins.

## 30/10/2026 — drag/position/border/animation editor tools
Owner reports missing direct object movement and Position/Border/Animation fields. Worktree /home/ubuntu/projects/hsk-designer-object-tools, feat/editor-object-tools, main baseline 104e615. Added direct per-object drag/resize, one-step undo, keyboard/Shift, inline text handling, scoped CSS controls, safe presets and reduced-motion support. Default app PC/mobile layout unchanged; only edited targets change. Preserve two-link owner-auth auto-publish and all legacy local workflows. Candidate 3.23.3; verify CI and deployment before claiming live availability.

## 30/10/2026 — editor rulers and disposable guides
PR238 follow-up: editor-only pixel rulers above/left, draggable horizontal/vertical guides, double-click/Delete/drag-out removal and clear button. Per-page/device in-memory state only; no project JSON, generated CSS or cloud publication. Hidden in Try mode; zoom uses iframe pixel coordinates. Editor chrome layout intentionally changes PC/mobile; release app geometry unchanged. Browser test extended for guide creation/movement/delete/zoom/isolation. Syntax, 10 core tests, feature-preservation64/330 and PWA193 integrity pass. UI/runtime attempts blocked: local Chromium fails socket() with Operation not permitted before opening; screenshots and pointer assertions remain unverified in this environment. Candidate3.23.4. Not merged/deployed.

## 30/10/2026 — automatic dedicated editor deployment
Branch ci/auto-deploy-editor from merged main6ddeda1. New push-main/manual workflow validates, packs and bundles dedicated Worker, deploys via existing direct-assets API and checks live release/all editor bytes. Serialized deployments; PR-only verifier checks have no deployment secrets. APP_RELEASE derives from release manifest. No layout/runtime data changes. Three verifier tests, four backend tests, PWA integrity, workflow YAML and feature contracts pass locally. No GitHub/Cloudflare API credentials available locally or on online VPS (only interactive Wrangler OAuth login); Actions secrets still require account owner setup. Do not claim unattended deployment active until secrets configured and a production run succeeds.

## 30/10/2026 — selected object ChatGPT editor
Owner requested API-key chat edits on selected boxes; confirms deployment Actions secrets configured. PR239 CI passed and merged e6eabe9, first production deployment pending verification. New feat/editor-chatgpt uses owner-only /__designer/chatgpt → OpenAI Responses with strict structured style patches, store:false, no arbitrary code. Session-only password key or optional OPENAI_API_KEY Actions/Worker secret; deploy retains secret_text bindings. Existing history/autosync; stale selection/manual changes reject late result. New editor inspector chat layout on PC/mobile only, public app geometry unchanged. Nine backend tests, ten core tests and three deployment tests pass. Cloud browser regression extends mock AI/edit/undo/stale request/key-storage checks; verify CI/screenshots before claiming live feature. Candidate3.23.6; feature not merged.

## 30/10/2026 — nested-object Hard-edit
Owner requests independent edits within grouped objects. New feat/editor-hard-edit based on merged e15a995 (ChatGPT and deployment verifier already merged). Hard-edit toggle scans nested DOM/SVG/image/span elements; geometric descendant hit-testing includes pointer-events:none without changing app hit testing or wrapping nodes. Immediate-parent navigation, ancestry buttons and direct-child list; existing drag/resize/schema/history/ChatGPT/autosync reused. SVG dimensions fall back to bounding rect. Editor toolbar/inspector PC/mobile changes only; public default geometry unchanged. Raster details/pseudo-elements/raw text nodes are not separate editable DOM objects. Core10, backend9 and feature67/341 pass; browser regression/screenshots pending. Candidate3.23.7; not merged.

## 30/10/2026 — independent gaps and multi-object layout (after PR242 merge)
Owner additionally requests separate horizontal/vertical spacing, marquee selection, multiple objects and alignment/distribution. Added columnGap/rowGap after existing gap (longhands override shorthand), schema-driven Python/browser exports unchanged. New multi.js owns editor-only rectangles, Ctrl/Cmd toggle, Shift add, marquee and pure union-bound alignment/edge-gap distribution. Parent+child selection aligns only outer parent; one history step retains selection, no DOM reorder/resize. Editor PC/mobile toolbar and inspector gain selection/alignment controls; public geometry unchanged until explicit owner edit. Core12 and feature69/347 pass. Real Chromium object regression passed on authorized VPS: modifier multi-select, equal centers, equal vertical edge gaps, one-step undo preserving selection, marquee, independent axis-gap override, Hard-edit and prior object editing behavior. Multiple-selection and phone preview screenshots inspected. Owner merged PR242 while this addition was being built, so publish this addition on a new PR from main a53a359. Not merged.

## 30/10/2026 — group drag + selected-object alignment only
Owner resumed only group dragging and alignment; explicitly excludes the stopped shell/header/sidebar auto-selection work. Branch fix/editor-group-drag from merged main27604f0. Retain selection on member pointerdown/click; one drag snapshot updates selected independent roots with shared bounded delta, freezes/restores all member transitions, supports atomic undo/Escape. Resize stays single-object. Alignment/marquee exclude selected ancestors, default key-object anchor is last selected, with selected-union alternative and removable selection chips. Layout declaration: only editor PC/mobile inspector reference/select-list controls added; public default geometry unchanged. Core13, backend9, feature71/351 and PWA193 pass. Real Chromium object regression passes on authorized VPS: all3 selected nodes move18px/12px together, selection persists, one undo and Escape restore all, fixed key-object anchor and hidden purple label assertions pass; group-drag screenshot inspected. GitHub CI still in progress. Stopped fix/editor-shell-align is not included.

Owner additionally asks to hide the floating purple selection toolbar obscuring text. Hide its bar, keep thin outline/resize corners and equivalent inspector controls. No shell/title/menu forced-edit changes.

## 30/10/2026 — scoped hands-free viewport layout
Owner reports excess space under the fullscreen auto-learning card and controls overlapping it; requests direct code only, no generated image. New branch fix/guided-fullscreen-layout from merged main703e597. Live read-only design state confirmed saved guided stage540px/footer169px/actions214px and translated controls (-173/-101/+73px). Add presentation-dialog-only structural CSS guard to restore auto heights/static flow/no translations for card/footer/actions/controls while preserving typography/colors and all manual-learning pages. High-specificity guard outranks saved designer scoped important rules without deleting any design configuration or learner data. Keep short-landscape side controls. Regression injects equivalent hostile design CSS over320/390/430/1440/1920 and short landscape; check card/footer gap, no overlap and button viewport containment. No audio/playback/storage JS changes. Candidate3.23.13; browser QA pending, not merged/deployed.

## 30/10/2026 — readable fullscreen type and centered pinyin
Owner reports text too small and joined pinyin; only hands-free viewport requested. New branch fix/guided-type-pinyin from merged main0d9b4c3. Viewport-relative reading fonts (desktop main up to64px/word120px/pinyin40px) retain fit-scale down to0.6. Pinyin full-width/auto margins/important center alignment. Core display-only formatter splits valid syllables with tones preserved, using Han count only for fully joined word strings, handles apostrophes/numeric tones and leaves unparseable chunks intact. Only render text uses formatting; source frames/data/speech unchanged. Two focused unit tests pass, browser regression pending. Candidate3.23.14, not merged/deployed.

## 30/10/2026 — account card spacing added to current UI PR
Owner additionally requests equal large-card gaps on Account. PC/mobile direct settings/voice/storage/version cards receive16px flow gaps and no saved per-card translations; no inner/auth/data changes. Regression guest/signed fixtures, light/dark390/1440 and saved offsets. Included alongside pending typography PR246 to keep PWA hashes consistent instead of competing release branches. Browser QA pending.

## Sentence grammar review (2026-11-10)
- Base: 886b972; branch fix/grammar-editor-review. Scope: sentence-editor only, PC/mobile.
- Fix replacement expansion with regex lookarounds; guard 二 in ordinals/compound numbers, add 帮忙 + person + action and missing 的 rules. Context/spelling guesses are style hints. Bound cache and correct transposition distance.
- Abort/invalidate AI on draft, account and route changes; validate spans, prefer AI on overlap, preserve dismiss on same draft and add session undo. Manual AI only, existing auth/quota unchanged.
- Tests: 7 core cases; Chromium checker covers screenshot example, apply/undo, dismiss, stale AI, 390/1440 layouts and zero automatic requests. Feature/PWA guards required. Provider mocked, not live AI acceptance.
- Release 4.4.26. No merge/deploy authorization in this task. Other agents: preserve these edits; rebase on main before merge/release to avoid PWA version conflicts.

### HSK ONNX Lite
- Branch `feat/hsk-onnx-lite` built on the grammar-editor fix. Adds an opt-in contextual ranker and model package in the Sửa câu tiếng Trung editor.
- 4.4.27 PWA candidate. Static rules remain the fallback. The experimental model ranks bounded HSK edits and was trained on synthetic examples. Broad Chinese benchmark and physical iPhone validation remain separate.
- Runtime check: `node tools/check-sentence-onnx-ui.cjs`. Reproduce the artifact with `tools/train-sentence-onnx.py` and update the worker asset hashes/version when shipping new weights.

### Grammar cards follow-up
- Base 332bfcc. Shared sentence-review normalizer replaces prose fallback with anchored cards, supports labelled revised paragraphs through bounded diff and structured edits.
- Local rules add formal-writing conjunction, causal redundancy, cultural collocation, prevent-negation and binary mismatch cases. Scope remains finite, no new broad neural grammar detector.
- All review paths keep edits on the supplied original. Test insertions, deletions, repeated text, emoji and reconstruction of the AI revision.

## ELECTRA 103 MB trial

- The sentence editor can open a pinned INT8 ELECTRA package from the device and mark suspected spans as review-only cards. Lite and AI remain separate. The large weights are not served by the PWA.
- Run `node tools/check-sentence-onnx-ui.cjs` for opt-in and lifecycle checks. Set `HSK_ELECTRA_PACKAGE` to the verified package to exercise actual inference through the same UI test.

- Follow-up: file selection survives switching tabs. The structural checker looks across clauses and covers multiple patterns per paragraph. Check negative examples alongside altered sentences to catch meaning-changing suggestions.

- Compound grammar follow-up: cover coordinated verb–object mismatches, broken incremental relations, two-sided subjects with one-sided predicates, and negative prevention across long noun phrases. Keep independent spans for simultaneous findings and preserve matched correct forms.
