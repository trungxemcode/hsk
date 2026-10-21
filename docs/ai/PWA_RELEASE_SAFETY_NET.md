# PWA release safety net (HSK 3.3.6+)

## Vì sao cần cơ chế này

Các commit 3.3.4–3.3.6 trước đó chỉ cập nhật Cloudflare Worker. iPhone không nhận được thông báo **bản PWA** bởi `app-version.json`, `offline.js`, `offline-worker.js` và `OneSignalSDKWorker.js` vẫn mang 3.3.3. Worker API đã chạy mã mới ngay khi triển khai; không cần tải lại 159 tệp offline vì nội dung app không đổi. Khi muốn iPhone nhận cập nhật tải xuống, phải phát hành PWA mới.

## Quy trình từ nay

1. Code và kiểm thử trên một nhánh tính năng. Với các tệp chạy trong trình duyệt (HTML, JS, CSS, ảnh, nội dung HSK), chạy **một lệnh** để tự lấy số patch tiếp theo và tạo hash:
   `python tools/prepare-pwa-release.py --note "Mô tả ngắn"`
   Lệnh `--bump minor` tăng bản thứ hai (ví dụ 3.3.6 → 3.4.1).
2. Đưa cả thay đổi giao diện, `app-version.json`, `offline.js`, `offline-worker.js`, `OneSignalSDKWorker.js` vào PR. Không đưa secret/mật khẩu lên repo.
3. CI tự chạy `.github/workflows/pwa-release-guard.yml` trên **mọi PR**:
   - So sánh thay đổi giữa PR và `main`; nếu tài nguyên client thay đổi mà không tăng cả phiên bản PWA lẫn semantic release → **FAIL**.
   - Kiểm tra 159+ tệp với SHA-256, tệp tài nguyên mới có trong offline manifest, và revision khớp giữa SW/OneSignal/client → **FAIL** nếu thiếu hoặc sai.
   - Riêng backend-only, docs-only không buộc tăng phiên bản PWA vì đó không phải bản app để tải xuống.
4. Sau merge vào `main`, CI lại kiểm tra manifest và tự đối chiếu GitHub Pages trong tối đa khoảng 7 phút: version + nội dung thực của index, offline.js, offline-worker.js, OneSignal worker, real-reading.js và push.js. Nếu CDN/Pages chưa triển khai đồng bộ → **FAIL**, không báo đã phát hành xong.
5. `.github/workflows/update-notifications.yml` đang gửi OneSignal sau khi xác minh manifest công khai đúng phiên bản. Chỉ gửi đến thiết bị đã opt-in `hsk_update_on=1`. Nếu chưa bật Push, app vẫn tự kiểm tra bản mới khi mở lại hoặc online qua `offline.js`.
6. Để **ngăn merge PR khi CI đỏ**, người sở hữu repository nên vào GitHub → Settings → Rules → Rulesets (hoặc Branch protection) → áp dụng cho `main`, bật **Require a pull request** và **Require status checks**, chọn `PWA release safety net / release-guard` và `Studio layout checks / layout`. GitHub Actions không thể tự bảo đảm ngăn một chủ repo force/direct push nếu không bật quy tắc này.

## Trường hợp đặc biệt

- Push một thay đổi **server/**: AI chạy bản mới sau khi Cloudflare Worker triển khai; không có file cài đặt mới cho iPhone, do đó không hiện bảng cập nhật PWA.
- Push thay đổi client mà **quên bump**: PR safety net đỏ; xem hướng dẫn lỗi rồi chạy `python tools/prepare-pwa-release.py --note "..." `.
- GitHub Pages gặp lỗi: workflow `verify-pages` đỏ dù merge thành công. Không tuyên bố đã phát hành cho tới khi public assets xác minh khớp.
- iPhone hoàn toàn offline, ứng dụng bị đóng, thiết bị bị hạn chế dữ liệu hoặc người dùng chưa cho phép Push: **không thể bảo đảm nhận cập nhật ngay lập tức**. Khi iPhone mở HSK và có internet, `offline.js` có thể kiểm tra bản mới; cập nhật offline chỉ áp dụng sau khi tải và xác minh trọn vẹn.
- Cache cũ và localStorage/Firebase không bị xóa để ép cập nhật.
- Với GitHub Pages, hiện repo phục vụ từ nhánh `main`; không tự commit bump bằng `GITHUB_TOKEN` trong Actions vì bot commit có thể không kích hoạt Pages build/notify. CI yêu cầu bump ở commit PR mà người dùng merge thật.


## Danh mục tài nguyên và chuyển module (3.4.12)

`tools/pwa-assets.json` là nguồn khai báo duy nhất cho danh sách file tĩnh và URL tương thích. `tools/pwa_assets.py` thêm đúng các audio/đề thi từ hai danh mục Drive hiện có, xác minh file tồn tại, đường dẫn an toàn và cặp dữ liệu loader `.js` / `.js.gz` byte-identical. `build-version.py` sinh `OFFLINE_FILES`, `OFFLINE_ALIASES` và checksum; không lấy danh sách cũ trong worker rồi tự thêm lại đường dẫn gốc. Guard đối chiếu nguồn khai báo, worker và manifest, kiểm tra cả việc xóa file khi so với base.

Khi chuyển module: dùng `git mv`, cập nhật HTML và consumer/test, thay đường dẫn trong catalog và giữ alias URL cũ → file mới. Worker mới phục vụ alias từ cache mới, giúp tab cũ còn yêu cầu URL cũ. Không chuyển các worker hay manifest khỏi gốc; không đổi scope, storage hoặc cơ chế kích hoạt. Chạy `python tools/prepare-pwa-release.py --note "Mô tả"`, guard theo base, rồi browser checks. `verify-live-pwa.py` kiểm tra thêm các đích alias trên Pages sau merge.

Hai kiểm tra Chromium trong workflow bảo toàn tính năng: `check-backup-relocation-ui.cjs` chạy nhập thật bằng dữ liệu giả, bảo toàn bản trùng/đổi tài khoản ở390/1440px; `check-pwa-relocation-ui.cjs` chạy mã worker thật với bộ tài nguyên giả nhỏ tại `/hsk/`, kiểm tra waiting/activate, cache reuse, alias, offline reload, cài mới và giữ localStorage. Đây không phải kiểm thử trên iPhone vật lý hay xác minh bản live chưa được triển khai.
