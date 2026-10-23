# Nhạc ngoại tuyến — bản thử nghiệm

Menu ba chấm → Nghe ngoại tuyến → Thêm bài đang chọn: chọn file M4A tương ứng để gắn với bài từ link. Hoặc “Thêm file M4A từ thiết bị” để lưu bài độc lập. Chỉ báo đã lưu sau khi trình duyệt đọc được âm thanh và IndexedDB ghi thành công. Bài đã gắn ưu tiên bản trên máy ở các lần mở tiếp theo sau khi thư viện đã tải; người dùng luôn có thể mở trực tiếp từ mục ngoại tuyến.

File nhập giữ nguyên bytes, không tự nén trên điện thoại. Chuẩn đã chọn là HE-AAC v2 64 kbps stereo M4A; chuẩn bị file gốc được phép sử dụng bằng công cụ:

```sh
python tools/prepare-offline-music.py input.wav output.m4a
# Nếu FFmpeg chưa có libfdk_aac:
python tools/prepare-offline-music.py input.wav output.m4a --encoder /path/to/aac-enc
```

Công cụ cần FFmpeg/FFprobe và bộ mã hóa FDK-AAC. Nó kiểm tra profile HE-AACv2, stereo, giải mã không lỗi, không ghi đè file có sẵn, không tải media từ YouTube/Spotify/SoundCloud. Browser chỉ kiểm tra container M4A và khả năng đọc âm thanh; đây không phải bộ kiểm định codec/bitrate, nên nhãn giao diện không khẳng định mọi file nhập đều đã được mã hóa 64 kbps.

Kho trên máy dùng IndexedDB riêng, giới hạn 100 MiB tổng trên thiết bị trong origin app, 50 MiB/file. Dung lượng này không bao gồm bộ cài offline hay dữ liệu học. Một file chung chỉ giữ một blob cho nhiều tham chiếu; xóa lần tham chiếu cuối mới giải phóng blob. Bài được lưu chủ động nên không bị LRU xóa âm thầm: khi hết dung lượng phải xóa bài hoặc chọn file nhỏ hơn. Trình duyệt có thể thu hồi dữ liệu khi thiếu chỗ; app chỉ liệt kê bản có blob và báo thêm lại nếu file không còn.

Dữ liệu bài tải về tách theo tài khoản/cached local owner. Mã hóa hay quyền phân phối không được suy ra từ một link công khai: người dùng cần cung cấp file tương ứng được phép sử dụng. Không có tự tải âm thanh từ trình phát nhúng và không có chuyển mã trên server đã triển khai trong thay đổi này.

Kiểm thử: `NODE_PATH=/tmp/hsk-tests/node_modules node tools/check-music-offline.cjs` (cần fake-indexeddb), `node tools/check-music-offline-ui.cjs` (Playwright). Kiểm thử UI dùng file HE-AACv2 thật, xác nhận lưu/gắn bài, dedup, đổi tài khoản, reload, sau đó ngắt mạng và phát/tua/tạm dừng. Shell PWA và nhạc là hai lớp khác nhau: cold start airplane mode + nhận bản cập nhật trên iPhone thật là bước nghiệm thu riêng.
