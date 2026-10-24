## 2026-10-24 — Music playback priority: background + iOS locked screen

The user asked to stop investing in music offline downloads and focus on
continuous playback while switching apps or locking iPhone. Existing offline
audio/library remains intact to avoid destructive regressions. No new offline
audio download or server extractor is introduced in this change.

**Important source restrictions:** An iOS PWA cannot register Xcode native
`Background Modes` or promise to outlive OS process termination. Continuous
playback may work for legitimate direct M4A in a persistent
`HTMLAudioElement` with `navigator.audioSession.type='playback'`,
`navigator.mediaSession` controls and no playback pause on visibility loss,
but MUST be validated using an unlocked phone, then Home, then lock screen,
then playback controls. The official YouTube/SoundCloud iframe cannot be
forced to continue when iOS suspends a web process. Extractor errors from
the AWS IP (including `Sign in to confirm you're not a bot`) prevent a
direct audio source entirely; they are independent from the playback UI.

**Regression fixed:** Previously online YouTube started by assigning a
looping silent WAV source to the permanent audio player while waiting for
the VPS. This sometimes made the media session appear playing before a real
audio URL arrived. Now we keep the persistent element, try to capture
play intent under the user's initial gesture, and only load the actual
M4A URL. The lock-screen session reports playing only when
`HTMLMediaElement.currentSrc` exists and `paused` is false. If iOS
interrupts audio, the UI prompts a real tap rather than hiding failure.

## 2026-10-24 — iOS player UX + Cốc Cốc Listening List handoff

User clarified: saving a URL in Cốc Cốc means opening the song's official
provider page and letting the browser itself add/download it to Cốc Cốc's
Listening List for offline play; not selecting an MP3 file manually.
The Cốc Cốc-only action is now named 'Lưu link để nghe ngoại tuyến trong
Cốc Cốc'. HSK cannot call a browser download API or read Cốc Cốc's private
audio files; a source URL by itself is NOT an offline file in HSK IndexedDB.
HSK's separate user-uploaded MP3/M4A library continues to work.

iOS YouTube iframe background playback: browser and official embed dependent.
An installed iPhone PWA cannot reliably keep YouTube playback when screen
locks or user exits. There is no honest JavaScript fix or native audio
extraction in this change. Native HTMLAudioElement backed by permitted direct
audio/file can use browser background playback where supported; for YouTube,
recommend browser-owned Cốc Cốc Listening List rather than falsely promising
automatic continuation in HSK.

UI fixes: properly sized 44x44 plus button, queue peek inside viewport,
3-column aligned controls, aligned icon buttons in external mini-player.
Geometric Playwright tests on 320px, 390px and 430px verify button bounds,
dock, mini-player. Real iOS safe area may differ from Chromium emulation.

Ad-block probe: 24 YouTube pages on Windows Cốc Cốc automation, 24 player
containers loaded; no *early visible* ad indicators in 3.6 second windows.
This is NOT proof of zero ads; no claim for mid-rolls, iPhone or PWA iframe.
See project conversation for probe and limitations.

## 2026-10-24 — Updated design: optional manual Cốc Cốc declaration (3.15.7)

The user approved a manual browser declaration because Cốc Cốc can deliberately
expose the same User-Agent and Client Hints as Chrome. In HSK's **Music →
3-dot menu**, a small control **"Tôi đang dùng Cốc Cốc: Tắt/Bật"** is visible
in all browsers. **Actual Cốc Cốc-specific actions remain hidden by default**
unless automatic browser evidence is positive **or the user actively turns
the toggle on**. One click persists `on` or `off` in origin-local
`localStorage`, **not the HSK account/cloud**, so Safari/other browsers
retain independent settings. Users can turn it off; explicit `off` overrides
automatic detection. If localStorage is denied the UI reports that the choice
could not be saved rather than claiming persistence.

When enabled, the actions only (1) open the sanitized official song page so
Cốc Cốc **may** apply its built-in ad-block and show native download options
if supported and (2) open the file picker for MP3/M4A stored on the user's
device. No website API exists to turn on the browser's ad-blocker or downloader,
no automatic copying of browser downloads, no audio extraction backend, and
no guarantee on iOS or that new tab opens in the same browser/PWA context.
User-uploaded music, offline playback and core HSK data remain untouched.

