# Chinese voice selection

Account → Giọng tiếng Trung, also available from Học tự động → Giọng Trung.
Actual device Web Speech voices remain the default. Installing/deleting an OS
voice remains an OS setting; app storage operations never delete OS voices.
Mandarin choices apply to cards, lessons and passive speech; Vietnamese stays
independent.

## Audition before download

Nine local MP3 auditions together occupy less than 0.1 MiB and are included in
the PWA assets. Audition plays the selected recording without opening a neural
worker, installing a voice, changing the default or calling a TTS API. Device
voices can also be auditioned before applying. Close/source change/pagehide
stops previews; stale play promises cannot update a later preview's status.

## Independent small package

The downloadable Huayan package is about 17.8 MiB (model + tiny configuration).
The shared runtime/resources add about 4.9 MiB on first installation: total
~22.8 MiB. The common assets contain no neural model. Catalog entries carry
per-voice `assets`; a replacement removes the previous model/configuration.
Only the common small runtime is reused. Returning to device speech clears all
app-pack assets, leaving OS voices intact.

The original eight Kokoro voices remain available as auditions, but new
installation is blocked in both UI and manager. Their ~162 MiB common model
cannot be divided into eight 20 MiB independent models. Do not advertise all
eight as small downloadable voices. Already-installed legacy Kokoro selections
remain playable through the old worker path, and are removed when replaced by
Huayan/device speech.

## Data boundaries and replacement

- IndexedDB `hsk-chinese-voices-v1`: assets keyed by SHA-256, one canonical
  selection/revision. LocalStorage `hsk-chinese-voice-selection-v1` is only a
  startup hint; IndexedDB is authoritative.
- Check free space, bounded response size and SHA-256, then initialize a candidate
  worker and synthesize a silent smoke-test phrase. Stage in memory; commit new
  assets, default choice and old-voice deletion in one readwrite transaction.
- Failure/cancel leaves the old selection/assets intact; a revision compare
  rejects stale writers. A cancelled candidate worker is terminated.
- Preferences are device-wide. No study, SRS, account, music or cloud sync data
  is modified. Browser eviction can remove downloaded blobs; missing data asks
  for reinstallation instead of secretly downloading in the background.

`voice-manager.js` handles storage/download/playback. The worker reads the
per-voice Piper config and uses its own model/tokens, appends metadata and
expands any FP16 operations to FP32 through `voice-model.js`. Every waveform is
checked for finite non-silent PCM. Legacy Kokoro blobs use the previous path.
A warm worker is reused; cancel/background/change/idle releases it as appropriate.
The model/runtime is excluded from the initial PWA precache; downloaded blobs
support playback after reload without network. Real iPhone RAM/audio QA remains
outstanding; browser/PCM checks are not a subjective pronunciation assessment.

## Checks

- `node --test server/speech.test.mjs server/passive.test.mjs server/chinese-voice-model.test.mjs server/chinese-voice-catalog.test.mjs`
- `node tools/check-chinese-voices-ui.cjs`: real IndexedDB with mocked TTS,
  selected auditions without installs/default changes, blocked heavy installs,
  atomic failure/cancel rollback, actual legacy/model deletion, shared reuse,
  warm workers, reload/offline, stale writers and unchanged learning data. Also
  decodes all real MP3 previews using native browser audio.
- `HSK_CHINESE_VOICE_FIXTURE=DIR node tools/check-chinese-voice-runtime.cjs`:
  actual downloaded Huayan weights + WASM, several phrases and dates, finite
  non-silent PCM. Source preparation: `vendor/chinese-voices/SOURCES.md`.
- Existing speech/passive/guided UI, feature-preservation and PWA checks.
