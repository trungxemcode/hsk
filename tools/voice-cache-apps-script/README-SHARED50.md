# Shared 50-word TTS test: ChatGPT Plus + Work

Both chats must use this same command through Desktop Commander:

```powershell
node C:\Users\LENOVO\hsk-shared-voice50\tools\voice-cache-apps-script\commander50.cjs run50
```

Pause:
```powershell
node C:\Users\LENOVO\hsk-shared-voice50\tools\voice-cache-apps-script\commander50.cjs pause
```

The CLI uses the existing clasp login, pulls the latest Google sources first, merges the shared adapter into current source, adds a private command, then pushes. It does not call the denied clasp execution API, read API keys, expose an anonymous endpoint, or require a cloud browser. The existing Google owner trigger consumes the command exactly once. A second run command joins an in-flight batch instead of starting another.

Result and command: [Voice_Control](https://docs.google.com/spreadsheets/d/1QOh-dFg-Lf3Ig-9ti6zGIYffNN5hs3ITjq1RjT2xNzk/edit#gid=1833102820).
- B15: RUN_ONCE_50 / RUNNING_ONCE_50 / PAUSE. This is separate from B2's older recovery command.
- B16:B19: batch ID, master link, state, error.
- B20:B23: preview folder, actual number cut, measured duration, verification status.
- B24:B26: size 50, requested pause, protocol; the literal transcript pilot requests the existing one-second dictionary separation.
- Google trigger polling may take up to five minutes; generation and verification take additional time.

Exactly one master is allowed per command. The queue prioritizes HSK 2, then 3, then 4, skips existing READY vocabulary, alternates available 2.5/3.1 key/model pairs and preserves provider cooldowns. Blank slots are omitted by the Worker.

Master audio is saved before any cuts. Neutral-numbered preview clips and a manifest are UNVERIFIED, never READY. Count/boundary checks plus existing blind double ASR are required for the main cache. A failed test stops; another generation requires an explicit new command. Do not resubmit an uncertain request.

## Other chats: prevent overwrites

Do not push stale hsk-long-pilot or hsk-voice-exec-refresh sources over this project. Always pull current Google sources into a separate staging directory before editing. Preserve Shared50.js, Shared50Command.js, the VoiceControl hook and explicit model routing in Vocabulary.js. This repository worktree tracks the common implementation; it does not merge into main automatically.

## Tests

Run test-shared50.cjs, test-voice-control.cjs and the required feature preservation/runtime checks. Synthetic splitting tests are not evidence of provider audio quality.

## Live result 2026-10-19
The shared Commander entry produced a real 66.61095833-second master and saved 50 individually numbered preview WAVs. The strict vocabulary verifier returned vocab_pause_or_count_mismatch, so these 50 remain UNVERIFIED in a separate Drive folder and were not promoted to READY. The one-shot stopped after that master; no automatic regeneration. Requested separation was reduced to the existing one-second literal-transcript style for this pilot; it does not demonstrate four-second gaps.

## ASR silence padding
AsrSilence.gs inserts up to 2 seconds of zero PCM on each side of each verify-words clip in the outbound request only. It keeps the original speech byte-identical and never alters the saved clip. Padding shrinks to respect the Worker's 350,000-character per-clip and 650,000-character aggregate base64 limits. Hanzi/pinyin double-ASR agreement is still required; silence itself proves no pronunciation quality.
The next existing owner trigger audits one saved preview without a TTS or ASR provider call; Voice_Control A29:B29 records measured duration, actual padding and byte preservation.
