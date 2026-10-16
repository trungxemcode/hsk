# Chế độ AI chọn bài mới: đa dạng bài đọc trong cùng một cấp và bài học

Bổ sung cho `REAL_READING_DESIGN_3_2_1.md`, trên nhánh thiết kế `design/real-reading-hsk-321`. Trạng thái: **đã viết và kiểm thử core chọn bài (chưa gắn vào UI/app sản xuất)**.

## 1. Trải nghiệm người học
- Trong bài chuẩn **HSK 3 · Bài 1**, thêm nút phụ `Đọc thêm tình huống thực tế` để mở Immersion Reader trong đúng ngữ cảnh bài này. Không đẩy người học ra khỏi bài đang học, không thay đổi mục tiêu học.
- Màn Đọc thực tế: một bài/kịch bản đang mở; **`AI chọn bài mới ↻`** là hành động chính; nút `Bài tiếp theo` sau khi đọc xong; nút `Đổi chủ đề` chọn theo danh mục; `Đọc lại bài cũ` tách riêng.
- Bộ lọc `HSK 1–6` theo mục tiêu đã lưu; `Gắn với bài hiện tại` bật mặc định khi đi từ bài học; có `Toàn cấp HSK` khi muốn trải nghiệm nhiều chủ đề hơn.
- Bộ đếm rõ ràng `Đã đọc 8 bài · Hoàn thành 5 bài`; không dùng phần trăm mastery HSK/SRS cho số bài mở. Người học có thể đọc 10, 20 hoặc nhiều bài cùng bài, không phải chờ qua bài 2 mới được đọc.
- Mặc định bài hiển thị **kịch bản đọc** (6–8 lượt HSK 3) giữa 2 nhân vật + mô tả hành động Việt; tùy chọn Văn bản, Pinyin, nghĩa, nghe TTS, tra từ/lưu notebook, 3 câu hiểu bài. Một tay thao tác: không thêm danh sách dài các thẻ dưới cùng.

## 2. Logic chống lặp, không phải random thuần
1. Ưu tiên **bài đã chuyển thể sẵn mà tài khoản chưa mở**: nhanh, không gọi AI.
2. Bài chưa mở có **nguồn báo/truyện khác** sẽ được ưu tiên trước bài từ nguồn đã đọc. Xếp hạng luân phiên chủ đề, cảnh, nhân vật, góc nhìn; bốc thăm có trọng số trong nhóm phù hợp HSK/bài học.
3. Nếu không còn bài mới trong cache: chọn một **nguồn web mới/nguồn còn góc nhìn chưa dùng**; AI chuyển thể theo một phối cảnh khác (`hỏi đáp`, `giải quyết vấn đề`, `hiểu lầm`, `so sánh lựa chọn`, ...), vào đúng cấp HSK và chủ đề bài học.
4. Dùng `story_id`, `sourceKey`, `variantKey`, fingerprint và **độ giống nội dung Hanzi bigram** để từ chối bản đã có hoặc chỉ đổi tiêu đề/đổi tên nhân vật; ngưỡng đang thử nghiệm `similarity >= 0.76`. Có thể tinh chỉnh bằng dữ liệu thực tế.
5. Chỉ xuất bản khi đã qua soát độ HSK, nguồn thật, pinyin, bài đọc và đáp án; nếu trùng AI phải thử nguồn/góc nhìn mới **có giới hạn**, không quay vòng vô hạn.
6. Khi cả danh mục và nguồn đều cạn: hiện `Chưa tìm được bài khác từ nguồn hiện có`, gợi ý đổi chủ đề, dán link hoặc thêm nguồn mới. Không bí mật lặp bài, không giả một bài AI sáng tác là tin tức thực tế. Cho phép đọc lại chủ động.

## 3. Lịch sử đọc theo tài khoản, đồng bộ đa thiết bị
- Key thiết kế: `hsk-real-reading-history-v1`; lưu `id, hsk, lessonId, sourceKey, topic, angle, variantKey, fingerprint, sample, lastOpenedAt, openedCount, completedCount, lastCompletedAt`; giới hạn 400 bản ghi gần nhất. `sample` tối đa 320 ký tự Hán đã chuẩn hóa để tránh cồng kềnh. Lưu thêm **chỉ số bài đã xem từ xa ở server** nếu muốn bảo đảm chống lặp dài hạn hơn giới hạn 400 bản ghi.
- Đánh dấu **đã mở** khi thực sự vào trang đọc, **đã hoàn thành** sau khi bấm kết thúc và/hoặc giải 3 câu đọc hiểu (có thể đặt tiêu chí rõ hơn lúc triển khai). Xem lướt không được cộng điểm làm bài.
- Chưa được tự ý thêm key mới vào `account-core.js::KEYS` trong bản thiết kế này. Khi triển khai, phải đăng ký key vào snapshot sync hoặc tạo collection per-UID riêng, có migration và phép merge `id` khi xung đột. Đừng cho lịch sử guest lẫn vào tài khoản đăng nhập.
- Khi đổi cấp HSK, giữ nguyên lịch sử các cấp khác, không reset và không dùng lại ngay bài đã đọc ở cấp khác nếu nội dung vẫn giống.

