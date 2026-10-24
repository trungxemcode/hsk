## AWS exact-source online audio — 2026-10-24
- Branch feat/music-aws-stream, main785ecca (PR184 merged), candidate3.16.1. Owner authorizes completing online background playback using newly provisioned AWS Lightsail1GB; no offline downloading. Isolated worktree preserves another local branch and untracked files.
- Deployed authenticated online_resolver.py on AWS with systemd/localhost binding, existing valid Plesk HTTPS origin, no media disk/cache/transcoding. Two extraction slots, per-account quotas, bounded in-memory source cache and short-lived relay tickets. Exact video ID and HTTPS googlevideo M4A validation; Firebase token checked server-side, never sent upstream. Config onlineResolver enables native YouTube audio for chill mode; official embeds still used when unconfigured; SoundCloud/study/local files retained.
- Single persistent native audio primed in original gesture; deferred source respects pause and account/serial cancellation. Metadata/actual timeline/MediaSession retain existing controls. Source errors try relay, then refresh exact source, bounded retry; stalls watched with cleanup. Auto-next uses existing queue even while hidden. No native privileges/force-quit or power-off claims.
- Real AWS source smoke and laptop cross-IP ranged audio succeeded on one video before implementation. HTTPS health works. Tests: new resolver HTTP/auth/rate/cache/source tests; new AWS browser suite390/1440 validates gesture/real AAC, route/hidden, controls, pending pause, relay/refresh, wrong-source rejection, retry, hidden auto-next, no IndexedDB writes and account cleanup. Existing online/embed/native/layout/link/runtime suites retained. Real phone lock-screen/Bluetooth and authenticated live account flow remain owner-device checks.
- Current endpoint uses Plesk/IP-derived hostname and existing TLS certificate; keep DNS/publicIP/certificate paths stable. See server/music/ONLINE-PLAYBACK.md for service locations, bounds and maintenance. No SSH keys or account tokens committed.

## BackgroundPlaybackGuard integration — 2026-10-24
- Branch fix/music-background-guard from merged PR183/main d32306f, candidate3.15.14. Adapt owner-supplied class to the existing single silent-WAV/retry/session lifecycle; no second audio loop/listener set. Center onclick calls guard.userPlay/userPause directly, MediaSession uses same methods, YouTube onReady attaches player and state changes reach guard.
- Do not copy visibility spoofing, stopImmediatePropagation or endless polling from supplied draft: preserve real app lifecycle, interruption and explicit pause behavior. Existing bounded150ms hidden recovery, hidden auto-next, owner cleanup and metadata retained.
- Replace old1px/zero-size stealth iframe with real min200x200 frame in musicLinkCover, behind thumbnail at opacity.01, pointer-events none, visible/block CSS and required allow permissions. Nest only when creating a YouTube track; no live route reparenting or visible video UI. Restore container for other providers at cleanup.
- Regression adds computed iframe geometry/layer/visibility checks and synchronous keep-alive play under trusted center-button activation; existing mocked-provider hidden/blocked/cleanup and native audio tests remain. Physical iOS/Android lock-screen/PiP capability still requires device verification; CSS/audio cannot grant native privileges.

## Background playback support, owner-requested keep-alive — 2026-10-24
- Extend still-open PR183 on main dc840a3, candidate3.15.13. Owner explicitly requests silent audio support, hidden-pause recovery and hidden auto-next; this supersedes prior no-keepalive scope. Optional Coc Coc offline-download handoff/help removed at owner request; actual user-file library remains.
- MediaSession uses current title/artist, album HSK Music, current thumbnail (fallback image allowed), play/pause/previous/next and exact5-second seek actions. Provider metadata refreshes on actual YouTube PLAYING. Iframe already permits autoplay/encrypted-media/PiP.
- Tiny one-second8kHz PCM WAV (8044bytes, all unsigned samples128) loops with YouTube. Prime only via user activation when available, then pause until actual PLAYING; best-effort audioSession playback, graceful play rejection. Pause/buffering/error/blocked/timeout/stop/account switch/other provider ends support; continuous same-element handoff only while advancing YouTube playlist. Last track stops/releases support, no silent forever loop.
- On PAUSED near a hidden transition, try playVideo after150ms once per transition, only if that player really played and user still requests play. Cancel stale/repeated timers, explicit MediaSession/UI pause, track/account changes, visibility return and exposed audioSession interruption. No infinite forced resume. End events advance the active queue/playlist even while hidden, deduplicate and honor opt-in track loop.
- Browser tests390/1440 validate real silent-WAV playback/content, metadata/actions/seek, hidden retry timing/duplicate event, user pause/interruption, rejected silent autoplay, continuous hidden playlist handoff, last-track/account cleanup. Existing native background, source/timed lesson UI, feature runtime, Coc Coc deletion, layout and preservation checks retained. Added3 implementation guards under existing background capability.
- This cannot force iOS/Android to keep a suspended/killed browser alive or confer Coc Coc native privileges. Hidden state/provider events are simulated; physical iOS/Android/Coc Coc/Safari lock-screen verification remains pending. No backend, download, ad-block or visible player changes.

## Scope update to PR183 — 2026-10-24
- Owner explicitly drops the Coc Coc offline-download option and asks whether183 borrows Coc Coc background privileges. Remove only the optional source-to-offline handoff/help menu; preserve the actual uploaded-file music library, original-source opener and browser choice. No guarded capability, playback route or user data removed.
- PR183 retains the existing player on in-app navigation and fixes full-screen/queue gestures. It does not acquire native Coc Coc privileges or ensure YouTube playback after app closure. MediaSession metadata/actions were already implemented; no invented native bridge added.
- Update browser assertions to require absence of the cancelled Coc Coc download UI while retaining source validation, per-browser declaration, file library and all player tests. Keep candidate3.15.13 on this existing unmerged PR.

## Fixed music viewport / Cốc Cốc limits — 2026-10-24
- Branch fix/music-locked-viewport from main dc840a3 (owner merged PR182,3.15.12). Owner requests non-scrolling full player, upward body swipe to queue, no source-tab jump from offline action, and asks whether MediaSession can borrow Coc Coc background/download permissions.
- Expanded chill only: fixed dynamic viewport, clipped backdrop/preview, bounded cover/title, dedicated dock grid. Short landscape uses two columns. Browse, study, menu and queue retain independent scroll. Existing gesture binding now supports an event accept guard; body/cover upward swipe uses existing queue drag mechanics, excluding controls and leaving menu separate. No iframe reparent/source change.
- Superseded by the owner scope update above: optional Coc Coc offline action/help removed. Explicit Open source action, browser choice/storage and source validation remain. No undocumented native download API, bridge privileges or fabricated offline file.
- MediaSession metadata, handlers, position and audio session already present for actual audio; this standard does not grant a website access to browser-private downloading or native YouTube playback. Official Coc Coc playlist docs confirm browser-owned offline/background capabilities, but no public website download/permission bridge was found. No claim of autonomous download or physical iPhone lock-screen verification.
- Checks: layout/touch swipe/cancel, independently scrolling long queue, square cover and fixed controls at320x568/667,390x844,430x932,844x390,1440x900; Coc Coc no-popup/help/declaration; provider online/links, real native background/MediaSession, feature runtime, tokens and preservation. Release prepared after validation; no merge requested for this task.

## 2026-10-24 — iOS music UX + truthful Cốc Cốc offline-link flow
- Address full-player bottom queue clipping, unaligned mini-player controls and quick-save plus button.
- Replace Cốc Cốc-specific MP3-import shortcut with URL handoff for Cốc Cốc-managed Listening List offline audio. A downloaded file in Cốc Cốc's browser-private store is not accessible to HSK PWA/IndexedDB.
- iOS YouTube official iframe cannot be forced by website JavaScript to keep playing on app exit/lock screen. Avoid simulated continuous playback and scraping.
- 24 Windows Cốc Cốc YouTube video pages probed: 24 players loaded, 0 early ad markers; not conclusive of ad-blocking on iOS/through iframe.
- Regression checks: Playwright 320/390/430 for viewport and controls plus old online/offline and browser declaration checks.

