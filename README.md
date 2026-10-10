# HSK 1–6

App từ vựng: thẻ học, tìm kiếm, kiểm tra tổng hợp, học trong ngữ cảnh và lịch ôn SRS.

Mở index.html qua GitHub Pages hoặc rawcdn.githack.com. Các file JS, CSS và dữ liệu .js.gz nằm cùng thư mục với index.html; tải đủ tất cả file. Trình duyệt tự tải dữ liệu nén, hoặc dùng bản JS dự phòng. Không cần build.

Chưa đăng nhập: tiến độ và lịch ôn lưu trên trình duyệt. Đăng nhập bằng email/mật khẩu: tiến độ từng từ, lịch SRS, lỗi sai, thống kê học và tùy chọn ghi nhớ đồng bộ theo tài khoản; bản offline được giữ trên thiết bị và tự gửi khi có mạng. Nhắc ôn khi mở app; thông báo khi đóng app cần kết nối OneSignal và bật quyền.

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

## Tài khoản / Firebase

Menu ☰ → Đăng nhập / Tạo tài khoản. Firebase Authentication quản lý mật khẩu; mã app không lưu mật khẩu. Cùng tài khoản dùng được trên nhiều thiết bị. Tài khoản mới đầu tiên trên thiết bị nhận tiến độ cũ khi tài khoản chưa có dữ liệu. Nút Nhập tiến độ cũ chỉ bổ sung các mục chưa có. Thay đổi từ thiết bị khác hiện nút Áp dụng tiến độ mới để không ngắt câu đang học. Đăng xuất giữ riêng bản lưu từng tài khoản và khôi phục tiến độ khách.

Cấu hình công khai trong account-config.json; không thêm khóa quản trị hoặc service account. Firestore rules ở firestore.rules đã triển khai cho đường dẫn users/{uid}/items/{itemId}, chỉ UID tương ứng đọc/ghi được. Project hsk-flashcards-44631 dùng Spark; không bật billing. Một bản ghi đồng bộ cho mỗi từ/mục thay đổi, giao dịch kiểm tra phiên bản để tránh ghi đè tiến độ mới hơn; xóa được biểu diễn bằng tombstone.

Đăng nhập, tạo tài khoản, đặt lại mật khẩu và đồng bộ cần mạng. Học offline vẫn lưu vào hàng đợi trên thiết bị. Đồng bộ tiến độ không đồng bộ quyền thông báo của iPhone; quyền thông báo vẫn theo thiết bị. Không xóa dữ liệu trình duyệt trước khi thay đổi offline đã đồng bộ.

## Triển khai bản cập nhật offline

Sau mỗi thay đổi app, tăng phiên bản và tạo lại metadata bằng `python build-version.py --version hsk-offline-YYYYMMDD-N`. Upload các file đã đổi cùng offline.js, offline-worker.js, OneSignalSDKWorker.js và app-version.json lên cùng một commit. Giữ đường dẫn và scope cũ. Metadata luôn tải từ mạng; file dữ liệu không thay đổi được xác minh SHA-256 và dùng lại từ cache cũ. Bản mới chỉ sẵn sàng khi đủ mọi file đúng checksum. Nếu tải lỗi, cache cũ và localStorage được giữ. Nút kiểm tra báo rõ tiến độ/lỗi và không bị khóa trong lúc chờ; áp dụng bản mới có thời hạn chờ và cách thử lại.
