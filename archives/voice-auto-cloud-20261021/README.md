# FAST production recovery, 2026-10-21

Exact production Apps Script snapshot with a targeted queue fix, separate from the unfinished parallel-ASR pipeline. Keep this module set intact. Do not combine it with voice-cache-apps-script. Credentials, Script Properties and clasp configuration are excluded.

- Preserve READY audio and active batch ownership. Recover saved master/chunks and saved third-round double-ASR evidence without new generation.
- Release uncertain missing WAVs only after two independent absence audits at least 60 seconds apart; retain before/after evidence in Voice_Repair_Audit.
- Strip grammar labels only from spoken input. Future polyphonic keys include source pronunciation. TTS receives a pronunciation guide; ASR remains blind and independent.
- Worker and Apps Script request shapes now match. Client 400 errors stop configuration retries without cooling every provider key. Each model uses its own reported cooldown; models match the actual deployed Worker (2.5, 3.1, 3.8 flash TTS), slot zero is excluded, and model rotation is checkpointed.
- One generator under the existing script lock advances at most three successful chunks sequentially per timer, with Drive checkpoint after each and immediate stop on error. Runtime headroom is reserved before another provider call.
- Provider availability/quota failures do not consume a word's quality budget. Genuine unverified masters, segmentation failures and repeated failed generation are bounded; REVIEW remains explicit and blocks phase completion. HSK order remains 2-4 -> 1 -> 5 -> 6.
- All new timestamps include Vietnam UTC+07:00. Tien_do now reports live cache/queue/phase counts, stage duration and sanitized provider diagnostics.

Production backups: Apps Script version 23, complete source snapshot on the laptop, and a full native Sheet copy before mutations. Worker source and bindings were checked before each surgical upload; all 38 bindings were verified unchanged. Worker modifications are limited to sanitized provider diagnostics and validated TTS pronunciation guides. Existing Worker authorization, routes, ASR and quota controls remain intact.

Validation: 23 focused offline tests pass, including the actual deployed Worker validator, pronunciation guidance, blind double ASR, no duplicate regeneration, active/READY ownership, key/model cooldown and sequential generation bounds. Existing app feature contracts and Chromium runtime (390px and 1440px) pass. Before model-routing refactor, legacy FAST checks matched baseline 33/35, with the same two stale expectations; these are not a claim that all historical tests pass after new routing behavior.

Run from this directory: node --test test-worker-contract.cjs test-worker-diagnostic.cjs test-pronunciation.cjs

worker-fixture/deployed-worker.mjs is the downloaded original deployed bundle; diagnostic-worker.mjs and pronunciation-worker.mjs are the successive surgical Worker versions. They are test fixtures, not Apps Script modules. Deploy only top-level .js source files and appsscript.json to Apps Script. Never include worker-fixture in a clasp upload.

The archived module set is the final patched source. Do not rerun earlier mechanical patch scripts on it.
