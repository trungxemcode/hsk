# Đưa App HSK lên Google Search

Website: https://trungxemcode.github.io/hsk/

Thay đổi SEO cơ bản: tiêu đề, mô tả tiếng Việt, URL canonical và metadata chia sẻ được gửi sẵn trong HTML, không chờ JavaScript. Sitemap chỉ liệt kê trang chủ công khai đang tồn tại. Các màn học dùng điều hướng JavaScript, chưa có URL nội dung độc lập; không tạo URL giả cho từng bài hoặc từ vựng trong sitemap. Không thay đổi UI, điều hướng, tiến độ, dữ liệu hay backend.

## Sau khi merge và xác minh bản công khai

1. Chủ website mở https://search.google.com/search-console/ bằng tài khoản Google muốn quản lý website.
2. Thêm property kiểu **URL prefix**: `https://trungxemcode.github.io/hsk/`. Không dùng kiểu Domain cho `github.io`, vì không quản lý DNS của tên miền đó.
3. Chọn xác minh bằng **HTML tag**, lấy nguyên thẻ `google-site-verification` do Google cấp. Thêm chính xác thẻ đó vào `<head>` của `index.html` qua một PR riêng, chuẩn bị bản PWA mới và triển khai. Không điền token mẫu, không gửi mật khẩu Google. Giữ token sau xác minh để Google có thể kiểm tra lại quyền sở hữu.
4. Trong Search Console chọn **Verify** sau khi thẻ thật xuất hiện trên bản public.
5. Vào **Sitemaps**, gửi `https://trungxemcode.github.io/hsk/sitemap.xml`.
6. Dùng **URL Inspection** cho URL trang chủ, kiểm tra bản live và chọn **Request indexing** nếu có sẵn. Theo dõi Pages/Indexing và Performance để biết Google thực sự đã index hay chưa.

Chưa xác minh Search Console, chưa gửi sitemap hoặc yêu cầu indexing bằng phiên làm việc này. Không thể kết luận đã được index từ việc tải HTTP thành công; không có cam kết thời gian, thứ hạng hoặc rich result. Tên miền riêng không bắt buộc để xuất hiện trên Google.

Không tạo `robots.txt` dưới `/hsk/`: Google chỉ đọc robots tại gốc host (`https://trungxemcode.github.io/robots.txt`). Không có robots ở project path không phải lỗi cần sửa. Nếu sau này quản lý site gốc của host, có thể khai báo URL sitemap tại robots gốc; hiện gửi trực tiếp bằng Search Console. Không chặn các JS/CSS cần thiết để Google render app.

## Tài liệu chính thức

- https://developers.google.com/search/docs/fundamentals/get-started-developers
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
- https://support.google.com/webmasters/answer/9008080
