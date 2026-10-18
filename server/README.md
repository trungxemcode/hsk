## Chống lạm dụng AI — Worker 3.5.1

Chỉ bật sau khi deploy Worker mới cùng cấu hình `AI_ABUSE_ENABLED=true`. Với tài khoản thường: Firebase phải trả `emailVerified=true` khi `AI_REQUIRE_VERIFIED_EMAIL=true`; dùng nút xác minh email có sẵn trong trang Tài khoản. Tài khoản đã tồn tại từ 24 giờ trở lên giữ 35 truy vấn + 15 bài đọc/ngày; trong 24 giờ đầu là 10 truy vấn + 3 bài đọc/ngày. Tuổi và UID lấy từ kết quả Firebase lookup trên máy chủ, không từ payload/claim vai trò của trình duyệt.

Durable Object thực thi nguyên tử một yêu cầu AI đang chạy/tài khoản, cách các lượt ít nhất 3 giây và hai lượt tạo bài đọc ít nhất 10 giây, dùng chung giữa các tab/thiết bị/Worker. Yêu cầu trùng đang chạy nhận 429 và `Retry-After`, không có lời gọi provider thứ hai và không trừ lượt AI. Không lưu kết quả hỏi đáp riêng tư trong Durable Object để chia sẻ giữa các phiên. Cache bài đọc công khai hiện có vẫn hoạt động. Khóa xử lý được giải phóng trong `finally` cả khi trả lỗi/hủy; khóa bị bỏ dở hết hạn sau 150 giây, completion cũ không thể mở khóa của yêu cầu thay thế. Thiếu binding khi bật bảo vệ thì từ chối trước khi gọi AI.

Ngắt tự động từng nhóm reading/query trong 60 giây sau 8 lỗi máy chủ/nhà cung cấp (HTTP 5xx) trong 2 phút. Người dùng tự hủy và hết hạn mức không được tính vào bộ ngắt. `AI_PAUSED=true` tạm ngắt AI cho tài khoản thường; học offline và lịch sử đọc cục bộ không phụ thuộc đường gọi này. Các biến trong wrangler.jsonc là cấu hình triển khai: nếu bật ngắt thủ công trên Dashboard, cập nhật lại tệp cấu hình trước lần deploy sau để giữ trạng thái đó.

**Admin trong `ADMIN_UIDS`, sau khi Firebase xác thực, được miễn toàn bộ hạn mức chống lạm dụng trong app:** không giới hạn lượt/ngày/phút, số yêu cầu đồng thời, thời gian chờ, xác minh email, tuổi tài khoản hay bộ ngắt tự động/thủ công; cũng không bị chặn bởi khóa bài đọc đang tạo. Không trừ hoặc ghi bộ đếm của tài khoản thường. Xác thực, kiểm tra dữ liệu đầu vào và hạn mức thực tế của nhà cung cấp vẫn giữ nguyên.

Chỉ lưu hash UID/fingerprint cùng trạng thái khóa và cửa sổ đếm lỗi; log lý do chặn + route, không log prompt, token, UID hay API key. Không thêm chặn IP cứng hoặc CAPTCHA trong bản này: triển khai lớp ưu tiên xác thực/tài khoản, gửi trùng, tốc độ, đồng thời và ngắt khẩn cấp. Không cần Secret, binding hay migration mới. Thay đổi backend, không cần tải lại PWA.

## Tạo bài đọc nhanh — Worker 3.4.2

`/reading-next` ưu tiên Gemini ở cả 5 thể loại và HSK 1–6, xKiro vẫn dự phòng khi lỗi; hỏi đáp/tra cứu nhẹ giữ phân vai cũ. Đo thật phát hiện cấu hình cũ chờ xKiro hết 18 giây rồi Gemini tạo bài khoảng 3 giây. Không gọi nhiều AI song song, không tạo bài nền, không rút giới hạn độ dài hay bỏ pinyin/dịch Việt/câu hỏi để lấy tốc độ.

Nội dung nguồn công khai đã xác minh được giữ trong bộ nhớ Worker tối đa 30 phút, theo ID nguồn trong danh mục cố định; không lưu token/UID hay nội dung riêng của người học. Cache có giới hạn tự nhiên là số nguồn trong danh mục, hết hạn phải kiểm tra nguồn lại. Khác với cache bài đọc hiện có, cache nguồn vẫn tạo một bài mới qua AI. Cold start có thể tải lại nguồn.

