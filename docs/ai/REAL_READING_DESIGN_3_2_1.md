# Thiết kế Đọc thực tế & Kịch bản — HSK 3.2.1

Trạng thái: **bản thiết kế, chưa triển khai vào giao diện sản xuất** (2026-10-16). Nhánh `design/real-reading-hsk-321`. Không làm thay đổi điểm bài học, SRS, API AI hay data sản xuất.

## 1. Phiên bản/điểm nối đã xác minh
- GitHub `origin/main` = `880ea36c263e3b885019cc57eae48d404e222227`; local sạch, `app-version.json` = `hsk-offline-r3-2-1` khi khảo sát.
- App: static `index.html`, `studio.js` (routes), `lessons.js` + `lesson-content-hsk1..6.json` (146 bài chuẩn, đọc & hội thoại), `practice-selector.js/css` (chế độ Luyện & Ôn).
- Tái dùng `HSKSpeech.button`, `HSKLessons.match()` và `HSKLessons.key()`; tra cứu `open-dictionary.js`; lưu từ qua `HSKNotebook.button(() => word)` hoặc `HSKNotebook.openEditor()`; hồ sơ lỗi `ai-coach.js` chỉ qua API ghi nhận câu trả lời đã kiểm chứng. Kiểm tra giao diện trong `tools/check-reading-ui.cjs`, `check-reading-dom.cjs` và các test khác.

## 2. Mục tiêu & nguyên tắc UX
- Học tiếng Trung qua nguồn đời thực: công việc, ăn uống, giao thông, thuê nhà, mua sắm, trường học, sức khỏe, du lịch, công nghệ. Tránh tin giật gân/chính trị nhạy cảm làm nguồn mặc định.
- Luồng A: **Kho chọn lọc** theo HSK 1–6, thể loại `Đời sống`, `Đối thoại`, `Truyện`, `Tin mới`, `Truyện tranh`. Lấy nguồn online theo lịch, bộ dữ liệu đã xuất bản và kiểm duyệt trước; offline chỉ cache bài đã mở (nếu được phép).
- Luồng B: **Dán URL nguồn** (chỉ HTTPS, danh sách host uy tín; khác host phải kiểm tra thêm). Hiện tiêu đề + URL + trích đoạn preview, người dùng bấm **Chuyển thành bài HSK** để chủ động gọi AI.
- Màn đầu không xổ 12 thẻ dài: trong `Bài học` thêm đúng 1 thẻ **Đọc thực tế**; trong bộ chọn chế độ `Luyện & Ôn` thêm 1 mục checkbox/route `real-reading`; không thêm danh sách trùng.
- Trang đọc: `← Quay lại · Đọc thực tế · HSK 3`; tab nhỏ `Kho bài | Dán link`; bộ lọc `Tình huống | Truyện | Tin tức | Truyện tranh`; 1 thẻ chọn bài; mặc định mở **Kịch bản**; nút chuyển `Kịch bản / Văn bản`, `Pinyin` và `Nghĩa` độc lập. Bật/ẩn theo cả bài hoặc từng câu; pinyin/tiếng Việt mặc định ẩn nếu người học đã chọn tự thử.
- Script: tên người nói, bối cảnh/hành động ngắn **tiếng Việt**, câu Hán tự chữ to thoáng dòng, nút 🔊 cạnh câu, không ưu tiên mic/chấm phát âm. Từ mới HSK được gạch chấm tím; từ vượt cấp hiển thị tag; chạm mở giải nghĩa/lưu sổ ngay trên mobile. Nút "Xem bài gốc ↗" luôn ở đầu bài.
- Cuối bài: **3 câu đọc hiểu** (thông tin rõ, nguyên nhân/ngữ cảnh, suy luận nhẹ). Sai hiển thị câu gốc giải thích và có thể ghi vào nhóm lỗi Đọc theo API hiện có; không tự cộng mastery/SRS khi chỉ xem, lướt, nghe hoặc AI đoán đúng.

