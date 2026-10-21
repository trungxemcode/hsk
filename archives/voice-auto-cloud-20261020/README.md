# Latest live snapshot: 2026-10-21

The current deployed queue recovery is stored in `../voice-auto-cloud-20261021/`. It includes the exact FAST Apps Script module set, surgical Worker snapshots and offline regression tests. See that README for checks and rollback details. This older 2026-10-20 snapshot is retained unchanged for recovery.

﻿# HSK Voice Auto50 — current running cloud snapshot (2026-10-20, 23:14 Vietnam time)

**33 Apps Script source modules plus appsscript.json** downloaded directly from production after deploy, not a separate Work 38-module pipeline. The baseline is the fast 18:19 Auto50 scheduler, with only a minimal future-stage module (`FastPhaseAuto.js`), trusted HSK1/5/6 corpus (`TrialCorpus.js`), and surgical integration into existing `Vocabulary.js` and `AutoCycle.js`.

- Complete HSK2/3/4 first, then automatically HSK1 (150), HSK5 (1,294) and HSK6 (2,440) by existing triggers.
- Reuse READY files, preserve Drive WAVs, and retain 12 Cloudflare slots and safe per-clip ASR retry.
- Distinguish known polyphonic words by pinyin when generating new-stage cache keys; legacy HSK2–4 keys remain untouched.
- No additional Work quality pipeline or extra synthesis concurrency. 84 local tests passed before deployment.
- `archives/voice-auto-cloud-20261020` is an **archive**, not a deployment; **do not merge or deploy automatically**. The original pre-quality backup is in PR #127. Historic versions of #126 are in Git commit history.

Production Apps Script ID: `1VrcrLdhikOS6qioyo5qlMAOFQhrtl_lLNURZ6l3Ne9pwToCgH5c4aja8`.

No API key values, Script Properties, private data, or audio files are committed.
