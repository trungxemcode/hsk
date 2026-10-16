# Bản 3.3.0 — Đọc thực tế & AI chọn bài mới (triển khai thử nghiệm)

Phạm vi: nhánh `feature/real-reading-player-3-3` từ thiết kế PR #74; **không đưa vào main khi chưa xác minh Worker live**.

## Tính năng đã viết
- Nút **Đọc thêm tình huống thực tế** từ bài học HSK 1–6, giữ context `lessonId` và 20 từ liên quan; thêm mục `Đọc thực tế` trong danh sách chọn bài luyện (có thể chọn cùng các mode khác).
- Trang mobile-first một cột: cấp HSK, chủ đề, nguồn liên kết gốc, nút **AI chọn bài mới** chủ động, xem lại, văn bản/kịch bản, ẩn pinyin/dịch, nút nghe từng lượt; 3 câu hiểu bài sau khi đọc. Không tự chấm SRS hoặc mastery khi chỉ xem.
- `real-reading-variety-core.js` chọn bài cache chưa đọc trước, chặn trùng ID/đoạn Hanzi gần giống, luân phiên nguồn + chủ đề + góc nhìn khi cache thiếu.
- `real-reading.js` lưu lịch sử (`hsk-real-reading-history-v1:<uid>`) và bài chuyển thể trên **thiết bị hiện tại** (`hsk-real-reading-cache-v1:<uid>`), giới hạn 400 lịch sử và 18 bản đầy đủ. Mở/hoàn thành tách riêng, không chạm cơ chế lưu SRS hay đánh giá bài chuẩn.
- Worker `POST /reading-next`: xác thực Firebase theo luồng có sẵn; kiểm tra chính xác ID bài nguồn trong danh sách cho phép; đọc source thông qua Jina Reader; gửi văn bản đã giới hạn độ dài cho Gemini; yêu cầu output JSON theo HSK và từ vựng bài; kiểm tra tối thiểu cấu trúc Hán/pinyin/Vi và 3 câu hỏi rồi trả về **kịch bản chuyển thể** (không nhận là lời trích gốc). Không sao chép nội dung toàn văn sang kho công khai.
- Nhóm nguồn ban đầu: 36Kr (bữa sáng), Mandarin Bean (thay đổi cuộc sống, xin nghỉ). HSK 1/6 có nguồn ít và chất lượng chuyên môn cần kiểm duyệt bổ sung.

## Điều kiện vận hành / chưa hoàn thiện
- Frontend có route và PWA asset nhưng chỉ tạo bài mới nếu **người học đã đăng nhập**, Worker thực sự đã được cập nhật/deploy và khóa Gemini hợp lệ. Nếu Worker trả 404, AI chưa được triển khai ở backend. Trình duyệt không biết/không giữ khóa Gemini.
- **Lịch sử hiện chỉ theo UID trên một thiết bị, chưa đồng bộ Firebase**. Không gọi là chống trùng xuyên thiết bị.
- Cache bài mới chia theo **thiết bị**, chưa có Cloudflare KV/R2 chung, chưa có lịch cron tự tuyển bài, chưa nhận dán URL bất kỳ, chưa hỗ trợ OCR truyện tranh. Không được hứa tác phẩm vô hạn hoặc không bao giờ trùng nội dung vì AI/nguồn có giới hạn.
- Gemini chỉ được kiểm tra định dạng và sự trùng gần đúng bằng máy; **chưa có biên tập viên/hệ đo kiểm semantic riêng** để xác minh mọi chi tiết dữ kiện hoặc pinyin. Dữ liệu bên ngoài là data không được coi là system instructions. Nguồn phải đúng quyền sử dụng/trích dẫn.
- Jina Reader có rate limits và có thể lỗi, Worker trả thông báo lỗi gắn với nguồn thay vì dựng bài báo giả. Có per-isolate cooldown, chưa có quota cấp toàn hệ thống.
- Quy trình triển khai Worker live: chạy `node tools/build-worker-bundle.cjs`, test bundle, sau đó deploy có xác thực `npx wrangler deploy` **sau khi được phép**; xác nhận endpoint `/reading-next` với tài khoản thật. Không phải chỉ merge HTML là AI hoạt động.

## Kiểm thử
- `node --test server/reading-service.test.mjs`: auth Firebase, catalog nguồn, chặn payload ngoại lai, Jina fail, Gemini invalid, cooldown, story schema.
- `node tools/check-real-reading-variety.cjs`: 16 góc nhìn không trùng trong cùng bài học, scope HSK, nhớ lịch sử mở vs hoàn thành.
- `node tools/check-real-reading-ui.cjs`: browser mock worker, 320/390/1440, sáng/tối, nguồn gốc rõ, login, ẩn/hiện, TTS, 3 câu, không ghi SRS, từ một bài học HSK.
- Studio/picker/mobile/lesson DOM/113 unit tests regression cần PASS trước merge.
- Các URL nguồn dùng để đọc bài báo thực tế, phần AI là bản chuyển thể học tập có ghi nguồn. Các bản mẫu trong test là dữ liệu mô phỏng, không phải bài đã khai thác thật.