## 2026-10-24 — Cốc Cốc self-declaration supersedes UA-only experiment
- User explicitly approved self-declaration after real Cốc Cốc Windows exposed only Chrome identifiers. Branch PR #181 updated with reversible "Tôi đang dùng Cốc Cốc" button in Music 3-dot menu.
- Only browser-specific actions hidden by default elsewhere, but the opt-in setting is visible so users whose Coc Coc UA looks like Chrome can enable them. Stored under \`hsk-music-coccoc-mode-v1\` in the local origin storage for the browser/PWA installation; explicit on/off overrides auto detection.
- Browser-native ad blocking/media downloading cannot be remotely controlled by HSK; official source page and user-selected file import only. No yt-dlp, server cache or automatic file import. Keep other HSK functions/data unchanged.
- New browser tests include Chrome, iOS Safari, branded Cốc Cốc, Chrome-looking Cốc Cốc, reload persistence, opt-out override and offline file retention.

## 2026-10-24 — Conditional Cốc Cốc handoff for music (release 3.15.7)
- Add an optional Cốc Cốc-only set of actions in HSK music menu to open a verified original song URL so Cốc Cốc may apply its own ad blocker/download media toolbar, then import locally downloaded MP3/M4A.
- No direct HSK browser adblock/download API exists; no server downloads or music ripping. UA Chrome masquerading can make some real Coc Coc builds indistinguishable. Fail closed and hide optional controls unless a positive marker is exposed.
- New Playwright and unit checks guard Chrome/Safari invisibility, branded/mock Cốc Cốc visibility, valid provider sources, local-file-only import.

## 2026-10-24 — Bridge update for Safari → Cốc Cốc re-install (HSK 3.15.6)
- Owner asked for an intermediate update: safely remove downloaded resource packs before installing HSK from another browser. No cross-browser storage sharing exists on iOS.
- Account > Dọn dẹp dung lượng now offers a **two-step bulk deletion** of ONLY extra download caches and voice model. Preserve the PWA core cache, offline MP3/M4A, user progress, account and unrelated caches. Existing per-item deletion remains available.
- In new PWA browser environment, base HSK files are downloaded automatically by the existing versioned service worker. Large extras (YunJian voice ~99 MB + handwriting neural ~28 MB) require one explicit confirmation to download and verify *in that browser*, sequentially; dictionary shards and handwriting stroke data continue loading on demand. Do not promise automatic reuse of Safari CacheStorage/IndexedDB from Cốc Cốc. Keep foreground open while installing.
- Reinstallation does not automatically restore unsynced local progress, music or private files. Users should use the existing progress backup/sync feature before deleting Safari PWA or site data.
- New tests: \`tools/check-storage-migration-ui.cjs\` verifies two-step confirmation, user data preservation, selected CacheStorage cleanup, fake verified SHA-256 model transfer, and opt-in voice install on 390/1440 viewports.

## Music start/navigation regression — 2026-10-24
- Branch fix/music-start-navigation from main d17edfc (owner merged PR178,3.15.4). Owner reports lost background playback, first play needing two presses and ads. Code proves route observer stopped/destroyed YouTube through canPlayBackground exclusion; paused polling could clear pending play before delayed onReady.
- Retain the original in-panel YouTube iframe/player on app navigation, including pending initialization. No body portal, visible video, reparent, substitute source or keepalive. Native/SC preserved. Ready flag + explicit playback intent prevent commands before ready and stale paused samples clearing a request; user cancel respected. Blocked/error/stalled start returns truthful controls/status with no automatic retry. MediaSession play/pause uses same intent and native/widget/YT position updates; cleanup clears position/playback state.
- Nocookie and SponsorBlock unchanged. SponsorBlock content skip/undo/toggle passes; it cannot remove YouTube-served pre/midroll ads. This architecture does not guarantee lock-screen/out-of-browser playback on iOS; physical phone verification still required.
- Validation: official online390/1440 with delayed ready/start, one play request, cancel-before-ready, blocked autoplay/retry, timeout/retry, route exit before/after ready, identical original iframe/no visible portal; native background390/1440 real audio, visibility/media controls/queue/account cleanup; provider UI, music DOM, SponsorBlock unit, feature runtime and feature contract. No merge requested for this new fix.

## Button release icon regression — 2026-10-24
- Branch fix/button-release-icons from main e504551 (3.15.3). Owner screenshot: SRS home tile loses icon after touch hold/release. Generic :hover forced white descendants/transparent tiles while higher-specificity home card remained white; mobile sticky hover kept the bad state. Legacy studio dark/press rules had the same unguarded hover behavior.
- Limit generic hover paint to hover-capable devices in ui-buttons.css/studio-layout.css; keep active, keyboard focus, selected and disabled semantics. Match home base specificity for complete purple active/focus surface with white icons. No music/player/data logic changed.
- Extend existing press-shape browser regression: actual touch release/cancel and sticky hover, forced active CSS state (CDP touch does not consistently expose :active), desktop hold/release outside, keyboard focus on six home actions;320/390/1440 light/dark. Existing route behavior remains covered separately.
- Validation: press-shape320/390/1440 light/dark, shared press116 headers/15 routes/4 viewports/both themes, dark contrast17 routes, feature runtime, redesign route/reduced-motion, design tokens and feature preservation passed. Browser touch is emulated; physical iPhone unverified. No merge requested for this new task.

## Restore music UI scope — 2026-10-24
- Correct PR176 unsolicited visible YouTube/mini-video UI: remove body portal and forced cover size; restore the original in-panel music presentation. Keep actual provider timeline, seek and stale-poll protection, nocookie and SponsorBlock unchanged. Keep handwriting improvements.
- Native/direct audio and SoundCloud background behavior unchanged. YouTube background behavior returns to the previous baseline; no new screen-lock guarantee.
- Regression: online controls at390/1440 verify real timeline/seek and no added portal; SponsorBlock unit, feature preservation and design tokens pass.

## Handwriting / real timeline / retained YouTube — 2026-10-24
- Branch fix/handwriting-music-transport from main0f2c73b (3.15.1). Screenshots showed generic input CSS painting the range as a large white box, duplicate handwriting headers, blank candidate spacing and all secondary controls expanded. Exclude range from text-input theme; scoped gradient timeline32px with provider time/value/remaining/ARIA updates and drag/seek acknowledgement guard shared by native/YouTube/SoundCloud.
- Drawing retains original IDs/handlers/samples: compact canvas <=300px /38dvh, no empty candidate space, one local close/header (hide redundant mobile study header/progress), core drawing/recognition buttons, one collapsed options disclosure containing neural settings, sharing/privacy, sample sync/deletion and sources. Real stroke/undo/clear and options reachability covered.
- Superseded by the scope correction above: the visible YouTube host/mini player introduced here is removed at owner request.
- CI follow-up: use standard clean-disclosure class for source-group compatibility; give advanced-recognition summary full ink contrast in dark theme. Existing assertions retained.
- Tests: expanded search tabs320/390/1440 themes; mobile UX360/390/1440; official online390/1440 checks actual provider seek/elapsed/fill, delayed-seek drag protection, retained same iframe/player/playing state and visible mini frame after route exit; existing link/timed lessons and upload-only offline playback. Provider APIs mocked; physical iOS pending. No merge authorized for this new fix yet.

## Official online playback — 2026-10-24
- Branch feat/music-online-cleanup from main53328ac (PR174 uploaded-file-only offline). Owner settled on official YouTube nocookie + browser SponsorBlock, official SoundCloud Widget, uploaded MP3/M4A stored in IndexedDB. No Invidious/Piped/Cobalt/catalogue-match/resolver calls in app playback; default loader no longer loads direct-source extractor. Legacy helper files/contracts remain compatible but unused by app. No backend or VPS deployment.
- SponsorBlock for entertainment YouTube only: bounded abortable metadata lookup, validated/merged content segments, duration limits, playing-state guard, skip/undo, per-owner toggle, cache and fail-open. No platform-ad interception; timed HSK lessons remain intact. Nocookie was already present; obsolete modestbranding removed. Titles optionally come from provider player metadata, no Noembed lookup.
- SoundCloud entertainment now uses existing official Widget adapter with duration, transport/state events, route persistence, MediaSession actions and account cleanup. OS lock-screen/background behavior and platform ads are not guaranteed. Direct public HTTPS MP3/M4A uses native streaming audio, no offline write or codec. User-picked MP3/M4A still uses existing persistent local library.
- Clean UI: Nhạc từ thiết bị, concise file-only help and prominent import button. No link-download form; inert hidden quality ID retained for compatibility guard. No source-search errors in app player.
- Validation: SponsorBlock unit; source URL tests; online official-controls browser390/1440 (YouTube/Sponsor skip+undo+toggle, SC widget retention/transport, native URL playback/background, zero alternate-source/noembed/codec/offline calls); existing provider/lesson UI390/1440; uploaded offline UI390/1440; full feature runtime390/1440; music DOM. External providers mocked, local file playback real. Physical iPhone/real provider availability unverified. No merge authorized yet.

## 2026-10-24: Bỏ tải nhạc từ link, giữ nghe ngoại tuyến bằng file do người dùng chọn
- User quyết định không dùng AWS/Oracle/R2/yt-dlp cho nhạc. PR #173 đã đóng, chưa merge.
- Nhánh \`fix/remove-music-offline-20261024\` dựa trên main: gỡ link-to-offline (nút, URL form, nguồn downloader, trạng thái background, tự resume), giữ lại IndexedDB + phát offline + file M4A cũ, thêm hỗ trợ file MP3 do người dùng chọn.
- Giữ nguyên nghe nhạc trực tuyến, playlist, nhập nguồn URL để phát, audio học HSK, offline của các tính năng học khác. Không xóa kho người dùng.
- Không tải WASM transcode cho music khi khởi động. Server source resolver giữ mã lịch sử nhưng không được gọi và chưa triển khai.
- Cần CI bảo toàn chức năng, kiểm thử trình duyệt 390/1440, PWA release.

## Four direct search tools — 2026-10-24
- Branch feat/search-four-tools from main01fcea8 (3.14.1). Owner asked to split combined vocabulary/handwriting and translation/OCR controls into four compact buttons. One equal-width row: Từ vựng, Vẽ chữ, Dịch câu, Đọc ảnh; selection and header follow exact tool, global Search remains active.
- Preserve all routes/IDs/API/storage. Original handwritingOpen button moves into the first toolbar and keeps its worker/handlers. Handwriting hides vocabulary entry/scope controls; image view opens existing OCR while sentence view keeps its form separate. OCR→translation transfer and legacy home/image entry remain supported. No auto API call, picker or keyboard on tool selection.
- Search UI tests cover320/390/1440, both themes, four-button bounds, selection, independent content and OCR file-picker/transfer. Existing Studio DOM, mobile UX and full feature runtime390/1440 passed. Local Chromium full browser lacked socket permission; headless shell worked. No merge requested for this new UI change.

## Optional download cleanup — 2026-10-24
- Branch feat/storage-cleanup from main64a05cb (PR170 merged). Account → Dọn dẹp dung lượng lists only allowlisted optional caches, current-device voice assets and current-owner offline songs with measured bytes. No app/PWA/demo cache or study/account data deletion. Nothing selected by default; explicit multiselect, select-all, refresh, per-item errors and completion counts.
- Voice removal uses revision-checked device fallback and releases voice worker. Offline song removal uses expected asset/timestamp and existing reference-count cleanup; other owners and unselected songs preserved. Active downloads block corresponding removal. Music removal releases current native audio; neural-cache removal resets the optional worker and keeps basic recognition and learned samples.
- Browser tests use real CacheStorage/IndexedDB at390/1440, selective deletion, voice fallback, shared-asset and account isolation, core/progress preservation, reload persistence and light/dark layout. New CI check and append-only feature guards. Physical iPhone storage accounting includes browser overhead not represented by summed payload bytes.
- No merge/deployment authorized for this new feature yet. No backend/Auto50/Worker changes.

## Offline source fidelity — 2026-10-24
- Owner asked to use official `yt-dlp/yt-dlp`. Extend the same PR with pinned official 2026.10.21 default/EJS dependencies, Deno 2.9.6 container runtime, real CLI parsing and post-download source-ID/URL validation. Container smoke workflow checks runtime without live YouTube requests.
- Live metadata probe succeeded for `bv_cEeDlop0` (203s, 251/Opus), while `BaW_jenozKc` was unavailable. Full media download was cancelled by the environment's network approval before a file was created; do not report end-to-end live download success. No local Docker engine, VPS deployment or frontend endpoint switch. Resolver contract including new official-command/source-identity regressions passes locally.
- Branch `fix/offline-source-fidelity` from merged main `b38ce08` (3.13.3). Root cause consistent with report: download() defaulted to a same-title/artist NetEase match when the YouTube source failed; app stored those different recording bytes under the original YouTube URL.
- Remove cross-catalogue fallback from offline download entirely, including legacy smartMatch=true callers; stop rewriting saved title/artist to a match. On source failure show an explicit exact-link error and preserve old assets. Labelled online catalogue matching stays available, unchanged. No stored music is deleted or repaired automatically.
- Tests: direct-source regression rejects replacement even with legacy smartMatch=true; real offline browser/WASM tests 390/1440 verify no catalogue request and unchanged prior asset/title/size when original source is blocked. Existing offline and online background tests pass. Public source and physical iPhone checks remain outside mocked tests.

## Home spacing and background music — 2026-10-24
- Branch `fix/home-spacing-background-music` from main `dc22b9c` (3.13.2). Mobile Home uses a shared 12px rhythm across shortcuts, music entries, pathway, daily word and search.
- Offline chill tracks use one persistent native audio element outside the route panel. Leaving the route retains playback and offers a global open/play/pause/stop bar. MediaSession play/pause/seek/next/previous/stop, actual state/position and feature-detected AudioSession playback category; owner change and study-mode entry release the player. Native loop remains opt-in.
- Owner expanded scope: menu action `musicMenuBackgroundRow` resolves progressive online audio without file conversion/download-to-library. `HSKMusicDirectSource.stream` uses bounded metadata lookup and a cancellable native readiness probe; actual media is streamed by the native player. The original embed remains until a playable source is found. Online queue mode resolves subsequent unsaved tracks too, with epoch/owner guards. Offline-only sessions keep their downloaded-only background queue.
- Spotify protected full tracks are not extracted: only a unique named song+artist match from another catalogue is permitted, labelled with its real provider; otherwise preserve original embed and show a visible error. Public provider availability is not established by mocked tests. Closing/killing the app or powering off cannot continue web audio. Real iPhone lock-screen/background behavior remains a physical-device check, not proven by browser tests.
- Validation: new real-audio background UI check, existing offline WASM UI check, source/player DOM checks, mobile spacing assertions and feature/PWA guards. External APIs are mocked; music fixture playback is real.

## Owner redesign integration — 2026-10-23
- Branch feat/redesign-integration from main83f532b (PR166 merged). Owner's Windows CSS/JS applied over latest shell; no route/storage/music feature replacement. Tokens consolidated, Inter subsets self-hosted and precached. See REDESIGN_INTEGRATION.md for source backup and compatibility boundaries. Publish and Windows synchronization status reported in task response.

## Kokoro Yunjian single-voice deployment — 2026-10-23
- Request: Use only Kokoro male Yunjian for Chinese TTS; minimize downloads. Branch `feat/kokoro-yunjian-only` from merged main.
- Exactly one new installable voice `zm_yunjian`; ONNX 8-bit model pinned at 92,361,116 bytes, speaker weights 523,435 bytes, Mandarin resources + shared Sherpa WASM. First full install ~94.3 MiB; only the small Yunjian MP3 demo precached by PWA. Users explicitly download the large package once; then the voice is the selection for all app Chinese TTS through HSKVoiceManager, Vietnamese stays unchanged. Unsupported devices retain OS TTS fallback. Previously installed packs are kept until successful replacement.
- Exact model and voice SHA-256 verified from Hugging Face; real ONNX/WASM generated Mandarin PCM. Smaller q8f16 was incompatible in current runtime; not deployed. See vendor/chinese-voices/SOURCES.md.
- Outstanding: iPhone physical device test and perceptual quality approval. No auto voice generation or key management touched.

## Chinese voices — feat/chinese-voice-packs / PR160 (Draft)

User corrected size policy: tiny demos before download, only chosen voice's
package, auto-delete previous app voice on successful replacement, keep OS
voices. Current catalog offers Huayan (~17.8 MiB model/config + ~4.9 MiB common
runtime = ~22.8 MiB first install). All 9 MP3 auditions together fit 0.1 MiB.
The original 8 Kokoro entries are demo-only for new downloads: the 162 MiB
shared model cannot be divided into 8 independent 20 MiB models. Existing
legacy Kokoro selections remain playable until replaced/removed.

Huayan actual WASM passed several Chinese/date phrases with finite non-silent
PCM and no skipped tone-symbol messages. Small x_low candidate was not selected
because its frontend skipped tone symbols. Fast UI tests include selected demos
without installs/default changes, quota/network/runtime/cancel rollback,
old-model deletion, warm workers, offline and real MP3 decoding. Sources and
reproduction: CHINESE_VOICES.md and vendor/chinese-voices/SOURCES.md. Real iPhone
and subjective listening QA still pending. No merge/deploy or Auto50 changes.

## On-device offline quality — 2026-10-23
- Added 32/64/96 quality selector and cancelable link save pipeline; true HE-AACv2 encoding runs in a single-use browser Worker with a custom 2.1 MiB audio-only FFmpeg.wasm/FDK build. Lazy SHA-verified codec cache stays separate from music storage and initial PWA precache.
- Original-audio resolver Python/container prepared; no server encoding. **Not deployed/configured**: `offlineSourceResolver` stays empty. Live provider downloads are not claimed; Spotify is unsupported. See MUSIC_OFFLINE.md for deployment contract.
- Real shipped WASM passes all three quality/profile tests, reuse cache and invalid input. Resolver auth/owner/source byte/cleanup tests pass. Browser at 390/1440 passed real device-side conversion from mocked original source plus prior offline playback suite. Existing feature runtime passed at 390/1440; storage, music DOM, design tokens and 48/203 feature guards pass. PWA 3.11.4 / 174 precached assets; codec WASM is lazy.

## Offline music collection — 2026-10-23
- Branch `feat/music-offline` from main `7ff181e`.
- Ellipsis “Nghe ngoại tuyến” sub-view: attach a corresponding M4A file to current provider track, standalone local import, stored list, remove and usage. No fake download from provider iframe. HE-AAC v2/64 kbps preparation provided by `tools/prepare-offline-music.py`; local imports retain original bytes and the UI explains this.
- IndexedDB is stable across PWA releases: per-owner references, shared hash-addressed blobs, 100 MiB global budget, 50 MiB/file, atomic add/quota failure, reference-count cleanup, no automatic deletion of user-saved tracks. Never stores audio in localStorage/Firebase.
- Native local player reuses current full player, progress, seek, pause, rate and optional repeat. End of offline collection stops unless repeat is enabled. Object URLs released on source/route/account change. Account race guard protects async file import/read.
- Verified storage unit test (dedup, separate owners, final-reference deletion, bad format, stale operation and atomic quota), DOM music regression, design tokens and real HE-AACv2 64 kbps converter output. Browser offline UI at 390/1440 passes: attach/import, reload persistence, wrong-account exclusion, offline real play/pause/seek and delete. Provider/link UI, feature runtime and music lesson UI light/dark also passed; route re-entry native-source restoration passed offline browser coverage at both 390/1440.
- Fixture is a six-second excerpt of generated synthetic music; no third-party recording. Physical iPhone and cold-start PWA in airplane mode still require device acceptance; browser playback test loads app shell online, reloads to verify DB persistence, then disconnects before playback.
- Provider URLs remain online until a user supplies the matching owned file. No hosted transcoding/download backend or R2 deployment added.

## Stable entertainment recents — 2026-10-23
- Branch `fix/music-stable-recents` from main `4b5ed59`.
- Evidence: `drawRecentBrowse()` previously substituted three demo tracks when `savedLinks()` was empty. `owner()` previously defaulted to guest until Firebase finished; account module emits transient user:null while restoring cloud state.
- Recents now contain only owner history or an explicit empty state. Local cached account UID keeps library ownership stable during auth restoration/offline. Real account switches still clear media and invalidate pending imports. Re-entry resets browse filter to All.
- Regression tests cover startup before auth, repeated null/ready events, different guest history, empty account and route re-entry; existing import/account isolation checks retained.

## Independent playback queue drawer — 2026-10-23
- Branch `fix/music-queue-drawer`, based on main `c5753ad` (PR #155).
- Bottom handle renamed “Danh sách chờ phát”; it and the queue icon open `musicQueueSheet`, independent of ellipsis actions.
- Queue shows current track + upcoming playlist/saved-link items; shared `playbackList()` keeps its order consistent with Next, including wraparound. Selecting a queued track retains its playlist.
- Drag begins at the collapsed handle and tracks mouse/touch 1:1; supports cancel, snap and scrollable content. Scoped fullscreen panel CSS removes transformed containing block/hidden scrolling that displaced fixed sheets.
- Verified: DOM music tests; 10 server music tests; design tokens; Playwright queue/link UI at 390/1440 (mouse hold, touch opening, touch closing/cancel, playlist order/select, separate ellipsis); feature runtime 390/1440; music/nav 320/390/1440; music lesson UI 390/844/1440 light+dark. External music providers mocked; no live credentials.
- Added queue guards to existing music feature contract. PWA metadata regenerated before commit. PR only; merge awaits user instruction.

## Music Home Button Animation Sync & Spotify-style Recent Tracks with Mini Player — 2026-10-22
- Release 3.10.21 on branch feat/music-spotify-home from origin/main 5d27e9a (3.10.20).
- Addressed two specific user requirements sequentially:
  1. Synchronized Home button active animation:
     - Fixed CSS rules in `music.css` lines 213–222 for `.home-music-grid :is(.home-music-entry,.home-music-chill)`.
     - Idle state keeps standard theme card colors. When pressed/active (`:is(:hover,:active,:focus-visible,.active,[aria-pressed=true])`), card background turns purple (`var(--button-active-bg)`), border turns purple, icon pill turns translucent white (`var(--legacy-rgb-11)`), and text/icon turns crisp white (`var(--button-active-text)`), perfectly matching "Sổ từ vựng" and the other home cards.
  2. Spotify-style Browse View & Floating Mini Player in "Nghe nhạc giải trí" (`currentMode === 'chill'`):
     - Entering "Nghe nhạc giải trí" displays `#musicBrowseView` (Browse mode) instead of an empty full-screen player placeholder:
       - Header with back button returning to Home (`window.HSKStudio?.navigate('home')`), title "Nghe nhạc giải trí", and `⋯` options button.
       - Category filter pills: "Tất cả", "Bài hát", "Playlist".
       - Section "Nội dung bạn hay nghe gần đây" rendered from `savedLinks()` with square 52x52px thumbnails, bold capitalized titles, artist/source subtitles, and `⋯` options button opening the action sheet.
       - Section "Danh sách phát của bạn" showing saved playlists.
     - Floating Mini Player (`#musicMiniPlayer`):
       - Docked near the bottom of the screen (`bottom: calc(12px + env(safe-area-inset-bottom))`), without a bottom navigation bar per user requirement: "( không cần thanh điều hướng ở đáy )".
       - Displays the last played / paused song (or most recent track) with 42x42px square thumbnail, track title, artist, quick save check/plus button, and Play / Pause button.
       - Thin 2px bottom progress bar synchronized with current playback position.
       - Tapping the mini player body expands to the full-screen now-playing player (`setPlayerExpanded(true)`); tapping the top-left chevron collapses back down to the browse view (`setPlayerExpanded(false)`).