Tests: `tools/check-music-coccoc.cjs` and
`tools/check-music-coccoc-ui.cjs` check manual opt-in, account-independent
browser persistence through reload, opt-out even with a branded UA, positive
auto-detection, validated URLs, unchanged local file import, and Safari/Chrome
action visibility defaults. Earlier notes below refer to the initial
auto-detection-only prototype, superseded by this manual opt-in behavior.

## 2026-10-24 — Cốc Cốc native media handoff (conditional)

- HSK music menu in chill mode includes *Cốc Cốc · mở bài tại trang nguồn* and
  *Nhập MP3/M4A đã tải vào HSK* **only when the browser provides a positive
  Cốc Cốc identity marker** (distinct UA token, User-Agent Client Hints brand,
  or a page-exposed proprietary `coccoc` object). Other browsers see neither
  action. This is progressive enhancement only; identity signals are not a
  security boundary.
- **Cốc Cốc switched its User-Agent to Chrome in 2021.** A genuine Cốc Cốc
  build may look identical to Chrome and suppress page-visible markers, in
  which case the optional section remains hidden (fail closed). The actual
  Cốc Cốc iPhone/PWA UI must be verified on device before guaranteeing
  automatic detection. We do not spoof a Coc Coc user-agent or enumerate
  extensions/fingerprint users.
- Opening a provider's original, validated HTTPS URL in a real Cốc Cốc
  tab allows the **browser itself** to apply its built-in ad blocking and,
  for supported sources, display its media toolbar with download controls.
  HSK has no official JavaScript API to enable Cốc Cốc's blocker or downloader.
  Embedded YouTube frames in HSK are not guaranteed ad-free. On iOS,
  downloading YouTube media through Cốc Cốc is not generally supported
  by the ordinary mobile download toolbar.
- Importing a user-owned/authorized MP3 or M4A uses the existing local
  file picker and IndexedDB. Files are not pulled automatically from Cốc Cốc's
  downloads or uploaded to an HSK server. No yt-dlp, scraping, CORS bypass,
  adblock script or provider proxy is enabled.
- Existing player, playlists, music from local files, music-study, Safari,
  browser PWA cache and HSK progress are unchanged.

Tests: `tools/check-music-coccoc.cjs` and
`tools/check-music-coccoc-ui.cjs` cover other-browser hiding, positive
marker exposure, HTTPS-source validation and local file import.

## Current playback policy — 2026-10-24
Official YouTube nocookie Iframe API and SoundCloud Widget only; direct public HTTPS MP3/M4A streams use native audio. No Invidious/Piped/Cobalt or similar-title source matching in the app playback path. Browser SponsorBlock can skip community-tagged sponsor/intro/outro/non-music content with undo and an account-local toggle; it does not remove YouTube-inserted ads or guarantee provider availability. No VPS/backend used for media. User-selected MP3/M4A files continue to be stored in IndexedDB for offline listening; no URL-to-file downloader or automatic codec usage. Some legacy helper/server files remain for compatibility but are not loaded by the app player. The notes below record earlier implementation stages where applicable.

## Quyết định mới — 24/10/2026: chỉ giữ ngoại tuyến với file người dùng tự chọn

**Tắt tính năng tự tải nhạc từ link YouTube/SoundCloud/Spotify về kho ngoại tuyến**;
không triển khai server yt-dlp, AWS, Oracle hay R2 cho chức năng này.

Người dùng vẫn mở menu **Nghe ngoại tuyến**, chọn **Thêm file MP3 / M4A
từ thiết bị**, hoặc **Gắn file từ thiết bị cho bài đang chọn**. Tệp
được kiểm tra định dạng rồi lưu trực tiếp vào IndexedDB trên thiết bị,
không upload lên máy chủ. Giữ nguyên các bản lưu M4A trước đó; không
tự động xóa file của người dùng. Giữ khả năng phát khi không có mạng,
phát nền, danh sách và cách ly theo tài khoản. Không còn tải codec
FFmpeg/WebAssembly dành riêng cho chuyển link thành file offline.

