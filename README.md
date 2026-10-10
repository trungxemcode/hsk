# HSK 1–6

App từ vựng: thẻ học, tìm kiếm, kiểm tra tổng hợp, học trong ngữ cảnh và lịch ôn SRS.

Mở index.html qua GitHub Pages hoặc rawcdn.githack.com. Các file JS, CSS và dữ liệu .js.gz nằm cùng thư mục với index.html; tải đủ tất cả file. Trình duyệt tự tải dữ liệu nén, hoặc dùng bản JS dự phòng. Không cần build.

Tiến độ và lịch ôn được lưu trong cùng trình duyệt theo tên miền. Nhắc ôn khi mở app; thông báo khi đóng app cần kết nối OneSignal và bật quyền.

## Thông báo iPhone / OneSignal

Mở Safari, thêm app vào màn hình chính (iOS 16.4+), mở biểu tượng HSK,
vào Ôn tập SRS → Nhắc ôn trên điện thoại. Chọn giờ Việt Nam và bật quyền.
Hiện cấu hình chưa kết nối tài khoản; app hiển thị đúng trạng thái chờ.

Thiết lập dịch vụ: tạo Web Push app trong OneSignal cho chính origin
https://trungxemcode.github.io, service worker đặt tại /hsk/OneSignalSDKWorker.js,
scope /hsk/. Ghi App ID công khai vào push-config.json. API key chỉ đặt trong
GitHub Actions Secrets ONESIGNAL_REST_API_KEY, cùng ONESIGNAL_APP_ID.
Sau khi kiểm tra lịch SRS reminders chạy thành công, đặt schedulerEnabled=true.
Không đưa API key vào mã nguồn hoặc gửi qua chat.

Workflow .github/workflows/srs-reminders.yml kiểm tra mỗi giờ ở phút 17;
chỉ chọn thiết bị đã bật, đúng giờ nhắc Việt Nam và có hạn ôn đã tới.
Khóa chống gửi trùng cho cùng giờ; chưa cấu hình secrets thì bỏ qua an toàn.
Mở app/học lại cập nhật ba tag lịch nhắc; lịch sử trả lời không được gửi.
Giờ gửi có thể trễ do GitHub Actions. Với repo công khai, GitHub có thể tự
vô hiệu hóa lịch sau 60 ngày repo không có hoạt động; cần bật lại workflow.
Thông báo cần mạng; không phải báo thức đúng phút. Lịch ôn thuộc thiết bị
đã đăng ký, không tự đồng bộ tiến độ học giữa các thiết bị.
