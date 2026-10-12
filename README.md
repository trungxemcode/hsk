# HSK 1–6

## Nội dung bổ sung ngày 11/10/2026

Đợt này thêm 83 mục từ theo bài học (76 mục đối chiếu nghĩa/phiên âm với Hanzii, 6 tên riêng và 1 mẫu ngữ pháp chưa đối chiếu mục từ), cùng 249 câu ví dụ tự biên soạn. Lấp đủ các mục chưa có thẻ của danh sách giáo trình HSK 1–2; HSK 3–6 bổ sung chọn lọc, vẫn còn các mục thiếu. Cấp HSK của thẻ bổ sung là cấp bài học đầu tiên sử dụng, không khẳng định phân loại trong danh sách từ thi chính thức. Giữ nguyên thẻ và khóa tiến độ cũ..

Bài 3, 6, 9 và 12 ở mỗi cấp có bài đọc dài mới, 3–5 đoạn song ngữ/pinyin, một hội thoại 8 lượt và 3 câu đọc hiểu có giải thích. Tổng cộng 24 bài đọc, 24 hội thoại và 72 câu hỏi mới. Độ dài: HSK1 132–156 chữ Hán, HSK2 255–269, HSK3 317–338, HSK4 394–424, HSK5 511–575, HSK6 716–798. Đây là nội dung tự biên soạn theo chủ đề, không sao chép bài khóa hoặc từ điển. Đoạn ngắn cũ được giữ trong phần khởi động; các bài khác vẫn dùng nội dung ngắn trước đó.

Nguồn biên tập và báo cáo phạm vi nằm trong `content/`. Chạy `python tools/expand-vocabulary.py` và `python tools/expand-reading.py` để tái tạo dữ liệu (cần Node và pypinyin); các bảng đọc theo ngữ cảnh nằm trong `tools/content_pinyin.py`. Chạy `python build-version.py --version hsk-offline-content-depth-20261011` sau thay đổi để cập nhật các hash tải offline, rồi `node tools/check-content.cjs`. Kiểm tra UI: chạy HTTP server cổng 8765 và `node tools/check-reading-ui.cjs` (cần Playwright/Chromium). Pinyin là dữ liệu được hỗ trợ sinh và sửa theo ngữ cảnh; cần tiếp tục rà soát biên tập trước khi coi là tài liệu chuẩn xuất bản.

Đã kiểm tra dữ liệu, khóa học cũ, các file nén/hash offline và chạy app trong DOM qua `tools/check-reading-dom.cjs`: mở đủ 24 bài đọc, kiểm tra thẻ mới/cách viết tương đương, nút ẩn/hiện, 8 lượt thoại và chấm/lưu 6 câu của một bài mở rộng. Chạy kiểm tra DOM với `NODE_PATH` trỏ tới cài đặt jsdom. Môi trường hiện tại chưa có Chromium và tải trình duyệt không thành công, nên kiểm tra DOM không thay thế kiểm tra bố cục trực quan trong trình duyệt.

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

Cấu hình công khai trong account-config.json; không thêm khóa quản trị hoặc service account. Firestore rules ở firestore.rules cần được triển khai cho `users/{uid}/items/{itemId}` và `users/{uid}/handwritingSamples/{sampleId}`; chỉ UID tương ứng đọc/ghi được. Project hsk-flashcards-44631 dùng Spark; không bật billing. Một bản ghi đồng bộ cho mỗi từ/mục thay đổi, giao dịch kiểm tra phiên bản để tránh ghi đè tiến độ mới hơn; xóa được biểu diễn bằng tombstone.

Đăng nhập, tạo tài khoản, đặt lại mật khẩu và đồng bộ cần mạng. Học offline vẫn lưu vào hàng đợi trên thiết bị. Đồng bộ tiến độ không đồng bộ quyền thông báo của iPhone; quyền thông báo vẫn theo thiết bị. Không xóa dữ liệu trình duyệt trước khi thay đổi offline đã đồng bộ.

## Triển khai bản cập nhật offline