## 3. Danh mục nguồn ưu tiên & thực chứng
| Nguồn | Mức ưu tiên | Bài cụ thể/loại | Trạng thái khi khảo sát |
| --- | --- | --- | --- |
| China Daily tiếng Trung | 1 | https://cn.chinadaily.com.cn/a/202605/02/WS69f564a5a310942cc49aa8f6.html (văn hóa cà phê ở Thượng Hải) | HTTP 200 máy Lenovo; nội dung dài, bối cảnh đời sống |
| 36Kr | 2 | https://www.36kr.com/p/1470282839229576 (thói quen ăn sáng người trẻ) | URL trực tiếp timeout trên Lenovo; **Jina Reader 200**, đã trích xuất Markdown |
| Mandarin Bean | 3 (bài theo HSK) | https://mandarinbean.com/change-of-life/ (HSK 3, thay đổi cuộc sống); https://mandarinbean.com/ask-for-leave/ (HSK 3, xin nghỉ) | Trang đọc trực tiếp có phân cấp; điều khoản Premium/cho phép tái sử dụng phải kiểm tra |
| Zhihu Daily | thử nghiệm, không phụ thuộc | https://news-at.zhihu.com/api/4/news/latest | Tài liệu cộng đồng nói có endpoint, nhưng **DNS không phân giải** trên máy Lenovo lúc kiểm tra |
| Douban/Bilibili/Kuaikan | chỉ chọn tay | Liên kết gốc, chủ yếu truyện & comic | Dynamic/login/ảnh có bản quyền, không tự cào thành kho mặc định |

Không nhầm bài gốc với bản chuyển thể. Mỗi bài luôn gắn tên nguồn, tiêu đề nguồn, URL, thời điểm lấy và ghi `Bản chuyển thể học tập`. Chỉ lưu bản tóm tắt/chuyển thể với phạm vi quyền đã kiểm chứng; bài gốc dài và hình truyện tranh không được mirror khi chưa có quyền.

## 4. Pipeline dữ liệu đề xuất
```text
[Kho biên tập/nguồn RSS hoặc URL tự dán]
  → chuẩn hóa canonical https URL, host allowlist, chặn IP/private/redirect nguy hiểm
  → server-side extraction (nguồn HTML/RSS trước, Jina Reader fallback)
  → main-content extraction: title, published_at, body, source_url, language, license metadata
  → 300–3000 chữ đầu đủ ngữ cảnh, chống prompt injection, loại menu / quảng cáo / boilerplate
  → Gemini qua Worker (chỉ sau xác thực & người dùng yêu cầu/biên tập lịch)
  → strict JSON schema, đối chiếu lại ý chính và tên riêng với nguồn, duyệt độ phù hợp HSK
  → cache dữ liệu online (Cloudflare R2/KV), index danh mục theo HSK/chủ đề/ngày, TTL
  → client render với textContent (không innerHTML từ bài), pinyin/vi toggles, audio TTS
  → từ vựng → quick lookup / notebook; 3 câu quiz → tracking đọc (không nhầm SRS)
```
- Không fetch `r.jina.ai` trực tiếp trong JS iPhone: CORS/latency/rate-limit/độ tin cậy không được bảo đảm. Worker server-to-server, giới hạn domain/redirect, 12–20 giây timeout, 1 lần retry có backoff, cache theo SHA-256(URL, hsk, source hash, prompt version).
- Jina Reader không mặc định **0 đồng/vô hạn**: theo tài liệu Jina có limit 20 RPM không API key, độ trễ trung bình khoảng 7.9 giây; khi dịch vụ lỗi, show link bài gốc và nút thử lại. Jina là bên thứ ba nhận URL và nội dung truy vấn.
- Chống SSRF/cost abuse: chỉ HTTPS, reject IP literal, localhost, private/VPC/metadata/port lạ, credentials, URL quá dài, loop redirects; ưu tiên `ALLOWED_READING_HOSTS`; auth Firebase verify giống Worker hiện có, cooldown per UID, quota ngày, cap bytes (đầu vào 3k–6k chữ), body limit, no unbounded crawls.
- **Bản 3.2.1 Worker**: `server/translator-worker.mjs` không có route reading và đang yêu cầu token Firebase cho AI; triển khai bằng `/reading-extract` + `/reading-adapt` (có thể tách module `server/reading-service.mjs`), cập nhật build bundled và deploy Worker riêng. Không bỏ qua xác thực, không chuyển Gemini API key/Jina key vào client.
- Biên tập kho hằng ngày: cron → RSS/public URL list → lọc đời sống → cache/extract → AI tóm tắt & soát lỗi → duyệt & xuất bản; tránh cào nội dung hàng loạt khi không có quyền. Chỉ load metadata/danh sách ban đầu; bài chi tiết lazy load, giữ PWA gọn.

