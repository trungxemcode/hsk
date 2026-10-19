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
