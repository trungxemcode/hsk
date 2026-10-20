
### ASR resilience update, 2026-10-20
Per-clip provider backoff preserves saved masters and quality-check counts. Unseen/less-failed clips run first; only a complete terminal clip set finalizes a batch. Retry-After is honored. Invalid credentials/configuration pause Voice_Control rather than being retried silently. A dedicated HSK_VOICE_ASR_MODEL runtime binding was set to gemini-2.5-flash for live verification; TTS model routing was not changed. End-to-end provider availability must be verified separately from local regression tests.
