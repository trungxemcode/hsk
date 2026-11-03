# HSK — Chỉ dẫn tìm đúng file cho AI

> Đặt file này ở gốc repository và dẫn tới nó từ `AGENTS.md`. Đây là bảng định tuyến bổ sung, không thay thế quy tắc bảo toàn chức năng, kiểm thử và quyền triển khai trong repo.
> Đối chiếu ngày 03/11/2026 với `trungxemcode/hsk`, nhánh `main`, commit `d5c500d490d77b62705c49079255a86375cafc3c`. Khi code đổi, xác nhận lại đúng phần cần sửa; không đọc lại toàn repo.

Cách dùng ít token: lần đầu chỉ đọc 25 dòng đầu; sau đó tìm đúng hàng bằng `rg -n 'nhạc|karaoke' HSK_AI_FILE_GUIDE.md` (đổi từ khóa theo nhiệm vụ). Không tự động nạp toàn bộ file này vào mỗi request. Các mục 4–7 chỉ đọc khi cần.

## 1. Quy trình bắt đầu ngắn

1. Xác nhận đúng checkout bằng `git remote -v`, `git status -sb`, `git log -1 --oneline`. Không in remote URL nếu có credential nhúng trong URL. Không reset hoặc ghi đè thay đổi có sẵn.
2. Đọc `AGENTS.md` một lần mỗi phiên. Dùng bảng ở mục 3 để chọn file; chỉ mở phần liên quan của `docs/ai/PROJECT_MAP.md` hoặc `CO_CHE_APP.md` khi thiếu thông tin.
3. Ghi một dòng nội bộ: `Chức năng → route/ID → file sở hữu → file phụ thuộc cần xác nhận`. Không bắt đầu bằng quét tất cả thư mục.
4. Tìm symbol/ID trước, đọc phần chứa symbol sau. Thường chỉ cần 2–5 file nguồn đầu tiên; đây là mục tiêu tiết kiệm, không phải giới hạn buộc bỏ qua phụ thuộc.
5. Chỉ mở rộng tìm kiếm khi có bằng chứng: import, loader, event, endpoint, selector hoặc caller dẫn sang file khác.

Nguồn xác thực: code đúng nhánh/commit đang làm > cấu hình và thứ tự nạp thực tế > bản đồ này/tài liệu lịch sử. Không dùng ngày ghi trong một đoạn tài liệu cũ để kết luận tính năng chưa triển khai. `TASK_STATE.md` chỉ cần khi tiếp tục một công việc dang dở.

## 2. Nhận đúng kiến trúc trước khi tìm

- App là HTML/CSS/JavaScript thuần, không mặc định là React hoặc dự án cần `npm run build`.
- `index.html`: DOM, ID, menu, panel và các script khai báo trực tiếp. `loader.js`: thứ tự nạp dữ liệu/script, fallback gzip và luồng nạp nhạc độc lập. Kiểm cả hai nếu lỗi khởi tạo.
- `app.js`: trạng thái và cơ chế học dùng chung còn ở gốc; không coi đây là chủ sở hữu mọi giao diện.
- JS tính năng nằm trong `src/modules/<nhóm>/`; CSS phần lớn vẫn ở gốc. Không tìm `music.css` hoặc `mobile-ux.css` trong `src/modules/` theo phỏng đoán.
- Các file dữ liệu lớn nằm ở `content/data/`, các JSON bài học ở gốc; chỉ đọc bản ghi cần thiết. Bản `.gz` là dữ liệu nén, không phải file nguồn để sửa tay.
- Frontend GitHub Pages và backend Cloudflare là hai nơi triển khai riêng. Merge frontend không chứng minh endpoint Worker đã cập nhật.

## 3. Bảng định tuyến theo yêu cầu

Đường dẫn trong bảng tính từ gốc repo. Cột cuối chỉ đọc khi triệu chứng thực sự liên quan.

