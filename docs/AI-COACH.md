# AI hỗ trợ phát hiện điểm cần cải thiện

## Sửa tương thích phản hồi 13/10/2026

Endpoint hỏi đáp hiện có trả `{answer: string}`, không cam kết JSON lồng bên trong chuỗi answer. Câu khách quan hiện yêu cầu giải thích bằng văn bản. App hiển thị và lưu nhận xét văn bản trực tiếp, không tự bịa điểm hoặc nhãn điểm yếu. JSON có cấu trúc vẫn được kiểm tra điểm, id và câu trích; JSON trong code fence/lời dẫn và wrapper answer cũng được hỗ trợ. JSON bị cắt hoặc sai chứng cứ không được biến thành điểm hợp lệ. Chọn hình gửi mô tả người đọc sách/uống nước… thay vì mã icon nội bộ.

Nằm trong Luyện tập và Luyện theo dạng đề. Mỗi câu đã làm có nút AI chấm và góp ý; bài viết có thể gửi trước khi tự đối chiếu. AI nhận đề, câu trả lời thực tế, đáp án/mẫu tham khảo, tiêu chí và nội dung nguồn của bài. Chấp nhận cách diễn đạt đúng khác mẫu. Không dùng AI để thay đổi đáp án khách quan hoặc 100% hoàn thành.

Tùy chọn “Hiện đúng/sai và giải thích AI ngay sau mỗi câu” mặc định tắt và nằm trong phần làm bài. Bỏ tick: nút Xem đáp án mở kết quả theo yêu cầu, không tự gửi AI. Bật: đúng/sai được chấm bằng đáp án có sẵn ngay sau chọn; câu vừa trả lời được gửi AI để giải thích bên dưới. Không đợi đủ 5 câu nữa. Với viết mở, AI góp ý sau khi nộp, không tự suy ra đúng/sai như câu khách quan. Cấu hình cũ enabled không tự kích hoạt tùy chọn mới instantEnabled, vì chế độ mới gửi nhiều yêu cầu hơn.

Yêu cầu AI được xếp hàng để tôn trọng khoảng cách 11 giây của dịch vụ hiện có. Nếu làm nhanh, có thể phải chờ giải thích; không khóa chọn đáp án hay chuyển câu. Câu đã rời màn hình trước khi tới lượt gửi không được gửi thừa; vẫn được lưu để phân tích tổng hợp. Bỏ tick hoặc đổi tài khoản hủy hàng đợi và phản hồi đang chạy tự động. Không gửi mỗi lần gõ. Không theo dõi hoạt động ngoài app, micro hay màn hình.

60 lượt gần nhất và 8 nhận xét được lưu trong drafts.__aiCoach của hsk-exam-practice-v1, dùng đồng bộ/sao lưu và tách tài khoản hiện có. Điểm bài viết 0–10 là nhận xét tham khảo, không quy đổi điểm thi HSK. Không kết luận phát âm/nói khi không có dữ liệu. Lỗi lặp được cung cấp kèm số lần gần đây; một lỗi riêng lẻ chưa phải kết luận năng lực. Xóa lịch sử AI không xóa bài làm, bản nháp hay tiến độ gốc.

Dùng endpoint /lesson-ask đang có, yêu cầu JSON bên trong answer; kiểm tra số điểm, id câu và đoạn sửa trích nguyên văn. Dữ liệu được gửi tới Gemini thông qua Worker hiện có. Không cần triển khai endpoint mới hay thay secrets. Dịch vụ vẫn chịu hạn mức và lỗi provider hiện tại. Kết quả sai định dạng không lưu. Nút chấm gửi bài ngay theo yêu cầu; quan sát tự động là lựa chọn riêng.

Nguồn đối chiếu cách diễn giải điểm: https://www.chinesetest.cn/userfiles/file/HSKTest.pdf. Tiêu chí luyện viết của app là rubric hỗ trợ học, không mô phỏng điểm chuẩn hóa của kỳ thi.

Kiểm tra: server/ai-coach.test.mjs và tools/check-ai-coach-dom.cjs giả lập phản hồi AI; không xác nhận chất lượng chấm của Gemini thực tế. Endpoint đang chạy đã kiểm tra trả 401 khi thiếu tài khoản. Cần tài khoản đăng nhập trong app để dùng chấm thực tế.