Prompt chia mục tiêu độ dài theo lượt thoại/đoạn, giữ nguyên validator chất lượng; schema ràng buộc 3 câu hỏi, 3 lựa chọn và chỉ số đáp án 0–2. Giữ nguyên cấu hình suy luận mặc định của Gemini và giới hạn 3.200 token đầu ra.

Log `hsk-reading-timing` chỉ ghi thời gian nguồn, cache hit, nhà cung cấp, kết quả và số thứ tự khóa đã cấu hình. Thời gian `gemini-key` là tới response headers; thời gian provider bao gồm đọc/kiểm tra response body. Không log API key, UID, token, câu hỏi hay bài đọc. Cần deploy Worker; đây là thay đổi backend, không cần tải lại PWA. Các biến quota và Secrets giữ nguyên. Vị trí 10 có thể để trống.

# Kết nối dịch Việt → Trung theo HSK

## Luân phiên tối đa 10 khóa Gemini — 3.4.1

Worker chia các lượt gọi Gemini theo round robin. Durable Object `AI_CONTROL` giữ con trỏ và thời gian nghỉ chung giữa các Worker; chỉ lưu mã SHA-256 của khóa, không lưu khóa, prompt hoặc token đăng nhập. Phân vai xKiro/Gemini, xác thực Firebase, quota 35 truy vấn + 15 bài đọc/ngày cho tài khoản thường và quyền admin giữ nguyên. Không tự tăng giới hạn chung của app.

Thêm tối đa 10 **Secrets** tại Cloudflare → Workers & Pages → `hsk-vietnamese-translator` → Settings → Variables and Secrets:

| Vị trí | Tên Secret |
| --- | --- |
| 1 | `GEMINI_API_KEY_1` hoặc `GEMINI_API_KEY` hiện có |
| 2–10 | `GEMINI_API_KEY_2` đến `GEMINI_API_KEY_10` |

Nếu đặt cả `_1` và tên cũ, `_1` được ưu tiên. Bỏ qua vị trí trống và khóa trùng. Chỉ một khóa vẫn hoạt động như trước. Các khóa phải thuộc những project bạn có quyền dùng; quota Google tính theo **project**, không theo số khóa hay số Gmail. Không mặc định các con số 150 RPM / 15.000 RPD trong tài liệu tham khảo; xem hạn mức thật trong từng project tại AI Studio: https://ai.google.dev/gemini-api/docs/rate-limits.

Từ thư mục repo trên Windows, nhập từng khóa ở prompt riêng của Wrangler:

```powershell
npx wrangler secret put GEMINI_API_KEY_1 --config server/wrangler.jsonc
npx wrangler secret put GEMINI_API_KEY_2 --config server/wrangler.jsonc
# Lặp lại tên tương ứng đến GEMINI_API_KEY_10.
npx wrangler secret list --config server/wrangler.jsonc
npx wrangler deploy --config server/wrangler.jsonc
```

Không đưa giá trị khóa vào lệnh, Git, biến frontend hoặc chat. Giữ `FIREBASE_API_KEY`, `SECONDARY_AI_API_KEY` và binding `AI_CONTROL`. Nếu triển khai bằng Edit code, dùng toàn bộ `translator-worker-bundled.mjs` mới rồi thêm các Secrets ở Settings. Không cần tạo thêm Worker hay migration DO.

Mỗi lượt Gemini thử tối đa hai khóa tuần tự, trong deadline của tác vụ; không gọi song song. HTTP 429 nghỉ ít nhất 60 giây, tôn trọng `Retry-After`/`RetryInfo`; quota ngày nghỉ ít nhất 24 giờ. Lỗi khóa/quyền 400 `API_KEY_INVALID`, 401, 403 nghỉ 15 phút; 500/502/503/504 nghỉ 15 giây. Khóa đang nghỉ được bỏ qua. Hết khóa khả dụng trả 429 hoặc dùng xKiro theo cơ chế dự phòng sẵn có. Lỗi nội dung, từ chối an toàn, hủy yêu cầu và JSON sai không kích hoạt thử thêm khóa. Lỗi mạng/timeout giao cho cơ chế dự phòng provider hiện có. Các chốt này vẫn áp dụng cho admin ở cấp provider.