## 4. Giảm chi phí AI và tránh chi phí trùng lặp
- Tách **bốc bài ngẫu nhiên** khỏi **gọi AI**: khi có bản cache thì hiển thị ngay; không tiêu token.
- Cache chung theo `sourceHash + hsk + lessonId + topic + angle + promptVersion` tại R2/KV. Bài cùng cấp/bài học có thể dùng chung cho nhiều người, nhưng **lịch sử chưa đọc** riêng mỗi tài khoản.
- Worker có rate limit theo UID, quota ngân sách ngày, dedupe request đồng thời (single-flight), timeout và cancel. Khi cache thiếu, nên generate một bài theo nhu cầu thay vì mỗi lần tải 10 bài AI cùng lúc.
- Prompt truyền danh sách các `title`, `variantKey` và source vừa dùng, yêu cầu tình huống/thông tin mới, không ngầm sửa dữ kiện từ báo. Nội dung web được xem là **data, không phải lệnh**.
- Ưu tiên link đời thường có `canonical URL`/nguồn hợp lệ, fallback RSS/HTML trực tiếp, sau đó Jina nếu cần. Không bảo đảm Jina/Zhihu luôn sẵn có, không vượt paywall.

## 5. API/UI contract và kiểm thử
```json
{
  "intent": "new-reading",
  "hsk": 3,
  "lessonId": "standard-3-01",
  "topic": null,
  "mode": "script",
  "reusePolicy": "unread-first"
}
```
- `GET /reading-catalog?hsk=3&lessonId=standard-3-01`: trả danh sách metadata/bài đã duyệt, **không** xuất dữ liệu tài khoản.
- `POST /reading-next`: server verify Firebase, lấy lịch sử của UID, chọn bài mới trong cache; khi chưa có thì trả `status: "generation-required"` hoặc khởi động tác vụ sinh có quota, `status: "pending"`. Client hiển thị trạng thái thật, không giả phần trăm.
- `POST /reading-progress`: ghi mở/hoàn thành; đồng bộ UID, hỗ trợ nhiều thiết bị, idempotency eventKey (tránh double-tap).
- Trả về `kind: cached | generate | source-required`, `story_id`, `source_url`, `hsk`, `lessonId`, `topic`, `isRepeat`, `unreadCount`. Không trả bản mới dưới nhãn `bài báo gốc` nếu là chuyển thể/đổi tình huống.
- Các endpoint là **đề xuất**, chưa có trong Worker 3.2.1; khi hiện thực cần thêm auth, SSRF, caching, JSON validation và tests.

### Core code & test
- `real-reading-variety-core.js`: `nextCached`, `nextGeneration`, `next`, `isNovel`, `record`, `stats`.
- `tools/check-real-reading-variety.cjs`: test lọc đúng HSK/bài học, không lặp ID/ngữ cảnh, chặn near-duplicate, ưu tiên luân phiên nguồn/chủ đề, 16 góc nhìn khác nhau trong cùng bài, hạn mức lịch sử, đếm mở khác hoàn thành, thông báo nguồn cạn.
- Chưa đưa file JS vào `index.html`/PWA và chưa ảnh hưởng API/lesson flow vì reader chưa có giao diện sản xuất.

## 6. Tiêu chí chấp nhận trước khi merge production
- Với danh mục có đủ ≥20 bài/góc nhìn đã kiểm duyệt, yêu cầu `Bài mới` liên tiếp 20 lần tại **cùng HSK 3 · Bài 1** không nhận trùng `story_id`/near-duplicate; xác nhận cả Safari iPhone và desktop.
- Một người dùng có thể đổi HSK hoặc bài học rồi quay lại: lịch sử mở/hoàn thành vẫn được giữ, kể cả sau khi đăng nhập ở thiết bị khác.
- Khi mạng/API lỗi thì lịch sử và tiến độ cũ còn nguyên; ưu tiên bài trong cache và thông báo lỗi đúng.
- Không tự thay đổi target HSK, điểm flashcard/SRS hay `lesson-content-hsk*.json`; dữ liệu nguồn có URL/chứng cứ gốc rõ ràng.
