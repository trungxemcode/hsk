# Audio gốc từ Drive: đợt 1

H31001, HSK 3, câu 11–20: 10 câu nghe đúng/sai. Cắt từ MP3 gốc được người dùng cung cấp; đối chiếu mã đề, lời nghe và bảng đáp án trong PDF. Không thay giọng gốc bằng TTS. Giữ hai lần đọc trong mỗi đoạn.

Ranh giới được tìm từ khoảng lặng rồi xác minh bằng nhận dạng giọng nói chạy cục bộ và đối chiếu nội dung từng câu. Đoạn ví dụ thứ hai phải loại ra trước câu 11. Không dùng riêng số lượng khoảng lặng để đánh số câu. Văn bản hiển thị lấy từ PDF gốc, không lấy từ ASR vốn có thể sai chữ.

`drive-audio-data.json` lưu mã đề/câu, trang PDF, ID tệp nguồn, SHA256 nguồn/đoạn, mốc bắt đầu/kết thúc và thời lượng. Các clip MP3 dùng sao chép khung âm thanh, không tái tạo giọng. Lượt luyện ngắn tối đa 5 câu, ghi đúng/sai, ôn lỗi và AI theo cơ chế hiện có. Bản gốc có chất lượng 16 kbps; không tuyên bố cải thiện chất lượng thu âm.

Audio tải khi người dùng phát, dừng khi trả lời/đổi bài/rời trang. Bản tải offline gồm các clip. Các đề và cấp khác chưa nhập: cần đối chiếu lời nghe/đáp án và kiểm tra riêng ranh giới, không tái dùng mốc thời gian H31001.

Tái tạo batch: `python3 tools/build-drive-audio-h31001.py THU_MUC_AUDIO_VA_MOC_DA_KIEM_TRA PDF_TEXT`. Không đưa nguyên MP3 36 phút hoặc mô hình ASR vào repository. Kiểm tra: `node --test server/drive-audio.test.mjs` cùng kiểm tra trình duyệt.
