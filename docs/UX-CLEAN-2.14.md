# Bản 2.14 — Ưu tiên việc học, giảm nhiễu giao diện

## Thứ tự tác vụ

| Mức | Tác vụ | Cách xuất hiện |
| --- | --- | --- |
| Chính | Bắt đầu/tiếp tục bài học | CTA đầu trang chủ; người mới không bắt buộc đánh giá trước |
| Thường dùng | Tra từ, vẽ chữ, dịch/đọc ảnh | Tra cứu nhanh ở Home; gọi đúng luồng hiện có |
| Theo nhu cầu | Ôn từ đến hạn | Nút có số từ thật khi có lịch đến hạn |
| Chủ động chọn | Thẻ từ, trắc nghiệm | Hai lối luyện ngắn; Luyện & Ôn vẫn giữ mọi phương pháp |
| Hỗ trợ | Học rảnh tay, tìm thẻ, AI phân tích lỗi | Mục có tên rõ, mở khi cần; nội dung/handler gốc giữ nguyên |
| Hệ thống/tham khảo | Cập nhật, số liệu kho, nguồn đối chiếu | Tài khoản, Giới thiệu hoặc nhóm Tham khảo |

## Nguyên tắc nội dung

- Giữ nhãn thao tác, khác biệt HSK/tra thường, hướng dẫn trống, kết quả đúng/sai và trạng thái lỗi.
- Giữ consent, quyền riêng tư, giấy phép, giải thích cách dùng và bằng chứng lỗi. Không dùng CSS ẩn toàn bộ `.hint` hay xóa câu ví dụ.
- Bỏ slogan Home, giảm lối tắt trùng, gộp dòng ghi nguồn vào Tham khảo. Không bỏ attribution/giấy phép khỏi app.
- Không thay dữ liệu học, thuật toán SRS, chấm điểm, cấu hình AI, đồng bộ hay quyền thông báo.
- Các mục phụ có semantic `details/summary`, hỗ trợ bàn phím; đường học/tra chính không đi qua các mục này.

## Kiểm thử

`check-clean-ux-ui.cjs` kiểm tra người mới đi thẳng tới bài học, đánh giá tùy chọn, tìm từ/vẽ chữ từ Home, mở công cụ rảnh tay/AI, nguồn còn truy cập được. Các kiểm tra giao diện cũ được chuyển sang mở đúng nhóm phụ; kiểm tra dữ liệu, SRS, placement và đồng bộ vẫn chạy. `check-responsive-goal-ui.cjs` tiếp tục kiểm tra co giãn chữ và mục tiêu.

Đây là điều chỉnh phân cấp tác vụ, không phải bằng chứng usability đã được xác nhận với người dùng thật. Cần tiếp tục quan sát người dùng trên iPhone/WebView thực tế.
