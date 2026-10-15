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

## Nghe phát âm

Nút loa trên hai mặt thẻ từ vựng và thẻ từ trong bài học đọc từ bằng giọng Mandarin của thiết bị. Bài đọc / hội thoại có loa cho từng câu và nút nghe toàn nội dung; bấm lại để dừng. Các đoạn dài chia thành lượt đọc ngắn, chỉ đọc phần chữ Trung (không đọc nhãn vai A/B, pinyin hoặc bản dịch). Đổi thẻ hoặc chuyển phần học sẽ dừng phát âm. Không cần API key; offline phụ thuộc giọng tiếng Trung đã cài trên thiết bị. App thông báo nếu trình duyệt không hỗ trợ hoặc chưa có giọng Mandarin. Giọng tổng hợp không phải bản thu âm giáo trình; từ đa âm có thể được thiết bị đọc theo cách đọc mặc định.

Kiểm tra: `node --test server/speech.test.mjs`; `NODE_PATH=PATH_TO_JSDOM node tools/check-speech-dom.cjs`. DOM test dùng speech engine giả lập, chưa kiểm chứng âm thanh thực trên iPhone/Windows.

## Giao diện Studio · 13/10/2026

Sidebar desktop và điều hướng mobile tổ chức thành Tổng quan, Bài học, Luyện tập, Ôn tập, Tra cứu và Tài khoản. Các màn cũ, ID điều khiển, dữ liệu và script học/AI/tài khoản vẫn được giữ. Dịch câu/OCR có tab ở Tra cứu; quản trị nằm trong menu và trang tài khoản nếu được cấp quyền; bài học giữ sáu phần và hỏi đáp AI.

`studio-layout.css` áp hệ màu, icon và phân cấp chữ theo thiết kế đã chốt. `studio.js` chỉ nối các điểm điều hướng mới với nút/handler có sẵn, đọc tiến độ và trình bày thống kê. Cấp đang theo học là mục tiêu được chọn, không phải kết quả đánh giá năng lực. Tiến độ từ vựng = số mục đã thuộc / số mục ở cấp đó trong app.

Chuỗi ngày và giờ học được ghi từ bản này trên thiết bị, khi tương tác làm thay đổi tiến độ/lịch sử học thật. Nhật ký dùng khóa riêng `hsk-studio-activity-v1:<uid hoặc guest>`; không sửa khóa học cũ và chưa đồng bộ nhật ký này lên cloud. Dữ liệu thiếu hiển thị trạng thái chưa đủ dữ liệu. Bộ cập nhật gốc giữ quyền tải/cài đặt, nút Cập nhật bị khóa đến khi bản mới tải xong và sẵn sàng áp dụng.

Kiểm tra: `node --test server/*.test.mjs`; các script DOM `check-speech-dom.cjs`, `check-reading-dom.cjs`, `check-studio-dom.cjs`; browser desktop/mobile `check-studio-ui.cjs` (Playwright, Chrome). GitHub Actions `Studio layout checks` chạy các kiểm tra này và lưu ảnh nội bộ. Gói iOS sao chép đủ tài nguyên từ manifest, giữ loader native.


## Kế hoạch học theo mục tiêu

`planner-core.js` tính ba nhịp học theo số từ chưa thuộc đến cấp mục tiêu, nền tảng tự khai báo, số ngày học và giới hạn phút/ngày. Không cam kết đạt chứng chỉ; chưa có đánh giá đầu vào nghe/đọc toàn diện. `planner.js` lưu kế hoạch và nhật ký riêng trong `hsk-study-plan-v1:<uid hoặc guest>`; chưa đồng bộ cloud. Kế hoạch không ghi đè tiến độ từ, bài học hay SRS. Nhiệm vụ mở handler học thật, ưu tiên từ chưa học, SRS đến hạn trong phạm vi mục tiêu, bài tiếp theo và bài kiểm tra.

