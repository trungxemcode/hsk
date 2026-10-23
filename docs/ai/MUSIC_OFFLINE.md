# Nhạc ngoại tuyến

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
