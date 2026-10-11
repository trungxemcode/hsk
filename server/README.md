# Kết nối dịch Việt → Trung theo HSK

Máy chủ hỗ trợ /translate (dịch câu), /ask (hỏi đáp theo câu) và /ocr (nhận dạng ảnh). Không có khóa Gemini trong mã ứng dụng.

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
