# Nghiên cứu cải thiện tra chữ viết tay — 2026-10-12

## Kết luận từ app hiện tại
Chữ 你 đã có trong handwriting-data.json: thiếu độ bền nhận dạng, không phải thiếu ký tự.
Mỗi chữ chỉ có một mẫu hình chuẩn. Bộ hiện tại so bitmap 32×32 bằng khoảng cách chamfer và mật độ mực.
Báo cáo content/handwriting-evaluation.json ghi nhận 你 không lọt top 10 ở mẫu independent-clean. Top-10 trên 40 mẫu clean là 27/40; trên 240 mẫu rough là 156/240. Đây là tập thử của repo, không phải đánh giá trên chữ viết của người dùng.
Normalizing X/Y independently can distort glyph proportions; benchmark preprocessing separately before attributing all errors to the source data.

## Nguồn ưu tiên thử: PP-OCRv5_mobile_rec
- Model chính thức: https://huggingface.co/PaddlePaddle/PP-OCRv5_mobile_rec
- Tệp nguồn: inference.pdiparams (16.5 MB), inference.json, inference.yml/config.json. Chúng là định dạng Paddle, không phải ONNX tải sẵn.
- Model card ghi Apache-2.0 và hỗ trợ chữ viết tay.
- Đã lấy ppocrv5_dict.txt từ repo PaddlePaddle/PaddleOCR. 18.383 dòng nhãn; phủ đúng 2.603/2.603 chữ trong bộ HSK của app, bao gồm 你.
- Đây là model nhận dạng dòng chữ; phải kiểm tra ảnh một chữ vẽ bằng ngón tay. Độ phủ nhãn không chứng minh độ chính xác.
- Bản benchmark handwritten Chinese 0.4166 trong model card là kết quả đúng TOÀN DÒNG, không phải xác suất nhận đúng chữ 你.
- Chưa tải weights/chuyển ONNX, chưa kiểm tra Safari/iPhone hay top-10. Không đưa vào app chỉ dựa trên nguồn này.
- Nếu dùng ONNX Runtime Web, cần đổi model đúng phiên bản, kiểm tra shape/operator, normalization/padding và CTC decoder. Không suy ra class logits từ số dòng dictionary một cách trực tiếp: cần xử lý blank và space đúng model.
- Single-character top-10 cần thiết kế decoder/ranking cho xác suất chuỗi một chữ; không lấy 10 ký tự xuất hiện ngẫu nhiên trong kết quả OCR dòng.
- Chỉ dùng recognition crop của ô vẽ; không cần thêm full document detection pipeline.
- Mã/model/runtime phải local và được cache nếu muốn offline. WASM fallback cần kiểm tra iPhone; không bắt buộc WebGPU.

## Nguồn khác
1. CASIA-HWDB: dữ liệu ảnh chữ viết tay thật, phù hợp học hình chữ, không cần thứ tự nét lúc suy luận. Chủ sở hữu chỉ miễn phí cho nghiên cứu học thuật; phân phối hay sử dụng thương mại phải xử lý quyền riêng. Không thu thập và phát hành tập này trong app theo mặc định.
   https://nlpr.ia.ac.cn/databases/handwriting/Application_form.html
   https://nlpr.ia.ac.cn/databases/handwriting/Download.html
2. mcyph/cnn_chinese_hw: nhận tọa độ nét, hỗ trợ đổi thứ tự nét ở mức nhất định, có pipeline ONNX. Phiên bản kiểm tra KHÔNG kèm pretrained checkpoint, cần huấn luyện. Nguồn gồm Tomoe, Make Me a Hanzi, KanjiVG với các điều khoản riêng. Là phương án xây mô hình chuyên dụng, không phải model ready-to-ship.
   https://github.com/mcyph/cnn_chinese_hw
   https://github.com/mcyph/cnn_chinese_hw/blob/master/THIRD_PARTY_DATA.md
3. HanziLookupJS/hanzi_lookup: nhận dạng local dựa trên nét; giữ làm baseline đối chiếu. Không mặc định coi thuật toán này bất biến thứ tự nét: phải thử nét đảo thứ tự/hướng.
   https://github.com/gugray/hanzi_lookup
4. Make Me a Hanzi: giữ làm nguồn mẫu nét chuẩn/đối chiếu và attribution. Thêm nhiều chữ từ cùng một phong cách không tự khắc phục thiếu đa dạng chữ viết tay.
   https://github.com/skishore/makemeahanzi

## Gói đã chuẩn bị
- ppocrv5_dict.txt: snapshot dictionary chính thức, không phải ảnh huấn luyện.
- hsk-label-map.json: ánh xạ chữ HSK vào số dòng dictionary; chưa phải index của model output.
- coverage.json: xác minh độ phủ nhãn.
- sources.json: nguồn, giấy phép và trạng thái tải.
- PaddleOCR-LICENSE.txt: license upstream Apache-2.0.
Không có ảnh chữ viết riêng của người dùng, weights model hoặc CASIA trong gói này.

## Kiểm chứng trước tích hợp
So baseline hiện tại với model ứng viên trên cùng mẫu của người dùng, có 你 và nhóm 休/体/他/你, 日/目, 未/末, 土/士. Chia mẫu test riêng theo người viết; không chấm mẫu đã dùng học cá nhân. Báo top-1/top-10, độ trễ, RAM, tải bổ sung và coverage HSK thực tế. Giữ tối đa 10 gợi ý, thứ tự nét tùy ý, dữ liệu suy luận local. Chưa có chữ người dùng để xác minh trường hợp 你 vừa báo; chỉ có evidence từ benchmark repo.
Không thay đổi app/AI/OCR/SRS trong giai đoạn tổng hợp dữ liệu này.

## Nguồn chính thức về suy luận offline
https://onnxruntime.ai/docs/tutorials/web/