| Yêu cầu/lỗi | Mở trước | Đọc tiếp khi cần |
| --- | --- | --- |
| Sidebar PC, drawer điện thoại, 5 nhóm menu, mở trang sai, bấm lại về Home | `src/modules/shell/studio.js` | `index.html`, `studio-layout.css`; symbol `navigate`, `repeatedDestination` |
| Nút HSK góc phải, menu 3 gạch, bộ chọn cấp độ | `src/modules/shell/mobile-layout.js` | `mobile-layout.css`, `studio.js`; tìm `levelPill`, `openFilter`, `menuBtn` |
| Thanh điều hướng dưới, bố cục/focus trên điện thoại | `src/modules/shell/mobile-dock.js`, `src/modules/shell/mobile-ux.js` | `mobile-ux.css`, `mobile-layout.css`; đối chiếu breakpoint thực tế |
| Trang chủ, Từ vựng hôm nay, nút chuỗi ngày | `src/modules/shell/home-overview.js` | `home-overview.css`, `index.html` |
| Hồ sơ/Tài khoản mở nhầm, nội dung hai trang | `src/modules/shell/studio.js` | `index.html`, `studio-layout.css`, `mobile-ux.js`; `setAccountPage`, `accountProfileView`, `accountSettingsView` |
| Đăng nhập/đăng xuất, thông báo tài khoản | `src/modules/account/account.js` | `account-core.js` cùng thư mục; phân biệt UI với Firebase/API |
| Đồng bộ, mất tiến độ hoặc lẫn dữ liệu giữa tài khoản | `src/modules/account/study-sync.js` | `study-sync-core.js`, `account-core.js`, `firestore.rules` |
| Tải/nhập bản sao lưu JSON | `src/modules/backup/backup-restore.js` | `backup-core.js`; vị trí nút: account settings và `mobile-ux.js` |
| Flashcard, quiz, ôn câu sai, SRS | `app.js` | Tìm mode/ID cụ thể; dữ liệu `content/data/`, giao diện shell chỉ khi có liên quan |
| Tìm từ, pinyin/âm Việt gần đúng, quan hệ từ | `src/modules/dictionary/search-core.js` | Caller trong `app.js`, `open-dictionary.js`, `src/ui/dictionary-relations.js`; AI backend nếu có request |
| Giáo trình, mở bài học, nội dung Đọc/hội thoại | `src/modules/lessons/lessons.js` | `lessons-data.json`, đúng cấp trong `lesson-content-hsk1.json`…`lesson-content-hsk6.json`; không đọc cả 6 cấp |
| Chấm mức hoàn thành hoặc ôn ngắn theo bài | `src/modules/lessons/lesson-mastery.js`, `lesson-mini.js` | `lesson-mini-data.json`, đúng tiến độ/bài đang xét |
| Học tự động theo bài, lặp nét chữ/âm thanh/karaoke ví dụ | `src/modules/lessons/lesson-guided.js` | `lesson-guided-core.js`, `lesson-guided.css`, module speech/writing được gọi |
| Luyện & Ôn: bộ chọn chế độ, trộn phiên luyện | `src/modules/practice/practice-selector.js` | `practice-selector.css`, `studio.js`; giữ chế độ con trong bộ chọn |
| Ghép 3 cột, sắp xếp câu | `src/modules/practice/practice-games.js` | `practice-games-core.js`, `practice-games.css` |
| Học rảnh tay | `src/modules/passive/passive.js` | `passive-core.js`, `passive.css` |
| Đánh giá trình độ/lộ trình | `src/modules/placement/placement.js` | `placement-core.js`, `placement.css` |
| Kế hoạch, mục tiêu, thời gian học | `src/modules/planner/planner.js` | `planner-core.js`, `home-overview.js`; không đồng nhất mục tiêu với bộ lọc tra cứu |
| Sổ từ vựng, thêm/sửa/xóa, bộ sưu tập, bài tập từ sổ | `src/modules/notebook/notebook.js` | `notebook-factory.js`, `notebook-tools-core.js`, CSS tương ứng |
| Luyện viết theo nét, khung viết nhỏ hoặc popup/trang viết | `src/modules/handwriting/writing-practice.js` | `writing-practice.css`, `src/modules/shell/feature-page.js`, `mobile-ux.js` |
| Vẽ chữ để nhận dạng/tra từ | `src/modules/handwriting/handwriting.js` | `handwriting-core.js`, `handwriting-worker.js`, `handwriting.css`; neural/learning chỉ khi cần |
| Dịch câu, đọc/dịch ảnh OCR | `src/modules/translation/translator.js` hoặc `ocr.js` | `studio.js::chooseSearchTool`, `mobile-ux.js`, endpoint Worker tương ứng |
| Chat AI trong bài, bôi đen hỏi AI ở truyện/nhạc | `src/modules/translation/lesson-chat.js` | Caller ở `reading/original-reading.js` hoặc `music/music.js`; `lesson-chat.css` |
| AI phân tích lỗi học tập | `src/modules/ai-coach/ai-coach.js` | `ai-coach-core.js`, `ai-coach-images.js`, `coach-profile.js` |
| Đọc nguyên văn Mandarin Bean/HSK Reading, random, danh sách, ruby pinyin | `src/modules/reading/original-reading.js` | `real-reading.css`, `server/original-reading.mjs`, `docs/ai/ORIGINAL_READING.md` |
| Tạo bài đọc bằng AI, thể loại và lịch sử AI | `src/modules/reading/real-reading.js` | `real-reading-variety-core.js`, `server/reading-service.mjs`; đây là luồng khác bài gốc |
| Bài tập thi, đáp án, chấm điểm | `src/modules/exams/exam.js` | `exam-core.js`, `exam-bank.js`, `exam.css` |
| Kho đề/audio Drive, đề thi thử Study4 | `src/modules/exams/drive-exam.js`, `drive-audio.js` hoặc `src/modules/practice/study4-practice.js` | `server/exams/worker.mjs`; chỉ chọn nhánh khớp route/network |
| AI giải thích đáp án A–D/hình ảnh/transcript | `server/wrong-answer-rules.mjs`, `server/wrong-answer-images.mjs` | Caller exam/coach, `server/translator-worker.mjs`; kiểm payload ảnh và transcript |
| Nhạc: player, danh sách, queue, phát nền | `src/modules/music/music.js` | `music-core.js`, `music.css`, `music-config.json`; `loader.js` nếu module chưa sẵn sàng |
| Lời nhạc, nghĩa, highlight từng chữ/timestamp | `src/modules/music/music-lyrics-ui.js`, `music-lyrics-core.js` | `music-lyrics.css`, `music-transcript.js`; kiểm dữ liệu cue trước khi sửa player |
| Import/xử lý nhạc, forced alignment, hàng đợi cloud | Định vị trong `server/music/` bằng tên job/endpoint | `cloud-worker.mjs`, `import-jobs.mjs`, `groq-queue.mjs`, `forced-alignment-proof.mjs` tùy dấu vết; không mở tất cả |
| Giọng đọc trên máy, cài/xóa gói giọng | `src/modules/speech/speech.js`, `voice-settings.js` | `voice-manager.js`, `voice-store.js`, `speech.css`; model/transport chỉ khi lỗi tải model |
| Tạo/cache voice phía server/Apps Script | `server/voice-tts.mjs` | `tools/voice-cache-apps-script/`, `server/voice-partial-verify.mjs`; không nhầm với giọng thiết bị |
| Phân quyền, quota, key rotation, provider/failover, cache AI | `server/translator-worker.mjs` rồi đúng module | `account-roles.mjs`, `ai-control.mjs`, `gemini-keys.mjs`, `ai-backup.mjs`, `tutor-cache.mjs` theo endpoint/lỗi |
| Dashboard quản trị | `src/modules/admin/admin.js` | `admin-core.js`, API phân quyền; không dùng cờ frontend để cấp quyền |
| Dọn bộ nhớ/gói dữ liệu | `src/modules/shell/storage-cleanup.js` | `storage-cleanup.css`, module lưu dữ liệu được gọi |
| Nút tím, dark mode, spacing chung | `ui-buttons.css`, `style.css` | CSS đúng tính năng, `studio-layout.css`, lớp mobile; đo computed style trước khi sửa toàn cục |
| Cập nhật/offline/PWA/cache cũ | `app-version.json`, `offline.js`, `offline-worker.js` | `OneSignalSDKWorker.js`, `tools/pwa-assets.json`, quy trình phát hành ở mục 6 |

