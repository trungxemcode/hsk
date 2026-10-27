# HSK — Shared AI Instructions

Source of truth: `https://github.com/trungxemcode/hsk`, branch `main`.
Preferred workspace on this Windows PC: `C:\Users\LENOVO\hsk`.
The older `C:\New folder\hsk` is a secondary checkout, not a separate app or source of truth.

## Cơ chế app
Đọc [CO_CHE_APP.md](CO_CHE_APP.md) để hiểu điểm cắm module, dữ liệu, PWA iOS/Android, backend và quy trình sửa an toàn. Khi thay đổi cơ chế, cập nhật mục tương ứng theo code đã kiểm chứng.

## Start a coding task (fast)
1. Read this file. Run `git status -sb`, `git branch --show-current`, and `git log -1 --oneline` in the current checkout.
2. Check `docs/ai/TASK_STATE.md` only when resuming work; inspect the relevant section of `docs/ai/PROJECT_MAP.md` only for the feature being changed.
3. Prefer symbol/file search (Serena when available), then read the functions and dependencies that matter. Do not dump or re-read the whole repo.
4. For fresh GitHub code, `git fetch origin main` and inspect the divergence. Only fast-forward a clean local `main`; never discard uncommitted or untracked files. When a checkout is dirty, preserve it and report the conflict rather than resetting it.
5. Verify affected behavior, commit to an appropriate feature branch, and open a PR. Merge/deploy only when the user authorizes it. Never silently force-push or reset `main`.

## Architecture shortcuts
- This is a static browser HSK 1–6 app (HTML/CSS/vanilla JS), GitHub Pages + PWA, not a frontend npm build. Primary shell `index.html`, `loader.js`, `app.js`, `src/modules/shell/studio.js`.
- Home/mobile JS: `src/modules/shell/`; root CSS: `home-overview.css`, `mobile-ux.css`, `studio-layout.css`, `ui-buttons.css`. Published baseline: **3.4.12**; module-refactor candidate **3.4.16** is branch-only until explicitly merged. Check GitHub for newer releases.
- Lessons, study plan, exams, SRS, notebook, auth/sync and AI have separate modules: use `docs/ai/PROJECT_MAP.md` for paths and data boundaries.
- Firebase/Auth/Firestore and Cloudflare/Gemini Worker are distinct from the static site. Never commit secrets.
- Keep stable storage keys, Firebase data contracts, existing UI controls, score/SRS behavior and genuine HSK goal/filter separation.

## Source layout after phase 4–5
- Feature JS lives under `src/modules/<feature>/`; account and study-sync share `src/modules/account/` because their CommonJS cores depend on each other. CSS/config URLs stay at root.
- Ten static learning packs and their gzip variants live in `content/data/`. `loader.js` loads ordered classic scripts, including `src/utils/text.js`, `src/utils/format.js`, dictionary search-core and `src/ui/dictionary-relations.js`, before `app.js`.
- Keep root `index.html`, `loader.js`, `app.js`, workers, PWA/push entrypoints and vendor URLs stable. `app.js` still owns state, storage and SRS scheduling; extracted helpers keep the original shared scope.
- Change paths in `tools/pwa-assets.json` and consumers, rebuild hashes, preserve legacy aliases. The installer can reuse verified old-URL cached bytes after a move. Run `tools/check-module-loading-ui.cjs` for gzip/fallback and worker imports under `/hsk/`.

## Feature preservation (non-negotiable)
- The user prohibits accidental feature removal. Read `docs/ai/FEATURE_PRESERVATION.md` and `tools/feature-contract.json` before editing a feature. Preserve the existing route, public API, behavior, storage keys and tests unless the user explicitly requests deletion.
- Run `python tools/check-feature-preservation.py --base origin/main` and `node tools/check-feature-runtime.cjs` (with Playwright) before PR. Add an entry/test for every new feature. Do NOT delete or weaken contracts, skip tests, or add an inline removal exception to satisfy CI.
- An intentional deletion requires a SEPARATE, owner-reviewed approval-only PR for `tools/approved-feature-removals.json`, merged before any code deletion PR. Protect `main` with required CI and CODEOWNERS reviews as documented. No direct-to-main pushes.

## Quality gates
- Run narrow unit/DOM tests for edited modules first, then regression checks for shared UI/data changes.
- Server tests: `node --test server/*.test.mjs` (PowerShell: `node --test (Get-ChildItem server -Filter '*.test.mjs').FullName`).
- Useful UI checks (Playwright): `tools/check-home-overview-ui.cjs`, `tools/check-responsive-goal-ui.cjs`, `tools/check-mobile-ux-ui.cjs`, `tools/check-ai-loading-ui.cjs`. See `.github/workflows/studio-ui.yml` for the full CI set.
- **Release naming (user policy):** the new release line starts at `3.1.1`. Increment the last component for fixes/improvements within an existing feature, or the middle component for a major feature addition (reset last to 1). Keep major `3` until the user explicitly requests a change. Label releases `Bản X.Y.Z (Nội dung cập nhật)`.
- **PWA release safety net:** before committing any frontend JS/CSS/HTML/content update on a feature branch, run `python tools/prepare-pwa-release.py --note "Mô tả ngắn"` to automatically choose the next patch release and regenerate the 159+ offline asset hashes. Use `--bump minor` for major feature additions. Stage `offline.js`, `offline-worker.js`, `OneSignalSDKWorker.js`, and `app-version.json` together. `python tools/check-pwa-release.py --base origin/main` and `.github/workflows/pwa-release-guard.yml` reject stale versions, missing assets and checksum mismatches. The post-merge workflow verifies live GitHub Pages before considering the iPhone release complete. Server-only changes need no PWA download; documents-only changes do not bump.

## Token-efficient handoff
- Do not recite the README or rescan unchanged files. Cite paths/symbols, minimal command output, and focused test results.
- If the task changes a verified subsystem, update only its section of `docs/ai/PROJECT_MAP.md`; use `docs/ai/TASK_STATE.md` as a brief handoff with current task, decisions, affected files, tests and blockers.
- Treat all notes as a map, **not** as a replacement for checking changed code or current `git status`.
- Do not store tokens, credentials, personal user data, or API keys in AI handoff files.
