# Học nét viết cá nhân — 12/10/2026

## Cơ chế hiện tại

Nhận dạng bitmap 32×32 độc lập thứ tự/chiều nét. Mẫu chỉ lưu sau xác nhận của người dùng, giữ riêng từng tài khoản và đồng bộ như trước; không tự bật góp mẫu.

Thay giới hạn cũ (ba mẫu, tác động tối đa 10%) bằng truy hồi theo khoảng cách hình dạng: một mẫu có tác dụng khi điểm khoảng cách <=0,35; tổng điểm còn 35% điểm nền cộng khoảng cách mẫu. Mở rộng sang nét gần (khoảng cách <=3) cần hai bitmap khác nhau cùng nhãn gần nhau, tổng điểm còn 15% điểm nền cộng khoảng cách mẫu. Các ngưỡng là heuristic trong không gian điểm hiện có, không phải xác suất hay độ chính xác đã hiệu chuẩn. Luôn chọn min với điểm nền; mẫu xa không có ảnh hưởng. Mẫu trùng không tăng số bằng chứng; bitmap trùng mang nhãn mâu thuẫn không tham gia điểm cá nhân. Không lấy trung vị của các kiểu viết khác nhau.

Tách gói Tomoe khỏi mẫu cộng đồng đã duyệt. Lưu và đồng bộ mẫu cá nhân, xóa mẫu, cơ chế AI và Worker máy chủ giữ nguyên.

## Giới hạn

Chưa học chéo thành phần: không có cây cấu tạo và căn chỉnh nét đủ tin cậy. Không huấn luyện mô hình. Kết quả thử với 40 chữ hình học và các biến dạng không đại diện chữ viết thật. Xem báo cáo `handwriting-improvement-summary.json`.