Lưu ý: CSS ghi tên ngắn nằm ở gốc repo; JS ghi tên ngắn trong cột cuối mặc định cùng thư mục với module JS chính, trừ đường dẫn được ghi đầy đủ. Kiểm tồn tại trước khi đọc. Tên hàm và ID chỉ là điểm neo; không phụ thuộc số dòng vốn thay đổi theo commit.

## 4. Tìm kiếm theo tầng — dừng khi đã đủ bằng chứng

Ưu tiên `rg`. Nếu máy chưa có, dùng `git grep` và `git ls-files`, không mất thời gian cài thêm chỉ để tìm vài symbol.

```sh
# 1) Chỉ tìm tên file trong nhóm đã chọn.
rg --files src/modules/reading
# 2) Tìm symbol/ID/endpoint, chưa in cả file.
rg -n -F 'rrRandom' src/modules/reading/original-reading.js
rg -n 'rrRandom|reading-library|rrOriginalBack' src/modules/reading server/original-reading.mjs
# 3) Fallback không cần rg.
git ls-files 'src/modules/reading/*'
git grep -n -F 'reading-library' -- src/modules/reading server/original-reading.mjs
```

Khi đã biết symbol, đọc một đoạn bao quanh nó bằng công cụ đọc theo dòng/range. Với file minify/một dòng rất dài, trích một cửa sổ ký tự quanh ID bằng script; không in nguyên dòng hàng trăm KB. Nếu kết quả bị cắt, thu hẹp mẫu hoặc đường dẫn, không lặp lại nguyên truy vấn.

