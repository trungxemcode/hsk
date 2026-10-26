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
Rebuild `node tools/build-worker-bundle.cjs` and deploy `npx wrangler deploy --config server/wrangler.jsonc`. The updated config binds MUSIC_BUCKET to the existing hsk-music-library R2 bucket. `/music-transcript` requires Firebase-verified fixed OWNER_UID; regular/VIP accounts receive 403 before media/AI/budget work. Only published library track IDs qualify; no browser media or arbitrary URLs. Audio is read from R2 (actual bytes <=6 MiB; browser-declared duration <=480 s).
Generation uses the Gemini key pool, default gemini-2.5-flash (optional MUSIC_TRANSCRIPT_MODEL), two audio passes and existing budget controls. Successful output is conditionally written to shared lyrics/{trackId}.json as a draft; a concurrent script change/deleted track prevents overwriting it. AI agreement does not prove accuracy. Admin can edit/review every cue and save a reviewed revision using the music Worker, which must also be deployed: `npx wrangler deploy --config server/music/wrangler-cloud.jsonc`. No new secrets. Listeners retrieve the shared sidecar and flip the cover to view it; they never generate or edit scripts.
