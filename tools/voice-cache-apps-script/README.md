# HSK Gemini Kore Voice Cache — prepared service

Latest HSK app checked: 3.4.10. This is a separate Apps Script project, NOT wired to the live app yet.

## Google resources
Apps Script: https://script.google.com/d/1VrcrLdhikOS6qioyo5qlMAOFQhrtl_lLNURZ6l3Ne9pwToCgH5c4aja8/edit
Cache index: https://docs.google.com/spreadsheets/d/1QOh-dFg-Lf3Ig-9ti6zGIYffNN5hs3ITjq1RjT2xNzk/edit
Audio folder: https://drive.google.com/drive/folders/154s3taqv3dBAPEuMJwLo1Df3Gz_iq5UX

## Real source corpus
Run `node make-corpus.cjs`. 11,281 normalized UNIQUE Mandarin clips:
4,843 vocabulary entries, 4,907 example sentences, 1,531 lesson phrases.
Source: words.js and lesson-content-hsk1..6.json; no personal data.
Generated WarmCorpus.gs is pushed via clasp. corpus.json is local-only inspection.

## Start (needs action once from authenticated Google Apps Script account)
1. Apps Script editor: select `hskInitializeStorage` then click Run, approve Drive/Sheet permission.
2. NO new Gemini keys are needed. The default `worker` transport sends a Google ID token to the authenticated `/voice-precache` endpoint of the existing Cloudflare Worker; the 9 previously configured Cloudflare Gemini keys remain secret and are never transferred.
3. AFTER PR #106 is merged, the Worker is deployed and the Google-subject allowlist is configured: in the Apps Script editor select `hskWarmStart`, press Run and approve new OpenID/email scopes if asked. The trigger resumes each minute. Do not start before the Worker is deployed.
4. Monitor `hskWarmStatus` in the editor (completed/remaining/configuredKeys); inspect the Kho_Voice sheet. To stop, run `hskWarmStop`; resume by running `hskWarmStart`. Store cursor and hashes prevent duplicate billing or restart from zero.
5. If it pauses on all keys exhausted or vendor error, check `hskWarmStatus`, API quota in AI Studio, then resume. Script itself never creates chargeable key or enables billing.

## Multi-model TTS (opt-in, backend branch)

Supported free-tier generation targets: `gemini-2.5-flash-preview-tts` (baseline), `gemini-3.1-flash-tts-preview`, `gemini-3.8-flash-lite-tts` (bulk throughput), and `gemini-3.8-flash-tts` (difficult pronunciation/quality). Google **Gemini 3.5 Flash is NOT a TTS model**; `gemini-3.5-transcribe` is speech-to-text and may be integrated as a separate pronunciation verifier, not as voice generation. `gemini-2.5-pro-preview-tts` has no free tier and is disabled unless the Worker has an explicit paid opt-in.

Google 3.8 audio uses the Interactions API (`/v1beta/interactions`) instead of the legacy `models/*:generateContent` request/response. The Worker uses separate validated adapters and refuses unsupported models. A per-model Durable Object pool tracks server-side key cooldown. Separate namespaced cooldowns **do not guarantee additive RPD**: any per-project or cross-model restriction returned by Google must still be respected.

After the matching Worker is deployed and Apps Script source is synced with the active project, call `hskWarmEnableFreeModelRotation()` once to opt in to scheduled multi-model routing. This only changes a script property; it doesn't start another scheduler, regenerate successful cache entries, or enable billing. `hskWarmDisableFreeModelRotation()` returns to legacy routing. The existing `hskWarmTick` trigger chooses healthy key/model pairs, respects model-pair cooldowns and keeps a separate audio hash for each model; it reuses any existing READY audio of the same text across supported models. Until live 3.8 validation, scheduled 3.8 batches default to one item to avoid mismatched split boundaries.

Offline tests: `node test-model-rotation.cjs` and `node --test server/voice-model-router.test.mjs` (from repository root). Real provider RPD and free-tier eligibility are account/project/model-specific; never rotate keys to bypass hard restrictions.

## Safety
- V8 source includes no credentials; keys and gateway token reside in Script Properties, not the PWA.
- Do NOT deploy a public web app without Cloudflare Worker authenticating Firebase callers and handling quotas.
- Do NOT use Apps Script directly in the HSK browser; preserve device Web Speech fallback until real iPhone audio tested.
- 9 keys do not guarantee 9 independent quotas or unlimited throughput. Quotas depend on Google projects, model, tier.
- Apps Script has per-execution and per-day quotas. 11k clips may require multiple days, not one instant run.
- A cache hit can still take hundreds of milliseconds; do not claim 0.1 second.
- Test: `node test-core.cjs` passes with mocked Gemini; NOT a real TTS test.

## Isolated batches
Run hskWarmConfigureIsolated once after deploying the bridge. The existing hskWarmTick trigger runs one small grouped request per tick, prioritising old failed TTS. Initial size 5, hard max 10; character/audio/time limits can reduce a batch. This implementation does not assume 150 clips fit the existing bridge. Voice_Batches retains the master file and manifest. Exact count and stable RMS boundaries gate individual READY writes; they do not prove semantic alignment. A split mismatch preserves the master and, after offline threshold checks fail, retries only its failed items in a smaller batch (5->2->1), bounded to three attempts. Uncertain transport pauses for review. Saved masters recover interrupted writes without another generation. Failed provider requests remain in Voice_Retry with bounded attempts. Do not delete masters or reservations during recovery.

### Longer master audio (opt-in)
Deploy the matching Worker and upload `Code.gs` and `IsolatedBatch.gs` together before running `hskWarmConfigureLongBatch()`. The helper configures 20 items per request, with hard bounds of 60 items / 1200 characters and 600 seconds of 24 kHz mono PCM16 (28,800,044 WAV bytes). The batch request deadline is 240 seconds. It does not create a trigger; use the existing start function afterward. Existing master recovery, clip validation and rejection/backoff remain active. The 600-second decoder and 20-item split are tested with synthetic PCM; live provider generation has not yet been verified. Partial ASR salvage still supports only its existing small-batch range; larger mismatches retain the master and use the existing rejection path.

For the requested 300–480-second manual pilot, the authenticated Worker accepts up to 240 entries / 4800 characters. Normal scheduled long batches remain bounded at 60 entries / 1200 characters, default 20. Key enumeration now includes numbered slots 1–12 plus distinct primary slot 0; blank or duplicate credentials are skipped. A generated master must have its actual duration measured before calling it a successful 300–480-second test.

Live 2026-10-19 pilot: model 2.5 / replacement slot 2 generated a 300.21-second master for 180 items. Thresholds disagreed on segmentation; extended checks also rejected unstable boundaries. `hskLongPilotAnalyze()` may save UNVERIFIED preview segments in a separate folder for inspection; these are never indexed READY. `hskLongPilotFinalize()` still requires count and boundary agreement. No regeneration is needed to analyze/cut a saved master.
