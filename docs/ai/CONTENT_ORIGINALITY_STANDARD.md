# Tiêu chuẩn Hệ thống hóa & Biên soạn lại Dữ liệu Bài học HSK (An toàn Bản quyền)

Tài liệu này định nghĩa quy trình **Clean-Room 2 tầng** để:
1. Tái hệ thống và làm sạch dữ liệu bài học / ví dụ hiện có trong repo (đặc biệt các mục còn tham chiếu Hanzii trong `content/data/` và `src/ui/dictionary-relations.js`).
2. Biến đổi dữ liệu bài học mới lấy từ Hanzii (hoặc nguồn giáo trình tham khảo) thành **dữ liệu biên soạn riêng của app HSK**, giữ nguyên độ chính xác kiến thức nhưng đổi mới hoàn toàn cách tổ chức, cách diễn giải, ví dụ, bài đọc, hội thoại và câu hỏi.

---

## 1. Nguyên tắc cốt lõi: Tách "Kiến thức" khỏi "Biểu đạt"

Trong biên soạn học liệu ngôn ngữ, cần phân biệt rạch ròi hai tầng:

| Tầng | Nội dung | Chính sách xử lý |
| --- | --- | --- |
| **Tầng 1: Kiến thức cốt lõi (Knowledge Spec)** — *Giữ chính xác 100%* | Chữ Hán (`han`), Pinyin chuẩn (`pin`), cấp HSK, từ loại cơ bản, nghĩa từ điển ngắn chuẩn xác, quy tắc ngữ pháp khách quan (ví dụ: `不是 A，而是 B`, trật tự từ, biến điệu thanh 3), nhóm từ cùng trường nghĩa/dễ nhầm | **Bảo toàn tuyệt đối độ đúng ngôn ngữ**. Không bóp méo thuật ngữ ngữ pháp hay nghĩa lõi để "cố viết khác". |
| **Tầng 2: Biểu đạt sư phạm (Expression Layer)** — *Viết mới 100%* | Tóm tắt bài (`summary`), mục tiêu (`objectives`), lời giải thích ngữ pháp (`usage`), lưu ý lỗi sai (`error`), câu ví dụ (`examples`), bài đọc (`reading`, `warmupReading`), hội thoại (`dialogues`), câu hỏi & giải thích đáp án (`practice`), ghi chú phân biệt từ (`note`, `intro`) | **Không sao chép, không "xào chữ" (shallow paraphrase)**. Phải cắt đứt văn bản gốc qua bước Blueprint rồi tự diễn giải theo khung sư phạm riêng của app. |

---

## 2. Quy trình Clean-Room 2 tầng (4 bước)

```text
[Nguồn Hanzii / Dữ liệu cũ]
       │
       ▼  Bước 1: extract-blueprint (Lọc sạch văn bản diễn đạt & ví dụ nguồn)
[Knowledge Blueprint (.blueprint.json)]  ← Chỉ còn: ID bài, chủ đề, danh sách từ, tên cấu trúc, chức năng lõi
       │
       ▼  Bước 2: Authoring (AI / Biên tập viên chỉ nhìn Blueprint, KHÔNG nhìn văn bản gốc)
[Bản bài học biên soạn mới (rewritten-lesson.json)]
       │
       ▼  Bước 3: verify (So đối chiếu tự động với Nguồn + Schema app HSK)
[Báo cáo kiểm định: 0 câu trùng, n-gram dưới ngưỡng, đủ từ/ngữ pháp, khớp schema]
       │
       ▼  Bước 4: apply-lesson (Chủ dự án duyệt → ghép vào lesson-content-hskN.json / content/data/)
```

**Vì sao bước `extract-blueprint` là bắt buộc?**
Nếu đưa thẳng đoạn giải thích hoặc ví dụ của Hanzii vào prompt rồi bảo "hãy viết lại cho khác", kết quả rất dễ rơi vào **paraphrase bề mặt** (giữ nguyên cấu trúc câu, trật tự ý, tên nhân vật, bối cảnh ví dụ). Khi ép đi qua **Blueprint khô** (chỉ có từ khóa kiến thức), người/AI viết bài buộc phải tư duy lại cách giải thích và sáng tác bối cảnh giao tiếp hoàn toàn mới.

---

## 3. Khung diễn giải lại chuẩn cho từng phần của bài học

### 3.1. Mục tiêu & Tóm tắt bài (`objectives`, `summary`)
- Viết theo hướng **năng lực giao tiếp đầu ra** ("Sau bài này bạn có thể làm gì trong tình huống thực tế"), thay vì chỉ liệt kê lại đề mục sách.
- Nêu rõ cách học thực hành trong app (nghe – đọc mẫu – đổi vai – tự đặt câu).

