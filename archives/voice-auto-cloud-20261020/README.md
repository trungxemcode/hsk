# HSK Voice Auto50 — active cloud snapshot 2026-10-21 11:43 Vietnam time

This is the **exact production Apps Script readback** after enabling the fast Auto50 continuation HSK1 (150) -> HSK5 (1294) -> HSK6 (2440), with 35 JavaScript modules + appsscript.json. It retains the working 15:53 architecture, 12-key Worker failover/ASR controls, owner-approved audio audit, and only adds TrialCorpus.js and HSKRollingPhases.js (plus hooks in Vocabulary.js and AutoCycle.js).

Every failed clip is RETRY in following 50-word batches alongside new words, across HSK level boundaries. When the final HSK6 fresh batch completes, unresolved audio is REVIEW for manual owner approval; NEVER fake READY or overwrite verified audio. Stage and manual-review checkpoints survive interruption. 7/7 new stage tests and 12/12 focused ASR/cache/owner-approval tests passed; 9 legacy tests already fail identically in the pre-change snapshot.

**Archive only:** GitHub pull request #126 is not a deployment mechanism; do not merge automatically. PR #127 retains the requested pre-quality rollback source. A full pre-change snapshot and patch are available on the authorized laptop at `C:\Users\LENOVO\hsk-phase-continuation-20261021`. Google Drive/Sheet data and all API secret values are excluded.

Apps Script production script ID: `1VrcrLdhikOS6qioyo5qlMAOFQhrtl_lLNURZ6l3Ne9pwToCgH5c4aja8`.
