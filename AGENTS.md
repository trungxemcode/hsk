# HSK — Shared AI Instructions

Source of truth: `https://github.com/trungxemcode/hsk`, branch `main`.
Preferred workspace on this Windows PC: `C:\Users\LENOVO\hsk`.
This is the **only supported local HSK checkout**. The former `C:\New folder\hsk` checkout was consolidated and should not be used. Serena and RTK are installed for this Windows user; `.serena/` and other machine-local agent configurations are ignored by Git.

## Start a coding task (fast)
1. Read this file. Run `git status -sb`, `git branch --show-current`, and `git log -1 --oneline` in the current checkout.
2. Check `docs/ai/TASK_STATE.md` only when resuming work; inspect the relevant section of `docs/ai/PROJECT_MAP.md` only for the feature being changed.
3. Prefer symbol/file search (Serena when available), then read the functions and dependencies that matter. Do not dump or re-read the whole repo.
4. For fresh GitHub code, `git fetch origin main` and inspect the divergence. Only fast-forward a clean local `main`; never discard uncommitted or untracked files. When a checkout is dirty, preserve it and report the conflict rather than resetting it.
5. Verify affected behavior, commit to an appropriate feature branch, and open a PR. Merge/deploy only when the user authorizes it. Never silently force-push or reset `main`.

## Architecture shortcuts
- This is a static browser HSK 1–6 app (HTML/CSS/vanilla JS), GitHub Pages + PWA, not a frontend npm build. Primary shell `index.html`, `loader.js`, `app.js`, `studio.js`.
- Home/mobile UX: `home-overview.js/css`, `mobile-ux.js/css`, `studio-layout.css`, `ui-buttons.css`. Latest verified release in this note: **2.16**; check GitHub for newer releases.
- Lessons, study plan, exams, SRS, notebook, auth/sync and AI have separate modules: use `docs/ai/PROJECT_MAP.md` for paths and data boundaries.
- Firebase/Auth/Firestore and Cloudflare/Gemini Worker are distinct from the static site. Never commit secrets.
- Keep stable storage keys, Firebase data contracts, existing UI controls, score/SRS behavior and genuine HSK goal/filter separation.

## Quality gates
- Run narrow unit/DOM tests for edited modules first, then regression checks for shared UI/data changes.
- Server tests: `node --test server/*.test.mjs` (PowerShell: `node --test (Get-ChildItem server -Filter '*.test.mjs').FullName`).
- Useful UI checks (Playwright): `tools/check-home-overview-ui.cjs`, `tools/check-responsive-goal-ui.cjs`, `tools/check-mobile-ux-ui.cjs`, `tools/check-ai-loading-ui.cjs`. See `.github/workflows/studio-ui.yml` for the full CI set.
- **PWA release:** code merge alone does not refresh installed phones. After user approval to release changed site assets, bump the version and hashes with `build-version.py`, include `offline.js`, `offline-worker.js`, `OneSignalSDKWorker.js`, `app-version.json` and confirm Pages deployment. Do not bump versions for documentation-only commits.

## Token-efficient handoff
- Do not recite the README or rescan unchanged files. Cite paths/symbols, minimal command output, and focused test results.
- If the task changes a verified subsystem, update only its section of `docs/ai/PROJECT_MAP.md`; use `docs/ai/TASK_STATE.md` as a brief handoff with current task, decisions, affected files, tests and blockers.
- Treat all notes as a map, **not** as a replacement for checking changed code or current `git status`.
- Do not store tokens, credentials, personal user data, or API keys in AI handoff files.