Sau mỗi thay đổi app, tăng phiên bản và tạo lại metadata bằng `python build-version.py --version hsk-offline-YYYYMMDD-N`. Upload các file đã đổi cùng offline.js, offline-worker.js, OneSignalSDKWorker.js và app-version.json lên cùng một commit. Giữ đường dẫn và scope cũ. Metadata luôn tải từ mạng; file dữ liệu không thay đổi được xác minh SHA-256 và dùng lại từ cache cũ. Bản mới chỉ sẵn sàng khi đủ mọi file đúng checksum. Nếu tải lỗi, cache cũ và localStorage được giữ. Nút kiểm tra báo rõ tiến độ/lỗi và không bị khóa trong lúc chờ; áp dụng bản mới có thời hạn chờ và cách thử lại.

## Bài học Giáo trình chuẩn HSK
Mục Công cụ → Bài học giáo trình HSK. Theo bộ HSK Standard Course 1–6 (9 quyển): 15/15/20/20/36/40 bài; HSK 4: A1–10,B11–20; HSK 5: A1–18,B19–36; HSK 6: A1–20,B21–40. `lessons-data.json` chứa mục lục và vị trí từ theo bài; `lessons.js` dùng cầu nối `HSKLessons` của app để học và ôn bằng dữ liệu đã có. Không gọi AI để tạo bài học.
Mỗi bài có thẻ từ, nghĩa/phiên âm/ví dụ hiện có, đánh dấu đã thuộc/chưa thuộc, kiểm tra từ bài (tối đa 20 câu trộn chữ→nghĩa và nghĩa→chữ), ôn SRS từ đến hạn và từ mới, hoàn thành bài và tiếp tục bài học. Hoàn thành bài là đánh dấu thủ công, không chứng nhận thi đỗ.
Tiến độ `hsk-course-lessons-v1` đồng bộ theo mục `lesson:<id>` qua cơ chế tài khoản đang có; không thay đổi quyền Firestore. Bài học và dữ liệu được lưu offline cùng app.
Các mẫu chữ đã xác nhận của bộ nhận dạng cá nhân đồng bộ riêng theo tài khoản trong `users/{uid}/handwritingSamples`. Bản local tiếp tục dùng được offline; khi có mạng app hợp nhất mẫu giữa các thiết bị và chỉ tải mẫu còn thiếu. Việc này không đồng nghĩa góp mẫu cho tập dữ liệu chung; checkbox góp mẫu vẫn là lựa chọn riêng.
Trong bài học, nút chat AI là nút tròn cố định ở góc dưới; có thể chọn một đoạn nội dung để gửi câu hỏi kèm trích đoạn đó. Hỏi đáp cần đăng nhập và cấu hình dịch vụ AI.
Nguồn cấu trúc: BLCUP và mục lục HanziStroke; ánh xạ từ theo bài: joelypoley/hsk_standard_course_vocab cho HSK1–5, Blog Tiếng Trung cho HSK6. Chỉ dùng thông tin từ/bài, không nhập giải thích hoặc đoạn sách của nguồn ngoài. Chuẩn hóa một số lỗi phiên chép (阿→啊 trong HSK3 bài1, 和爱→和蔼, 进来→近来, エ人→工人, 何況→何况, 丟→丢) và biến thể ngoặc khi khớp dữ liệu. Không tuyên bố tất cả ánh xạ đã được đối chiếu trực tiếp với từng trang sách.
Danh sách giáo trình có tên riêng và từ ngoài dữ liệu. Mục chưa khớp hiện riêng trong từng bài, không tính vào thẻ/kiểm tra. Không chứa toàn bộ bài khóa, âm thanh và bài tập nguyên bản của sách.

## Nhận dạng viết tay nâng cao

Trong khung Vẽ chữ, chọn **Tải nhận dạng nâng cao (~28 MB)**. Tải một lần để nhận dạng trên thiết bị bằng PP-OCRv5 / ONNX Runtime Web; không cần API key, không gửi nét vẽ đến máy chủ. Nhận dạng cơ bản tiếp tục dùng khi chưa tải hoặc mô hình gặp lỗi. Safari/iPhone thực tế chưa được kiểm chứng. Xem `content/handwriting-neural-status.md` để biết kết quả và giới hạn.
