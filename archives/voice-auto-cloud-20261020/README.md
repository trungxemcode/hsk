# Active HSK Voice Auto50 — fast architecture with minimal HSK phase handoff

The owner chose the FAST pre-20:00 Auto50 engine. This **exact readback from production Google Apps Script** on 2026-10-20 contains **33 source modules** plus `appsscript.json`: 31 proven FAST modules plus only `FastPhaseAuto` and `TrialCorpus` for automatic HSK2–4 → HSK1 → HSK5 → HSK6 transitions. Work's later heavyweight modules (`PhasedVocabularyAuto`, `QualityEnhancements`, `VoiceProgress`) remain excluded.

Safety invariants: retain READY/EXISTING Drive clips; reuse existing cache; only add queued terms once; keep 50-word logical batches, 12 Cloudflare key slots, verified dictionary master support, and per-clip ASR backoff. `FastPhaseAuto` enrolls at most 160 Sheet rows each scheduler tick without directly making a TTS or ASR request. Test suite: 81/81 passed, cloud readback verified.

Production Script ID: `1VrcrLdhikOS6qioyo5qlMAOFQhrtl_lLNURZ6l3Ne9pwToCgH5c4aja8`. This is a CODE ARCHIVE, not an automatic deployment. PR #127 remains the original owner-requested before-quality backup. The exact pre-handoff cloud source and rollback utility remain locally at `C:\Users\LENOVO\hsk-phase-fast-20261020\cloud-before-phase`.

Never commit key values, change Script Properties, merge or deploy this archive automatically without verification.