- Quality Gates & Validation:
  - PASS design tokens (0 hex/rgba violations).
  - PASS DOM tests (`check-music-dom.cjs`, `check-music-links-dom.cjs`).
  - PASS Playwright UI tests: `check-music-mobile-nav-ui.cjs` (320, 390, 1440px), `check-music-links-ui.cjs` (390, 1440px), `check-music-ui.cjs` (390, 844, 1440px, light & dark), `check-home-overview-ui.cjs`, `check-mobile-ux-ui.cjs`.
  - PASS feature preservation (47 capabilities, 189 guards).
  - PASS PWA release guard: 169 assets verified, version **3.10.21**.

## Music Spotify-style compact menu and dedicated sub-views — 2026-10-22
- Release 3.10.20 on branch feat/music-spotify-compact-menu from origin/main 19833e1 (3.10.19).
- Re-architected bottom sheet into Spotify-style compact action sheet with dedicated sub-views:
  1. Main compact sheet view (`data-view="main"`): Contains only the primary action rows (Song info head, Share row, Add to playlist, Paste new song link, Library & playlists with chevron `>`, Open source link). Eliminates deep nested configuration clutter from the initial view.
  2. Dedicated "Đã lưu vào" sub-view (`data-view="save"`): Exact replica of Spotify playlist save sheet:
     - Top bar with "Hủy" (left) and "Xong" (right).
     - Section title "Đã lưu vào" with green text action "Danh sách phát mới".
     - Interactive playlist selection list: 56x56 thumbnail, bold title, song count, green circle checkmark for saved playlists and outline plus for unsaved playlists. Pending changes are committed only upon tapping "Xong"; "Hủy" cancels cleanly.
     - Inline collapsible new playlist creation form and full-row "+ Danh sách phát mới" action.
     - Centered large green pill "Xong" button (`var(--legacy-hex-27ae60)`) at bottom.
  3. Dedicated library view (`data-view="library"`): "‹ Quay lại" / "Thư viện của bạn" header, collapsible playlist items with inline track management and "+ Tạo playlist mới".
  4. Dedicated link view (`data-view="link"`): "‹ Quay lại" / "Dán link bài hát mới" header with focused URL import form.
  5. Scoped ID CSS rules preventing display cascade bleed-through across sub-views while keeping design token compliance.
