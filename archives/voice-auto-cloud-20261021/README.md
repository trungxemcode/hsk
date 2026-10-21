# FAST production recovery, 2026-10-21

Exact production Apps Script snapshot with a targeted queue fix, separate from the unfinished parallel-ASR pipeline. Keep this module set intact. Do not combine it with voice-cache-apps-script. Credentials, Script Properties and clasp configuration are excluded.

- Preserve READY audio and active batch ownership. Recover saved master/chunks and saved third-round double-ASR evidence without new generation.
- Release uncertain missing WAVs only after two independent absence audits at least 60 seconds apart; retain before/after evidence in Voice_Repair_Audit.
- Strip grammar labels only from spoken input. Future polyphonic keys include source pronunciation. TTS receives a pronunciation guide; ASR remains blind and independent.
- Worker and Apps Script request shapes now match. Client 400 errors stop configuration retries without cooling every provider key. Each model uses its own reported cooldown; models match the actual deployed Worker (2.5, 3.1, native 3.8 Flash/Lite TTS), slot zero is excluded, and model rotation is checkpointed.
- One generator under the existing script lock advances at most three successful chunks sequentially per timer, with Drive checkpoint after each and immediate stop on error. Runtime headroom is reserved before another provider call.
- Provider availability/quota failures do not consume a word's quality budget. Genuine unverified masters, segmentation failures and repeated failed generation are bounded; REVIEW remains explicit and blocks phase completion. HSK order remains 2-4 -> 1 -> 5 -> 6.
- All new timestamps include Vietnam UTC+07:00. Tien_do now reports live cache/queue/phase counts, stage duration and sanitized provider diagnostics.

Production backups: Apps Script version 23, complete source snapshot on the laptop, and a full native Sheet copy before mutations. Worker source and bindings were checked before each surgical upload; all 38 bindings were verified unchanged. Worker modifications are limited to sanitized provider diagnostics and validated TTS pronunciation guides. Existing Worker authorization, routes, ASR and quota controls remain intact.

Validation: 24 focused offline tests pass, including the actual deployed Worker validator, pronunciation guidance, blind double ASR, no duplicate regeneration, active/READY ownership, key/model cooldown and sequential generation bounds. Existing app feature contracts and Chromium runtime (390px and 1440px) pass. Before model-routing refactor, legacy FAST checks matched baseline 33/35, with the same two stale expectations; these are not a claim that all historical tests pass after new routing behavior.

Run from this directory: node --test test-worker-contract.cjs test-worker-diagnostic.cjs test-pronunciation.cjs

worker-fixture/deployed-worker.mjs is the downloaded original deployed bundle; diagnostic-worker.mjs and pronunciation-worker.mjs are the successive surgical Worker versions. They are test fixtures, not Apps Script modules. Deploy only top-level .js source files and appsscript.json to Apps Script. Never include worker-fixture in a clasp upload.

The archived module set is the final patched source. Do not rerun earlier mechanical patch scripts on it.

Native profile v2: confirmed provider error 'Model tried to generate text' prompted short literal fallback for legacy models, plus literal Hanzi transcript and pronunciation in speech_metadata for 3.8 Lite. The Worker now accepts both 3.8 models. Repair jobs prefer native Lite; saved WAVs are never regenerated. The improved input profile has a fresh bounded verification budget.

## Stable cohorts and provider keys - 2026-10-21

The 08H release now holds a durable logical cohort of up to 50 source rows until at least 30 are READY/EXISTING. Physical repair journals remain append-only children of that cohort. A stage tail below 30 must finish all remaining members; REVIEW or changed source identity never counts as verified. Active journals finish before a new cohort opens. HSK order remains 2-4 -> 1 -> 5 -> 6.

Successful TTS key/model and ASR key stay pinned while eligible. Round-robin after each ASR clip and automatic rotation after each AUTO50 journal are removed. Provider/model cooldowns and Retry-After remain authoritative; pronunciation/format failures do not cool another key. Actual TTS chunk slot is recorded in new cache entries; existing READY files stay unchanged. Tien_do shows actual stage, cohort progress and pinned keys; release label rows33-34 are reserved.

Validation: 33 focused tests pass (24 existing plus 9 new policy tests), including actual routing cooldown exclusion, 30-pass barrier, 13-word stage tail, in-flight adoption, source identity, ASR sticky/failover, and cache provenance. Full app contracts and browser runtime must also pass before commit. Production source backup and immutable Apps Script version27/tag run-20261021-0800 remain available.

Release evidence: Apps Script version29 pushed as36 production files; immutable version27 and original release tag retained. All33 focused tests,46 capability/168 contract guards and Chromium390/1440 pass. Live09:01 VN retained TTS key7 for consecutive saved chunks; one12-word tail cohort is active. Provider model cooldown may change models on the same key. ASR sticky behavior is covered by tests; live confirmation follows when the master reaches ASR. Original user release label is preserved.
