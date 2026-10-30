## Thay đổi và xác minh

Mô tả yêu cầu, kết quả và các kiểm thử đã chạy.

## Phạm vi giao diện được phép sửa

- Trang/chế độ/vùng được người dùng yêu cầu sửa:
- PC/điện thoại và khác biệt dự kiến:

## Kiểm tra trước/sau các trang ngoài phạm vi

Thực hiện theo [quy tắc kiểm tra phạm vi](../docs/ai/UI_SCOPE_REVIEW.md). Trang được yêu cầu sửa không nằm trong phép so sánh giữ nguyên này.

- Base SHA / final head SHA:
- Danh sách đầy đủ trang/chế độ được bảo vệ:
- Viewport, theme, fixture và trạng thái:
- Liên kết ảnh trước/sau, diff và kết quả đo:
- Khai báo `.github/ui-scope.json` của PR và artifact check `ui-outside-scope`:
- [ ] Đã so sánh các trang ngoài phạm vi trên PC/điện thoại, sáng/tối.
- [ ] Không còn khác biệt ngoài phạm vi; bằng chứng khớp code/base cuối cùng.
- [ ] Các kiểm thử của trang được sửa và CI đã đạt; chủ dự án đã review nếu có thay đổi layout.

Nếu không áp dụng (chỉ tài liệu/quy trình), ghi lý do thay vì đánh dấu đã kiểm tra. Thiếu bằng chứng hoặc còn khác biệt ngoài phạm vi thì chưa merge.
