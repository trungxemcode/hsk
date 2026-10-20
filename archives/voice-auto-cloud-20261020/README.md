# HSK Voice Auto50 active cloud snapshot — rollback to fast pre-20:00 architecture

Archived on 2026-10-20 after restoring the fast 18:19 production architecture. Exact Google Apps Script readback contains **31 source modules** plus appsscript.json, rather than the later 38-module Work integration. The patched rollback preserves (1) all 12 numbered Cloudflare key slots; (2) per-clip provider retry that does not block an entire batch; (3) verification of previously generated dictionary WAV masters without generating them again; and (4) Vietnam-local timestamps.

Live Google Apps Script script ID: `1VrcrLdhikOS6qioyo5qlMAOFQhrtl_lLNURZ6l3Ne9pwToCgH5c4aja8`. PR #126 is ARCHIVE ONLY and must not be merged or used as a Cloudflare deployment. The prior 38-module source is preserved in this branch's Git history and the local pre-rollback snapshot at `C:\Users\LENOVO\hsk-rollback-fast-20261020\cloud-before-rollback`. The original owner-requested 18:05 backup remains PR #127.

No API key values or Script Properties are stored in this archive. Existing Drive voice data and Sheet checkpoints are not included and were never changed by this archival operation.