**Lưu ý:** MP3/M4A gốc được lưu nguyên bytes, không tự nén lại. Giới
hạn 50 MiB mỗi file và 100 MiB kho nhạc trên thiết bị như trước. Chế
độ nghe trực tuyến, nhập link để nghe và playlist vẫn hoạt động.

Các phần dưới đây ghi lại lịch sử thí nghiệm; cơ chế tải nhạc từ link
đã ngừng áp dụng. Các mã server cũ được giữ trong repo như tài liệu
lịch sử/để bảo toàn kiểm thử, không có endpoint đang chạy.

# Nhạc ngoại tuyến

## yt-dlp chính thức — bản thử tích hợp 2026-10-24

Dịch vụ Python dùng bản phát hành chính thức `yt-dlp[default]==2026.10.21` từ dự án `https://github.com/yt-dlp/yt-dlp`, kèm EJS và Deno 2.9.6 trong container. Không fork hay sửa mã yt-dlp. Deno chạy với cache ghi được trong `/tmp`; không chạy bộ nén trên server. CLI tải duy nhất một nguồn, giới hạn 50 MiB/15 phút và kiểm tra ID/URL do yt-dlp báo sau tải trước khi chấp nhận file. Sai nguồn hoặc nhiều kết quả đều bị từ chối. Giữ kiểm tra ffprobe, xác thực và tách file theo UID như cũ.

Thử trực tiếp từ môi trường phát triển: yt-dlp 2026.10.21 + EJS 0.8.0 + Deno 2.9.6 đọc được video `bv_cEeDlop0`, 203 giây, format 251/Opus. Video thử `BaW_jenozKc` báo unavailable. Môi trường có proxy chứng chỉ riêng: phép thử metadata dùng kho CA hệ thống qua `--compat-options no-certifi`, không tắt xác minh TLS. Lượt tải media đầy đủ bị hủy ở bước phê duyệt mạng của môi trường; chưa có file tải thật để nghiệm thu đầu-cuối. Container chưa build được cục bộ do không có Docker, có workflow riêng để kiểm tra build/runtime trên GitHub.

Build từ gốc repo: `docker build -f server/music/Dockerfile.source -t hsk-audio-source .`. Khi triển khai cần cấu hình `FIREBASE_API_KEY`, `ALLOWED_ORIGINS`, tùy chọn `ADMIN_UID` và HTTPS cho dịch vụ. Kiểm tra `/health`, sau đó mới đặt `music-config.json.offlineSourceResolver` thành URL HTTPS và tắt `offlineDirect.enabled`. Hiện endpoint vẫn trống và cấu hình frontend không đổi: chưa triển khai lên VPS hay chuyển app đang chạy sang dịch vụ này. Cookies/PO Token provider chưa cấu hình; một số nguồn vẫn có thể bị chặn. Cập nhật phiên bản yt-dlp/Deno cần chạy lại kiểm thử trước phát hành.

## Giữ đúng phiên bản từ link gốc — 3.13.4

Lưu ngoại tuyến không tự đối chiếu sang NetEase hay kho nhạc khác khi nguồn gốc bị chặn. Trùng tên bài và ca sĩ không chứng minh cùng bản thu, hòa âm, remix hoặc tốc độ. Nếu chưa lấy được nguồn từ chính link đã nhập, app báo lỗi và giữ nguyên bản cũ; người dùng có thể thử lại hoặc nhập đúng file. Nhánh đối chiếu có nhãn nguồn của chế độ nghe nền trực tuyến vẫn tách biệt. Những file lưu bằng nhánh đối chiếu ở bản cũ không tự đổi lại âm thanh; chỉ thay sau khi tải lại thành công.

## Sửa lưu link và demo giọng Trung — PWA 3.12.5

