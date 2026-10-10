# HSK iOS · SideStore miễn phí

Bản iOS giữ giao diện và dữ liệu HSK 1–6, chạy offline, thêm Simple Test Đúng/Sai ngay trên thông báo. Nhấn giữ thông báo để hiện nút. Câu trả lời được xử lý trong nền; đúng tăng lịch SRS, sai ôn lại sau 10 phút. Lỗi cũng được ghi vào phân tích học hiện có.

## File cài

Vào Actions → Build iOS SideStore → lượt build xanh → Artifacts → HSK-SideStore-IPA. Giải nén file tải xuống để lấy `HSK-SideStore.ipa`. Đây là IPA chưa ký; SideStore ký bằng Apple ID của bạn trên thiết bị. Không nhập tài khoản Apple vào GitHub và không cần tài khoản Developer trả phí.

## Cài SideStore từ Windows

Làm theo hướng dẫn chính thức hiện hành: https://docs.sidestore.io/docs/installation/install . Dùng Windows để cài SideStore lần đầu bằng iloader, cài LocalDevVPN theo hướng dẫn, bật Developer Mode và tin cậy ứng dụng. Tự nhập Apple ID trong công cụ chính thức trên máy bạn; không gửi mật khẩu qua chat.

Sau khi SideStore được cài, bật kết nối LocalDevVPN, mở SideStore, đăng nhập và refresh SideStore trước. Chuyển IPA vào ứng dụng Tệp trên iPhone, chọn My Apps → dấu + → chọn `HSK-SideStore.ipa`. HSK phải là một app được cài trực tiếp, không chạy bên trong LiveContainer (để có thông báo và lưu trữ riêng).

Chữ ký miễn phí có hạn 7 ngày. Refresh trên iPhone trước hạn; cần Wi-Fi và kết nối cục bộ phù hợp. Tự gia hạn nền không được bảo đảm tuyệt đối. Sau cập nhật/khôi phục iPhone, pairing file có thể phải làm lại bằng máy Windows. Tài khoản miễn phí giới hạn số app. Không cần jailbreak.

## Mang tiến độ cũ sang app

Mở https://trungxemcode.github.io/hsk/ios-transfer.html bằng đúng trình duyệt/tên miền trước đây đã học. Nếu học trên rawcdn, cần mở trang chuyển tương ứng trên cùng origin rawcdn; Pages không đọc được bộ nhớ rawcdn. Tải `hsk-progress.json`, lưu vào Tệp. Trong app iOS: Ôn tập SRS → Nhập tiến độ từ file → chọn file → xác nhận thay tiến độ trong app. Website giữ nguyên. Xuất bản sao lưu từ app trước khi gỡ/cài lại; xóa app có thể xóa dữ liệu.

## Thử nút trả lời trên màn hình khóa

1. Học hoặc đánh dấu một từ. Vào Ôn tập SRS → Simple Test trên màn hình khóa.
2. Bật Simple Test, cho phép thông báo. Chọn giờ, HSK và số câu tối đa/ngày (5–30).
3. Bấm Thử thông báo sau 10 giây, khóa iPhone. Nhấn giữ thông báo → Đúng hoặc Sai.
4. Xem thông báo kết quả và lịch sử trong app; kiểm tra thời hạn SRS thay đổi.
5. Nếu bật gửi tiếp và còn từ đến hạn, câu tiếp theo được hẹn sau 3 giây, trong hạn mức ngày. Không gửi vô hạn. Câu thử cũng ghi nhận kết quả học.

Lịch tự động được chuẩn bị cho 7 ngày tới, mỗi ngày bắt đầu bằng một câu đến hạn. Mở app hoặc trả lời sẽ làm mới lịch. Không có máy chủ push/APNs cho bản này. iOS quản lý thời gian giao, chế độ Tập trung, bản xem trước và thao tác khi khóa; cần thử trên iPhone thật, không bảo đảm bỏ qua mọi yêu cầu mở khóa của hệ thống. Chỉ ôn từ có record học/đánh dấu, không tự đưa từ mới vào thông báo.

## Build lại

Mã nguồn nằm trong `ios-source.zip` (giải nén ra `ios/`). Workflow `.github/workflows/ios-build.yml` chuẩn bị web từ các file hiện có trong repo, kiểm tra logic SRS rồi build bằng Xcode trên macOS của GitHub. Giữ nguyên các file website ở thư mục gốc. Khi cập nhật app iOS, cài IPA mới đè bằng cùng Apple ID/Bundle ID để giữ dữ liệu; luôn sao lưu trước.

Kiểm tra biên dịch và logic tự động không thay thế kiểm tra thông báo trên thiết bị thật. Không có chứng nhận rằng toàn bộ dữ liệu từ điển hoàn toàn không có sai sót; đáp án sử dụng nghĩa và bộ lọc đáp án sai của app hiện có.
