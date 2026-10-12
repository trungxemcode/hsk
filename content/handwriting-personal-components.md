# Học nét viết cá nhân: trạng thái triển khai

## Đã triển khai

- Nhận dạng so bitmap hình học 32 x 32; thứ tự và chiều nét không tham gia điểm nền.
- Mẫu chỉ được lưu sau khi người dùng chọn hoặc tự xác nhận nhãn chữ. AI chưa xác nhận không được ghi vào hồ sơ.
- Mẫu cá nhân vẫn tách theo tài khoản/thiết bị theo cơ chế hiện có và không tự bật chia sẻ.
- Bộ nhận dạng giữ nhiều biến thể toàn chữ. Một mẫu cá nhân không đổi xếp hạng; cần ít nhất ba mẫu cùng nhãn có độ lệch điểm nhất quán. Tác động tối đa được giới hạn ở 10% điểm nền.
- Thêm kiểm tra thứ tự nét đảo, xen kẽ, đổi chiều từng nét, chia nét rồi nối lại trên 40 hình thử độc lập.

## Chưa học thành phần

Gói `handwriting-data.json` chỉ chứa một bộ tọa độ nét chuẩn cho mỗi chữ HSK. Nó không chứa cây cấu tạo chữ, ánh xạ nét sang bộ phận, hoặc mẫu thành phần có thể dùng để khẳng định nét nào trong hình người dùng thuộc về 亻. Xác nhận một nhãn toàn chữ cũng không xác nhận cách phân vùng thành phần. Vì vậy phiên bản này không tạo hồ sơ 亻 hoặc thành phần suy đoán từ vùng trái/phải cố định.

Muốn bật học chéo thành phần cần tích hợp nguồn cấu tạo chữ có giấy phép phù hợp, giữ quan hệ thành phần theo vị trí, rồi căn chỉnh ảnh viết với mẫu cấu tạo bằng phép tách có ngưỡng tin cậy. Phải loại mẫu khỏi bước học thành phần khi có nét nối giữa vùng, thành phần viết xen kẽ hoặc phân vùng mơ hồ. Mẫu toàn chữ đã xác nhận vẫn được giữ và nhận dạng offline tiếp tục hoạt động.

Không có huấn luyện mô hình trong thay đổi này. Mẫu cá nhân chỉ là biến thể so khớp. Không có tập chữ viết tay nhiều người độc lập để chứng minh cải thiện top-1/top-5; benchmark hình học hiện có là kiểm tra hồi quy, không đại diện người dùng.
