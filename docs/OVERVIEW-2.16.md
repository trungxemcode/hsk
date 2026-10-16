# Bản 2.16 — Tổng quan gọn trên điện thoại

Một thẻ học chính: phút học lấy từ nhật ký planner UTC+7, bài tiếp theo lấy từ nhiệm vụ của planner. Nút tiếp tục gọi handler gốc; không suy diễn phần trăm hoàn thành hay tạo tiến độ giả. Danh sách bốn nhiệm vụ mở dưới thẻ chính. Thiết lập vẫn ở sheet mục tiêu; đánh giá trình độ ở mục mở rộng khi chưa có kế hoạch.

Lưới 2×2: Ôn SRS (số đến hạn từ thống kê hiện có), Trắc nghiệm, Thẻ từ (tiến độ cấp mục tiêu, có nhãn cấp rõ), Sổ từ vựng (số mục hợp lệ). Các đường đi vẫn dùng điều hướng gốc. Bộ lọc HSK vẫn độc lập với mục tiêu học.

Từ vựng hôm nay lấy trong kho thuộc bộ lọc đang chọn, thay đổi theo ngày hoặc nút Đổi từ. Chạm dòng từ để mở ví dụ có sẵn, học đúng từ hoặc lưu qua Save Sheet hiện có. Nghe dùng HSKSpeech. Không tự ghi SRS/đã thuộc khi chỉ xem từ.

Tra cứu nhanh thu vào disclosure bên dưới. Dock Luyện & Ôn / Sổ từ vựng giữ nguyên. Chuỗi ngày là dữ liệu thống kê thật, mở tài khoản khi chạm. Menu mở drawer gốc; sáng/tối ở Tài khoản. Màn 320px ẩn tên trang bằng kỹ thuật accessible để ưu tiên vùng chạm 44px.

Thông báo cập nhật gốc được đặt vào Home dưới dạng banner khi updater thực sự phát hiện phiên bản mới. Để sau và Cập nhật gọi handler cũ; trang khác vẫn dùng thông báo toàn cục. Đăng ký push ở Tài khoản.

Giao diện dùng chiều cao nội dung, không khóa một màn hình. Mặc định hướng tới khoảng 1–1,2 màn hình trên điện thoại phổ biến; chữ lớn, nhiệm vụ mở hoặc thông báo mới được phép cuộn thêm. Không cắt chữ, khóa cuộn hoặc thay schema dữ liệu. Nút chính có phản hồi nhấn 100ms, tôn trọng reduced motion.

`check-home-overview-ui.cjs` kiểm tra 320/375/390/430/1440px, hai theme, badges thật, lưu từ không tăng mastery, nhiệm vụ mở theo yêu cầu và tiếp tục bài thật. Các bộ kiểm tra responsive và chức năng cũ chạy bổ sung. AI/account transport trong browser tests được chặn hoặc mô phỏng; đây không thay thế kiểm thử WebView/iPhone thực tế.