Thời gian chỉ ghi khi trang hiện, có focus và có thao tác học gần đây; không tính thời gian tab chạy nền. Tăng tốc cần ít nhất 7 ngày, vượt tiến độ, đủ bài kiểm tra đúng và lần nhớ lại cách ngày. Không dùng đánh dấu Đã thuộc đơn thuần làm chứng cứ nhớ lâu. Checkbox AI cho phép gửi thống kê số tổng hợp (không email, từ vựng, bài viết hay token trong nội dung) đến `/study-plan-review`, dùng cơ chế Firebase/Gemini hiện có. Tăng tốc tối đa khoảng 10% mỗi lần, trong giới hạn thời gian; có hoàn tác. Chậm tiến độ chỉ đề xuất giãn hạn hoặc học bù; luôn chờ người học chọn. Lỗi mạng, auth hay AI không đổi lịch.

Endpoint mới cần triển khai Worker từ `server/wrangler.jsonc` sau khi kiểm tra; bundle đã đồng bộ bằng `node tools/build-worker-bundle.cjs`. Giữ nguyên secrets và model hiện có. Nếu Worker chưa nâng cấp, UI báo rõ dịch vụ tinh chỉnh chưa triển khai và vẫn giữ kế hoạch local. Kiểm tra: `node --test server/planner.test.mjs`, `node tools/check-planner-dom.cjs` và browser `check-studio-ui.cjs`.

## Sổ từ vựng cá nhân · 14/10/2026

Mở Sổ từ vựng từ sidebar hoặc lối tắt Tổng quan trên điện thoại. Thêm chữ Trung và nghĩa tiếng Việt, pinyin/ví dụ/ghi chú tùy chọn; tìm, sửa và xóa từng từ. Nút Lưu vào sổ ở kết quả HSK và từ điển mở điền sẵn biểu mẫu để kiểm tra trước khi lưu. Không lưu nghĩa tiếng Anh làm nghĩa Việt. Từ trùng chữ và pinyin được báo để sửa mục cũ.

Khóa riêng `hsk-vocabulary-notebook-v1` được ánh xạ thành `notebook:<uuid>` trong hàng đợi tài khoản hiện có; giữ nguyên khóa tiến độ/SRS. Xóa dùng tombstone và hợp nhất theo phiên bản từng mục. Không cần đổi Firestore rules hiện tại. Khi có dữ liệu từ thiết bị khác, dùng Tài khoản → Áp dụng như tiến độ học. Sao lưu tài khoản bao gồm sổ. Chưa đăng nhập lưu theo khách; đăng nhập/đăng xuất dùng cơ chế tách dữ liệu hiện có.

Kiểm tra: `node --test server/notebook.test.mjs`, `NODE_PATH=/tmp/hsk-tests/node_modules node tools/check-notebook-dom.cjs`, cùng kiểm tra hồi quy Studio/tra cứu/bài đọc/phát âm.

## Đặt tên bản cập nhật

Tên hiển thị dùng `Bản 2.01 (Nội dung cập nhật)`, tăng lần lượt 2.02, 2.03… khi phát hành. Tạo manifest bằng `python3 build-version.py --version hsk-offline-r2-02 --release 2.02 --note "Nội dung cập nhật"`. Khóa phiên bản nội bộ vẫn dùng cho cache/kiểm tra hash; không đổi cơ chế cập nhật. Chạy lại không tham số sẽ giữ tên phát hành hiện tại. Tên này dùng ở Tài khoản, trạng thái cập nhật và thông báo điện thoại.

## Bản 2.02 — Nút đồng bộ màu và kế hoạch học theo tài khoản

Kiểm tra phát hành: 72 unit tests, hồi quy DOM/account, giao diện và tương phản trên trình duyệt, thao tác thanh điều hướng di động đều đạt.

Nút mới tự nhận nền trắng (bề mặt tối khi dark mode), bấm/chọn chuyển tím. Dùng biến trong `ui-buttons.css`; không đặt lại màu xanh hoặc ghi đè màu cố định ở module mới. Giữ màu đúng/sai cho phản hồi học tập. Checkbox/radio dùng accent tím. Browser CI quét màu xanh còn sót trên các nút đang hiện và kiểm tra tương phản.

