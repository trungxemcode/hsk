# HSK TTS – Google Sheet controller / recover 50 vocabulary items

This directory snapshots the deployed Apps Script TTS coordinator (2026-10-19) in a separate Git branch. The Google Apps Script project and Cloudflare Worker remain the production executors; **this Git branch alone does not deploy them**.

## Current recovery
- Source master WAV: Drive ID `1Qf4HVlBrveLui9OKsVyD0hFkiD4GXu5y` (50 requested words, 62.33 s).
- 49 stable speech islands were recovered offline. Never assume segment `n` equals word `n`: the model omitted/modified one or more utterances.
- Auditable working tabs in the existing spreadsheet: `Voice_Control` (command and progress) and `Voice_Recovery_50` (49 candidates).
- `RECOVER_50` pauses both TTS schedulers, reads the saved master, requests **blind double-pass Chinese + tone-mark pinyin ASR**, and only writes `Kho_Voice/Voice_Vocabulary READY` when both passes identify exactly one matching word in the correct monotonic position. All failed or ambiguous candidates get at most three checks then remain for future TTS batches.
- A manually produced 4-second-gap listening preview is explicitly `UNVERIFIED`; it is not a verified cache.
- Both TTS and ASR failures are handled separately. Error `provider_refused_batch` must **not** convert unseen words into permanent pronunciation `REVIEW`.

## Sheet commands (Voice_Control!B2)
- `RECOVER_50` – ASR-only recovery from the saved master; no new TTS calls.
- `PAUSE` – stop vocab and warm TTS generation.
- `RUN_VOCAB` – explicitly resume scheduled normal vocabulary batches. Coordinator first switches command to `RUNNING`; no repeated starts.
- `RUNNING` – normal vocabulary scheduler handles work with its existing limits.

Installable `hskVoiceControlTick` trigger runs under the Google account that owns the script, installed automatically from the previously authorized tick (the controller never requires a public web endpoint). It polls the Sheet every 5 minutes. The live script was installed via `clasp push` with the existing owner's OAuth; do not turn on anonymous Web App access. No API keys or token values belong in Git.

## Safe development
- Preserve `Kho_Voice` ready records and `Voice_Vocabulary` confirmations. New voice clips are saved only after verified transcription.
- Use a distinct branch/worktree for code changes. Run `node tools/voice-cache-apps-script/test-voice-control.cjs` and existing repository contract/server tests before merge.
- Do **not** push this folder wholesale into a different Apps Script project or overwrite a newer remote script without pulling and reviewing its sources.