- Validation: PASS design tokens (0 violations), PASS DOM tests (`check-music-dom.cjs`, `check-music-links-dom.cjs`), PASS Playwright UI tests across 320/390/844/1440px light & dark modes, PASS feature preservation (47 capabilities, 189 guards), PASS PWA release guard with 169 verified assets.

## Music Spotify-style Flat Action Bottom Sheet — 2026-10-22
- Release 3.10.19 merged to main (commit 19833e1) via PR #151 from feat/music-spotify-bottom-sheet.
- Redesigned `#musicMenuSheet` and playlist bottom sheet according to Spotify Flat Action Sheet pattern:
  1. Top header: Centered drag handle (36x4px, rounded), Now Playing Track Info header (48x48px thumbnail, 16px bold title, 13px artist/channel) with a subtle full-width bottom divider line. Removed verbose tutorial/guidance text blocks.
  2. "Zero Boxes" principle: Eliminated all rectangular purple buttons and boxed card containers. Every action is a flat menu row (`.music-flat-row`) with left 22x22 outline SVG icon, clean 16px white label, and subtle hover/active highlight.
  3. Four flat action rows: Row 1 dynamic save state ("Đã lưu trong playlist Yêu thích" / "Thêm vào danh sách phát"), Row 2 collapsible link import, Row 3 open source link in external tab, Row 4 collapsible playlist creation.
  4. Flat playlist section: "Danh sách phát của bạn" with 48x48 thumbnail cards, track count, chevron `>` expander, and flat track rows with 40x40 thumbnail and minimal delete button.
  5. Dark paper theme (`var(--palette-dark-paper)`), hidden scrollbars, rounded top corners (16px), 16px inputs avoiding mobile auto-zoom.
- Verification: PASS token check (0 violations), PASS unit DOM tests (`check-music-dom.cjs`, `check-music-links-dom.cjs`), PASS browser Playwright checks (`check-music-links-ui.cjs`, `check-music-ui.cjs`, `check-music-mobile-nav-ui.cjs`), PASS feature preservation (47 features, 189 guards), PASS PWA release guard (169 assets). All CI checks on PR #151 passed (including `layout`, `touch`, `release-guard`, `feature-contracts`, `protected-flows`, `mobile-and-learning`). PR merged and local `main` fast-forwarded to `19833e1`.

