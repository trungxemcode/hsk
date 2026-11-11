# Cổng huấn luyện model Sửa câu HSK

[Cổng GitHub Actions](https://github.com/trungxemcode/hsk/actions/workflows/train-hsk-sentence-model.yml) nhận bộ dữ liệu theo nhánh, tinh chỉnh ELECTRA và trả model INT8 ứng viên cùng báo cáo HSK 1–6. Cộng tác viên và AI dùng phiên GitHub có quyền ghi vào repo để khởi chạy. Các lần chạy lưu artifact để xem xét trước khi đưa model vào app.

## Chạy một lượt

1. Chọn **Run workflow**, nhánh chứa dữ liệu, tên thư mục dữ liệu và số epoch. Bật **validation_only** nếu chỉ kiểm tra định dạng. Bộ mặc định `seed` có 78 câu để thử toàn bộ quy trình. Bộ `expanded-v1` có 1.008 câu tổng hợp, đủ HSK 1–6 và 14 nhóm lỗi để mở rộng coverage; điểm trên dữ liệu tổng hợp vẫn cần được kiểm tra lại bằng dữ liệu người bản ngữ trước khi phát hành.
2. Mở **Summary** của lần chạy để xem số lỗi tìm được và số câu đúng bị báo nhầm theo từng cấp. Tải gói trong **Artifacts**. `report.json` lưu kết quả theo nhóm lỗi, dấu SHA-256 của dữ liệu và model, tham số huấn luyện, kết quả gốc và ứng viên cùng ngưỡng 0,90.
3. Nếu chọn một ứng viên để phát hành, mở PR riêng thay mã SHA-256 và kích thước gói trong bộ nạp của app, rồi chạy lại kiểm thử trên trình duyệt. Dùng tập kiểm tra đủ lớn, có câu viết đúng, nhiều lỗi cùng câu và câu ngoài những mẫu từng dùng để huấn luyện.

AI có thể gọi bằng CLI:

```sh
gh workflow run train-hsk-sentence-model.yml -R trungxemcode/hsk --ref <nhanh> -f dataset=seed -f epochs=1
gh run list -R trungxemcode/hsk --workflow train-hsk-sentence-model.yml
gh run download <run-id> -R trungxemcode/hsk
```

Hoặc chạy ngay trong repo với Python 3.12:

```sh
python -m pip install --index-url https://download.pytorch.org/whl/cpu 'torch==2.6.0+cpu'
python -m pip install -r tools/sentence-training/requirements.txt
python tools/sentence-training/train.py --out /tmp/hsk-candidate
```

CLI có thêm `--learning-rate`, `--error-weight`, `--unfreeze-layers` và `--max-clean-false-alarm`. Ngưỡng ứng viên được chọn trên `validation` theo mức báo nhầm cho phép và độ phủ trung bình qua sáu cấp. Tập `test` dùng để đo sau khi chọn ngưỡng.

## Thêm dữ liệu

Tạo `tools/sentence-training/data/<ten-bo>` với `manifest.json`, `train.jsonl`, `validation.jsonl` và `test.jsonl`. Manifest ghi `name`, `license`, `provenance`, `purpose`. Mỗi dòng là một câu và các lỗi được gắn nhãn. Dùng dữ liệu có quyền huấn luyện và công khai trong repo, đã bỏ thông tin cá nhân.

```json
{"id":"a1","hsk":1,"family":"shopping","text":"我想买一只书。","errors":[{"start":4,"end":5,"type":"classifier","original":"只"}]}
```

Vị trí là chỉ số ký tự Unicode bắt đầu từ 0, khoảng `[start,end)`. Câu đúng có `errors: []`. Vị trí thiếu từ có `start == end`. Mỗi tập cần câu đúng và câu có lỗi ở cả sáu cấp. Đặt các biến thể của cùng mẫu hoặc câu gốc chung một `family` và giữ cả nhóm trong cùng một tập. Các nhóm lỗi được liệt kê ở `corpus.py`.

ELECTRA hiện đánh dấu ký tự nghi vấn. Với vị trí cần chèn hoặc lỗi chỉ có dấu câu, bộ đánh giá đo việc model đánh dấu chữ Hán lân cận. Báo cáo đếm các trường hợp đó riêng bằng `anchor_only`. Thay đổi câu và phân tích cấu trúc vẫn là nhiệm vụ của các thành phần tương ứng trong app.

## Corpus mở rộng trong repo

`data/expanded-v1` được sinh lại bằng `generate_expanded.py` từ các mẫu do repo biên tập. Mỗi cấp HSK có 14 nhóm lỗi, mỗi nhóm có sáu biến thể; các family được giữ nguyên trong một split và câu đã được kiểm tra không trùng giữa các split. Corpus bao gồm lỗi chữ, lượng từ, trợ từ, thể, trật tự từ, thành phần thiếu, dư thừa, kết hợp từ, liên từ, phạm vi, phủ định, song song, mơ hồ và dấu câu. Các mẫu collocation và pragmatic-naturalness là tín hiệu huấn luyện có kiểm soát, không phải thống kê tần suất người bản ngữ. Hãy bổ sung dữ liệu đã được người bản ngữ duyệt trước khi dùng làm bằng chứng chất lượng sản phẩm.

Tạo lại corpus sau khi sửa template:

```sh
python tools/sentence-training/generate_expanded.py
python tools/sentence-training/corpus.py tools/sentence-training/data/expanded-v1
```
