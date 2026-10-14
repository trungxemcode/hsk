# Bổ sung kho đề Drive, 14/10/2026

Nguồn do người dùng cung cấp: https://drive.google.com/drive/folders/14sqSlPydbPS7VetvbVMxVuLOlyB1sahj . Đã kiểm tra 89 PDF, gom theo mã HSK trong nội dung, không dựa vào thư mục hoặc tên file. Chỉ nhập câu đầy đủ và có bảng đáp án đi kèm; giữ SHA256 nguồn, mã đề, số câu và trang. Không chỉnh sửa Drive gốc.

Đã nhập 1.648 câu từ 52 mã đề: HSK 1: 259; HSK 2: 119; HSK 3: 274; HSK 4: 299; HSK 5: 397; HSK 6: 300. Cộng 254 câu vốn có thành 1.902 câu trong luyện dạng đề. Ôn ngắn theo bài giữ nguyên 1.022 tác vụ; không gán câu đề vào bài học nếu chưa đối chiếu nội dung.

Các nhóm đã nhập: đọc với hình gốc, ghép hỏi–đáp, chọn từ điền câu/đoạn, đúng/sai, đọc hiểu với đoạn chung đầy đủ, tìm câu lỗi, sắp xếp câu và đoạn. HSK 1 dùng 52 ảnh WebP trang gốc để bảo toàn hình và pinyin, có nút phóng to. AI chưa đọc được ảnh qua API hiện có, nên không tạo lời giải phỏng đoán cho câu chỉ có ảnh.

Không nhập tự động: 13 mã đề thiếu bảng đáp án; phần nghe MP3; phần viết mở; câu điền chữ/pinyin hoặc đoạn nhiều chỗ trống trích xuất chưa đủ rõ. Không suy diễn đáp án. Báo cáo chi tiết nằm trong drive-exam-data.json.gz → report. Các lượt trộn với nguồn Drive được giới hạn 5 câu; điểm, ôn sai, hồ sơ lỗi lặp và đồng bộ dùng cơ chế sẵn có.

Tái tạo: tải các PDF qua Google Drive đã xác thực, ghi manifest.json gồm metadata vào một thư mục nguồn; chạy python3 tools/import-drive-hsk.py THU_MUC_NGUON . Tệp nguồn và URL tải có chữ ký không được đưa vào repository. Nhập dữ liệu qua drive-exam.js, kiểm tra bằng node --test server/drive-exam.test.mjs và kiểm tra giao diện.