## Music player UX responsiveness & home cards balance — 2026-10-22
- Release 3.10.18 on branch feat/music-player-latency-and-home-grid from origin/main adfaaaf (3.10.17).
- Root causes identified and resolved:
  1. Home page 2-column shortcut misalignment:
     - `iconPaths` in `src/modules/shell/studio.js` lacked `headphones`, leaving `.home-music-chill` icon box completely empty. Added SVG path.
     - `music.css` line 214 previously injected `.home-music-entry{margin-top:8px}` on max-width 600px, pushing the right button down by 8px. Removed this rule.
     - Mobile touch tap triggered `:focus`/`:active` which was caught by `ui-buttons.css` turning the card purple and erasing the icon background. Added explicit scoped `:not(.correct):not(.wrong):is(:hover,:active,:focus,:focus-visible)` rules keeping `--surface`/`--ink` and `--accent-light` icon box under all tap states.
     - Both cards now use `align-items: stretch`, `min-height: 60px`, `height: 100%`, and flexible text wrapping with `overflow-wrap: anywhere` passing all responsive goal tests down to 320px at 200% text scale.
  2. Music player responsiveness & latency elimination:
     - Play/pause button SVG fill was previously overridden to white under active/hover states by `ui-buttons.css`. Added scoped `!important` rule on `:is(svg,path,rect)` and explicit inline/attribute fills for `var(--palette-dark-paper)`.
     - Clicking play had a 2-3s freeze because YouTube iframe API takes 1-3s to buffer and report state 1 (`PLAYING`). Added optimistic state tracking (`linkOptimisticPlay`, `linkPendingPlay`) providing instant 0ms toggle feedback from Play to Pause upon user touch.
     - Added `&autoplay=1` and `linkPendingPlay` when opening tracks from playlist/form to pre-buffer media without idle delay.
     - Scoped `.music-aux-btn` to override `ui-buttons.css` with transparent ghost icons.
- Validation: PASS design tokens, PASS feature preservation (47 capabilities, 189 guards), PASS DOM unit tests, PASS Playwright UI checks (320/390/844/1440px), PASS responsive goal UI at 100/150/200% text scale, PASS PWA release 3.10.18 with 169 verified assets.

## Music URL import — 2026-10-22
- Branch feat/music-link-import-20261022 from merged main9be0164/3.10.1. Add full HTTPS song link input, source validation/canonicalization, official YouTube/Spotify/SoundCloud previews,30 saved links per account and deletion of saved entries. Bare links do not invent HSK lyrics/grades. Optional reviewed JSON enables timed YouTube/SoundCloud learning; SoundCloud Widget adapter handles ms/seconds, pause/seek and cleanup. Spotify remains listen-only with explicit preview/session limitations; redirect shortlinks need full URL. Loop stays opt-in.
- No harvesting, Googlevideo resolver, metadata/lyrics scraping, AI generation, role/quota changes or Worker voice deployments. Cloud catalogue remains default off; personal links function independently. Detailed limits and external references: MUSIC_PILOT.md.
- Local validation: link parser and adapter/DOM tests; browser390/1440 official iframe construction and mocked timed SoundCloud seek/loop/account cleanup; existing native WAV390/844/1440 light/dark still pass. Broad server/runtime/PWA checks and PR status in response. Third-party live availability and actual iPhone playback remain acceptance checks.

## Music listening pilot — 2026-10-22
- User narrowed the ZIP architecture to music learning first. Branch feat/music-hsk-pilot-20261022 from main411b128 (3.9.1). Candidate3.10.1 integrates a music practice route, local recording + reviewed timed JSON, reusable native/official YouTube player, segment loop/replay, hold/reveal/pinyin/translation, quiz, proportional HSK (dominant token level, higher-level tie) and separate unknown words.
- Per-UID bounded local history/progress, account-switch and navigation cleanup; no SRS/mastery/notebook/quota or voice changes. Independent music Worker + D1 schema/R2 playback with fixed-owner publication; catalogue default off and20-song cap. No real songs, source lists, Cloudflare bindings or credentials supplied/provisioned. Live library requires an actual recording/YouTube ID, reviewed lesson and isolated Worker deployment. No automatic harvesting, OCR, top-hit rotation or resolver service in this first pilot; see MUSIC_PILOT.md.
- Validation:258 server tests pass, local DOM isolation/late imports pass, real synthetic WAV playback/loop/seek/reveal/quiz at390/844/1440 light/dark pass, feature runtime390/1440 and practice picker320/390/1440 pass, design tokens pass.47 protected features/183 guards,168 PWA assets. Browser checks are Chromium, not physical iOS; Firebase/R2 mocked. PR/CI status in response.

## Image feature parity — PR133 follow-up (2026-10-21)
- User requires regular accounts retain all image functions. OCR, photo translation and AI handwriting now use Gemini for regular accounts, with a shared10/day atomic reservation cap in Vietnam time. Lượt11 rejected before provider. These10 are within existing35-query/50-total limits; VIP has no image sublimit, owner unlimited. Text/reading remain xKiro; no promise of identical model quality.
- Eight new tests cover mixed routes, concurrency, Vietnam reset, independent accounts, no spend on rejected budgets/auth/input, verified provider routing, forgery and VIP/admin exceptions. Existing raw-image/text-only adapter guard remains. UI badge/admin explanation updated; PWA3.5.2 prepared. Final PASS:252 server tests, UI/runtime390/1440,46 features/177 guards,163 PWA assets. No live deployment.

## Account roles — 2026-10-21
- Candidate 3.5.1, feat/account-roles-20261021 from origin/main 9ae727d. Owner fixed to existing account-config UID/email; only owner grants/revokes VIP. Admin/VIP Gemini-only, regular xKiro-only, regular image AI exceptionally uses Gemini with10/day shared OCR/translation/handwriting reservations in Vietnam time; existing quotas preserved. No real users promoted.
- Roles persisted through AI_CONTROL in separate object; authenticated management routes and dashboard. Cache partitioning prevents cross-provider reuse. Voice code and active dirty voice checkout untouched.
- Tests: Final validation PASS:244 server tests, account-role UI390/1440, feature runtime390/1440,46 features/175 guards,163 PWA assets, shared design-token checks. Management/provider transports mocked, no live Gemini speed benchmark. Separate Worker deployment required and must preserve independently deployed voice changes. PR132 chat remains separate.

## Alternating Chinese/Vietnamese word pairs — 2026-10-18
- Base main947f550 (3.4.7). Word study now alternates Chinese word -> spoken Vietnamese meaning, repeated as three complete pairs, before stroke demos/examples. Examples remain Chinese -> Vietnamese meaning -> silent karaoke. Per-slide audio completion, slow pacing, stroke repetitions, pause and mastery behavior retained.
- guidedShow v4 matches the expanded sequence. Core and browser regression assert the exact six-utterance language/text prefix; no repeated Chinese block before the first Vietnamese meaning. Validation/PR/deployment status in response.

## Repeated word audio and spoken Vietnamese meanings — 2026-10-18
- Base main d421475 (3.4.6). Presentation word audio now repeats3 times with a1.4s gap before pace scaling, then reads Vietnamese meaning, shows3-pass strokes and starts examples. Example/context order: Chinese model -> Vietnamese meaning -> silent karaoke learner turn. Long meanings use bounded Vietnamese speech chunks and are gated on actual audio completion.
- Device speech explicitly selects vi-VN for meanings and Mandarin otherwise, never a Chinese fallback for Vietnamese. Missing Vietnamese voice pauses with an actionable notice. Shared speech defaults remain Mandarin0.85 and no inter-chunk gap; presentation opts into language/rate/gaps. Completion callbacks are one-shot; stop cancels pending repetitions and stale endings cannot replay audio.
- guidedShow v3 matches the changed sequence; no learner mastery/history migration. Core/speech tests cover repeat count, bilingual sequence/voice selection, gaps and cancellation. Browser presentation test verifies three Mandarin reads before Vietnamese word meaning, stroke passes, Vietnamese example meaning before silent karaoke, full playback and viewport/pause cleanup. Full server/DOM/runtime/release checks before PR; CI/deployment state in final response.

## Slower guided study, stroke demos and read-along — 2026-10-18
- Base main 4d0bc3d (3.4.5). Default presentation pace is Chậm0.75, with Rất chậm0.65/Vừa1 and no fast setting. Word/meaning dwell minimum6.5s before pace scaling; default short meaning stays8.67s. Presentation voice uses0.6 default; other speech keeps0.85.
- Each distinct Han character in a word has a dedicated three-pass HanziWriter stroke slide at slow speed with gaps. Uses the existing HSKWritingPractice.characterData starter/CDN/cache loader. Missing data gives a visible timed static fallback; no fake strokes. Async completion guards prevent stale animations moving a paused/closed session.
- Every spoken example/context line now has a subsequent silent Bạn đọc theo slide:2.5s preparation, paced character highlight, generous reading time tied to length/model duration, then a quiet gap before meaning. This is a timing guide, without microphone capture or pronunciation grading. Pause freezes highlight; resume restarts that learner turn. guidedShow version2 avoids resuming an old frame ID against the changed sequence; learner mastery/SRS data preserved.
- Core/speech tests assert sequence, pacing, three loops and unchanged speech defaults. Presentation browser test exercises real stroke SVG/three completed animations plus karaoke/no overlapping model voice, pause and full automatic completion. Existing Học viết regression, full server suite and release checks run before PR. Report CI/merge state in response.

## Hands-free guided presentation — 2026-10-18
- Base main 7e92c0a, preserving dark-contrast 3.4.4 and the earlier non-floating toolbar fix. Học tự động now opens a full-viewport top-layer dialog and starts Mandarin playback. One word, then its meaning and each supplied example/meaning, then the next word; dialogue/reading/grammar follow as bounded slides.
- Speech onend controls advancement, a stalled/error voice pauses visibly, pause resumes the same slide, background/account/route exits cancel playback, timers and optional screen wake lock. iPhone uses CSS viewport fallback; supported browsers request native fullscreen. `guidedShow` resume is independent of the original `guided` step record.
- Học từng chặng retains original checks, retry review and completion controls. Passive playback does not mark words/SRS/completion or award answer evidence.
- Targeted core/legacy guided/browser presentation tests and full177 server tests pass. Runtime390/1440 and feature contracts43/145 pass. New test covers speech ordering, late callbacks, hands-free finish and viewport fit at320/390/430/1440 plus landscape568x320/844x390, both themes. Voice is mocked; physical iPhone audio/fullscreen remains device-dependent. PR/CI state reported in response.

