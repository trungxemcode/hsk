# Bài tập theo năng lực HSK

Đối chiếu ngày 13/10/2026. Mục mới dùng cấu trúc HSK 1–6 (2.0), phù hợp bộ từ và giáo trình hiện có. CTI thông báo HSK 3.0 mở thi toàn cầu ngày 13/12/2026; không đánh đồng hai hệ. Đây là luyện từng dạng, không phải đề thi chính thức hoặc bộ mô phỏng đầy đủ thời lượng, số câu và điểm chuẩn hóa.

| Cấp | Đọc | Viết | Nghe |
|---|---|---|---|
| 1 | Câu–hình, ghép hỏi–đáp | Không có phần viết trong hệ đang đối chiếu | Nghe chọn hình |
| 2 | Câu–hình, hỏi–đáp, đúng/sai, chọn từ điền câu | Không có phần viết trong hệ đang đối chiếu | Đúng/sai, chọn đáp án |
| 3 | Hỏi–đáp, điền từ, đọc hiểu | Sắp xếp từ, điền chữ theo pinyin | Đúng/sai, chọn đáp án |
| 4 | Điền từ, sắp xếp đoạn, đọc hiểu | Sắp xếp từ, viết một câu theo hình và từ cho sẵn | Đúng/sai, chọn đáp án |
| 5 | Điền từ và đọc hiểu | Sắp xếp từ, viết khoảng 80 chữ với 5 từ hoặc hình | Chọn đáp án |
| 6 | Tìm câu lỗi, điền nhóm từ, điền câu vào đoạn, đọc suy luận | Đọc 10 phút rồi ẩn nguồn, viết tóm tắt khoảng 400 chữ trong 35 phút | Chọn đáp án |

17 loại, 182 câu/tình huống được biên soạn riêng. Độ khó được lựa chọn dựa trên cấu trúc, mục đích giao tiếp và ngữ cảnh, không phải cam kết từng chữ đều thuộc danh sách từ của cấp. Các bài đọc/nghe ngắn là lượt khởi động từng kỹ năng; chưa thay thế độ dài và mật độ thông tin của toàn bộ đề thi. Hình minh họa là SVG gốc, dùng để nhận diện tình huống; không sao chép hình đề thật. Bài nghe dùng giọng đọc thiết bị, nên không tái tạo nhiều người nói, ngữ điệu hoặc chất lượng phòng thi. Không bổ sung HSKK vào phần thi viết HSK.

## Chấm và phản hồi

- Câu khách quan: chấm một lần mỗi lượt, hiển thị giải thích, ghi lại lần làm và mở lượt ôn câu sai.
- Sắp xếp: chạm để thêm/bỏ từ, mỗi token chỉ dùng một lần. Bỏ khác biệt khoảng trắng/dấu câu, chấp nhận các phương án đã đối chiếu trong dữ liệu. Không tuyên bố nhận diện mọi cách diễn đạt đúng; đáp án còn thiếu có thể bổ sung vào `accepted`.
- Điền chữ: đối chiếu chữ Hán với đáp án theo ngữ cảnh/pinyin.
- Viết mở: đếm chữ Hán, kiểm tra đủ từ khóa, lưu bản nháp, cung cấp tiêu chí/ý chính/bài tham khảo. Các chỉ báo này không chấm ngữ pháp, độ tự nhiên hay điểm thi. Bài viết không bị đánh sai vì khác đáp án tham khảo.
- Tóm tắt: nguồn bị xóa khỏi DOM khi sang viết; đồng hồ tính theo thời gian thực kể cả lúc app ở nền. Hết thời gian gợi ý vẫn giữ bài. Có thể bắt đầu lượt đọc mới, không mất bản nháp.

## Tích hợp và bảo toàn tính năng

Đi vào từ Luyện tập → Luyện theo dạng đề. Ngân hàng, bộ chấm và UI là các module riêng, không thay thuật toán flashcards/SRS/trắc nghiệm cũ. `hsk-exam-practice-v1` được thêm vào cơ chế sao lưu/đồng bộ tài khoản hiện tại; câu và bản nháp là từng mục revision riêng để hợp nhất giữa thiết bị. Đổi tài khoản dừng phiên đang mở. Bộ nhớ lỗi có thông báo, không âm thầm báo đã lưu. Offline cache chứa bốn asset mới; CSS dùng cùng dark mode và phản hồi tím/chữ trắng. Tỷ lệ đúng trong danh mục là thống kê luyện tập, không phải mức thành thạo hay điểm HSK quy đổi.

## Nguồn cấu trúc

- [CTI · Sổ tay cấu trúc HSK 1–6](https://www.chinesetest.cn/userfiles/file/zhongying2010.pdf)
- [CTI · HSK 3 H31001, trang 12–13](https://old.chinesetest.cn/userfiles/file/HSK/level3/H31001.pdf): sắp xếp từ, viết chữ theo pinyin.
- [CTI · HSK 4 H41001](https://old.chinesetest.cn/userfiles/file/HSK/level4/H41001.pdf): chọn từ, sắp xếp đoạn, đọc hiểu, viết câu.
- [CTI · HSK 5 H51001, trang 15–16](https://old.chinesetest.cn/userfiles/file/HSK/level5/H51001.pdf): hoàn thành câu, viết khoảng 80 chữ với năm từ hoặc hình.
- [CTI · HSK 6 H61001, trang 7–18](https://old.chinesetest.cn/userfiles/file/HSK/level6/H61001.pdf): câu lỗi, điền từ/câu, đọc hiểu, tóm tắt.
- [CTI · Thông báo lịch HSK 3.0](https://old.chinesetest.cn/gonewcontent.do?flag=kdnew&id=51336883)

Nguồn được dùng để đối chiếu dạng bài và quy trình; nội dung câu hỏi, truyện, hình và đáp án tham khảo trong app là mới. Không dùng nguyên văn câu hỏi đề mẫu làm ngân hàng.
