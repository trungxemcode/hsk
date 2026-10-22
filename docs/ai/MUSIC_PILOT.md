# Nghe nhạc học HSK — pilot

Scope: first music lesson workflow adapted from the user-supplied `test folder.zip` frontend/edge skeleton. Existing HSK app routes, Firebase accounts, SRS/word scores and AI/voice Worker are preserved. Entry: Luyện & Ôn → Nghe nhạc học HSK. This is a branch implementation, not a claim of deployed R2 resources or a live music catalogue.

## What works

- Local audio/video + validated lesson JSON, without uploading the user's media. 50 MB/file, 500 KB lesson input, 250 non-overlapping timed lines, maximum end 30 minutes. Local files are not persisted; select them again after reload. Text progress/history is per Firebase UID (or guest), bounded to 30 songs/200 answered segments and does not modify SRS, mastery, notebook or account study score.
- One reused native media element, explicit play, line selection/replay/loop, native controls, playback speed, hidden lyrics with pointer/keyboard hold or persistent reveal, independent pinyin/translation switches, per-line multiple choice and real selected-answer grading. Imported answers are client-visible practice data, not trusted assessment evidence.
- Progress is saved periodically, on visibility/navigation changes, and restored after metadata loads; playback resumes only on user action. Failed playback has a reload-source action; no infinite auto-retry or claim of 100% uninterrupted playback.
- HSK counts use occurrences of segmented words, not the hardest word. Highest exact-level proportion wins; ties prefer the higher level. Unknowns remain a separate new-word fraction and are never converted into HSK1/6 or silently added to a notebook. The denominator includes all Han-word tokens. A 100% unknown line has no proposed HSK level. This is vocabulary classification, not a validated listening difficulty score.
- Uses the app's HSK dictionary in memory. Reviewed `tokens` in a manifest take priority and must reconstruct the Han text. Without reviewed tokens, Intl.Segmenter is a provisional segmentation; platforms lacking it keep unknown Han phrases intact for review rather than splitting them into easy characters. Traditional forms need a reviewed token/dictionary mapping; no automatic simplified/traditional normalization is claimed.
- Shared catalogue API with Firebase server-side validation and fixed-owner publishing, 20-song pilot cap. Shared playback is identical for admin/VIP/regular accounts: this read-only pilot does not introduce a new AI usage allowance or change existing quotas/role assignments. No generation is performed.
- R2 native playback has published-key allowlisting, hash-shaped keys, byte/suffix ranges, 206/416, ETag, conditional GET, HEAD and bounded caching. R2 objects are shared public learning media, not a private media vault.
- Official YouTube embed option uses video IDs and IFrame Player API, visible player controls, play/seek/pause/state and autoplay-blocked recovery. It does not crop the player, overlay hard subtitles, resolve Googlevideo streams, remove ads or guarantee a particular playback quality. YouTube needs online third-party access.

## First usable lesson

1. Prepare one authorized audio/video file and timed lesson JSON using `content/music/lesson-template.json`. Its Chinese example text is original placeholder lesson text, not a song recording. Replace lines/timestamps/pinyin/translation/question options to match the actual recording. Indices of correct answers are zero-based.
2. Open the music route, expand “Thử với file nhạc và lời của bạn”, choose both files and press “Mở bài đã chọn”. This works without Cloudflare or a paid resource. Files never leave the browser on this path.
3. Check each line against the recording, HSK tokens, pinyin, translation, answer key, line start/end, lyric revelation and playback on a physical iPhone. A WAV fixture verifies media transport, not the linguistic quality of a real song.

## Shared pilot deployment (separate Worker)

Do not deploy `server/music` over `hsk-vietnamese-translator`. No AI/voice bindings, keys or deployments are modified.

Prerequisites: configured Wrangler access to the intended Cloudflare account; permission to store/distribute the selected recording; a real source file/YouTube ID and reviewed lesson. No songs or source playlists were provided with this implementation.

```sh
npx wrangler d1 create hsk-music-pilot
npx wrangler r2 bucket create hsk-music-pilot
# Put the returned real D1 ID in server/music/wrangler.jsonc.
npx wrangler d1 execute hsk-music-pilot --remote --file server/music/schema.sql --config server/music/wrangler.jsonc
npx wrangler secret put FIREBASE_API_KEY --config server/music/wrangler.jsonc
npx wrangler deploy --config server/music/wrangler.jsonc
```

Use the same Firebase project's normal web API key for accounts:lookup. Preserve secrets privately. Set ALLOWED_ORIGINS to exact app origins. The D1 ID in the checked-in template deliberately prevents accidental deployment to an unspecified resource.

To publish, install Wrangler normally on the admin machine. Set HSK_MUSIC_ENDPOINT to the actual HTTPS Worker URL, HSK_MUSIC_BUCKET to the dedicated bucket, and HSK_MUSIC_ADMIN_ID_TOKEN to a current Firebase ID token of the fixed owner (do not paste the token in chat or commit it). Then run:

```sh
node tools/music-publish.mjs path/to/lesson.json path/to/song.mp3
```

The tool hashes the local file, uploads to a content-addressed object key through configured Wrangler, then calls the owner-only publication API. Source credit is required. If publication fails, it reports that an uploaded object can remain orphaned; clean that specific staging object manually after review. Do not overwrite content-addressed keys with different media. The 20×50 MB catalogue is at most about 1 GB of referenced media; staging/orphan uploads are not a hard account billing cap. No deletions or automatic expansion to 100 GB are performed by the pilot.

For an authorized official YouTube embed, publish a manifest with `source: {"kind":"youtube","videoId":"REAL_11_CHAR_ID"}` through the same owner API (no media file needed). Do not point native video at a temporary Googlevideo URL.

Only after actual Worker verification set `music-config.json` enabled=true and endpoint to its real URL, rebuild the PWA release, and publish the frontend. The default false leaves local file learning usable with an explicit unconnected-catalogue status. Never claim the cloud library is active solely because a frontend PR was merged.

## Intentionally later

Automatic YouTube/Douyin harvesting; subtitle OCR/ASR; AI-generated pinyin/translation/questions; cloud learner history; trust-score quota changes; and daily 00:00 Vietnam top-hit rotation are not part of this first listening pilot. The user narrowed this iteration to the first music learning workflow. Existing prepared design for those components remains a later integration, not a running automation.

## Validation

`node --test server/music.test.mjs`: real SQLite schema/queries, manifest validation, proportional HSK/unknown classification, answer grading, Firebase/owner boundary, pilot capacity and media range/CORS behavior with mock provider/R2.

`node tools/check-music-dom.cjs`: imports, filters, reveal, answer history, user switch/late imports and absence of SRS writes.

`node tools/check-music-ui.cjs`: actual native WAV play/seek/loop on 390/844/1440px, light/dark, hold-to-reveal, quiz and route/account cleanup. Physical iOS audio policy and live YouTube/R2/Firebase are separate acceptance checks.

Run existing server suite, feature runtime, practice picker, feature preservation and PWA guards before review. Browser tests use simulated transport and synthetic silent WAV; no copyrighted media is bundled and no paid API is called.