## 5. HSK grading & chất lượng
- HSK 1–2: 4–6 lượt thoại, mỗi lượt 8–16 chữ Hán (linh hoạt với tên riêng); 2 từ đời sống vượt cấp tối đa, bối cảnh đơn giản.
- HSK 3–4: 6–8 lượt, mỗi lượt 10–28 chữ; 2–3 từ đời sống mới, cấu trúc HSK cấp đích.
- HSK 5–6: 8–12 lượt, chú trọng thái độ, suy luận, đoạn giải thích; 3–4 từ đời sống mở rộng.
- Tỷ lệ từ trong cấp đo bằng `server/hsk-vocabulary.mjs` hoặc kho từ học hiện tại; **không** ép 80% theo cách đếm ký tự. Theo dõi `coverage`, từ mới, độ dài câu, điểm ngữ pháp; nếu HSK 1–2 quá khó → regenerate/biên tập.
- AI không được phát minh quan điểm/sự kiện/quote/tên người/địa điểm; phân biệt rõ **chuyển thể tình huống lấy cảm hứng từ bài gốc** khác với lời thoại trích nguyên văn. Câu hỏi chỉ dựa trên script cuối, không dựa vào phần nội dung đã bị cắt.

## 6. JSON contract tối thiểu
```json
{
  "id": "36kr-breakfast-hsk3-v1",
  "source": {"site": "36Kr", "title": "谁偷走了我们的早餐？", "url": "https://www.36kr.com/p/1470282839229576", "fetchedAt": "ISO-8601", "sourceHash": "sha256", "permission": "review-required"},
  "hsk": 3, "topic": "Ăn uống", "status": "adapted", "generatedAt": "ISO-8601",
  "titleZh": "为什么有些年轻人不吃早饭？", "titleVi": "Vì sao một số người trẻ bỏ bữa sáng?",
  "paragraphMode": [{"hanzi": "...", "pinyin": "...", "vi": "..."}],
  "scriptMode": [{"speaker": "Tiểu Minh", "stageNote": "Vừa đến công ty, xách đồ ăn sáng", "hanzi": "...", "pinyin": "...", "vi": "..."}],
  "realWorldVocab": [{"word": "...", "pinyin": "...", "meaning": "...", "hsk": null}],
  "quiz": [{"question": "...", "options": ["...", "...", "...", "..."], "answerIndex": 0, "evidence": "...", "explanationVi": "..."}]
}
```
Nội dung `...` là **placeholder**, không được xem là câu hỏi/bản dịch đã kiểm chứng. Schema validation bắt buộc: tối thiểu 1 paragraph, 4 script lines, quiz **đúng 3 câu**, options 3–4, đáp án trong phạm vi; pinyin và vi tương ứng câu Hán; không HTML/script từ nguồn ngoài.

## 7. Các bước triển khai trên app
1. PR độc lập: core `real-reading-core.js` (validations, URL rules, filter/word segmentation) + unit tests; source catalog mẫu chỉ metadata URL thật; không đụng SRS.
2. PR UI: `real-reading.js/css`, một `section[data-studio-hub-panel=real-reading]`; route `real-reading` trong `studio.js`, 1 lối vào Bài học, 1 checkbox trong `practice-selector.js`; focus one-hand trên 320/390/1440, có lối về.
3. PR API/Worker: `/reading-extract` + `/reading-adapt`, tests auth/SSRF/cache/rate limit/AI JSON injection + bundle + deploy staging. Đặt key server-side, không gọi Gemini từ HTML.
4. PR bài đọc nguồn thật: chuyển thể từng nguồn qua biên tập; kiểm tra ngữ pháp, pinyin, nội dung gốc, 3 đáp án, metadata; ghi nguồn và kiểm toán quyền.
5. Tích hợp tra từ / lưu notebook / quiz đọc (loại lỗi Đọc) vào API hiện có; không sửa thuật toán chấm điểm lesson/SRS.
6. Hồi quy đầy đủ (reading UI, mobile UX, studio, quiz/SRS, API tests), build PWA mới và đối chiếu trên điện thoại đã cài **trước khi merge main**.

## 8. Quy tắc hoàn thành / không làm
- Không xuất bản bài giả mạo là bài thực tế; link chết báo rõ trạng thái thay vì tạo nội dung thay thế không gắn nguồn.
- Không tự thay đổi target HSK toàn app khi người dùng mở bài riêng; cấp HSK đọc mặc định theo mục tiêu, có thể đổi tại màn đọc.
- Không giả số % tiến độ AI; loading phụ thuộc request thật; cancel khi đóng màn/đổi tài khoản.
- Không tải ảnh truyện tranh/audio bài báo hoặc tái bản nguyên văn nếu quyền chưa bao trùm.
- Kiểm tra PWA, dark/light, thao tác 1 ngón; không làm tăng kích thước bundle offline đáng kể.
