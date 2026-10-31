# Cloudflare Study4 HSK exam bank

- Cloudflare R2 bucket: `hsk-exam-bank`; keys `study4/manifest.json`, `study4/data/<sha256>.json.gz` and optionally `study4/audio/<sha256(url)>.mp3`.
- Public read URL currently: `https://pub-af2cf92bdb964826afb5fa13cb332892.r2.dev/study4/manifest.json` (Cloudflare R2 development domain, rate-limited; migrate to Worker/custom production domain when Cloudflare deploy access is restored).
- A separate read-only Worker is in `server/exams/worker.mjs`, config `server/exams/wrangler.jsonc`. It supports `GET/HEAD /v1/manifest`, `/v1/data/<sha256>.json.gz`, `/v1/audio/<sha256>.(mp3|m4a)` with 206 byte ranges. **Never replace the existing AI/music workers.**
- Audio remains on the official source until explicitly mirrored and verified; a bad/missing mirror is never referenced in the published data.

## Publish changed questions without updating the app

After replacing `study4-tests-data.json.gz` with a newly validated source dataset on your VPS:

```bash
python3 tools/publish-study4-cloud.py --data study4-tests-data.json.gz --audio-map ~/.hsk-study4-audio-map.json
```

Publisher uploads immutable, versioned gzip **first**, then updates the small no-cache manifest **last**. On the next app opening, or when reopening the exams after two minutes, the app checks that manifest and downloads changed data. Stable exam IDs preserve learner progress. The app retains bundled exams as fallback during R2/network failures.

To mirror source audio in controlled batches (only where you have redistribution rights):

```bash
python3 tools/mirror-study4-audio.py --limit 20 --budget-mib 150
python3 tools/publish-study4-cloud.py --audio-map ~/.hsk-study4-audio-map.json
```

The importer stores its resumable map outside Git at `~/.hsk-study4-audio-map.json` and limits individual downloads, transferred bytes and successful upload count. Already-mirrored files are skipped. Do not commit the map or any credentials. A source audio URL continues to play directly when it has not been mirrored. The current dataset references ~9,058 distinct audio URLs; bulk migration is **not** achieved merely by deploying the Worker or catalog.

## Permissions and safety

The currently connected Wrangler session can create/write R2 but received `No access to the specified resource` for Workers deployment, including the existing music Worker. Fix Worker deployment permissions before switching away from R2's public dev domain. `r2.dev` is not suitable as the permanent high-traffic endpoint. No public write endpoints exist. Do not claim full audio migration until object counts and ranges are verified. Check media redistribution rights with the content owner before bulk mirroring.
