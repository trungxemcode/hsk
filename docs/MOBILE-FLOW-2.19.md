# Bản 2.19 — Tối ưu luồng học trên mobile

Áp dụng có chọn lọc bản tham khảo vào app hiện có. Giữ Trang chủ đã thu gọn, thanh dưới gồm Trang chủ / Bài học / Luyện & Ôn / Sổ từ vựng / Tra cứu. Không tách Luyện và Ôn thành hai mục hoặc thay thuật toán học.

| Khu vực | Bố trí và thao tác | Liên kết hoạt động |
| --- | --- | --- |
| Bài học | Tiến độ và bằng chứng trước dải bốn bước; điều kiện chi tiết thu gọn. Dải tab cuộn ngang, không kéo cả trang khi chọn. CTA cuối phần giữ nguyên. | Đọc từ `HSKLessonMastery`; điểm và điều kiện hoàn thành không đổi. |
| Tra từ trong bài | Chạm từ đã nhận diện trong nội dung để mở hộp nghĩa/pinyin/loa/lưu ngay cạnh từ. Cuộn hoặc chạm ngoài đóng hộp. | Loa và nút Lưu dùng module gốc; lưu mở Save Sheet, không điều hướng khỏi bài và không tính hoàn thành. Chọn đoạn chữ để hỏi AI vẫn giữ nguyên. |
| Thẻ và SRS | Trong phiên học ẩn header/dock, hiện tiến trình và nút thoát. Cụm đánh giá ở đáy. | Nút đánh giá thẻ gọi handler gốc; SRS dùng chính nút reveal/rating đang có. Xem đáp án chưa ghi tiến độ. |
| Trắc nghiệm / dạng đề | Nút Kiểm tra hoặc Câu tiếp nằm cố định ở đáy, nội dung cuộn phía trên. Giải thích mở sheet sẵn có. | Giữ nguyên các node/ID và handler; không đưa nút động ra khỏi vùng render của đề. |
| Tra cứu | Ô gõ, Vẽ chữ và Ảnh ở cùng cụm; Tìm kiếm ở hàng dưới. | Ảnh mở đúng bộ chọn tệp OCR qua thao tác chủ động. Không tự bật bàn phím hay tải ảnh. |
| Sổ từ vựng | Thêm từ gọn; trò chơi và tìm kiếm trước danh sách. Mỗi từ có chữ Hán/pinyin hàng đầu, nghĩa hàng sau. | Giữ nguyên phiên ôn sổ, import/export và Save Sheet. |
| Tài khoản | Ba số liệu thật; trạng thái đồng bộ luôn hiện; hồ sơ điểm yếu; nhóm Tài khoản & đồng bộ, Thống kê chi tiết, Cài đặt hệ thống, Dữ liệu & quyền riêng tư. | Số từ thuộc tính theo khóa từ duy nhất; độ chính xác chỉ ghi “Đúng khi ôn từ”. Luyện nhóm lỗi gọi nút luyện thật của coach; hồ sơ chi tiết dùng cả panel gốc rồi trả lại khi đóng. |
| Desktop | Trả các điều khiển về vị trí gốc; điều kiện tiến độ mở đủ. | Cùng một nguồn dữ liệu và handler. |

## Điều kiện và giới hạn

- SRS hiển thị số từ đủ ba lượt hợp lệ. Không gọi là “ngày 1/3” vì mỗi từ có lịch riêng. Chi tiết giải thích quy tắc cách nhau ít nhất 24 giờ.
- Kế hoạch, đồng bộ, tài khoản, đánh giá AI, thông báo cập nhật và dữ liệu bài học giữ nguyên. Không tạo phần trăm hoặc kết quả giả để lấp giao diện.
- Phần mới dùng design tokens sáng/tối, vùng chạm tối thiểu 44px, chữ và nút được phép xuống dòng, không khóa cuộn trang. Hiệu ứng tím/bo góc dùng hệ tương tác chung; không thêm lớp ripple riêng.
- `tools/check-mobile-flow-ui.cjs` kiểm tra thao tác thật, lưu tại chỗ, profile lỗi, vị trí nút khi cuộn, SRS, sáng/tối, mobile/desktop. `check-responsive-goal-ui.cjs` mở nhóm cài đặt trước khi thao tác và kiểm tra chữ 100/150/200%.
- Kiểm tra trình duyệt dùng transport AI/Firebase giả lập, không khẳng định đã kiểm tra máy chủ thật hay mọi phiên bản Safari iOS.