### 3.2. Ngữ pháp (`grammar[]`) — Khung 4 điểm thống nhất của app
Mỗi điểm ngữ pháp giữ đúng cấu trúc JSON của `src/modules/lessons/lessons.js` (`title`, `pattern`, `usage`, `error`, `examples`), nhưng tuân thủ văn phong chuẩn:
1. **`title`**: Đặt theo **chức năng giao tiếp** (ví dụ: *Xác định danh tính người bằng 谁* thay vì chỉ chép tiêu đề sách).
2. **`pattern`**: Ghi công thức bằng ký hiệu thống nhất của app (`[Chủ ngữ] + 是 + 谁？`).
3. **`usage`**: Giải thích theo 2 ý mạch lạc:
   - *Khi nào dùng* (ngữ cảnh nói/viết thực tế).
   - *Vị trí & nguyên tắc ghép câu* (trật tự thành phần trong câu tiếng Trung).
4. **`error`**: Chỉ thẳng **lỗi thực tế người Việt hay mắc** (dịch từng chữ từ tiếng Việt sang tiếng Trung, đặt sai vị trí trợ từ, nhầm sắc thái) và đưa cách sửa đúng.
5. **`examples[]`**:
   - Sáng tác **tình huống đời sống mới hoàn toàn** (lớp học, văn phòng, quán cà phê, gia đình, du lịch, mua sắm).
   - Không dùng lại câu nguồn từ Hanzii hay giáo trình; đổi chủ thể, tân ngữ và ngữ cảnh.
   - Đủ `cn`, `pin` (có dấu thanh chuẩn), `vi` (dịch tự nhiên theo tiếng Việt hiện đại).

### 3.3. Bài đọc (`warmupReading`, `reading`) & Hội thoại (`dialogues`)
- **Cốt truyện & bối cảnh mới 100%**, không tóm tắt lại nội dung bài khóa gốc.
- Đảm bảo đáp ứng toàn bộ yêu cầu kiểm thử của `tools/check-content.cjs`:
  - `reading.kind = "long-form-original"`
  - `reading.lines.length >= 3`
  - `reading.characterCount` bằng đúng tổng số chữ Hán (`[\u3400-\u9fff]`) và đạt tối thiểu theo cấp HSK:
    - HSK 1: `>= 120` chữ Hán
    - HSK 2: `>= 180` chữ Hán
    - HSK 3: `>= 200` chữ Hán
    - HSK 4: `>= 280` chữ Hán
    - HSK 5: `>= 320` chữ Hán
    - HSK 6: `>= 400` chữ Hán
  - `reading.lessonApplication`: toàn bộ từ vựng mục tiêu của bài (`vocabularyUsed`) và toàn bộ điểm ngữ pháp (`grammarApplied`) xuất hiện tự nhiên trong bài đọc (`grammarMissing: []`).
- Mỗi câu hỏi trong `practice[]` phải bám **đúng nội dung** của đoạn đọc/khởi động mà nó nêu (`source: "warmup"` thì bám `warmupReading`, `source: "reading"` thì bám `reading`).

### 3.4. Dữ liệu từ vựng & ví dụ trong `content/data/`
Khi làm sạch các mục còn gắn Hanzii trong `content/data/`:
- **Giữ nguyên** các khóa học (`hsk|han|pin`) trong `content/data/words.js` để không ảnh hưởng SRS, tiến độ học và `tools/check-content.cjs`.
- **Thay thế hoàn toàn** các câu ví dụ có `origin: "hanzii"` trong `checkedPracticeExamples.js` (4.428 câu) và `example` trong `dictionarySupplement.js` (4.578 câu) bằng câu tự biên soạn (`origin: "authored"`), bảo đảm mỗi câu chứa đúng từ mục tiêu `han` và minh họa đúng sắc thái nghĩa `sense`/`meaning`.
- **Viết lại** ghi chú phân biệt (`note`, `intro`) trong `confusableGroups.js` và các ví dụ/nhãn cứng nhắc tới Hanzii trong `src/ui/dictionary-relations.js`.
- **Gỡ bỏ** các liên kết/nhãn lệ thuộc Hanzii (`hanzii.net`, `"source": "Hanzii"`, `"Ví dụ Hanzii"`) sau khi nội dung tương ứng đã được tự biên soạn và qua kiểm định.

---

## 4. Ngưỡng kiểm định chống trùng lặp tự động (`tools/content_originality_pipeline.py`)

Mọi bản viết lại phải vượt qua đồng thời **2 cổng**:

### Cổng A — Originality Gate (An toàn bản quyền)
1. **Không trùng nguyên câu tiếng Trung**: `exact_cn_matches == 0` (sau khi chuẩn hóa dấu câu, khoảng trắng).
2. **Trùng cụm chữ Hán (5-gram)**: tỷ lệ 5-gram chữ Hán trùng với văn bản gốc `<= 0.08` (đã loại trừ các từ vựng mục tiêu của bài và ký hiệu cấu trúc ngữ pháp bắt buộc để tránh báo giả).
3. **Trùng cụm từ tiếng Việt (4-gram)**: tỷ lệ 4-gram tiếng Việt trùng giữa phần diễn giải mới (`summary`, `grammar.usage`, `grammar.error`, `examples.vi`, `practice.explanation`) với văn bản nguồn `<= 0.12`.
4. **Độ tương đồng từng cặp trường tiếng Việt (word-level `SequenceMatcher`)**: không có cặp trường diễn giải nào (>= 6 từ) vượt quá `0.45`.
5. **Không còn dấu vết nguồn bị cấm**: 0 lần xuất hiện `hanzii`, `hanzii.net`, `Ví dụ Hanzii`, `"origin": "hanzii"` trong bản mới.