Theo dấu lỗi: nút/route → handler → module → payload/endpoint → backend → response → renderer. Dừng ở tầng đã chứng minh là nguyên nhân; không mở backend chỉ vì thấy chữ “AI” trong nhãn UI.

## 5. Quy tắc giảm token và request

- Gộp các lần tìm/đọc độc lập trong một lượt công cụ; thao tác phụ thuộc kết quả phải làm tiếp theo. Không song song các sửa đổi, phê duyệt hoặc nhiều Chromium trên VPS ít RAM.
- Mỗi lượt tìm chỉ trả đường dẫn, symbol, đoạn liên quan và lỗi cần xử lý. Mục tiêu thường 1.000–3.000 token output/lượt; không cắt mất bằng chứng để ép đủ hạn mức.
- Ghi nhớ file/symbol/commit đã đọc trong phiên. Chỉ đọc lại phần có diff, file vừa đổi hoặc nội dung chưa có; không đọc lại `AGENTS.md`, bản đồ và toàn bộ repo sau mỗi bước.
- Không dump `content/data/*.js`, 6 JSON giáo trình, audio, vendor, lockfile, log dài hoặc Worker bundle để “nắm tổng quan”. Dùng schema, tên biến và một bản ghi đúng ID làm mẫu.
- Trạng thái job đang chạy không phải lỗi. Giữ PID/call_id/run ID và đọc tiếp kết quả; không khởi động lại cùng một tác vụ ghi dữ liệu khi tác vụ cũ còn chạy.
- Nếu lỗi lặp lại, lưu mã lỗi + giả thuyết + thay đổi kiểm tra kế tiếp. Không retry cùng lệnh/cùng cấu hình khi chưa có lý do. Không bỏ qua cooldown 429.
- Chỉ dùng nguồn ngoài/web khi cần tài liệu API hoặc dịch vụ hiện tại; lỗi layout trong repo phải bắt đầu từ code/DOM/computed style của repo.
- Không tự chia nhiều agent cho tác vụ nhỏ. Không quét app/token/credential của tài khoản khác; không in PEM, key hoặc signed URL vào log hay handoff.
- Không khẳng định toàn app không mất chức năng chỉ từ một test hẹp; nêu đúng phạm vi đã kiểm tra.

