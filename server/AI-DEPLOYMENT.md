# Khắc phục AI_LOCATION_UNSUPPORTED

Ảnh lỗi cho thấy Google Gemini trả HTTP 400: User location is not supported for the API use. Cả /ask, /lesson-ask, /translate và /ocr dùng cùng upstream. Không phải bằng chứng lỗi layout, model hoặc pinyin.

Cấu hình wrangler.jsonc yêu cầu Cloudflare đặt Worker gần gcp:us-east4, một vùng ở Hoa Kỳ. Đây là biện pháp kiểm tra đường đi máy chủ, không bảo đảm Google chấp nhận IP hoặc dự án. Cloudflare không cam kết IP egress cố định. Việt Nam cũng nằm trong danh sách Gemini hỗ trợ, nên không kết luận tài khoản ở Việt Nam bị cấm.

## Triển khai đúng Worker hiện tại

Từ thư mục server, dùng Wrangler chính thức:

```sh
npx wrangler login
npx wrangler deploy --config wrangler.jsonc
```

Kiểm tra đang chọn đúng tài khoản và Worker hsk-vietnamese-translator trước khi xác nhận deploy. Giữ nguyên secrets và biến môi trường hiện có. keep_vars giữ các biến cấu hình đã cài từ dashboard. Không tự đổi model hoặc bật billing. Chỉ dán mã bundled vào Edit code sẽ cập nhật xử lý lỗi nhưng KHÔNG áp dụng placement trong file cấu hình.

Nếu dùng dashboard, phải cấu hình Placement của Worker bằng chức năng mà tài khoản hỗ trợ; nếu chỉ có Smart Placement và không có region hint, dùng Wrangler để áp dụng cấu hình region. Không nhập khóa API vào GitHub hay phía trình duyệt của app.

## Kiểm tra sau triển khai

1. Kiểm tra phản hồi có X-HSK-Worker-Version: hsk-gemini-location-20261012.
2. Kiểm tra header cf-placement trên phản hồi để xem placement có hiệu lực. Header do Cloudflare cung cấp và có thể thay đổi; không dùng vị trí điện thoại để suy ra vị trí thực thi Worker.
3. Đăng nhập app; thử dịch Việt–Trung, Trung–Việt, hỏi theo câu, hỏi trong bài, nhận dạng chữ và dịch ảnh một lượt.
4. Nếu vẫn có AI_LOCATION_UNSUPPORTED, kiểm tra quyền vùng/tài khoản/dự án ở Google AI Studio và báo Google kèm thời gian, mã lỗi, model và revision. Không gửi API key, token đăng nhập hay nội dung cá nhân.

Kiểm tra tự động chỉ giả lập upstream và xác nhận cấu hình/nhận diện lỗi. Chưa có bằng chứng gọi Gemini thực tế thành công sau placement.

Nguồn chính thức:
- https://ai.google.dev/gemini-api/docs/available-regions
- https://developers.cloudflare.com/workers/configuration/placement/
- https://developers.cloudflare.com/workers/wrangler/configuration/

### Music transcripts
Rebuild `node tools/build-worker-bundle.cjs` and deploy `npx wrangler deploy --config server/wrangler.jsonc` to enable `/music-transcript`. Reuses Gemini keys and AI_CONTROL; optional `MUSIC_TRANSCRIPT_MODEL` defaults to `gemini-2.5-flash`. The route sends media to Gemini directly for every role because the text-only secondary provider cannot transcribe audio. Each successful two-pass generation reserves two existing query slots. Inputs limited to 6 MiB and declared 480 seconds; generated timestamps are checked against duration, but client-declared duration is not a media probe. All results are drafts and cannot guarantee exact lyrics. Personal edits remain on the device; file media is not stored by the Worker. Cloud library publication additionally requires the music library Worker deployed per `server/music/R2-DEPLOYMENT.md`.
