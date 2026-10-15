# Bản 2.10 — Học rảnh tay với flashcard

Mở Thẻ từ vựng → Học rảnh tay, hoặc Luyện & Ôn → Luyện → Học rảnh tay. Chọn HSK và trạng thái từ bằng bộ lọc cũ, rồi bắt đầu. Phiên dùng 10/20/50 thẻ tính từ thẻ hiện tại, tối đa số từ có trong bộ lọc, không lặp trùng trong một vòng. Mặc định 10 thẻ, nhịp vừa, từ đọc 2 lần, một ví dụ ngắn và hẹn dừng 10 phút. Lặp bộ thẻ là lựa chọn riêng và luôn bị giới hạn bằng hẹn giờ 5/10/20/30 phút.

Luồng mỗi từ: chữ Hán → nghe từ → chờ tự nhớ → lật pinyin/nghĩa → đọc nghĩa Việt → một câu ví dụ Trung/pinyin/Việt có sẵn → chuyển thẻ. Không gọi AI sinh ví dụ. Ưu tiên ví dụ đã đối chiếu trong practice, sau đó ví dụ từ điển hoặc ví dụ gốc có bản dịch; bỏ qua nếu thiếu cặp Trung–Việt hoặc câu quá dài. Nghĩa chính được chọn cho phần đọc rảnh tay, không đọc toàn bộ danh sách từ đồng nghĩa dài.

Nhịp chậm/vừa/nhanh lần lượt có 6/4/2 giây tự nhớ sau khi giọng đọc đã kết thúc; tốc độ đọc Trung .7/.85/1.0. Mặt nghĩa nghỉ ít nhất 5/3/2 giây, tăng theo độ dài chữ Việt. Ví dụ cũng chờ âm thanh kết thúc, rồi dành thời gian đọc thêm. Không có một con số thẻ/phút cố định vì độ dài nội dung và giọng thiết bị khác nhau.

Có Bắt đầu/Tạm dừng/Dừng, thẻ trước/sau và nghe lại thẻ. Tiếp tục bắt đầu lại từ mặt trước của thẻ đang dở, không chạy bù các bộ hẹn giờ đã qua. Đổi bộ lọc/vị trí hay thiết lập thì yêu cầu phiên mới. Đổi màn hình, mở menu, thao tác thẻ thủ công, đổi tài khoản, ẩn app hoặc khóa máy đều tạm dừng/cancel âm thanh. Không tự chạy lại khi trở về app. Khi hoàn thành chỉ báo số thẻ đã phát trọn; không tự đánh dấu thuộc, không tăng mastery, không đổi SRS hoặc tạo bằng chứng trả lời đúng cho AI coach.

Giọng Trung và Việt lấy từ hệ điều hành qua Web Speech, không dùng tiếng Anh thay thế. Thiếu giọng Việt thì vẫn hiện nghĩa, thông báo cần cài giọng Việt; thiếu giọng Trung hoặc phát âm lỗi thì tạm dừng, có thể cài giọng hoặc tắt đọc để chỉ xem. Một số giọng cần mạng. Mỗi phát âm có timeout; promise/abort token ngăn callback cũ lật thẻ hoặc âm thanh chồng nhau. Các timer chỉ tính thời gian đang chạy, không tính lúc tạm dừng.

Tùy chọn giữ sáng chỉ xin Screen Wake Lock trong lúc phát. Luôn nhả khi pause/stop/rời trang; nhả cả khi yêu cầu wake lock hoàn tất trễ sau khi đã dừng. Hệ điều hành, pin yếu, WebView hoặc trình duyệt có thể từ chối/thu hồi. Không cam kết phát nền hay phát khi khóa máy trên iOS: phiên sẽ chủ động tạm dừng. Không có silent audio hay service worker giả để lách hạn chế chạy nền.

`passive-core.js`: cấu hình, snapshot, giọng đọc có abort, state machine. `passive.js`: UI, voice/wake lifecycle, xử lý navigation và owner. `HSKFlashcardBridge` trong app.js chỉ đọc bộ thẻ, hiển thị thẻ và lật; không có phương thức ghi mastery. Thiết lập `hsk-passive-settings-v1:<owner>` lưu cục bộ theo tài khoản/thiết bị, không đưa vào đồng bộ tiến độ vì giọng đọc và khả năng wake lock tùy máy. Không lưu nhật ký nghe hay gửi nội dung sang AI.

Tham khảo: Quizlet auto-cycle/audio — https://help.quizlet.com/hc/en-ca/articles/360030988091-Studying-with-Flashcards ; Web Speech — https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis ; Wake Lock — https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API . Đây là lựa chọn UX của app, không tuyên bố chỉ nghe là đã ghi nhớ từ lâu dài; nên quay lại tự kiểm tra/SRS khi rảnh tay.

Kiểm thử: engine thứ tự mặt/âm thanh/timer, abort callback cũ, hẹn giờ khi lặp, thiếu giọng, native speech error; DOM cho pause/wake release/visibility/navigation/owner; browser với thẻ thật và voice/wake giả lập ở mobile/desktop, xác nhận không đổi các store mastery/SRS. Chưa xác minh mọi giọng và mọi WebView iOS trên phần cứng thật.
