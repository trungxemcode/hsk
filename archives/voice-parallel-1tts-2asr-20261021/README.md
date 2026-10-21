# One producer and two verification consumers

Base: production Apps Script pulled after the owner rollback on 2026-10-21, corresponding to archive commit cb22c10. This directory contains the changed modules only. All other live modules and appsscript.json are preserved; baseline-sha256.json identifies the exact source snapshot. No credentials, Script Properties or user data are included.

One durable seven-minute producer lease prevents overlapping timer invocations from issuing TTS. Two separate seven-minute consumer leases claim different saved masters; no clip or vocabulary row is assigned to both. The restored two-vote Hanzi/pinyin matcher and third-pass policy are retained verbatim in ParallelVerifyBatch.js. Existing READY audio, failed-word carry-forward and HSK1 ->5 ->6 continuation remain.

Provider I/O releases the short script lock; ownership, pause state and source identity are checked after reacquiring it. Cache lookup, file reuse and Sheet checkpoint writes are serialized. ASR backoff is scoped by master and cannot replace the producer cooldown. At most three completed masters await verification, bounding paid generation ahead of consumers.

A timed-out paid TTS call is journaled UNCERTAIN before any later producer can resubmit. Expired ASR leases may retry transcription, never synthesize a replacement. Unverified words are released to the next batch only after their current master is finalized. Stage handoff and final manual review wait for all in-flight masters.

The original production code and sheet were backed up before rollout. The manifest remains Asia/Ho_Chi_Minh; the spreadsheet remains Asia/Saigon. No timezone migration or previous timestamp rewrite is performed. Status is written to a new Voice_Parallel_Status tab, preserving existing control diagnostic cells.

Validation: node --test archives/voice-parallel-1tts-2asr-20261021/test-parallel.cjs (20 behavior tests). Restored focused suite: 30/31 on both base and patched source; the identical pre-existing adaptive split fixture fails in both. Feature contracts and browser runtime are also checked before commit.

Rollback: pause the coordinator; allow active executions to finish; restore the saved live-before source with clasp push. The prior immutable version is retained. Set HSK_PV_ENABLED=false for sequential scheduling without removing source; checker timers then do no work.
