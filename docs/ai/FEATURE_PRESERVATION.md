# HSK Feature Preservation Guard (bảo vệ chức năng)

## Mục tiêu
Theo yêu cầu chủ dự án: không được tự xóa tính năng của HSK trừ khi người dùng yêu cầu rõ. Các AI coding agent có thể sửa/đổi UI, tối ưu hoặc thêm mới, nhưng không được âm thầm bỏ màn, route, nút, module, tiến độ đã lưu hoặc tính năng AI đang hoạt động.

Baseline phiên bản HSK 3.3.6 được chốt trong `tools/feature-contract.json`: hiện **40 nhóm tính năng, 131 điểm bảo vệ**, bao gồm 13 chế độ luyện, HSK 1–6 và 146 bài học, SRS, câu sai, học tự động, nhận dạng viết tay, đề thi, AI đọc thực tế, dịch/OCR, sổ từ vựng, đồng bộ, sao lưu và PWA/push.

## Tự động kiểm tra mỗi PR

- `python tools/check-feature-preservation.py` quét toàn bộ danh mục đang có: các tệp nguồn, ID/route chính xác, export công khai, khóa tiến độ, cấu trúc giáo trình. Tự phát hiện route hoặc chế độ luyện mới chưa được ghi vào danh mục.
- `python tools/check-feature-preservation.py --base origin/main` so sánh baseline với `main`: **cấm xóa bất cứ entry hoặc giảm bớt điểm bảo vệ** nếu không có phê duyệt đã tồn tại trên `main` từ trước. Không được tự xóa cả tính năng và danh mục trong cùng PR.
- `node tools/check-feature-runtime.cjs` dùng Chromium chạy app thật (không tốn API): màn điện thoại 390px và desktop 1440px, kiểm tra 7 hub, 8 tuyến hoạt động khác, 13 mode, account, nút AI đọc, đề HSK và updater.
- Workflow `.github/workflows/feature-preservation.yml` chạy **trên mọi PR, kể cả thay đổi server/doc**, song song ba job: `feature-contracts`, `protected-flows`, `mobile-and-learning`. Chạy test server, đọc bài, SRS, đề thi, notebook, quiz, đồng bộ, update/PWA và bài tương tác trình duyệt. CI đỏ khi bất cứ bài nào thất bại.

## Quy trình chủ dự án chủ động yêu cầu XÓA

1. Người dùng yêu cầu rõ **tính năng nào phải xóa**, đưa đường dẫn issue/PR ghi yêu cầu.
2. Mở **PR chỉ gồm `tools/approved-feature-removals.json`**, mô tả id, lý do, người phê duyệt `trungxemcode`, liên kết issue/PR. Không trộn code trong PR này. Chủ repo trực tiếp review và merge.
3. Mở PR **thứ hai** xóa tính năng và cập nhật `tools/feature-contract.json`, giữ đầy đủ các chức năng còn lại. Bộ bảo vệ đọc quyền xóa chỉ từ phiên bản đã có ở `main` trước PR thứ hai.
4. Bất kỳ tính năng mới nào thêm về sau phải có entry trong danh mục và test hành vi mới; tính năng đó sẽ được bảo vệ như tính năng cũ.

## Một bước GitHub bắt buộc để thực thi thật

Trong Settings → Rules → Rulesets hoặc Branch protection, áp dụng cho `main`: bật **Require pull request before merging**, **Require approvals**, **Require review from Code Owners**, **Require status checks to pass**, chọn:
- `Preserve existing HSK features / feature-contracts`
- `Preserve existing HSK features / protected-flows`
- `Preserve existing HSK features / mobile-and-learning`
- `PWA release safety net / release-guard`

Tệp `.github/CODEOWNERS` gắn danh mục, test và workflow cho `@trungxemcode`. Nếu không bật các rules trên, người có quyền vẫn có thể push thẳng và bypass CI; ChatGPT không thể tự bảo đảm quy trình đó.

## Giới hạn cần hiểu rõ

Không có kiểm thử phần mềm nào chứng minh mọi chức năng và mọi thiết bị *không bao giờ* lỗi. Danh mục/behavior tests bắt lỗi tháo bỏ và nhiều hồi quy phổ biến; phát sinh lỗi logic tinh vi hoặc mất dữ liệu trên môi trường thật vẫn có thể cần thêm test. Không chỉnh dữ liệu người học để test; API ngoài được mock, không gọi khóa Gemini/xKiro. Với tính năng liên quan thanh toán, Firebase, OneSignal, đồng bộ đa thiết bị, cần có môi trường staging và test tích hợp riêng.

**Dùng trước mỗi PR:** `python tools/check-feature-preservation.py --base origin/main`. Nếu sửa giao diện: `python tools/prepare-pwa-release.py --note "Mô tả ngắn"`; xem `docs/ai/PWA_RELEASE_SAFETY_NET.md`.
