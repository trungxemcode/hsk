# Bài đọc nguyên văn
Hai nguồn chủ dự án chỉ định: mandarinbean.com và hskreading.com.
Worker chỉ nhận POST nhỏ từ origin app đã cho phép. Đọc nguồn công khai không cần key AI/đăng nhập. Chỉ trả text/metadata; frontend dùng textContent, không chạy JS nguồn.
Danh sách: op=list, hsk1–6; index tag/hskN hoặc category/hsk-N. Chỉ chọn URL đúng host và nhãn cấp nguồn. Cache6 giờ. Một nguồn lỗi vẫn trả nguồn còn lại và trường unavailable.
Bài: op=article, URL slug chính xác; HTTPS, đúng hai hostname, không port/credentials/query/hash. Từ chối redirect, admin path, quá650000 bytes, không HTML, quá12 giây hoặc cấu trúc không nhận diện được. Cache12 giờ, coalesce request, Map80 entry, Cache API theo datacenter khi có. Không cron quét toàn website.
Mandarin Bean: p trong widget nội dung, lấy simplified và rt pinyin nguồn. HSK Reading: p sau h2.cjk đến translation/questions, không lấy ví dụ từ vựng cuối trang. Giữ thứ tự/câu chữ; không viết lại hoặc bịa khi nguồn lỗi. Không nhập media, quảng cáo, script hoặc quiz chưa hỗ trợ.
Trình duyệt lưu URL/tiêu đề/nguồn/cấp/giờ mở (40 mục, tách UID); bài chỉ ở DOM/RAM. Không gói truyện vào repo/PWA. Không có Vietnamese/quiz AI tự chạy; TTS chỉ khi bấm nghe.
UI giữ AI cũ ở lựa chọn riêng để bảo toàn chức năng; mặc định Bài gốc. Đổi tài khoản/chế độ/trang hủy request, chặn phản hồi cũ. Hết cache cần mạng/nguồn truy cập được.
Kiểm thử: server/original-reading.test.mjs, tools/check-original-reading-ui.cjs; luồng cũ check-real-reading-ui.cjs và server reading tests. Khảo sát VPS1/11/2026: đủ6 cấp,19 URL/cấp ở trang index đầu của hai nguồn, bài mẫu mỗi nguồn trích được. Không khẳng định nguồn phát hành hằng ngày. Không vượt đăng nhập/paywall/chống truy cập.
Cần cả bundle Worker và frontend mới. PR chưa merge không có nghĩa API live. Dùng wrangler translator, giữ secrets/bindings hiện hữu.