## AI account quotas - server3.3.9 (2026-10-17)
- User authorizes normal accounts50/day:35 non-reading AI queries plus15 reading-generation reservations. Defaults and Wrangler vars updated. Existing same-day total/reading counters preserved; query usage derives from total minus reading. Global protections remain for ordinary accounts.
- ADMIN_UIDS matches the existing account-config admin UID. Reserve bypass uses only the UID from Firebase accounts:lookup; no client/token role flag is trusted. Admin reservations bypass all app budget caps without consuming ordinary-account counters; verified admin also bypasses per-isolate cooldown. Provider limits and reading generation locks remain.
- Quota errors distinguish user-reading/user-query/user-total and global minute/day. Reading cache/reopen stays free. Worker bundle synchronized. No frontend/PWA changes.
- Focused34 server tests PASS, including35+15 independent quotas, admin beyond exhausted global/user limits, no counter consumption, forged admin flag and Firebase UID mismatch. Feature preservation validation before PR. Not deployed yet.

## Real-reading quiz feedback - 3.3.8 (2026-10-17)
- User screenshot shows score2/3 but all explanation strings begin with Đúng. Grading was correct; pre-generated explanationVi was displayed as a learner verdict.
- real-reading.js now renders per-question verdict from selected index vs answerIndex, chosen/correct option text and answer-key explanation. Strip leading Đúng vì/Sai vì boilerplate from cached AI explanations. No new provider calls or scoring/history changes.
- Focused existing reading UI regression deliberately answers question1 incorrectly with an AI explanation starting Đúng vì; assert2/3, exactly one wrong verdict, correct options and two correct verdicts. User requested limited testing. Feature contract and PWA checksum checks retained.

## Lesson section dropdown - 3.3.7 (2026-10-17)
- User requested a dropdown rather than horizontally hidden lesson pills on phones. lessons.js renders a labelled native select for all four original sections; desktop buttons and all handlers/footer navigation remain. Mobile CSS removes sticky positioning so expanding mastery details pushes the picker down and scrolling cannot overlay reading text. Completion evidence remains visible in option labels.
- Removed obsolete mobile pill auto-centering. Updated browser interaction tests to use the visible mobile control without weakening protected feature contracts. New check-lesson-picker-ui.cjs covers four sections, expansion/scroll geometry, unchanged progress, desktop and light/dark. Added to feature-preservation CI.
- Validation: feature preservation40/131 PASS; feature runtime390/1440 PASS; lesson-mini DOM and speech DOM PASS; mobile-flow browser320/390/1440 PASS; dedicated lesson-picker browser320/390/430/1440 light/dark PASS. PWA3.3.7 prepared. No AI/backend/data contracts changed. PR/CI status recorded in task response.

## AI task roles - 3.3.6 (2026-10-17)
- AI_TASK_ROUTING=true: xKiro first for dictionary, short/basic translation, basic lesson/sentence questions and HSK1-4 dialogue/story/email generation. Gemini first for OCR/handwriting, plan analysis, HSK5-6 translation/tutoring/reading, long inputs/history, complex-language questions, news/explainers and large dictionary batches. Classification is a server heuristic, not proof of task difficulty.
- xKiro deadlines: text10s, reading18s; then Gemini25s. Heavy Gemini deadlines: text15s, reading25s; text-only xKiro fallback25s. At most two sequential providers; cancellation/refusal never crosses. Image routes stay Gemini-only.
- Both providers must satisfy response schema; reading must also pass the existing structural/length/quiz validator before being accepted. Invalid xKiro output falls back to Gemini with the original grounded prompt. This is structural validation, not factual certification. Existing auth/cache/global and user budget gates remain.
- Successful responses expose X-HSK-AI-Provider (gemini/xkiro); no credentials or prompts logged. Feature flag false restores Gemini-first routing. Worker-only change; no frontend/PWA change.
- Validation: full server suite141/141 before final classifier/header refinements; rerun focused tests after those refinements. No live deployment or live new-router tests yet. Branch feature/ai-task-roles from12ce49c. Production still3.3.5 until explicit merge/release authorization.
# HSK Cross-AI Handoff

## Faster failover — 3.3.5 (2026-10-17)
- Base8efd831. User requests less than15s and explicitly permits real quota tests. Shared AI_TIMEOUTS: primary text6s, reading12s, backup25s. Same sequential/no safety/image crossover protections; no credential or UI changes.
- Live browser currently guest; no configured local provider keys. Do not extract Cloudflare secrets, browser tokens or weaken Firebase for live testing. Real authenticated measurement requires normal app sign-in. Automated tests mock vendor behavior and do not establish real latency.

## Text AI failover — 3.3.4 (2026-10-17)
- Base74342f0. Shared adapter now covers text routes, not just reading: provider errors/network/invalid JSON/schema/truncation trigger one sequential backup. Primary15s/reading30s; backup25s; caller abort never launches backup. Keep Firebase, quotas, validators, safety refusals, original success settings and credential configuration. Image routes explicitly remain Gemini-only because configured backup is text.
- Cloudflare secret names checked: SECONDARY_AI_API_KEY is now installed; no values accessed. Real authenticated provider quality/quota not tested. Tests use mocks, including503, timeout/stalledbody, cancellation, no recursive retry and no safety/image/auth crossover. All130 server tests passed, including bundled authenticated dictionary503→backup integration. Worker-only release, no frontend/PWA asset change.

## Reading genres and quality — 3.3.3 (2026-10-17)
- Base main 921650a. Add dialogue, story, educational news, email/message and short explainer selector. Scope cache/history/reopen by genre; preserve legacy dialogue. Responsive selector spans the mobile row.
- Genre-specific source-grounded prompt, HSK length targets (learning guidance, not official test standards), natural lesson vocabulary, faithful pinyin/Vietnamese and three grounded questions. Reject too-short, duplicate paragraphs/questions/options. Fiction/news attribution remains honest. No automatic paid retry, secret/config, auth, budget or mastery changes.
- Source: real-reading.js/css, variety core, server reading service/cache key/Worker revision and generated bundle. Tests cover all five genres, invalid genres, cache isolation, history and UI transport at 320/390/1440. Provider output is mocked; live authenticated generation not verified.
- Full server suite: 124 passed. Release/CI/deployment must be checked before marking published.

## Reading request fix — 3.3.2 (2026-10-17)
- Base a154353, main already includes reading + budget/xKiro configuration. Reproduced real standard-3-01 meanings longer than the server's 80-character bound; old frontend sent them unmodified and received 400 before AI generation.
- Normalize request-only vocabulary (20 unique supported Han, mean <=80); preserve dictionary data and strict server validation. Inline status/cancel replaces blocking reading overlay; Firebase-token wait is abortable and stale/account-switched responses cannot write cache. Changes of level/topic/navigation cancel the request.
- Existing xKiro adapter is enabled only when a real SECONDARY_AI_API_KEY secret is installed. Wrangler secret list currently has only GEMINI_API_KEY and FIREBASE_API_KEY. Do not reuse an exposed chat key or claim real fallback tested. Document secure installation; retain global/user AI budget and single sequential fallback. Extend provider retry statuses to 500/504 and show missing-backup/quota errors clearly.
- Focused tests passed with actual HSK3 app vocabulary and the Worker validator at 320/390/1440; cancellation during a never-resolving token, HTTP 400 and loading cleanup covered. Provider tests are mocked. Full CI, worker deployment and Pages verification pending.

## Verified checkpoint — 2026-10-16
- GitHub `https://github.com/trungxemcode/hsk`, `main` is the source of truth.
- Single local checkout: `C:\Users\LENOVO\hsk`. The older copy at `C:\New folder\hsk` was consolidated into this directory, then retired.
- The last verified app release was 2.16. The last known canonical code commit when consolidating was `58f781c`; do **not** assume it remains latest: check GitHub before work.
- Codex, Antigravity, Gemini and Claude share the root `AGENTS.md` and focused architecture `docs/ai/PROJECT_MAP.md` through small agent-specific entry files.
- Serena project configuration was migrated from the old checkout to `.serena/` in this checkout and is excluded from Git. RTK and Codex configuration reside in the Windows user profile, outside the repository. Earlier AI notes remain in the separate archived backup.

## Current work
- Single-workspace consolidation: canonical Git `main`, Serena configuration local-only, old checkout retired. No app logic or PWA assets changed.
- Do not commit machine-local `.serena/`, RTK, Codex or editor setup. Use tracked shared `AGENTS.md` and `docs/ai/` for portable, compact AI context.
- Follow-on tasks must be requested by the user; no pending feature is implied.

## Handoff template (replace this section only when work actually starts)
- Goal:
- Feature paths touched:
- Decisions and constraints:
- Completed work:
- Tests and actual results:
- Open issues / next safe action:

Do not store secrets, API keys, personal data, or entire chat logs. This file is a checkpoint, never a substitute for checking actual code or Git state.

