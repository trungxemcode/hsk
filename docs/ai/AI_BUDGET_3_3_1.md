# HSK 3.3.1 — Token guard and optional second AI provider

## Đã lập trình
- Cloudflare Durable Object SQLite `HSkaIControl`: đếm lượt AI tập trung toàn app, nguyên tử qua storage transaction.
- Cấu hình bảo thủ: 180 lượt AI/ngày toàn app, 10/phút, 15/ngày/UID, tối đa 5 lượt tạo bài đọc/ngày/UID. Ngày UTC; có dư địa so với 500 RPD (Google quota đặt lại giờ Pacific). Worker trả 429 `AI_BUDGET_EXHAUSTED` trước khi gọi AI khi đạt giới hạn.
- Cache đọc thực tế dùng chung các tài khoản qua Durable Object theo SHA-256(HSK + bài học + nguồn + chủ đề + góc nhìn + từ vựng bài), TTL 14 ngày, khóa 105 giây chống tạo cùng một biến thể đồng thời. Chỉ cache nội dung bài học, không lưu UID/Firebase token/câu dịch riêng tư. Lịch sử đã đọc mỗi thiết bị vẫn tách biệt.
- Nguồn cho bài đọc cắt còn 4.500 ký tự (trước 7.000); maxOutputTokens đọc còn 3.200 (trước 4.200). Giữ nguyên các pipeline khác.
- `AI_CONTROL_REQUIRED=true` bắt buộc binding DO; khi binding hỏng sẽ dừng AI thay vì cho gọi vô hạn.

## Key AI thứ hai — CHƯA kích hoạt
- Adapter OpenAI-compatible `server/ai-backup.mjs` hỗ trợ **xKiro**, cố định endpoint `https://api.xkiro.com/v1/chat/completions`, chỉ fallback đọc thực tế khi Gemini trả 429/502/503, không gọi hai model song song tốn phí.
- Tiền tố `sk-xt-` chưa chứng minh là xKiro: **XTokenHub** cũng phát hành key tiền tố này. Cần xác nhận nhà cung cấp/model/bảng giá trước khi bật; nếu provider khác phải sửa adapter cho endpoint thật.
- Nhà cung cấp đã xác nhận: xKiro, endpoint `https://api.xkiro.com/v1/chat/completions`. Chọn model trong catalog Free ngày 17/10/2026: `qwen/qwen-plus-2025-07-28:free`. Cấu hình `AI_BACKUP_ENABLED=true` nhưng tự động vô hiệu khi chưa có secret; Gemini vẫn chạy chính. Chỉ fallback bài đọc khi Gemini trả 429/502/503.
- Key đăng trong chat cần được **thu hồi và tạo mới**. Công cụ từ chối việc truyền khóa chat thẳng sang Cloudflare; key chưa được cài. Người dùng nhập key mới trong Cloudflare > Workers & Pages > hsk-vietnamese-translator > Settings > Variables and Secrets, tên `SECONDARY_AI_API_KEY`, Type Secret, sau đó Deploy. Không lưu trong git, chat hoặc mã nguồn.
- Bật sau xác minh bằng vars `AI_BACKUP_ENABLED=true`, `SECONDARY_AI_PROVIDER=xkiro`, `SECONDARY_AI_MODEL=<model ID thực tế>`. Mặc định tắt; chưa chi phí nhà cung cấp thứ hai.
- Không đồng bộ từ vựng/tiến độ hay lịch sử đọc trên nhiều thiết bị; token guard không thay thế việc đồng bộ đó.

## Vận hành
1. `node tools/build-worker-bundle.cjs`, `node --test server/*.test.mjs`, `npx wrangler deploy --dry-run` trước deploy.
2. Worker live: thử 401 không có Firebase token, tạo bài thật có token, cache hit lần sau, quota vượt hạn mức trả 429. Không ghi log key hoặc nội dung người học.
3. CI + Playwright trước merge `main`; kiểm tra Pages và Service Worker khi phát hành. Quay lui Worker nếu DO/quota có lỗi.
4. Cloudflare Durable Objects SQLite hiện được hỗ trợ trên gói Free nhưng vẫn có giới hạn tài nguyên; theo dõi chi phí nếu tài khoản là Paid.
