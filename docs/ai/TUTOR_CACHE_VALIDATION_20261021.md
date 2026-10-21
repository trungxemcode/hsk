# Tutor AI cache deployment — 2026-10-21

Scope: App HSK dictionary lookup, batch glossary translation, sentence QA and lesson QA. No Apps Script or auto voice change. Feature branch feat/tutor-qa-cache-20261021 / PR128; main is not merged. Backend revision hsk-ai-cache-3-6-1; frontend/PWA unchanged.

## Validation

-25 new behavior tests PASS; all229 server tests PASS, no skips.
- Append-only45 capabilities /165 guards PASS; all44 main features preserved.
- Chromium real runtime390px and1440px PASS.
- Actual deployed-source patch preserves the original provider prompt and JSON response schema. Exact miss then hit issues one model request across both calls. Voice auth boundary remains byte-equivalent for the unauthenticated canary.

## Isolated Cloudflare staging

Private fixture-only Worker used real Durable Object storage and the exact patched deployment code. Auth/provider replies were synthetic: no learner account/session/data and0 real provider billing calls. Six cache writes and five hits observed. Repeated dictionary requests and public lesson FAQ reuse across synthetic verified accounts; private sentence contexts remain separated. Batched glossary responses retain IDs/schema. Followup history bypasses. Intentionally identical embeddings for different Hanzi still yielded a freshly generated answer; observer recorded one score above0.92 without serving it. Temporary staging Worker and its fixture-only namespace were deleted after the checks.

## Production

The current independently newer voice Worker was downloaded first and backed up privately. QA hooks were added instead of uploading main's older voice bundle. Exact source readback matches SHA256 615fa60882db1f2350c9563a3f43cfe52f9335812b2e2c9ba352184fca647e32. All 38 previous bindings and original settings were preserved; only4 QA configuration variables were added. Voice code, TTS secrets/pools, ASR configuration, Sheets and Apps Script were not changed.

Production smoke: new app revision header; missing app auth401, missing Google voice auth401, CORS204. No real-user session or paid Gemini answer was exercised in this smoke; it proves deployment/auth/CORS, while cache reuse was verified on real storage in staging. Cache savings and semantic quality for real learner traffic require subsequent observation.

QA_CACHE_ENABLED=true; QA_SHADOW_MODE=observe; shadow limit20/day; no explicit cache storage charges or new external database. Rollback flags and physical retention bounds are in server/README.md.

Read-only auto voice check after deployment: Voice_Control remains AUTO_CYCLE;1268 READY plus20 EXISTING,1430 remaining of2718 enrolled. Both checker handlers have recent checkpoints. No voice control cells were written for this task.