## 6. Sửa đúng và kiểm tra đủ

1. Trước sửa: ghi rõ trang/vùng, PC/mobile và hành vi được phép đổi. Đọc phần quy tắc liên quan trong `docs/ai/FEATURE_PRESERVATION.md`, `tools/feature-contract.json` và `docs/ai/UI_SCOPE_REVIEW.md`; không giảm guard để làm CI xanh.
2. Sửa file sở hữu chức năng. Với CSS, kiểm selector thắng, breakpoint, computed margin/padding và node bị di chuyển bởi `mobile-ux.js`; tránh thêm `!important` toàn app để chữa một trang.
3. Chọn test hẹp có thật bằng `rg --files tools` và tên tính năng. Điểm vào đã xác nhận: `check-grouped-navigation-ui.cjs`, `check-mobile-header-filter-ui.cjs`, `check-original-reading-ui.cjs`, `check-music-lyrics-ui.cjs`. Xem lệnh/môi trường chính xác trong `tools/ci-suites.json` và workflow, không đoán tên test.
4. Trước PR, thực hiện các kiểm tra repo bắt buộc: `python3 tools/check-feature-preservation.py --base origin/main`, `node tools/check-feature-runtime.cjs`, cùng kiểm tra giao diện theo quy tắc hiện tại. Chỉ chạy test server khi thay đổi server hoặc quy tắc repo yêu cầu; CI đầy đủ vẫn phải đạt trước merge. Windows dùng Python/Node phù hợp môi trường thực tế.
5. Frontend thay đổi: chạy `python3 tools/prepare-pwa-release.py --note 'Mô tả ngắn'`; thay đổi UI rất nhỏ dùng thêm `--keep-release` theo chính sách phiên bản. Stage đủ bốn file phát hành và chạy `python3 tools/check-pwa-release.py --base origin/main`. Chỉ tài liệu không bump PWA.
6. Worker liên quan module được bundle: sửa nguồn rồi dùng `node tools/build-worker-bundle.cjs`, kiểm diff/test phù hợp; không sửa bundle một mình. Triển khai đúng Worker theo workflow/config, giữ nguyên secret/binding và kiểm endpoint live.
7. Sau test hẹp đạt, không chạy lặp vô hạn. Chỉ chạy lại phạm vi bị ảnh hưởng bởi thay đổi mới, lỗi mới hoặc yêu cầu đối chiếu base/head; giữ các gate bắt buộc và bằng chứng giao diện ngoài phạm vi. Không merge khi còn check bắt buộc lỗi/thiếu/pending.

## 7. Khi không thấy file hoặc bị gián đoạn

- File không tồn tại: tìm theo basename trong `git ls-files`, đối chiếu `index.html`/`loader.js` và import/caller. Chỉ tìm toàn bộ tên file một lần trước khi mở rộng nội dung toàn repo.
- Code khác bản đồ: ghi nhận nhánh/commit, tìm chủ sở hữu mới và sửa lại đúng hàng trong bản đồ nếu nhiệm vụ cho phép; không âm thầm dựa vào mô tả cũ.
- Thiếu context khi tiếp tục: đọc phần nhiệm vụ đang làm trong `docs/ai/TASK_STATE.md`, kiểm `git diff --name-only`, chỉ đọc diff/file liên quan.
- Handoff ngắn: `Mục tiêu | base/head | file+symbol đã xác minh | thay đổi | test đã đạt/lỗi | job đang chạy | bước kế tiếp`. Không chép hội thoại, toàn bộ log hoặc dữ liệu nhạy cảm.

## Dòng dẫn nên thêm vào AGENTS.md

> Trước khi tìm code, đọc 25 dòng đầu `HSK_AI_FILE_GUIDE.md`, sau đó tìm đúng hàng theo chức năng; chỉ mở rộng theo caller/import/event/endpoint đã xác minh. Không đọc lại toàn repo hoặc tài liệu đã đọc khi chưa có thay đổi.
