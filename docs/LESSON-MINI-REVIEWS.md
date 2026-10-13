# Ôn ngắn theo từng bài

146 bài HSK 1–6, mỗi bài 5 tác vụ: nghe câu ngắn, chọn từ của bài điền câu, đọc câu/ý trong đoạn ngắn, ôn cấu trúc và ôn chữ hoặc diễn đạt. HSK 1–2 tập trung từ vựng và giao tiếp; HSK 3 thêm sắp xếp câu và điền chữ; HSK 4–5 thêm viết 2–3 câu; HSK 6 có điền câu theo đoạn và diễn đạt ngắn. Đây là lượt ôn 3–6 phút, không phải bản rút gọn của toàn bộ bài thi.

`tools/build-lesson-mini.cjs` tạo `lesson-mini-data.json` từ đoạn ngắn, ví dụ ngữ pháp, câu kiểm tra và danh sách từ của từng bài. Ví dụ điền từ/chữ lấy từ `checkedPracticeExamples` cho chính từ nằm trong bài. Không lấy một câu ngẫu nhiên của cấp HSK rồi gắn vào bài khác. Gợi ý pinyin trong bài điền từ cố định từ cần nhớ, tránh kết luận những từ thay thế hợp ngữ pháp khác là sai. Sắp xếp đối chiếu thứ tự mẫu đã học; lời phản hồi không tuyên bố mọi trật tự khác đều sai. Khung viết ngắn dùng chủ đề, từ và mẫu của đúng bài. Câu mẫu tham khảo có thể là ví dụ ngữ pháp/điển hình từ của bài, không phải một bài văn hoàn chỉnh duy nhất.

## Tiến độ

| Phần | Điểm trong 100 |
|---|---:|
| Đã học qua | 15 |
| Kiểm tra từ | 15 |
| Hiểu bài | 15 |
| SRS | 45 |
| Ôn ngắn | 10 |

Năm tác vụ ôn ngắn có trọng số bằng nhau. Câu khách quan cần đúng 2 lần liên tiếp. Viết ngắn cần đạt độ dài tối thiểu, có từ khóa và người học xác nhận ba tiêu chí tự đối chiếu; tính hoàn thành hoạt động, không chấm chất lượng ngôn ngữ. Xem lời trước khi trả lời phần nghe là học hỗ trợ, không tăng tiến độ nghe. Chưa thể dùng âm thanh thì học hỗ trợ vẫn có sẵn.

Mức 100% của bài cần đủ tất cả điều kiện cũ lẫn mới. Chỉ hoàn thành ôn ngắn không thể đạt 100%. Bằng chứng từ, đọc, hiểu bài và SRS cũ không bị xóa. Bài đã đạt 100% theo công thức cũ hiện 90% nếu chưa hoàn thành phần ôn mới. Hàm chấm giữ công thức cũ cho các lời gọi không khai báo tác vụ ôn. Danh sách bài hiển thị tiến độ chung HSK bằng trung bình tiến độ các bài; thanh tiến độ từ vựng tại Tài khoản giữ ý nghĩa riêng.

`miniEvidence` và `miniDrafts` nằm trong cùng bản ghi bài học, dùng cơ chế lưu/đồng bộ/sao lưu hiện có. Sai một câu đặt lại chuỗi đúng của câu đó, không xóa các phần khác. Bản nháp viết lưu khi gõ. Các câu khách quan ôn ngắn được ghi vào thống kê làm bài của kế hoạch; tự đối chiếu viết không được giả định là trả lời đúng để tăng độ chính xác AI.
