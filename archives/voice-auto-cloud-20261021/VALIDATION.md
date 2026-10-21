# Production recovery validation

2026-10-21, Vietnam time.

- 24 focused offline tests pass, including the downloaded deployed Worker validator, the additive Worker patch, pronunciation guidance, blind two-pass ASR, queue ownership, missing-WAV evidence, saved-ASR reuse, quota budget preservation, model/key cooldown and bounded sequential synthesis.
- Existing app contract checks pass against origin/main. Chromium checks pass at 390px and 1440px. This archive changes no frontend assets or learner records.
- Complete production Apps Script and native spreadsheet backups were taken before queue mutations. Apps Script rollback baseline is version 23. Worker original version is 5a425eb1-4dca-4cb4-91e8-5ad339147fb3. Each surgical Worker upload verified that all 38 bindings remained identical.
- Live evidence: HOLD_UNCERTAIN dropped from 12 to 0; verified HSK2-4 entries increased from 1017 to 1028 of 1044 before the latest master finished validation. The active batch saved 14 audio entries to a master and entered AUTO_VERIFY. These saved audio entries are not automatically READY.
- Measured first 25 TTS requests: 66.7 seconds total; measured first 10 ASR verification requests: 38.6 seconds total. The one-request-per-minute scheduler introduced substantial avoidable idle time. The patch keeps one generator, permits up to three sequential successful TTS checkpoints per timer, and processes up to ten ASR clips within the existing runtime budget. Any failed TTS request stops the burst immediately.
- Provider errors are separate from scheduling: confirmed Gemini HTTP429 daily quota on individual key/model pairs, and upstream HTTP400 generic invalid argument. Quota waits remain enforced. Generic request rejection no longer poisons a key/model pair with the bridge's artificial 24-hour cooldown; retries rotate model durably and remain bounded.
- Phase counts and state now derive from the live queue. Completion still requires every current-stage item to be READY/EXISTING, in order 2-4 -> 1 -> 5 -> 6. No claim is made that all HSK audio is complete or that external providers cannot fail.

The older legacy FAST test bundle had two baseline failures before modification (an obsolete ASR migration and an old model-scan expectation). Those tests do not describe the new model-routing contract; the focused suite verifies the actual deployed API contract explicitly.

Native profile v2: confirmed provider error 'Model tried to generate text' prompted short literal fallback for legacy models, plus literal Hanzi transcript and pronunciation in speech_metadata for 3.8 Lite. The Worker now accepts both 3.8 models. Repair jobs prefer native Lite; saved WAVs are never regenerated. The improved input profile has a fresh bounded verification budget.

Final deployed Apps Script version26 was read back with native_dictionary_v2 and Lite routing. Live native Lite generation at08:33 VN saved three consecutive WAVs on first attempts within one serialized timer. Generation success does not grant READY; blind ASR remains required.
