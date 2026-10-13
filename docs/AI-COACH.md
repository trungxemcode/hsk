# AI hỗ trợ phát hiện điểm cần cải thiện

Nằm trong Luyện tập và Luyện theo dạng đề. Mỗi câu đã làm có nút AI chấm và góp ý; bài viết có thể gửi trước khi tự đối chiếu. AI nhận đề, câu trả lời thực tế, đáp án/mẫu tham khảo, tiêu chí và nội dung nguồn của bài. Chấp nhận cách diễn đạt đúng khác mẫu. Không dùng AI để thay đổi đáp án khách quan hoặc 100% hoàn thành.

Quan sát tự động mặc định tắt. Bật để gửi một nhóm tối đa 8 câu gần đây sau khoảng 5 câu khách quan hoặc một bài viết đã hoàn thành, khi đang đăng nhập. Gọi dịch vụ có khoảng cách tối thiểu 11 giây, không gửi mỗi lần gõ. Nếu bận/chưa kết nối, dữ liệu vẫn lưu để người dùng bấm phân tích lại. Không theo dõi hoạt động ngoài app, micro hay màn hình.

60 lượt gần nhất và 8 nhận xét được lưu trong drafts.__aiCoach của hsk-exam-practice-v1, dùng đồng bộ/sao lưu và tách tài khoản hiện có. Điểm bài viết 0–10 là nhận xét tham khảo, không quy đổi điểm thi HSK. Không kết luận phát âm/nói khi không có dữ liệu. Lỗi lặp được cung cấp kèm số lần gần đây; một lỗi riêng lẻ chưa phải kết luận năng lực. Xóa lịch sử AI không xóa bài làm, bản nháp hay tiến độ gốc.

Dùng endpoint /lesson-ask đang có, yêu cầu JSON bên trong answer; kiểm tra số điểm, id câu và đoạn sửa trích nguyên văn. Dữ liệu được gửi tới Gemini thông qua Worker hiện có. Không cần triển khai endpoint mới hay thay secrets. Dịch vụ vẫn chịu hạn mức và lỗi provider hiện tại. Kết quả sai định dạng không lưu. Nút chấm gửi bài ngay theo yêu cầu; quan sát tự động là lựa chọn riêng.

Nguồn đối chiếu cách diễn giải điểm: https://www.chinesetest.cn/userfiles/file/HSKTest.pdf. Tiêu chí luyện viết của app là rubric hỗ trợ học, không mô phỏng điểm chuẩn hóa của kỳ thi.

Kiểm tra: server/ai-coach.test.mjs và tools/check-ai-coach-dom.cjs giả lập phản hồi AI; không xác nhận chất lượng chấm của Gemini thực tế. Endpoint đang chạy đã kiểm tra trả 401 khi thiếu tài khoản. Cần tài khoản đăng nhập trong app để dùng chấm thực tế.