## UI follow-up — rounded press states (2.17)
- Fix: `ui-buttons.css` summaries use the same shared radius tokens as their frames; standalone summaries use the button radius. Expanded framed headers keep rounded top corners. Native rectangular tap highlight is disabled; keyboard outline, geometry and handlers remain intact. No global overflow clipping or learning-data changes.
- Tests: press shape at 320/390/1440 light/dark, mobile UX and 552 responsive cases pass locally. Full Studio CI passed on application commit `81e0c45`; the follow-up commit changes only this handoff to preserve the concurrent workspace-consolidation notes.
- Release: PWA metadata bumped to 2.17. Verify Pages and asset hashes after merge. Windows checkout/configuration was not modified by this cloud task.

## UI follow-up — daily-word spacing (2.18)
- `home-overview.css`: daily-word summary has 8px vertical / 12px horizontal padding in every interaction state. Border-box sizing keeps it inside the existing row; no state-dependent padding or handler/data changes.
- `check-press-shape-ui.cjs` asserts padding and unchanged normal/focused geometry. Home compactness and responsive checks cover the increased content height. PWA release 2.18 must pass CI and Pages verification.

## Mobile flow refinement — 2.19
- Reference adapted to existing routes: keep combined Luyện & Ôn dock, current compact home, existing save sheet, handwriting and AI chat. No new storage keys, scoring, sync or AI transport.
- `mobile-ux.js/css`: flashcard/SRS focus; fixed original quiz/exam/SRS action nodes; grouped account with visible sync status, real error-profile training; notebook meaning on a second row; explicit image lookup action. Original moved controls restore on desktop.
- `lessons.js`: honest mastery chips and in-place vocabulary lookup/save without leaving reading; no completion from opening a popup. SRS remains per-word 3 qualifying passes separated by 24 hours, not a fabricated global day count.
- Validation: new mobile-flow integration, real touch dock scrolling, reading DOM all 146 lessons, goal persistence and 552 responsive/text cases passed locally. Full Studio workflow and Pages must pass before considering release published. External AI/Firebase transport is mocked in integration checks.
- Canonical Windows checkout and tooling untouched. Re-check GitHub head before subsequent edits.

## Picker fix — 2.25
- `practice-selector.js/css`: restore separate Luyện and Ôn choosers with identical scoped multi-select/clear/all/start interactions. Both initially closed; opening one closes the other. Existing SRS/mistake routes and all 12 modes preserved, 10+2. Existing per-account choice key retained.
- Move each Start row inside its disclosure and remove sticky positioning so it cannot cover option tiles. Group closes on launch; session controls continue using original routes. No learning/SRS data-contract change.
- Narrow browser checks passed at 320/390/1440 in light/dark: review sequence, independent choices, closed actions, actual content scroll, progress unchanged by navigation, icons and source links. Mobile UX regression passed. Studio workflow/Pages must pass for release.
- Source base: `5687be3`. Canonical Windows checkout/tooling untouched.

## Assessment feedback — 2.26
- `placement-core.js`: read-only diagnosis by skill, confident vs fragile recall and untested audio. Roadmap chooses earliest actual gap even at a passed level; never treats unavailable listening as a mistake. Level scoring unchanged.
- `placement.js/css`: strengths/weaknesses and question evidence before route CTA, explicit rationale, AI synthesis on existing authenticated lesson-ask endpoint. Same original start/continue/planner handlers. Guest/offline feedback remains useful; no fabricated AI output. Abort/stale-owner guards and bounded in-memory cache, no report/SRS storage changes or new Worker deployment.
- Narrow unit, placement DOM/browser and real route-activation tests passed locally. New feedback browser test mocks AI transport and covers payload grounding, skipped listening, retry/cache, no data writes, owner isolation and light/dark at 320/390/1440. Full CI and Pages required for release; provider response quality not verified using a real user token.
- Base `22818f3`; canonical Windows checkout/tooling untouched.
- CI caught a native dialog lifecycle race on rapid close/reopen: ignore a queued old close event when the dialog is already open again, so it cannot invalidate the new analysis or resumed session. Browser regression now closes/reopens in one event-loop turn before exercising AI retry.

## Adaptive placement — 3.1.1
- User version policy: first three-part release 3.1.1; patch for same-feature changes, minor for major additions, major 3 changes only on explicit request. Builder accepts X.Y.Z; no downgrade comparison depends on label.
- `placement-core.js`: preserve 36 initial items and add 48 separate original verification items (8/level). After a failed block, cut higher levels and choose 12 new items from the boundary pair, balanced by skill and real weak evidence. 24–48 answers total; aggregate evidence includes probe answers, no fabricated precision or hearing penalties.
- `placement.js`: instant local progression, at most two authenticated live AI requests to prioritize the next skill within the fixed pool; never replace visible items or change the ceiling/answers. Pause/resume, stale-account cancellation and offline fallback remain. Existing reports/legacy drafts work; new adaptive metadata uses the same storage/sync contracts.
- Narrow checks: 12 core tests and placement DOM pass; browser confirms HSK4 cutoff, unique HSK3/4 probes, bounded AI priority, no answer leak, exact reload and no mastery writes at 320/390/1440. Existing placement/feedback/route checks must pass with full CI. AI transport is mocked; no new Worker deployment required.
- Base 738ca6a; canonical Windows tooling untouched.

## Evidence-based placement stopping — 3.1.2
- New sessions use stopMode=evidence; old fixed-12 drafts/reports remain valid. Boundary verification checks every skill at both levels, minimum 8 new questions; clear strong/weak evidence stops early. Correct guesses cannot establish strength. Unavailable listening remains unassessed.
- Up to 16 unique boundary probes (52 total at HSK6). If ambiguity remains after exhausting the vetted bank, explicitly show a provisional result; never loop/reuse questions or claim certainty. No percentage confidence is fabricated. AI remains a bounded skill-priority helper, not a stopping authority.
- Draft/report validators support variable lengths and validate stop reason from actual answers. Pause/reload and sync contracts retained.
- Local checks: all 103 server tests, placement DOM, placement browser and adaptive browser (320/390/1440) pass. Full Studio CI and Pages verification required. Base 8b7a615; Windows tooling untouched.

## Guided lesson mode — 3.2.1
- Optional Học tự động entry inside every lesson; existing four-section flow preserved. Deterministic content-grounded plan, new words before their contexts, dialogue pairs/reading paragraphs, linked grammar, recall and existing lesson checks; no new provider/API dependency.
- Auto advance has slow/normal/fast pacing; optional Mandarin speech waits for audio completion. Quiz steps require a real choice and manual continuation; wrong answers get a review stop. Visibility/pagehide/account changes pause/stop playback. Store guided stage within existing lesson record; explicit read confirmation only, actual content checks retain existing streak rules. No word mastery or SRS generated by viewing.
- New core tests inspect all 146 sequences; new browser check exercises entry, timers/pause/resume, answer gates, wrong-answer review, actual evidence writes and 320/390/1440 light/dark. Existing all-146 reading DOM regression passes. Full CI and Pages must pass before release. Base 24983d6, Windows checkout/tooling untouched.
- CI mobile-dock test was stale: it tapped the intentionally hidden legacy review/practice lists. Updated only the test to open the current practice mode picker, assert legacy lists stay hidden, then retain actual CDP touch-scroll/dock-position checks. It passes locally at 320/390 portrait and landscape rail. No navigation app logic changed.

## Reading latency optimization — Worker 3.4.2
- Goal: reduce real AI reading wait without removing learning fields, validators, provider fallback or quotas.
- Verified baseline: HSK3 story 21,095 ms = source 115 ms + xKiro timeout 18,000 ms + Gemini 2,980 ms. Gemini-first baseline 3,436 ms.
- Final: Gemini-first for all reading; bounded 30-minute per-handler cache of verified public source text; explicit primary-Hanzi length/chunk instructions; exact quiz schema; sanitized provider/key timing. Default Gemini reasoning/output-token ceiling retained.
- Tests: 164 server tests pass; feature runtime passes 390/1440; append-only guard preserves all 41 baseline groups, adds performance group (42/139); PWA check confirms backend-only, no asset download needed.
- Live tests use a temporary guarded fixed-input benchmark; remove it and restore approved main Worker after testing. No benchmark endpoint, token, credentials or generated passages belong in git. New Worker needs an explicit merge and normal deployment before rollout.

## AI anti-abuse — Worker 3.5.1
- User explicitly requires admin exemption from limits. Exempt only Firebase-verified ADMIN_UIDS; do not trust role flags in ID-token claims or request bodies.
- Added atomic cross-Worker per-account lease/dedup, 3s request/10s reading pacing, email verification, trusted-account-age starter cap 10+3 for first 24h, manual pause and scoped 8x5xx/2min breaker (60s). Admin skips all of these and regular counters.
- Query/reading outputs, storage keys, provider rotation/fallback and budgets 35+15 for established regular accounts preserved. No private response cache, raw UID or prompts in abuse state/logs.
- Mocked integration exercises concurrency, forged admin, cancellation, stale locks, missing binding and admin parallel readings. No live-user data modified or real provider quota spent for guard tests.
- Needs PR/CI and explicit merge/deploy. No new secrets, bindings, migrations or PWA release required. IP/CAPTCHA layer not introduced in this priority implementation.
- Validation: all 175 server tests pass; preservation 43 groups/143 guards and backend-only PWA guard pass. Browser runtime passes at 390px and 1440px after restoring the transient Chromium test dependency; PR CI still must pass before merge.
## Dark contrast repair — 2026-10-18
- Based on latest main ae27bda (PWA 3.4.3), preserving the guided-toolbar fix. User requests contrast repair across dark mode, not only lesson screenshot.
- Reproduced lesson-number contrast 1.61:1; also found light calendar dots, dark about links and low-contrast purple Study4/game labels. Paired badge/calendar surfaces and text; shared accent-ink keeps readable dark text independent of the existing purple button fill. Shared dark progress track/fill covers WebKit and Firefox.
- Added browser regression for 17 routes, expanded practice, lesson badges and all four lesson sections at 320/390/1440. External APIs mocked; no account/progress/provider behavior changes. Verification/PR status reported in final response.

