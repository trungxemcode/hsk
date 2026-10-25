# Kho nhạc R2 (Bản 3.17.1)

Nhạc giải trí phát file MP3/M4A do chủ kho tải lên R2. Không giải mã YouTube, không VPS, không tải ngoại tuyến. Bài học HSK và dữ liệu tài khoản giữ nguyên. Playlist/lịch sử lưu thông tin bài, không lưu audio. Nhạc cũ trên thiết bị chỉ xóa khi người dùng chọn trong Dọn dẹp.

## Cấu hình một lần

1. Bật R2 trong Cloudflare Dashboard. Tài khoản hiện trả lỗi10042 khi chưa kích hoạt. Kiểm tra thông tin thanh toán/giá trước khi bật.
2. Từ thư mục dự án, đăng nhập Wrangler và tạo bucket:

```sh
npx wrangler login
npx wrangler r2 bucket create hsk-music-library
npx wrangler secret put FIREBASE_API_KEY --config server/music/wrangler-cloud.jsonc
npx wrangler deploy --config server/music/wrangler-cloud.jsonc
```

FIREBASE_API_KEY là Web API key của cùng Firebase project mà app dùng. Worker kiểm tra Firebase ID token và UID chủ kho từ server/account-roles.mjs; không đưa credentials quản trị vào frontend. Origin website được khai báo ALLOWED_ORIGINS trong wrangler-cloud.jsonc.

3. Điền URL HTTPS thực tế Wrangler trả về vào `music-config.json.cloudEndpoint`. Giữ `enabled`/`endpoint` nếu dùng dịch vụ bài học riêng. Bump PWA release sau thay đổi config rồi mở PR.
4. Đăng nhập tài khoản chủ kho trong app, mở Nhạc giải trí → ⋯ → Thêm nhạc vào kho. Chọn MP3/M4A tối đa50MB, nhập tên/nghệ sĩ, chờ thanh tải lên báo hoàn tất. Upload lại cùng file không tạo bản sao. Người nghe chỉ thấy bài đã công khai, không có nút upload.

Worker liệt kê tối đa100 bản ghi/trang; app đọc tối đa20trang. Audio hỗ trợ HTTP Range, ETag và HEAD. URL dựa trên SHA256 nội dung, không dùng URL YouTube có hạn. Bucket giữ riêng tư; Worker phân phối những object có metadata published=true. Không dùng r2.dev để phân phối trực tiếp.

## Kiểm thử/cắt chuyển

Chạy node --test server/*.test.mjs và các check-music-{background,online,ios-layout,links}-ui.cjs. Kiểm thử AAC thực trong Chromium không thay thế kiểm thử khóa màn hình trên Safari/Cốc Cốc iOS/Android. MediaSession cung cấp điều khiển hệ thống; đóng cưỡng bức app hoặc tắt nguồn điện thoại sẽ dừng phát.

Chưa kích hoạt R2 thì app báo kho chưa được cấu hình; không dùng fallback YouTube hoặc VPS. Chỉ ngừng dịch vụ AWS cũ sau khi R2 và bản main mới hoạt động; không xóa VPS/tài nguyên người dùng tự động.

## Admin YouTube import (3.18.1)

`/api/admin/imports` requires the fixed owner Firebase UID, just like file uploads. Normal/VIP accounts can only save personal YouTube links and listen to published R2 audio. Public YouTube embeds are visible, use official player controls/time, and have browser-dependent background playback; no silent keepalive or alternate-source matching.

`.github/workflows/music-import.yml` runs manually or every5minutes on main and processes one queued job. GitHub may delay scheduled runs. Cookie secret is `YTB_Cookies`; no PAT or R2 credentials are needed in frontend/Actions. The Worker verifies the GitHub OIDC signature, audience, immutable repository/owner IDs, main ref, workflow path and event type before claiming/uploading. The queue is private R2 JSON; Firebase owner-only reads status. A job has a15minute lease, errors are shown in the admin panel, and a new request is required after failure. MP3 output128kbps,20minute source/50MB file maximum; source title/artist are defaults, admin overrides supported. No media/cookie artifacts are uploaded to GitHub. Temporary cookie/audio files disappear after the job.

The queue pilot scans the first1000 task records per claim. This is a small owner-operated import workflow; archive old job records before exceeding that scale. For immediate processing, use Actions → Admin music import to R2 → Run workflow. GitHub schedules only execute after the workflow reaches main.
