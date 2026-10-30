# Kiểm tra giao diện ngoài phạm vi trước khi merge

Mục đích: khi chủ dự án yêu cầu sửa trang A, phát hiện thay đổi vô tình ở các trang khác. **Trang A không tham gia phép so sánh giữ nguyên giao diện này.** Kiểm thử riêng của trang A vẫn thực hiện như bình thường.

## Quy trình bắt buộc

1. Trước khi sửa, ghi rõ trang, chế độ và vùng được người dùng cho phép thay đổi. Ví dụ: chỉ Học tự động toàn màn hình; chế độ học thường và các trang khác vẫn được bảo vệ. Không tự mở rộng phạm vi theo danh sách file đã sửa. Thành phần dùng chung như sidebar/header chỉ được thay đổi khi nằm trong yêu cầu.
2. Chốt hai mốc: commit base của PR (merge-base với nhánh đích) và commit head cuối cùng. Chạy hai bản độc lập, tránh cache/service worker trộn phiên bản. Không dùng ảnh cũ không rõ commit hoặc trang live đang ở phiên bản khác làm baseline.
3. Lập danh sách đầy đủ các trang/route hiện có từ điều hướng và bản đồ tính năng; đánh dấu trang nào thuộc phạm vi được phép sửa, trang nào phải giữ nguyên. Với mỗi trang được bảo vệ, so sánh ảnh trước/sau và kích thước/vị trí các khối, chữ, nút, khoảng cách, overflow và chồng lấn. Bao gồm các modal/chế độ liên quan nếu CSS hoặc thành phần dùng chung có thể tác động đến chúng.
4. Dùng cùng trình duyệt, font, viewport, theme, fixture dữ liệu, trạng thái đăng nhập, vị trí cuộn và cấu hình editor cho cả hai bản. Tối thiểu PC 1440×900 và điện thoại 390×844, sáng/tối; thêm breakpoint/trạng thái mà thay đổi dùng chung có thể ảnh hưởng. Đợi font và dữ liệu sẵn sàng, cố định nội dung/animation động bằng fixture giống nhau ở cả hai bản. Không che các vùng có thể bị ảnh hưởng để làm ảnh khớp.
5. Ghi bằng chứng trong PR: hai SHA, danh sách trang/trạng thái đã so sánh, liên kết ảnh trước/sau (và ảnh diff nếu có), kết quả đo và kết luận. Có thể dùng tự động hóa chụp/diff, nhưng test hành vi pass hoặc chỉ đọc code không thay thế bằng chứng giao diện.
6. **Chưa đủ bằng chứng hoặc phát hiện khác biệt ngoài phạm vi: chưa được merge.** Sửa nguyên nhân rồi so sánh lại. Không đổi baseline, tăng ngưỡng bỏ qua hoặc tự thêm trang lỗi vào phạm vi được phép sửa. Nếu khác biệt thực sự cần thiết, lấy yêu cầu rõ của chủ dự án rồi cập nhật phạm vi và kiểm tra lại các trang còn được bảo vệ.
7. Sau thay đổi code có thể tác động giao diện hoặc sau khi base thay đổi, cập nhật cặp commit và chạy lại phép so sánh liên quan trước merge. Bằng chứng của head cũ không đủ cho head mới có thay đổi UI.

Ví dụ: yêu cầu chỉnh khoảng cách ở Tài khoản → bỏ Tài khoản khỏi phép so sánh giữ nguyên; đối chiếu Trang chủ, Bài học, Luyện & Ôn, Nghe nhạc, Tra cứu, Sổ từ vựng và các route còn lại trong danh sách thực tế. Sidebar dùng chung vẫn phải giữ nguyên nếu không được yêu cầu sửa.

PR chỉ sửa tài liệu/quy trình, không tác động bản hiển thị, được ghi `Không áp dụng` kèm lý do; không cần tạo ảnh giả cho PR đó. Đây là quy tắc review bắt buộc cho người/agent thực hiện; việc GitHub tự khóa nút merge cần một required status check/ruleset riêng, không được suy diễn từ checklist.

## Check GitHub và Ruleset

- Workflow `.github/workflows/ui-outside-scope.yml` tạo check **`ui-outside-scope`** trên mọi PR, kể cả PR chỉ tài liệu (khi đó báo không áp dụng thay vì mất check). So sánh merge-base và head thật, lưu ảnh trước/sau/diff cùng `report.json` làm artifact 14 ngày.
- `.github/ui-scope.json` ghi yêu cầu và `excludedRoutes` của PR. Chỉ đọc danh sách miễn so sánh nếu chính file này thay đổi trong PR; khai báo từ PR cũ không tự áp dụng cho PR mới. Chủ dự án review danh sách này cùng yêu cầu. Không thêm các trang lỗi để làm check xanh.
- Chromium chạy cùng fixture, thời gian, seed, font và trạng thái offline trên hai bản; chụp các lát cuộn của nội dung chính, PC 1440×900/điện thoại 390×900, sáng/tối. Pixelmatch so sánh với ngưỡng màu 0, chỉ nhận diện bỏ qua antialiasing ở mép; mọi phần tử hiện có vẫn phải khớp geometry, màu và border/radius. Hiệu chỉnh này dựa trên đối chứng cùng một commit vẫn lệch36 pixel ở mép bo dock, không dựa trên việc chấp nhận thay đổi code ngoài phạm vi. Lưu cả số pixel raw để review; không có cờ tự cập nhật baseline. Test unit xác nhận ảnh đổi một pixel cũng bị phát hiện.
- Phạm vi tự động hiện là các trang vào từ điều hướng công khai và trang Admin với fixture local. Các dashboard người học đã đăng nhập, modal và chế độ học sâu cần fixture/so sánh riêng theo bước 3; check xanh không thay thế phần review đó. API ngoài bị chặn; không chạm tài khoản/dữ liệu thật.
- Ruleset `.github/ui-scope-ruleset.json` chỉ thêm required check trên `main`, nguồn GitHub Actions, bắt buộc cập nhật theo base mới, không bypass; không thay thế các ruleset cũ. Khi có phiên `gh auth login` của chủ repo, chạy `python tools/apply-ui-scope-ruleset.py`. Script đọc, tạo/cập nhật ruleset riêng rồi đọc lại xác nhận. Có thể import JSON trong GitHub Settings → Rules → Rulesets. **File JSON có trong repo không có nghĩa ruleset đã active; phải kiểm tra setting trên GitHub.**
