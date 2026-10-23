# Chinese voice selection

Account → Giọng tiếng Trung, also available from Học tự động → Giọng Trung.
Device voices are the default. The app lists actual Web Speech voices and honors
selected Mandarin voiceURI everywhere without changing Vietnamese preferences.
Installing/deleting an OS voice remains an OS setting; Safari cannot manage it.

The optional pack offers Xiaobei, Xiaoni, Xiaoxiao, Xiaoyi (female) and Yunjian,
Yunxi, Yunxia, Yunyang (male), from Kokoro v1.0. Only one selected tensor is kept.
Initial download ~162 MiB, later voice changes ~0.5 MiB. The common model/runtime
is retained across same-engine voice changes. Returning to device speech clears
all app-pack assets. RAM use is substantially higher than download size; default
device speech is preferable on older/low-memory phones.

## Data boundaries and switching

- IndexedDB `hsk-chinese-voices-v1`: `assets` keyed by SHA-256, `settings` containing
  one canonical selection/revision. LocalStorage `hsk-chinese-voice-selection-v1`
  is a startup hint only. Startup reloads the authoritative IndexedDB selection.
- Download missing assets with no credentials/cache, bounded size + SHA-256.
  Check storage estimate, then initialize a candidate worker and synthesize a
  silent smoke-test phrase. No audio preview or quota-backed request is automatic.
- Commit all new assets, default choice and old-voice deletion in one readwrite
  transaction. A revision compare rejects stale writers from other tabs; abort
  rolls back the transaction. Download/check/runtime/quota failures preserve the
  prior selected voice. Cancellation terminates the candidate worker.
- Selection is device-wide, including after account changes, like OS voice
  preferences. No study, SRS, music, account or cloud sync data is written/deleted.
- Blob assets can be evicted by the browser. Missing data produces a download
  instruction instead of falsely reporting completion. Switching to device voice
  remains available. There is no automatic redownload in the background.

`voice-manager.js` owns download, IndexedDB selection and AudioContext playback.
`voice-pack-worker.js` initializes pinned Sherpa blobs, upcasts the compact model
via `voice-model.js`, validates every waveform, and returns PCM. Workers are
terminated on cancellation, voice change, pagehide and after idle time.
`HSKSpeech.createPlayer` routes Chinese chunks to the selected pack; Vietnamese
stays on Web Speech. Passive speech uses the same choice and AbortSignal.

Only small control modules/catalog/worker are initial PWA assets. Model/runtime
binaries and embeddings are excluded from the offline precache; their own local
store supplies reload/offline playback. Upstream CORS/network restrictions can
still block a first download. A browser kill from memory pressure cannot be
caught reliably; iOS real-device testing is required before production approval.

## Verification

- `node --test server/speech.test.mjs server/chinese-voice-model.test.mjs`
- `node tools/check-chinese-voices-ui.cjs`: actual IndexedDB, device selection,
  lazy downloads, checksums, quota/network/runtime failure rollback, cancellation,
  old-voice deletion, shared reuse, reload/offline playback, stale writer rejection
  and untouched study data. Synthesis is mocked in this fast test.
- `tools/check-chinese-voice-runtime.cjs`: optional real WASM + weights, all eight
  voices and representative Chinese sentences/dates. Source preparation and
  licenses: `vendor/chinese-voices/SOURCES.md`.
- Existing speech/passive/guided UI, feature preservation and PWA release checks.
