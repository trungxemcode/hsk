# Private voice quality trial — 20 October 2026

Experimental source snapshot; not merged into the application. Trial audio and report remain private, separate from the main voice cache and Sheets. User approval is required before publishing any trial results or audio to Sheets.

V3 selects 150 unique references that are absent from historical batches, attempted queue entries, cache model hashes, and earlier private trial cohorts. Each of three batches contains 25 HSK5 and 25 HSK6 words. Selection uses the app corpus, not a claim of independently validated HSK classification.

Only the existing owner timer is used. Vocabulary.js provides hskVocabTickWork_; VoiceProgress.js is the unique hskVocabTick entry, invoking the bounded private trial before the normal queue. Duplicate timer declarations were found and removed. No additional trigger is installed. DONE or ERROR returns control to normal processing.

The Worker dictionaryStyle flag is opt-in. It requests independent dictionary pronunciation and does not ask Gemini to generate silence. Cuts require exact segment count and agreement between noise thresholds. Padding is added to generated clips afterwards. A logical batch contains 50 references; transport chunks contain up to 10.

Checks 1 and 2 require exact Hanzi and source marked pinyin from both blind ASR outputs. Check 3 permits exact marked common pinyin despite different Hanzi. Common-reading overrides currently cover the existing curated map and five additional entries; unlisted polyphones retain source pinyin, so this is not a comprehensive frequency dictionary. Tone removal is never used. Keep passing clips; one bounded recovery regenerates only failed words with changed model preference.

Historical model pass rates rank the initial candidates. The first two batches prefer different eligible models; the third favors the better observed result. Provider cooldowns remain enforced. Two retries per transport chunk maximum, eight ASR provider failures maximum. Ambiguous transport is quarantined rather than resent.

Run: node test-quality-trial.cjs and node test-dictionary.cjs. These validate matching, tone rejection, stable segmentation, balanced unseen cohort selection, opt-in Worker behavior, and absence of Sheet/cache writes. They do not prove synthesis quality; use the private runtime JSON for actual initial/final pass counts and failures.

Worker deployment: 5a425eb1-4dca-4cb4-91e8-5ad339147fb3. Apps Script script ID: 1VrcrLdhikOS6qioyo5qlMAOFQhrtl_lLNURZ6l3Ne9pwToCgH5c4aja8. Do not blindly push these snapshots over concurrent edits; pull first and apply a scoped diff.
