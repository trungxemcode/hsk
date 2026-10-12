# Nguồn dữ liệu và thay đổi nhận dạng — 12/10/2026

## Đã tích hợp

Tomoe Chinese handwriting dictionary: https://github.com/l4u/tomoe
Snapshot: 9d054a1f490368e0d45e0aff6430ce3598ab92c5, `data/handwriting-zh_CN.xml`.
README upstream công bố LGPL, trừ KANJIDIC2; không trích KANJIDIC2. Bản LGPL 2.1 nguyên văn đi kèm `handwriting-data-LGPL.txt`. Gói dẫn xuất có nguồn và SHA-256 trong `handwriting-external.json`; công cụ chuyển đổi `tools/import-tomoe-handwriting.py` được công bố cùng mã nguồn.

2.602 chữ HSK, khoảng 521 KB chưa nén. Đây là các mẫu đường nét được biên soạn cho recognizer, không phải hàng triệu ảnh chữ viết tay thực hoặc nhiều người viết. Không dùng file model từ các repo mirror khi chưa xác minh nguồn gốc weights.

Make Me a Hanzi/Arphic là dữ liệu nền có sẵn, tiếp tục giữ nguyên. `handwriting-learned.json` tiếp tục dành riêng cho mẫu cộng đồng đã duyệt; không bị thay bằng dữ liệu bên ngoài.

## Đã nghiên cứu, chưa tích hợp

CASIA-HWDB/OLHWDB: https://nlpr.ia.ac.cn/databases/handwriting/Application_form.html — miễn phí cho nghiên cứu theo điều kiện; thương mại cần giấy phép riêng. Không phân phối dữ liệu này vào app.

Intel handwritten-chinese-ocr-samples: https://github.com/intel/handwritten-chinese-ocr-samples — mã tham khảo CNN/CTC cho dòng chữ, chưa chứng minh phù hợp nhận dạng một chữ trong canvas; giấy phép mã không tự cấp quyền cho dữ liệu/weights.

cnn_chinese_hw: https://github.com/mcyph/cnn_chinese_hw — tài liệu kiến trúc CNN/ONNX và nguồn dữ liệu; README snapshot nghiên cứu yêu cầu train model. Không tích hợp checkpoint chưa được kiểm chứng.

Không thu ảnh từ Facebook/Reddit hoặc dữ liệu riêng của app khác. Có thể dùng các cộng đồng để tìm nguồn hoặc mẫu tự nguyện, nhưng không tự gán nhãn hay tự coi ảnh công khai là dữ liệu được phép phân phối.

## Kiểm chứng và phát hành

`node --test server/handwriting-recognition.test.mjs server/handwriting-learning.test.mjs server/translator-worker.test.mjs`

`node tools/check-handwriting.cjs handwriting-data.json content/handwriting-external-evaluation.json handwriting-external.json`

Lệnh benchmark trả mã 2 vì ngưỡng chất lượng hiện có chưa đạt; không phải lỗi chạy script. Mẫu rõ top1/top5 không thay đổi (17/40, 26/40). Mẫu nhiễu top5 tăng 139/240 → 154/240, nhưng thiếu nét top10 giảm 9/39 → 8/39. Ghi nhận cả suy giảm, không chỉ tăng trưởng.

`node tools/check-handwriting-personal.cjs content/handwriting-personal-evaluation.json`: mẫu biến dạng giữ lại để kiểm tra, không trùng bitmap mẫu học. Hai mẫu học trên mỗi chữ nâng top1 117/240 → 240/240 trong thử nghiệm hình học rất gần mẫu; không diễn giải thành 100% trên chữ người dùng thực.

Gói cập nhật offline và manifest đã được đổi phiên bản. Chỉ thay frontend; không cần Worker Cloudflare hay migration Firebase mới. Chưa kiểm tra iPhone/Safari thật, chưa công bố độ chính xác trên nhiều người viết.
