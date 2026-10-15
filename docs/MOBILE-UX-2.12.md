# Bản 2.12 — Mobile gọn hơn và tập trung khi học

Lớp `mobile-ux.js/css` nối các handler sẵn có; không thay schema, thang điểm, thuật toán SRS, nguồn từ hay đồng bộ. Phạm vi là chiều rộng ≤720px và màn hình ngang thấp có con trỏ cảm ứng. Theme được chuyển vào Tài khoản khi ở mobile và trả lại header ở desktop. Pill HSK tiếp tục mở drawer, gồm bộ lọc từ và menu giáo trình độc lập.

## Luồng đã triển khai

- Header mobile giữ tên màn, HSK và avatar. Tài khoản có theme và nút mở menu. Hero Home dùng plan thật và thời gian thao tác đã ghi để ước tính phút còn lại; chưa có plan thì CTA đánh giá/bắt đầu theo báo cáo hiện hữu. Không bịa “còn 8 phút”. Banner trùng và sơ đồ ba bước ẩn trên mobile; chỉnh mục tiêu nằm trong dialog sheet, giữ form và ID cũ.
- Quiz, dạng đề đang có câu, câu hỏi placement và khung vẽ/học viết kích hoạt focus mode: giấu dock/header, có nút thoát và thông tin phiên. Placement/writing dùng thanh thoát bên trong dialog native, không để nút ở nền bị inert. Thoát placement giữ draft theo engine cũ; thoát exam dừng nguồn audio; trở về hub không thay điểm đã ghi.
- Flashcard có thanh Chưa thuộc/Đã thuộc/Thẻ tiếp cố định trên dock. Vuốt ngang touch >85px, ngang hơn dọc ít nhất 2 lần, dưới 1.2s gọi đúng handler mức thuộc, không tự chuyển thẻ. Giữ nút thay thế và pan dọc/pinch zoom; không nhận vuốt từ control hoặc khi rảnh tay đang chạy. Viền xanh/cam chỉ là preview. Không bật auto mastery từ học rảnh tay.
- Bài học giữ **4 bước đang có**, chuyển sang hàng pill cuộn ngang, căn tab đang chọn, giữ footer đi tiếp. Dot chỉ có khi bằng chứng hiện hữu phù hợp; không đánh dấu hoàn thành chỉ vì chạm tab. Ngữ pháp chỉ coi đủ khi toàn bài đạt điều kiện hoàn thành, không thêm một bộ chấm mới.
- Chat bài dùng chip và panel khoảng nửa màn hình. Giải thích quiz/exam mở sheet theo yêu cầu, không chặn Next chờ AI. Nếu văn bản có Vì sao/Ghi nhớ/Ví dụ thì trình bày ba mục đó; nếu không có, giữ giải thích nguyên văn thay vì tự bịa nội dung. Prompt AI khách quan vốn đã yêu cầu ba dòng, không đổi provider hay hạn mức.
- Hub chỉ mở một nhóm lớn tại một thời điểm ở mobile. Công cụ Sổ dùng các khối xổ loại trừ nhau. Sổ hiện tìm kiếm/luyện nhanh/danh sách trước; thêm/sửa mở native save sheet, optional ví dụ/ghi chú gộp. Quick game dùng từ trong bộ hiện tại; vẫn yêu cầu đủ dữ liệu/phương án và không đổi phần trăm HSK. Import, truyện và bulk SRS nằm trong Bộ sưu tập & công cụ.
- Undo/Clear và dải ứng viên vẽ được chuyển lên trên canvas khi mobile, trả lại vị trí cũ trên desktop. Học viết có Xem nét mẫu/Tự viết trước canvas, vẫn cùng engine và nút gợi ý/viết lại/chữ tiếp. SVG canvas được đặt kích thước rõ để không bị global icon rule thu về 20px.
- Rảnh tay có play/pause hợp nhất 64px, trạng thái có số từ/HSK/số lặp. Engine âm thanh, wake lock, pause khi rời màn và quy tắc không tăng mastery giữ nguyên.
- Dark mode dùng token sáng hơn cho pinyin/badge và viền bề mặt. Màn hình ngang thấp có mini-rail icon trái, có accessible name từ nhãn nút gốc; quay lại dọc khôi phục dock đáy.

## Tham khảo thiết kế và giới hạn

- W3C APG native dialog/modal: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ — focus vào nội dung, bàn phím không đi xuyên modal, đóng quay lại control phù hợp.
- web.dev touch: https://web.dev/articles/add-touch-to-your-site — phân biệt hướng cử chỉ, giữ đường bấm thay thế, không chặn thao tác cuộn toàn trang.
- web.dev responsive interaction: https://web.dev/learn/design — khác biệt kích thước viewport và phương thức nhập.

Mục tiêu tương phản, hit target, reduced motion và focus được kiểm tra bằng trình duyệt; không phải tuyên bố đã kiểm chứng mọi iPhone/WebView hay bàn phím thật. Browser test giả lập account/voice ở các luồng tương ứng; không chứng nhận chất lượng phản hồi AI thực tế. `tools/check-mobile-ux-ui.cjs` kiểm tra luồng mới; các kiểm tra bài học, planner, notebook, passive và touch dock được giữ/cập nhật theo control mới. Không xóa hoặc sửa dữ liệu người dùng để đổi layout.
