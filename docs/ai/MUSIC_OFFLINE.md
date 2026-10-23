# Nhạc ngoại tuyến

Menu ba chấm → Nghe ngoại tuyến → chọn Thấp 32 / Trung bình 64 / Cao 96 kbps → Lưu link. Bộ lấy nguồn (khi đã cấu hình) trả âm thanh gốc; trình duyệt nén HE-AAC v2 stereo 48 kHz bằng FFmpeg.wasm trong Web Worker, kiểm tra profile và ghi IndexedDB. Không cần người nghe chọn file cho luồng này. Có tiến trình/hủy; nguồn lỗi, hủy, đổi tài khoản hoặc đổi bài không ghi đè bản cũ. Mỗi lượt tối đa 15 phút và 50 MiB nguồn. Tùy chọn chất lượng nhớ riêng theo tài khoản, mặc định 64. Dung lượng âm thanh xấp xỉ 0,24/0,48/0,72 MB/phút cộng container; tải nguồn ban đầu vẫn có thể lớn hơn file cuối.

## Trạng thái tích hợp

**Chưa bật lấy link thật:** `music-config.json.offlineSourceResolver` đang trống. Bộ nén và luồng lưu đã được thử bằng nguồn thật do resolver mô phỏng cung cấp; chưa có dịch vụ lấy nguồn công khai được triển khai. Không coi kiểm thử này là tải thành công từ YouTube/SoundCloud thật. FFmpeg.wasm không lấy audio từ iframe hoặc vượt CORS/DRM; Spotify bị từ chối rõ ràng.

`server/music/source_resolver.py` cung cấp POST `/v1/jobs` (`{url}`), GET `/v1/jobs/{id}`, GET `/v1/jobs/{id}/file`, DELETE `/v1/jobs/{id}`. Nó dùng yt-dlp cho một bài YouTube/SoundCloud công khai, không cookie/đăng nhập, giữ nguyên bytes, kiểm tra độ dài bằng ffprobe. Không chạy nén server. Firebase ID token kiểm tra bằng Identity Toolkit; job/file phân tách UID. Giới hạn 2 worker, 4 job đang chạy/chờ, 20 job giữ tạm, 10 lượt/UID/giờ (admin ngoại lệ), TTL 15 phút và xóa sau nhận file. Nguồn chặn tải/yêu cầu đăng nhập có thể thất bại.

Triển khai container `docker build -f server/music/Dockerfile.source -t hsk-source .`, chạy HTTPS reverse proxy với `FIREBASE_API_KEY`, `ALLOWED_ORIGINS` (đúng origin app), tùy chọn `ADMIN_UID`, `SOURCE_TEMP`; đặt URL HTTPS vào `offlineSourceResolver`. Service cần Python/yt-dlp/ffprobe, không chạy trực tiếp trên GitHub Pages hay Cloudflare Worker JS. Chỉ dùng nguồn được phép tải. Khi chưa cấu hình, UI báo thiếu kết nối và vẫn giữ tính năng nhập file cũ.

## Bộ nén trên thiết bị

`vendor/music-codec` có FFmpeg.wasm audio-only riêng (~2,1 MiB WASM + 74 KiB glue), FDK AAC thật; không dùng AAC-LC để giả HE-AAC v2. Chạy single-thread, không cần SharedArrayBuffer/COOP/COEP. WASM chỉ tải khi chuyển bài đầu tiên, xác minh SHA-256 theo manifest rồi lưu Cache Storage `hsk-music-codec-v1`; không thêm 2,1 MiB vào bộ cài PWA ban đầu. Worker bị terminate khi xong/hủy/lỗi; không giữ nguồn hay PCM trong kho nhạc. Xem `tools/wasm/build-music-core.sh` và notices/source refs trong `vendor/music-codec/README.md` để rebuild/thay module.

## Kho và tính năng cũ

100 MiB tổng blob trên thiết bị trong origin app, 50 MiB/file; độc lập cache PWA và cache bộ nén. Không tự LRU xóa bài người dùng đã chọn. Dedup theo SHA-256, tách tham chiếu tài khoản; xóa tham chiếu cuối giải phóng blob. Trình duyệt vẫn có thể thu hồi dữ liệu khi thiếu chỗ. Nhạc được phát bằng native Audio/Blob URL, dùng cùng player, tua/dừng/tốc độ/queue. Object URL thu hồi khi rời/đổi nguồn/tài khoản; cuối danh sách dừng trừ khi bật lặp.

“Gắn file có sẵn vào bài đang chọn” và “Thêm file M4A từ thiết bị” vẫn giữ bytes gốc, không tự khẳng định codec/bitrate của file nhập. CLI chuẩn bị file: `python tools/prepare-offline-music.py input.wav output.m4a --bitrate 64 [--encoder /path/to/aac-enc]`.

## Kiểm thử

`node tools/check-music-codec.cjs` chạy đúng worker và WASM được ship: nén HE-AACv2 thật 32/64/96, xác minh output, cache dùng lại, nguồn/chất lượng sai. `node tools/check-music-offline.cjs` cần fake-indexeddb: owner, dedup, quota atomic, hủy stale. `node tools/check-music-offline-ui.cjs` dùng Playwright 390/1440: resolver giả trả bytes HE-AACv2 thật → WASM thật → lưu cả ba chất lượng; gắn/import, đổi owner, reload, ngắt mạng, play/pause/seek và xóa. `python tools/check-music-source-resolver.py` (cần fastapi/httpx): auth, link validation, owner, giữ nguyên bytes và cleanup. Cold start PWA và hiệu năng trên iPhone/Android cũ thật chưa được nghiệm thu.