## Combined guided word playback — 3.4.9
- User requests shorter idle pauses, simultaneous writing/pronunciation and a different Vietnamese voice. Three word rounds now animate all Han characters while speaking Mandarin, then speak Vietnamese; advance only when both animation and audio end. No separate trailing stroke phase. Silent karaoke and legacy gated mode retained; no mastery writes.
- Remove minimum spoken-slide dwell; transition 300ms at normal / 400ms default, karaoke lead 900ms. Silent content still has text-based dwell. Vietnamese prefers named Natural/Enhanced/Premium/Neural voices, then online; user may preview/select an actual installed voice and save its URI locally. Device voice inventory limits available quality; no external TTS service or credentials added.
- Resume schema v5 because frame sequence changed; all existing lesson, SRS and account storage retained. Voice settings pause playback and require explicit resume. Required CI and Pages verification must pass before rollout.

## Stroke-length pronunciation — 3.4.10
- User replaces three bilingual word pairs: Mandarin now repeats without a read-count cap throughout the existing three stroke passes; after every Han character finishes all passes, finish the current pronunciation and read the Vietnamese meaning exactly three times before examples. Example/grammar speech and silent karaoke unchanged.
- Explicit per-epoch repeat timer cancels on pause/navigation and on animation completion. Missing stroke data falls back to one pronunciation then three meanings. Resume schema v6 for revised sequence; no mastery/SRS changes. Browser test holds a multi-Han animation open for more than five readings, pauses queued repeats, checks every character/pass barrier and exactly three Vietnamese meanings.

## Gemini TTS incomplete output repair — Worker 3.5.2
- Base main06fc85d (PR108), not the unfinished Gemini-voice checkout from earlier in this thread. Windows canonical checkout was also at06fc85d. Preserve Google-verified /voice-precache and existing 9 server-side keys; no key transfers or new frontend provider integration.
- Live reproduction: current Vietnamese instruction returned HTTP200, finishReason OTHER and zero audio parts, causing cloudflare_tts_502_invalid_tts_audio. Explicit English instruction targeting Mandarin returned proper audio/L16;codec=pcm;rate=24000. Use that instruction and retry incomplete non-refusal output only once within80s; never retry safety blocks.
- Validate actual decoded PCM bytes, supported rate/channels/MIME, size and all audio parts; normalize base64 whitespace and join PCM parts. Safe categorical failures distinguish incomplete generation, refusal and invalid bytes without logging content/tokens/audio.
- Real Apps Script→Worker→Gemini→Drive/Sheets probes:2/4/22-character clips created35130/60090/192570-byte WAV24kHz with correct RIFF/data lengths; every second call cached=true and byte-identical. Warm-up initially advanced4 phrases then hit another empty generation. Literal-transcript second attempt plus Apps Script retryable categories and checkpointed1–60min backoff prevent permanently disabling the queue on transient errors. Safety/configuration faults still pause without skipping items.
- Track the reusable Code.gs/WarmBatch.gs sources and regression tests in Git, without storage IDs, Setup.gs, corpus, OAuth or secret files. Signed-byte WAV headers, unchanged key custody and cache reuse retained. Full197 server tests and browser feature runtime390/1440 pass. Temporary fixed-phrase probes must be removed after verification. Backend-only; app stays3.4.10.

## Tutor lookup cost cache — 2026-10-21
Owner explicitly requests App HSK AI lookup optimization; auto voice must continue unchanged. New clean branch based on latest main48ba105, leaving existing dirty voice checkouts and archival PRs untouched. Added exact response cache across four app routes, pinned public curriculum/word fingerprints, private account separation, full context/version keys, lease ownership/TTL cleanup and observe-only bounded semantic pilot. Uses existing Durable Object on a separate instance; no new DB/account, key transfer, explicit paid context cache or frontend/PWA build.25 new behavior tests pass, previous full suite223tests passed before six additional cases; final full suite and real DO staging/production evidence will be recorded before completion. Live Worker was backed up; additive deployment tool preserves its newer auto voice code instead of replacing it with main's older voice implementation.

Release evidence:25 new /229 full server tests PASS;45 capabilities/165 guards and Chromium390/1440 PASS. Real Cloudflare staging:6writes/5hits, account isolation and observe-only semantic rejection PASS using synthetic providers (0 actual billing calls); staging cleaned up. Production hsk-ai-cache-3-6-1 exact readback PASS, all38 old bindings/settings preserved plus4 QA vars. Auth/voice/CORS smoke PASS. Auto voice still AUTO_CYCLE,1268 READY+20 EXISTING after deployment. No Apps Script/Sheet mutation, frontend/PWA update or main merge. Detailed limits/evidence: TUTOR_CACHE_VALIDATION_20261021.md.


## Structure refactor phase 1–3 — 2026-10-21
- Isolated `refactor/project-structure` from main16f578f; no dirty canonical or voice checkout changed. Scope: relocation-aware feature protection, one PWA catalog, exact backup module move only. No AI entrypoint move, framework change, data relocation or app.js extraction.
- 19 feature-gate tests,21 PWA guard/catalog tests,229 server tests PASS. All45 capabilities/165 guards and159 offline assets retained. Chromium backup import390/1440 and synthetic actual-worker lifecycle/upgrade/offline fixture PASS; existing feature runtime390/1440 PASS. Account sync migration/transaction DOM, notebook CRUD and update notification DOM PASS (mock external transport). Catalog generation idempotent; all159 original assets retained after path mapping. PR status reported in task response.
- PWA candidate3.4.12; old backup URLs resolve through worker aliases. No main merge/Pages publish/Worker deployment, Apps Script or Sheet changes. CI and owner authorization required before release.


## Phase4–5 module/data refactor — 2026-10-21
- Branch `refactor/modules-and-app` from main203559c, clean isolated local/Windows worktrees.20 static JS/gzip files and52 feature JS files relocated unchanged; maintainers' AI entrypoints, CSS/config/root platform workers retained.
- Extract24,701bytes of dictionary/search/text/format code from app.js into4 ordered classic-script helpers; retain state/SRS/learning keys and data augmentation timing. Candidate3.4.16,163offline assets; old159 preserved, renamed bytes equal baseline. Alias-aware install reuses checksum-verified old-cache bytes. Never deploy the older main Cloudflare bundle over independent live voice code.
- Local:237server tests,19feature-gate tests,22PWA guard/catalog tests PASS;45capabilities/171guards; content5011words/146lessons PASS. New browser scenarios gzip/no-api/corrupt-gzip, real handwriting worker, PWA alias/gzip reuse, backup390/1440 and feature runtime390/1440 PASS. All51 CI-equivalent Node DOM/browser checks PASS (44initial checks plus repaired Studio and remaining checks). Final PR status recorded in response.
- No merge/Pages/Worker deployment, Apps Script or Sheet writes. This task does not change auto voice, authentication policies, curriculum contents or AI-provider behavior.

- Full UI run reached Studio's random Drive-image case: two baseline JSON entries (H11330/H11003 page10) had empty `data:image/webp;base64,` values. Confirmed unchanged on main, then restored both from original Drive PDFs after matching the exact recorded source SHA256. All question IDs/answers unchanged. Source pages visually checked; importer now validates/decode-checks all image payloads before writing packs, and deterministic browser coverage decodes all52 images and opens both repaired pages. Repaired-page deterministic browser check, failed Studio check and every remaining check PASS; no skipped assertions. See MODULE_REFACTOR_VALIDATION_20261021.md.

## Music download feedback fix
Branch fix/music-download-progress from main9e67edb: visible download status outside menu plus native progress inside offline menu, indeterminate discovery/codec stages and byte/encode percentages, final committed success100%, errors/cancel retained. Avoid re-creating same active player; handle YouTube buffering/init/error/autoplay-block feedback. External provider availability still controls online latency. Test adds visible progress and committed success checks.

## Offline fallback update
Branch fix/music-source-fallback from main01dc3e9. Discovery tries HTTPS despite unknown/false api/cors flags with bounded seeds. GET network failures try AllOrigins once. Smart title+artist NetEase matching experimental; GDStudio live403, Noembed200, proxy timeout. Three quality buttons and hidden long help. No promise of live YouTube download or same-recording proof.

## Background music save
Branch fix/music-background-save from maincd1561e. Save survives music route exit/player stop/track changes, retains owner and explicit cancel guards, shows a global status button. Pending per-owner metadata restarts interrupted saves on next load; no guarantee while iOS suspends/kills the web app, no byte-range resume. Quality shows selected checkmark and distinct color even while disabled. Directory cache5min, working origin priority6hours, failed metadata cooldown30sec. Chromium390/1440 passed background-route save, interrupted restart, real WASM32/64/96, visual selected colors, owner isolation, cancel, import and offline playback. Feature runtime390/1440, source/discovery tests, feature guards and design tokens passed. No external service deployment or auto voice changes.