Mục nghe offline có ô dán URL trực tiếp, nút hoạt động khi chưa có bài đang phát, báo rõ lỗi hoặc xác nhận sau khi file được lưu vào IndexedDB. Chưa bảo đảm nhà cung cấp YouTube/SoundCloud có nguồn CORS hoạt động khi bị 403. Cả 9 MP3 demo giọng Trung được tự tải trong gói cập nhật PWA; service worker hỗ trợ audio Range 206/416 từ cache, phục vụ Safari khi không có mạng. Kiểm thử bằng tools/check-music-offline-ui.cjs và tools/check-voice-demo-offline-range.cjs.


Menu ba chấm → Nghe ngoại tuyến → chọn Thấp 32 / Trung bình 64 / Cao 96 kbps → Lưu link. Bộ lấy nguồn (khi đã cấu hình) trả âm thanh gốc; trình duyệt nén HE-AAC v2 stereo 48 kHz bằng FFmpeg.wasm trong Web Worker, kiểm tra profile và ghi IndexedDB. Không cần người nghe chọn file cho luồng này. Có tiến trình/hủy; nguồn lỗi, hủy, đổi tài khoản hoặc đổi bài không ghi đè bản cũ. Mỗi lượt tối đa 15 phút và 50 MiB nguồn. Tùy chọn chất lượng nhớ riêng theo tài khoản, mặc định 64. Dung lượng âm thanh xấp xỉ 0,24/0,48/0,72 MB/phút cộng container; tải nguồn ban đầu vẫn có thể lớn hơn file cuối.

## Tải trực tiếp qua dịch vụ bên ngoài (thử nghiệm)

`music-config.json.offlineDirect.enabled=true` cho trình duyệt gọi Piped/Cobalt và tải bytes thẳng từ proxy/tunnel của instance. Audio không qua Cloudflare hay VPS HSK; app/config/codec vẫn tải bình thường từ hosting. Không gửi Firebase token, cookie, Authorization hay referrer cho bên thứ ba. Chế độ trực tiếp không âm thầm chuyển về resolver HSK khi thất bại.

Module `music-direct-source.js` tự lấy danh sách `https://api.invidious.io/instances.json?sort_by=health` trước mỗi lần lưu YouTube, chọn tối đa 5 Invidious HTTPS có `api=true`, `cors=true`, và không báo down. Tra cứu `/api/v1/videos/{id}`, lấy audio-only trong `adaptiveFormats` thuộc itag 139/140/249/250/251; tải bằng đường dẫn của *chính instance đó* `/latest_version?id={id}&itag={itag}&local=true`, không lưu raw googlevideo URL. Nếu danh sách trống hoặc CORS không hợp lệ, báo lỗi rõ ràng và giữ đường nhập file; không bảo đảm có nguồn đang sống. `offlineDirect.instances` mặc định rỗng, có thể cấu hình tối đa 4 Piped/Cobalt được chủ dịch vụ cho phép tích hợp để làm fallback; không còn gắn các URL Piped chết trong bản phát hành. Không tự kết nối Cobalt chưa xác minh.

Piped: đọc `/streams/{videoId}`, chọn audio-only tương thích, ưu tiên bitrate nguồn đủ cho đích; chỉ dùng audio URL cùng origin với `proxyUrl` của phản hồi. Cobalt: POST `{url,downloadMode:"audio",audioFormat:"best",alwaysProxy:true,localProcessing:"forced"}`, nhận `tunnel` hoặc một tunnel audio/remux không HLS. Không chạy mã do extractor trả về, không xử lý captcha, không tự dùng raw redirect Googlevideo, multi-track merge hay HLS. SoundCloud cần Cobalt endpoint được phép tích hợp; danh sách Piped mặc định chỉ phục vụ YouTube. Spotify không được hỗ trợ.

Lookup timeout 8 giây/instance, tải tối đa 90 giây/stream, tối đa 2 stream ứng viên/instance, 50 MiB nguồn và 15 phút âm thanh. 429 tạo cooldown theo Retry-After (tối thiểu 60 giây) trong phiên; không gọi lại instance đang cooldown. Hủy/đổi owner vẫn bảo toàn file cũ. Sau tải luôn nén HE-AACv2 đúng mức 32/64/96 bằng WASM trên thiết bị, không đổi MIME để giả định dạng.