Xác nhận Worker bằng header `X-HSK-Worker-Version: hsk-gemini-key-pool-3-4-1`. Kiểm thử dùng khóa giả và mô phỏng provider, không tiêu quota thật. Sau khi thêm đủ Secrets, cần kiểm tra một yêu cầu thực trên Worker để xác nhận quyền/quota các project; code không thể xác nhận 10 tài khoản chỉ từ tên Secrets.

Phạm vi bản này là xoay khóa. Không triển khai SQLite, tạo sẵn nội dung hay cache hỏi đáp từ tài liệu tham khảo; cache bài đọc và quota hiện có tiếp tục được giữ.

## AI dự phòng cho các tác vụ văn bản (3.3.5)

Gemini là dịch vụ chính. Các luồng dịch, hỏi đáp, giải thích, từ điển, kế hoạch và tạo bài đọc chuyển sang xKiro **một lần** khi Gemini lỗi kết nối, HTTP 401/403/404/408/429/500/502/503/504, JSON rỗng/sai cấu trúc hoặc bị cắt. Ngắt chờ Gemini sau 6 giây (bài đọc 12 giây), dành tối đa 25 giây cho dự phòng, vẫn chịu deadline toàn route. Không gọi song song, không tự lặp lại và không bỏ qua Firebase, quota hay kiểm tra kết quả hiện có. Hủy từ signal cha không kích hoạt dự phòng. Không chuyển khi yêu cầu sai HTTP400 hoặc provider từ chối an toàn. Ảnh/OCR/nhận dạng chữ không chuyển sang model dự phòng chỉ hỗ trợ văn bản. Các ngưỡng là giới hạn chờ, không phải cam kết tốc độ thực tế.

Worker cần secret `SECONDARY_AI_API_KEY`; tạo/cập nhật trong Cloudflare → Worker `hsk-vietnamese-translator` → Settings → Variables and Secrets → Add → Secret. Hoặc chạy `npx wrangler secret put SECONDARY_AI_API_KEY` trong thư mục `server` và nhập key ở prompt riêng. Không đặt key trong Git, frontend, biến thường hoặc gửi lại qua chat. Nếu key đã từng được chia sẻ công khai, thu hồi và tạo key mới trước khi cài.

Các biến không bí mật hiện tại là `AI_BACKUP_ENABLED=true`, `SECONDARY_AI_PROVIDER=xkiro`, `SECONDARY_AI_MODEL=qwen/qwen-plus-2025-07-28:free`. Chỉ có biến chưa đủ: thiếu secret thì dự phòng không hoạt động. Dùng `npx wrangler secret list` để kiểm tra **tên** secret, không in giá trị. Bài kiểm thử dùng provider giả lập không chứng minh key thật còn quota.

Máy chủ hỗ trợ /translate (dịch câu), /ask (hỏi đáp theo câu) và /ocr (nhận dạng ảnh). Không có khóa Gemini trong mã ứng dụng.

Worker cũng hỗ trợ `/lesson-ask` để hỏi theo bài học. Bản `hsk-gemini35-compat-20261012` khôi phục cấu hình của commit `8be39e5`: model mặc định `gemini-3.5-flash-lite`, temperature `0.2` cho dịch/hỏi đáp và `0` cho OCR. Nếu có biến `GEMINI_MODEL` trên Cloudflare, đặt đúng `gemini-3.5-flash-lite` để dùng model này; biến đó có ưu tiên hơn giá trị mặc định trong code.

Để cập nhật Worker hiện tại, thay toàn bộ mã trong Cloudflare Edit code bằng `translator-worker-bundled.mjs`, rồi Deploy. Bản nguồn và bundle được kiểm tra đồng nhất bằng `node --test --test-isolation=none server/translator-worker.test.mjs` từ thư mục app. Kiểm tra dùng API giả lập, không gọi Gemini thật. Header `X-HSK-Worker-Version` xác nhận mã Worker đang phục vụ; HTTP 400 trả model thực tế và lý do Google gửi về, đã ẩn khóa API. Không ghi log câu hỏi, token hoặc nội dung lỗi provider.

