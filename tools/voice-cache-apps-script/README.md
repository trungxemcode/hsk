# HSK Gemini Kore Voice Cache — prepared service

Latest HSK app checked: 3.4.10. This is a separate Apps Script project, NOT wired to the live app yet.

## Google resources
Apps Script: https://script.google.com/d/1VrcrLdhikOS6qioyo5qlMAOFQhrtl_lLNURZ6l3Ne9pwToCgH5c4aja8/edit
Cache index: https://docs.google.com/spreadsheets/d/1QOh-dFg-Lf3Ig-9ti6zGIYffNN5hs3ITjq1RjT2xNzk/edit
Audio folder: https://drive.google.com/drive/folders/154s3taqv3dBAPEuMJwLo1Df3Gz_iq5UX

## Real source corpus
Run `node make-corpus.cjs`. 11,281 normalized UNIQUE Mandarin clips:
4,843 vocabulary entries, 4,907 example sentences, 1,531 lesson phrases.
Source: words.js and lesson-content-hsk1..6.json; no personal data.
Generated WarmCorpus.gs is pushed via clasp. corpus.json is local-only inspection.

## Start (needs action once from authenticated Google Apps Script account)
1. Apps Script editor: select `hskInitializeStorage` then click Run, approve Drive/Sheet permission.
2. NO new Gemini keys are needed. The default `worker` transport sends a Google ID token to the authenticated `/voice-precache` endpoint of the existing Cloudflare Worker; the 9 previously configured Cloudflare Gemini keys remain secret and are never transferred.
3. AFTER PR #106 is merged, the Worker is deployed and the Google-subject allowlist is configured: in the Apps Script editor select `hskWarmStart`, press Run and approve new OpenID/email scopes if asked. The trigger resumes each minute. Do not start before the Worker is deployed.
4. Monitor `hskWarmStatus` in the editor (completed/remaining/configuredKeys); inspect the Kho_Voice sheet. To stop, run `hskWarmStop`; resume by running `hskWarmStart`. Store cursor and hashes prevent duplicate billing or restart from zero.
5. If it pauses on all keys exhausted or vendor error, check `hskWarmStatus`, API quota in AI Studio, then resume. Script itself never creates chargeable key or enables billing.

## Safety
- V8 source includes no credentials; keys and gateway token reside in Script Properties, not the PWA.
- Do NOT deploy a public web app without Cloudflare Worker authenticating Firebase callers and handling quotas.
- Do NOT use Apps Script directly in the HSK browser; preserve device Web Speech fallback until real iPhone audio tested.
- 9 keys do not guarantee 9 independent quotas or unlimited throughput. Quotas depend on Google projects, model, tier.
- Apps Script has per-execution and per-day quotas. 11k clips may require multiple days, not one instant run.
- A cache hit can still take hundreds of milliseconds; do not claim 0.1 second.
- Test: `node test-core.cjs` passes with mocked Gemini; NOT a real TTS test.

## Isolated batches
Run hskWarmConfigureIsolated once after deploying the bridge. The existing hskWarmTick trigger runs one small grouped request per tick, prioritising old failed TTS. Initial size 5, hard max 10; character/audio/time limits can reduce a batch. This implementation does not assume 150 clips fit the existing bridge. Voice_Batches retains the master file and manifest. Exact count and stable RMS boundaries gate individual READY writes; they do not prove semantic alignment. A split mismatch preserves the master and, after offline threshold checks fail, retries only its failed items in a smaller batch (5->2->1), bounded to three attempts. Uncertain transport pauses for review. Saved masters recover interrupted writes without another generation. Failed provider requests remain in Voice_Retry with bounded attempts. Do not delete masters or reservations during recovery.
