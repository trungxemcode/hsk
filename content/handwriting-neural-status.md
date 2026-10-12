# Nhận dạng nâng cao — mục tiêu 85% top-1

## Kết quả đo

Dùng mô hình chính thức PP-OCRv5_mobile_rec_onnx, snapshot `ed152b8b495f84de93cda5709d768548a9127622`, chạy ONNX Runtime Web 1.22.0 WASM một luồng. Renderer và decoder cùng mã đang đưa vào app; Canvas dùng @napi-rs/canvas trong Node để kiểm thử. Không fine-tune trên fixtures.

| Nhóm kiểm tra hình học | Đúng đầu tiên | Top-5 |
|---|---:|---:|
| 40 mẫu rõ | 40/40 (100%) | 40/40 |
| 240 mẫu nhiễu | 218/240 (90,8%) | 239/240 |
| 39 mẫu bỏ nét cuối | 8/39 (20,5%) | 22/39 |

Mục tiêu 85% đạt trên hai nhóm mẫu đủ nét của bộ phát triển này, KHÔNG chứng minh 85% trên người dùng thật hoặc toàn bộ 2.603 chữ HSK. Những hình này đã được dùng để chọn giải pháp và không phải tập kiểm tra mù độc lập cuối cùng. Không diễn giải mẫu biến dạng thành nhiều người viết. Nhóm thiếu nét chưa đạt; nhiều trường hợp nhãn mong đợi không thể suy ra chỉ từ hình còn lại.

Median khoảng 248 ms, p95 khoảng 348 ms trên máy Node/WASM hiện tại; không đại diện tốc độ điện thoại. Mô hình chứa 18.385 lớp gồm blank/khoảng trắng và nhiều ngôn ngữ; app lọc kết quả về chữ HSK sẵn có, không tự mở rộng từ điển nghĩa/pinyin.

## Tích hợp

Tải tùy chọn 27.814.219 byte; không làm tăng tải mặc định offline thêm 28 MB. App lưu bốn asset tĩnh vào Cache Storage, kiểm SHA-256 và byte length trước khi chạy; phiên bản và URL cố định. Metadata / danh sách ký tự nằm trong gói offline. Không upload ảnh, tọa độ, nhãn chữ hay mẫu học tới nhà cung cấp model/runtime.

Canvas 48x48, chuẩn hóa RGB vào tensor 1x3x48x320 với padding trung tính; xếp hạng một chữ bằng max bằng chứng CTC theo timestep. Điểm này không phải xác suất đã hiệu chuẩn của toàn chữ. Người dùng vẫn tự xác nhận. Tầng so hình và AI qua Worker cũ được giữ nguyên; lỗi tải/inference rơi về so hình.

Mẫu cá nhân exact-match với nhãn không mâu thuẫn được ưu tiên; không fine-tune trọng số, không tuyên bố đã huấn luyện từ chữ cá nhân. Chưa học chéo bộ thủ. Không cần migration Firebase hoặc deploy Cloudflare mới.

## Tái hiện

- `node --test server/handwriting-neural.test.mjs server/handwriting-recognition.test.mjs server/handwriting-learning.test.mjs server/translator-worker.test.mjs`
- `node tools/fetch-handwriting-neural-assets.cjs ASSET_DIRECTORY`
- Cài `@napi-rs/canvas` trong môi trường kiểm thử Node (không phải phụ thuộc app).
- `node tools/check-handwriting-neural.cjs ASSET_DIRECTORY content/handwriting-neural-evaluation.json`

Lệnh benchmark trả mã 2 nếu clean hoặc rough top-1 <85%. Model không cần API key. Tệp nguồn là model card chính thức: https://huggingface.co/PaddlePaddle/PP-OCRv5_mobile_rec_onnx (Apache-2.0). Runtime: https://github.com/microsoft/onnxruntime/tree/v1.22.0/js/web (MIT); thông báo bên thứ ba đi kèm. Không dùng dữ liệu CASIA hoặc ảnh lấy từ mạng xã hội để huấn luyện.

## Chưa kiểm chứng

Tải Chromium trong môi trường thử thất bại do archive tải về rỗng; chưa chạy test trình duyệt thực, Safari/iPhone, khởi động lại offline thực hoặc UI pointer end-to-end. Kiểm tra cache/integrity/fallback dùng mock; kiểm tra inference dùng WASM thật và Canvas native. Cần kiểm tra trên thiết bị và một bộ chữ nhiều người viết giữ riêng trước khi tuyên bố đạt 85% thực tế hoặc tự phát hành mặc định.