### Cổng B — Knowledge & App Schema Gate (Giữ đúng kiến thức & tương thích app)
1. Khớp đầy đủ khóa dữ liệu bắt buộc của `src/modules/lessons/lessons.js` và `tools/check-content.cjs`.
2. Đủ số lượng điểm ngữ pháp và giữ đúng từ vựng mục tiêu trong bài đọc (`vocabularyNotUsed` không tăng so với blueprint, `grammarMissing == []`).
3. `reading.characterCount` khớp chính xác tổng ký tự Hán và đạt ngưỡng tối thiểu theo cấp HSK.
4. Tất cả `examples`, `reading.lines`, `dialogues[].lines` có đủ `cn`, `pin`, `vi` khác rỗng.
5. `practice[]` có ID duy nhất, `answer` nằm trong `[0, options.length - 1]`, có `explanation`.
6. Mọi `vocabReplacements` (nếu có) đều chứa đúng từ `han`, đủ `cn`/`pin`/`vi`, `origin == "authored"` và không trùng câu nguồn Hanzii.

---

## 5. Cách dùng công cụ CLI

```bash
# 1. Kiểm kê toàn bộ dấu vết Hanzii / nguồn ngoài hiện có trong repo
python3 tools/content_originality_pipeline.py audit-repo --out tools/originality-pilot/repo-audit-report.json

# 2. Tách khung kiến thức sạch (Blueprint) từ 1 bài có sẵn trong repo
python3 tools/content_originality_pipeline.py extract-blueprint \
  --lesson-id standard-1-04 \
  --out-dir tools/originality-pilot/standard-1-04

# 2b. Hoặc tách Blueprint từ 1 file dữ liệu thô mới lấy từ Hanzii (JSON hoặc Markdown)
python3 tools/content_originality_pipeline.py extract-blueprint \
  --raw-input path/to/hanzii-raw-lesson.json \
  --out-dir tools/originality-pilot/custom-lesson

# 3. Kiểm định bản đã viết lại (so với nguồn gốc + kiểm tra schema app)
python3 tools/content_originality_pipeline.py verify \
  --candidate tools/originality-pilot/standard-1-04/rewritten-lesson.json \
  --source tools/originality-pilot/standard-1-04/source-snapshot.json \
  --blueprint tools/originality-pilot/standard-1-04/blueprint.json \
  --report tools/originality-pilot/standard-1-04/verification-report.json

# 4. Áp dụng vào dữ liệu thật (mặc định dry-run; thêm --write khi đã duyệt)
python3 tools/content_originality_pipeline.py apply-lesson \
  --candidate tools/originality-pilot/standard-1-04/rewritten-lesson.json
```

---

## 6. Lộ trình làm sạch repo theo mức độ ưu tiên rủi ro

1. **Ưu tiên 1 (Rủi ro bản quyền cao nhất — hiển thị trực tiếp câu/nhãn Hanzii)**:
   - `src/ui/dictionary-relations.js`: thay 2 ví dụ cứng gắn `'Ví dụ Hanzii'`, đổi câu chữ nhãn UI trung lập.
   - `content/data/checkedPracticeExamples.js`: thay thế theo từng cấp HSK (HSK 1 → 6) toàn bộ 4.428 câu có `origin: "hanzii"` bằng câu `origin: "authored"` (có kiểm chứng tự động qua `verify`), sau đó xóa `checkedAgainst` trỏ `hanzii.net`.
   - `content/data/dictionarySupplement.js`: thay thế theo lô 4.578 câu `example` lấy từ `hanzii.net` và gỡ `url` trỏ Hanzii; giữ lại `meanings` chuẩn xác sau khi chuẩn hóa.
2. **Ưu tiên 2 (Trung bình — ghi chú & quan hệ từ)**:
   - `content/data/confusableGroups.js`: viết lại `note`/`intro` theo văn phong app, gỡ `url` Hanzii.
   - `content/data/wordRelationsData.js` & `content/data/words.js`: làm sạch metadata nguồn (`source`, `url`, `vocabularyProvenance`) sau khi hoàn tất biên soạn lại.
3. **Ưu tiên 3 (Chuẩn hóa & đồng nhất toàn bộ 146 bài học + nhập dữ liệu mới)**:
   - Chạy qua quy trình Blueprint → Author → Verify cho từng cấp HSK (15 bài HSK 1, 15 bài HSK 2, 20 bài HSK 3, 20 bài HSK 4, 36 bài HSK 5, 40 bài HSK 6) và mọi gói dữ liệu bài học mới nhập từ Hanzii.
   - Chạy `node tools/check-content.cjs`, nén lại `.js.gz` khi sửa `content/data/`, và cập nhật gói PWA bằng `python3 tools/prepare-pwa-release.py` trước khi phát hành.
