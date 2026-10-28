# Vietnamese song meanings

Source index: `music-vietsub-sources.json` covers the 51 catalogue entries. Search results are candidates, not permission grants or verified full translations. Prefer the exact Moah recording already authorized by the owner; preserve translator credits when available. No generative translation is used.

`tools/collect-music-vietsub-drafts.py` reads the eight locally available source videos and their verified OCR observations on the VPS. It checks video SHA256, matches the visible Chinese line, and reads only the existing Vietnamese subtitle using the fast and best Vietnamese Tesseract models. Outputs remain unreviewed drafts, with crops, confidence, agreement and source time for review. OCR can confuse tone marks even when a sentence looks plausible; do not automatically publish these drafts.

Operator root: `/home/ubuntu/hsk-alignment`. Job: `hsk-vietsub-drafts.service`; it waits for the current sequential word-alignment run before extracting. YouTube currently requires bot/sign-in verification for direct VPS retrieval of additional videos. Do not claim missing videos have been processed.

Publication must match exact current Chinese cue text, use the current R2 ETag with conditional writes, keep a backup, and preserve all `characters`, audio IDs, cue timing and existing translations. The candidate `cueIndices` come from the observation snapshot and must not be blindly applied to a newer script. Keep source URL and translator attribution. Never replace unavailable human translations with invented AI lyrics.