**Kết quả live 2026-10-23:** Directory Invidious GET HTTP 200, trả CORS `*`, nhưng cả 11 instance hiện được trả về đều không thỏa đồng thời `api=true` và `cors=true`; vì vậy chưa có bản tải YouTube thành công qua tuyến động. Directory `instances.hyper.lol` cũng không truy cập được từ máy thử. Không khẳng định vượt được IP-block/CORS trên máy chủ, không tự thay bằng bản nhạc trùng tên thiếu xác minh. Các bài test mới `node tools/check-invidious-discovery.cjs` dùng phản hồi giả để kiểm tra top 5, chọn itag, `local=true`, đường lỗi 403/danh sách rỗng và không gửi credentials. **Lịch sử:** từ môi trường kiểm tra, kavin/leptons trả 403, private.coffee trả 500, nosebs/privacy.com.de/drgns trả 503, adminforge/piped.yt timeout. Cobalt rue-cobalt.xenon.zone trả 403, cobaltapi.cjs.nz timeout ở GET metadata. Đây là quan sát từ một môi trường mạng, không kết luận mọi người dùng đều thất bại. Browser của môi trường không truy cập được hosting HSK để chạy phép thử live CORS. Chưa tải đủ một bài thật qua instance công khai và chưa nghiệm thu SoundCloud. Không coi test mock là bằng chứng live.

## Resolver HSK tùy chọn (giữ tương thích)

Khi `offlineDirect.enabled` tắt, app giữ luồng `offlineSourceResolver` cũ. Trường resolver hiện trống, dịch vụ Python/container chưa được triển khai. `server/music/source_resolver.py` cung cấp POST `/v1/jobs` (`{url}`), GET `/v1/jobs/{id}`, GET `/v1/jobs/{id}/file`, DELETE `/v1/jobs/{id}`. Nó dùng yt-dlp cho một bài YouTube/SoundCloud công khai, không cookie/đăng nhập, giữ nguyên bytes, kiểm tra độ dài bằng ffprobe; không nén server. Firebase ID token và job/file tách UID. Giới hạn 2 worker, 4 job đang chạy/chờ, 20 job giữ tạm, 10 lượt/UID/giờ (admin ngoại lệ), TTL 15 phút.

Triển khai tùy chọn: `docker build -f server/music/Dockerfile.source -t hsk-source .`, HTTPS reverse proxy với `FIREBASE_API_KEY`, `ALLOWED_ORIGINS`, tùy chọn `ADMIN_UID`, `SOURCE_TEMP`. Không cần dịch vụ này cho chế độ direct.

## Bộ nén trên thiết bị

`vendor/music-codec` có FFmpeg.wasm audio-only riêng (~2,1 MiB WASM + 74 KiB glue), FDK AAC thật; không dùng AAC-LC để giả HE-AAC v2. Chạy single-thread, không cần SharedArrayBuffer/COOP/COEP. WASM chỉ tải khi chuyển bài đầu tiên, xác minh SHA-256 theo manifest rồi lưu Cache Storage `hsk-music-codec-v1`; không thêm 2,1 MiB vào bộ cài PWA ban đầu. Worker bị terminate khi xong/hủy/lỗi; không giữ nguồn hay PCM trong kho nhạc. Xem `tools/wasm/build-music-core.sh` và notices/source refs trong `vendor/music-codec/README.md` để rebuild/thay module.

## Kho và tính năng cũ

100 MiB tổng blob trên thiết bị trong origin app, 50 MiB/file; độc lập cache PWA và cache bộ nén. Không tự LRU xóa bài người dùng đã chọn. Dedup theo SHA-256, tách tham chiếu tài khoản; xóa tham chiếu cuối giải phóng blob. Trình duyệt vẫn có thể thu hồi dữ liệu khi thiếu chỗ. Nhạc được phát bằng native Audio/Blob URL, dùng cùng player, tua/dừng/tốc độ/queue. Object URL thu hồi khi rời/đổi nguồn/tài khoản; cuối danh sách dừng trừ khi bật lặp.

“Gắn file có sẵn vào bài đang chọn” và “Thêm file M4A từ thiết bị” vẫn giữ bytes gốc, không tự khẳng định codec/bitrate của file nhập. CLI chuẩn bị file: `python tools/prepare-offline-music.py input.wav output.m4a --bitrate 64 [--encoder /path/to/aac-enc]`.