Cấu hình mục tiêu chuyển về Tổng quan, mục Mục tiêu & lịch học; Tài khoản giữ thống kê và đồng bộ. `study-sync-core.js`/`study-sync.js` lưu cấu hình kế hoạch, nhật ký theo ngày/phiên và hoạt động vào `hsk-study-sync-v1`, đồng bộ qua các mục `study-*` của cơ chế phiên bản hiện có. Danh sách từ dài được chia nhỏ trước khi gửi. Streak được tính lại từ hợp ngày học, không đồng bộ một con số streak. Dữ liệu cũ theo UID/guest được nhập bổ sung, không xóa bản cũ; baseline cũ trùng/lồng nhau lấy mức lớn nhất để hạn chế cộng trùng, không thể dựng lại thời gian sự kiện vốn chưa được ghi. Khách vẫn lưu trên máy; thay đổi từ thiết bị khác vẫn chờ người dùng Áp dụng tại Tài khoản. Không cần thay Firestore rules hiện có của repo. Kiểm tra hợp nhất và giao dịch dùng Firebase giả lập, không phải xác nhận trực tiếp tất cả phiên đăng nhập thực.

## Bản 2.03 — Luồng học gọn trên điện thoại

Bài học có bốn phần: Từ vựng (kèm tổng quan), Đọc & hội thoại (hội thoại trước bài đọc), Ngữ pháp, Luyện tập. Nút Tiếp theo/Quay lại ở cuối mỗi phần chuyển nội dung và đưa vị trí đọc về đầu phần mới. Thanh chọn phần hiển thị 2×2 trên điện thoại, bốn cột trên desktop. Không thay đổi dữ liệu, cách chấm điểm, SRS hay điều kiện đạt 100%.

## Bản 2.04 — Tra chữ viết tay ngoài HSK

Chọn một chữ Hán sẽ điền chữ đó vào ô tìm kiếm. Nếu bộ lọc HSK hiện tại có từ phù hợp, tiếp tục tra HSK; nếu không, tự chuyển sang Tra cứu thường mà không đổi cấp HSK toàn app. Nhận dạng nâng cao được phép gợi ý các chữ Hán có trong mô hình ngoài kho HSK; bộ nhận dạng cơ bản và học mẫu nét vẫn giữ phạm vi dữ liệu hiện có. Chữ ngoài phạm vi học mẫu vẫn được tra bình thường, không báo đã học mẫu và không tự thêm vào SRS.

## Bản 2.05 — Bộ giao diện dùng chung

Toàn bộ biến giao diện được định nghĩa tại đầu `style.css`: một khối `:root` và một khối `html[data-theme="dark"]`. CSS module không khai báo lại màu, bo góc hay đổ bóng. Màu thanh trình duyệt cũng đọc `--paper` thay vì giữ một bảng màu JS riêng.

Module mới dùng vai trò: `--paper` (nền trang), `--surface` (bề mặt), `--ink`/`--sub`/`--muted` (chữ), `--line`/`--line-dark` (đường phân cách), `--accent`/`--accent-dark`/`--accent-light`, `--green`/`--red` (phản hồi đúng/sai). Nút dùng chính sách `ui-buttons.css` và nhóm `--button-*`; không tự đặt màu nút. Bo góc chuẩn: `--radius-btn`, `--radius-card`, `--radius-dialog`, `--radius-pill`, `--radius-round`; bóng thẻ dùng `--shadow`. Các biến radius cỡ riêng và shadow recipe giữ nguyên hình dạng cũ.

Nhóm `--palette-*` và `--legacy-*` là bảng màu nền cố định để giữ nguyên các sắc độ đã có; module mới ưu tiên vai trò theo theme ở trên, không tạo thêm màu legacy tùy ý. Kiểm tra `node tools/check-design-tokens.cjs` ngăn CSS module thêm mã màu, bo góc/đổ bóng trực tiếp hoặc khai báo trùng biến theme. Mọi thay đổi giao diện phải qua kiểm tra trình duyệt sáng/tối và độ tương phản.
