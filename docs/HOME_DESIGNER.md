# Chỉnh giao diện trang chủ HSK trên máy

## Mở bộ chỉnh

Trên Windows, mở thư mục dự án rồi bấm đúp **Chinh-giao-dien.cmd**. Cần Python 3.10 trở lên. Giữ cửa sổ lệnh mở trong lúc chỉnh. Bộ chỉnh mở tại `http://127.0.0.1:8788/tools/home-designer/editor.html`; nếu cổng đang được dùng, chạy `python tools/serve-home-designer.py --port 8789 --open`.

Không cần npm, API AI, Figma hay tài khoản dịch vụ thiết kế. Bộ chỉnh chỉ phục vụ trên địa chỉ loopback. Nó dùng một cổng riêng với app local thường mở ở cổng 8000, nên bản xem thử có vùng lưu dữ liệu riêng. Không mở bộ chỉnh trên cùng cổng đã dùng làm app học thường ngày. Tài khoản/push và kết nối dịch vụ bên ngoài bị tắt trong máy chủ chỉnh sửa; phần Dùng thử dành cho xem bố cục và các thao tác local.

## Chỉnh trực tiếp

1. Bấm vào chữ, nút hoặc khối trong bản xem để chọn. Nút trong app không chạy khi đang ở chế độ chỉnh.
2. Bảng bên phải chỉnh riêng phần tử đang chọn: chữ, căn hàng, khoảng đệm, khoảng cách và các màu theo theme hiện có. Ô để trống nghĩa là dùng kiểu mặc định của app. Các thông số PC và điện thoại tách biệt.
3. Bấm **Chọn cả khối** khi muốn chỉnh khoảng cách của cả thẻ thay vì từng dòng chữ. **Mở/thu nội dung** giúp xem phần nằm trong khung thu gọn.
4. Kéo tay nắm trên khung đang chọn hoặc kéo các khối ở bảng trái để đổi thứ tự. Có nút Lên/Xuống để dùng bàn phím. Thứ tự dùng CSS; không clone nút hay di chuyển DOM của app.
5. **Hiện kế hoạch mẫu** tạo lộ trình minh họa trong vùng lưu riêng của bản xem để chỉnh được các dòng nhiệm vụ. Không đồng bộ lên tài khoản.
6. **Dùng thử** cho phép bấm các nút của app. Bấm **Quay lại chỉnh sửa** để về trang chủ và tiếp tục chọn phần tử.
7. **Hoàn tác/Làm lại** hoặc Ctrl+Z/Ctrl+Shift+Z thao tác trên lịch sử tối đa 100 lần chỉnh. **Khôi phục bản mặc định** vẫn có thể hoàn tác.

Bản đầu hỗ trợ trang chủ và các phần tử đã được đặt tên trong danh sách. Không hỗ trợ xóa/nhân bản chức năng, thay nội dung dữ liệu học, kéo vị trí pixel tự do, hay chỉnh các trang khác.

## Giữ bản chỉnh và áp dụng

- Bản nháp tự lưu trong trình duyệt, gắn với thư mục dự án. **Xuất bản nháp** giữ một file JSON để sao lưu, chuyển máy hoặc gửi cho AI tiếp tục. **Nhập bản nháp** kiểm tra cấu trúc/giá trị trước khi thay trạng thái; tệp sai không ghi đè bản đang chỉnh.
- **Xuất CSS** tải CSS được sinh từ cấu hình. Hãy giữ JSON cùng CSS để chỉnh lại sau này.
- **Lưu vào dự án** chỉ ghi sau hộp xác nhận. Nó cập nhật `home-design.json`, `home-design.css`, một vùng link có đánh dấu trong `index.html`, và đăng ký CSS vào danh mục tài nguyên PWA khi có danh mục. Không sửa handler, ID, nội dung bài học, tiến độ, khóa lưu trữ hoặc những stylesheet khác. Lưu lặp chỉ cập nhật một link.
- Thay đổi này mới nằm trên máy. Bộ chỉnh không tự commit, push, merge hoặc phát hành. Trước khi đưa lên GitHub, làm theo quy trình PR/PWA của dự án: khai báo thay đổi layout, kiểm tra, chạy `python tools/prepare-pwa-release.py --note "Mô tả thay đổi giao diện"` trên nhánh tính năng rồi kiểm tra `python tools/check-pwa-release.py --base origin/main`.

Muốn trở về giao diện gốc sau khi đã áp dụng: **Khôi phục bản mặc định → Lưu vào dự án**. CSS mặc định không có rule thay đổi giao diện.

## Kiểm tra cho người bảo trì

`node tools/check-home-designer-core.cjs`, `python -m unittest discover -s tools -p test_home_designer.py`, và `node tools/check-home-designer-ui.cjs`.

Kiểm tra UI tạo một bản sao tạm bằng hardlink, chạy app và máy chủ thật trên bản sao, kiểm tra chọn không kích hoạt nút, PC/mobile, Undo/Redo, lưu/mở lại nháp, kéo thực, export/import, ghi file và app thông thường sau khi áp dụng. Việc ghi dùng thay thế file nên không sửa nguồn của hardlink. Các bài bảo toàn tính năng hiện có vẫn phải chạy.

`schema.json` là danh sách phần tử/thuộc tính được phép. Bộ sinh CSS trình duyệt và bộ ghi Python dùng cùng schema, có kiểm tra kết quả giống hệt nhau. Chỉ một stylesheet được quản lý có độ ưu tiên cố định, có phạm vi trang chủ và breakpoint; không nối chồng stylesheet mỗi lần chỉnh.