## Kiểm thử

`node tools/check-music-codec.cjs` chạy đúng worker và WASM được ship: nén HE-AACv2 thật 32/64/96, xác minh output, cache dùng lại, nguồn/chất lượng sai. `node tools/check-music-offline.cjs` cần fake-indexeddb: owner, dedup, quota atomic, hủy stale. `node tools/check-music-offline-ui.cjs` dùng Playwright 390/1440: resolver giả trả bytes HE-AACv2 thật → WASM thật → lưu cả ba chất lượng; gắn/import, đổi owner, reload, ngắt mạng, play/pause/seek và xóa. `python tools/check-music-source-resolver.py` (cần fastapi/httpx): auth, link validation, owner, giữ nguyên bytes và cleanup. Cold start PWA và hiệu năng trên iPhone/Android cũ thật chưa được nghiệm thu.

Kiểm thử direct: `node tools/check-music-direct-source.cjs` kiểm tra chọn chất lượng nguồn, failover, 429 cooldown, hủy, URL riêng tư, Cobalt tunnel, không gửi credentials và không nhận raw redirect/HTML. Browser offline UI 390/1440 bổ sung Piped failover + Cobalt tunnel với CORS mô phỏng, WASM thật, bảo toàn bản cũ khi hủy và xác nhận không gọi resolver HSK.

## Source fallback update 2026-10-23
Discovery accepts up to5 HTTPS candidates even when api/cors flags are false or unknown; ignores known-down entries, rejects private URLs and deduplicates. Four owner-requested seeds supplement an empty/unreachable directory. A candidate is only verified by actual metadata/file requests. GET fetch TypeError (network or CORS, not distinguishable by JS) gets one AllOrigins raw retry under the same timeout; HTTP403/429 do not trigger proxy bypass. No HSK Worker relay added. Corsproxy.io is not configured because current official documentation requires an account/key and has bandwidth limits.

After YouTube source failures, Noembed title -> cleaned Hanzi query -> GDStudio NetEase search(max5) -> exact title-containing-song+artist and exactly1candidate -> url lookup. Reject mismatches, ambiguous results, cover/live/remix/instrumental markers, missing size and br<128. HTTPS audio URL then uses existing byte/time limits and HE-AACv2 pipeline. Metadata matching cannot prove identical recording or complete licensed audio; this is experimental and GDStudio returned403 in this environment. Noembed returned200/CORS*, AllOrigins timed out. Never claim guaranteed successful live download or a provider uptime of100%. Candidate name appears in source progress. Source bytes are not stored on HSK servers.

Quality UI uses three pressed buttons32/64/96, retaining per-account offline-quality preference and control id. Long help remains hidden. Download progress/error/success remains visible. Narrow tests cover false/null flags, actual local=true attempts, GET proxy retry, Chinese title search and wrong artist rejection. Browser tests use mocked sources and real shipped WASM; separate from live endpoint evidence.

## Background save and discovery reuse
Link downloads are independent of player serial/route/stop. Leaving music, pausing or selecting another track no longer cancels saving. A body-level status button shows progress/completion on study screens and opens offline downloads. Explicit cancel and account changes still stop a task; owner checks guard the final IndexedDB write. The selected quality keeps a checkmark and explicit selected/disabled colors.

A per-owner localStorage pending descriptor contains only link/title/artist/bitrate, not audio or credentials. An interrupted page load restarts the save once on the next app load. Success, errors and explicit cancellation remove it. This restarts source discovery/download/conversion rather than resuming a byte range. It does not guarantee execution after iOS suspends/kills the web app or after closing the browser. Ordinary in-app navigation continues within the living document.

Discovery reuses an in-memory list for5minutes, remembers only the last working provider origin/type for6hours, and prioritizes that provider when still in the candidate list. Metadata failures have a30second cooldown; existing403/429 cooldowns remain. No expiring media URL or file bytes are cached by this optimization. This reduces repeat probes, with no measured claim about first-download latency or provider uptime.