1. Tạo Gemini API key trong Google AI Studio, chọn dự án ở Free tier. Không bật billing/gói trả phí.
2. Trong tài khoản Cloudflare Workers Free, triển khai thư mục server bằng Wrangler: `npx wrangler deploy`.
3. Thêm secret bằng `npx wrangler secret put GEMINI_API_KEY`, nhập khóa trong prompt của Wrangler (không đưa vào GitHub hoặc chat).
4. Thêm `FIREBASE_API_KEY` bằng `npx wrangler secret put FIREBASE_API_KEY`: dùng web API key của cùng dự án Firebase hsk-flashcards-44631. Key cần cho phép Identity Toolkit API từ máy chủ. Đây không phải khóa service account.
5. ALLOWED_ORIGINS phải là origin chính xác của app. Mặc định hỗ trợ GitHub Pages và rawcdn.githack.com. Có thể đặt ALLOWED_UIDS để giới hạn những UID được sử dụng.
6. Đặt translation-config.json: {"enabled":true,"endpoint":"https://TEN-WORKER.TEN-TAI-KHOAN.workers.dev/translate"}.
7. Chạy `python3 build-version.py --version hsk-offline-YYYYMMDD-translator-live-1` từ thư mục app. Xuất bản các file app ở đường dẫn cũ. Không xuất bản secret.
8. Kiểm tra đăng nhập thật, dịch cùng một câu ở HSK 1, 4, 5; kiểm tra phiên âm, giữ nguyên nghĩa và trạng thái khi hết quota. Chưa có kiểm tra chất lượng dịch thật trước bước này.

Gói miễn phí có hạn mức; app trả thông báo khi API trả 429, không tự đổi sang gói trả phí. Google có thể dùng dữ liệu gói miễn phí để cải thiện sản phẩm. HSK được điều chỉnh theo bộ từ vựng hiện tại của app; ngữ pháp chỉ là ước lượng. Tên riêng/chuyên môn có thể vượt mức để giữ nghĩa. Đăng nhập được xác thực qua Firebase accounts:lookup. Cooldown 10 giây chỉ có hiệu lực theo isolate, không phải giới hạn toàn cục. Không ghi log câu nhập hoặc token. Cần mạng để tạo bản dịch mới.

## Nhận dạng chữ từ ảnh

Triển khai lại Worker để bật /ocr. Có thể dùng Wrangler như bước 2, hoặc mở Worker hiện tại trên Cloudflare → Edit code, thay nội dung bằng translator-worker-bundled.mjs và Deploy. Giữ các secrets GEMINI_API_KEY, FIREBASE_API_KEY và biến môi trường đang sử dụng; không tạo Worker hay đổi URL.

OCR dành cho chữ Trung → dịch sang tiếng Việt. Có thể kéo chọn vùng chữ. Ảnh đầy đủ được nén thành JPEG tối đa 1600 px; vùng chữ dùng tối đa 2048 px và khoảng 1,5 MB. Chỉ gửi ảnh khi người dùng bấm Nhận dạng chữ. Thời gian chờ OCR: máy chủ 110 giây, app 125 giây; có nút hủy và tái sử dụng kết quả của cùng ảnh trong phiên. Người dùng kiểm tra hoặc sửa văn bản rồi đưa đoạn tối đa 500 ký tự vào ô dịch. OCR có thể nhận sai dấu/chữ, không dùng kết quả chưa kiểm tra cho nội dung cần độ chính xác tuyệt đối. Máy chủ xác thực Firebase và giới hạn kích thước trước khi gọi Gemini. Ảnh được gửi tới Gemini như dữ liệu inline, không tải lên kho Files của Gemini.

### Dịch ảnh một lượt (thử nghiệm)
Nút mới gửi `/ocr` với `translate:true,hsk:1..6`, trả chữ Trung, nghĩa Việt, phiên âm và giải thích trong một lần gọi Gemini. Tối đa 500 ký tự; dùng chọn vùng chữ cho ảnh dài. Cần Deploy lại Worker bundled; nút Nhận dạng chữ cũ vẫn dùng được. Chưa có số đo tốc độ thực tế. Có thể phục hồi Worker từ commit `2f4afabb62ea46440fd52527bc38f199bcf3ca36` nếu cần rollback.
