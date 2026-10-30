# Chỉnh giao diện toàn app HSK trên máy

## Mở bộ chỉnh

Trên Windows, mở thư mục dự án rồi bấm đúp **Chinh-giao-dien.cmd**. Cần Python 3.10 trở lên. Giữ cửa sổ lệnh mở trong lúc chỉnh. Bộ chỉnh mở tại `http://127.0.0.1:8788/tools/home-designer/editor.html`; nếu cổng đang được dùng, chạy `python tools/serve-home-designer.py --port 8789 --open`.

Không cần npm, API AI, Figma hay tài khoản dịch vụ thiết kế. Bộ chỉnh chỉ phục vụ trên địa chỉ loopback. Nó dùng một cổng riêng với app local thường mở ở cổng 8000, nên bản xem thử có vùng lưu dữ liệu riêng. Không mở bộ chỉnh trên cùng cổng đã dùng làm app học thường ngày. Tài khoản/push và kết nối dịch vụ bên ngoài bị tắt trong máy chủ chỉnh sửa; phần Dùng thử dành cho xem bố cục và các thao tác local.

## Chỉnh trực tiếp

1. Chọn trang trong ô **Trang đang chỉnh** ở bảng trái. Có 44 trang/khung: trang chủ, bài học và học tự động, các chế độ luyện, sổ từ, tra cứu/dịch/ảnh, nhạc, tài khoản, menu chung và cửa sổ công cụ. Bấm vào chữ, nút hoặc khối trong bản xem để chọn. Nút trong app không chạy khi đang ở chế độ chỉnh.
2. Bảng bên phải chỉnh riêng phần tử đang chọn: chữ, căn hàng, khoảng đệm, khoảng cách và các màu theo theme hiện có. Ô để trống nghĩa là dùng kiểu mặc định của app. Các thông số PC và điện thoại tách biệt.
3. Bấm **Chọn cả khối** khi muốn chỉnh khoảng cách của cả thẻ thay vì từng dòng chữ. **Mở/thu nội dung** giúp xem phần nằm trong khung thu gọn.
4. Kéo tay nắm trên khung đang chọn hoặc kéo các khối ở bảng trái để đổi thứ tự. Có nút Lên/Xuống để dùng bàn phím. Thứ tự dùng CSS; không clone nút hay di chuyển DOM của app.
5. **Hiện kế hoạch mẫu** tạo lộ trình minh họa trong vùng lưu riêng của bản xem để chỉnh được các dòng nhiệm vụ. Không đồng bộ lên tài khoản.
6. **Dùng thử** cho phép bấm các nút của app. Bấm **Quay lại chỉnh sửa** để về trang chủ và tiếp tục chọn phần tử.
7. **Hoàn tác/Làm lại** hoặc Ctrl+Z/Ctrl+Shift+Z thao tác trên lịch sử tối đa 100 lần chỉnh. **Khôi phục bản mặc định** vẫn có thể hoàn tác.

Mỗi trang giữ riêng cấu hình PC/điện thoại. Những khối có dòng chảy thông thường cho phép kéo đổi thứ tự; trình phát, thanh điều hướng và cửa sổ cố định giữ thứ tự để bảo toàn tương tác. Vẫn có thể chọn phần tử trong các khung đó để chỉnh chữ, căn hàng và khoảng cách. Không hỗ trợ xóa/nhân bản chức năng hay kéo vị trí pixel tự do.

**Cập nhật thành phần** nhận diện lại nội dung sau khi mở một trạng thái mới. **Hiện phần đang ẩn** chỉ mở phần tử trong bản xem, không xuất quy tắc hiện/ẩn vào app. Các màn cần quyền/dữ liệu online chỉ có khung có sẵn; bộ chỉnh không cấp quyền, không giả đăng nhập và không gửi yêu cầu AI. Trong Dùng thử có thể mở trạng thái local (ví dụ câu hỏi hoặc sổ từ) rồi quay lại chỉnh ngay tại trạng thái đó.

## Giữ bản chỉnh và áp dụng

- Bản nháp tự lưu trong trình duyệt, gắn với thư mục dự án. Nháp v2 chứa nhiều trang; nhập nháp trang chủ v1 chỉ cập nhật trang chủ và giữ nguyên các trang khác. **Xuất bản nháp** giữ một file JSON để sao lưu, chuyển máy hoặc gửi cho AI tiếp tục. **Nhập bản nháp** kiểm tra cấu trúc/giá trị trước khi thay trạng thái; tệp sai không ghi đè bản đang chỉnh.
- **Xuất CSS** tải CSS được sinh từ cấu hình. Hãy giữ JSON cùng CSS để chỉnh lại sau này.
- **Lưu vào dự án** chỉ ghi sau hộp xác nhận. Nó cập nhật `home-design.json`, `home-design.css`, một vùng link có đánh dấu trong `index.html`, và đăng ký CSS vào danh mục tài nguyên PWA khi có danh mục. Không sửa handler, ID, nội dung bài học, tiến độ, khóa lưu trữ hoặc những stylesheet khác. Lưu lặp chỉ cập nhật một link.
- Thay đổi này mới nằm trên máy. Bộ chỉnh không tự commit, push, merge hoặc phát hành. Trước khi đưa lên GitHub, làm theo quy trình PR/PWA của dự án: khai báo thay đổi layout, kiểm tra, chạy `python tools/prepare-pwa-release.py --note "Mô tả thay đổi giao diện"` trên nhánh tính năng rồi kiểm tra `python tools/check-pwa-release.py --base origin/main`.

Muốn một trang trở về giao diện gốc sau khi đã áp dụng: chọn trang rồi **Khôi phục trang này → Lưu vào dự án**. Các trang khác được giữ nguyên. CSS mặc định không có rule thay đổi giao diện.

## Kiểm tra cho người bảo trì

`node tools/check-home-designer-core.cjs`, `python -m unittest discover -s tools -p test_home_designer.py`, và `node tools/check-home-designer-ui.cjs`, và `node tools/check-site-designer-ui.cjs`.

Kiểm tra UI tạo một bản sao tạm bằng hardlink, chạy app và máy chủ thật trên bản sao, kiểm tra chọn không kích hoạt nút, PC/mobile, Undo/Redo, lưu/mở lại nháp, kéo thực, export/import, ghi file và app thông thường sau khi áp dụng. Việc ghi dùng thay thế file nên không sửa nguồn của hardlink. Các bài bảo toàn tính năng hiện có vẫn phải chạy.

`schema.json` chứa danh sách trang, phạm vi CSS và thuộc tính được phép. Phần tử nhận diện trong từng trang được lưu bằng selector cấu trúc có kiểm tra; không cho selector vượt ra ngoài phạm vi trang hoặc chèn CSS tự do. Bộ sinh CSS trình duyệt và bộ ghi Python dùng cùng schema, có kiểm tra kết quả giống hệt nhau. Chỉ một stylesheet được quản lý có độ ưu tiên cố định, có phạm vi trang chủ và breakpoint; không nối chồng stylesheet mỗi lần chỉnh.

Tên home-design.json/CSS được giữ để tương thích bản trang chủ cũ; nội dung v2 chứa cấu hình của các trang đã chỉnh. Xuất bản nháp hiện tải hsk-giao-dien.json. Chỉnh theo vị trí dòng/thẻ là chỉnh ô giao diện đó, không sửa dữ liệu từ vựng hay nội dung bài. Undo/Redo hoạt động trên toàn bộ nháp và quay về trang của lần chỉnh tương ứng.

## Hai link online
- Bản phát hành: https://trungxemcode.github.io/hsk/
- Chỉnh UX/UI: https://hsk-ui-designer.trung-hsk668.workers.dev/

Đăng nhập ở link chỉnh bằng tài khoản chủ app HSK. Mỗi chỉnh sửa hợp lệ tự lưu; xem trạng thái “Đã đồng bộ tới bản phát hành”. Bản phát hành đang mở nhận CSS trong khoảng 15 giây hoặc ngay khi trở lại trang, tùy mạng. Không phải bấm Lưu vào dự án; nút Đồng bộ ngay cho phép thử lại. Đăng xuất khi dùng xong trên máy chung.

Nếu hai tab cùng chỉnh, tab cũ bị dừng ghi thay vì ghi đè. Xuất nháp trước khi tải lại; nút Tải nháp chưa đồng bộ giúp giữ thay đổi chưa gửi. Hoàn tác cũng được đồng bộ sang bản phát hành. Khi mất mạng, thay đổi chưa gửi còn trong nháp; bản phát hành giữ CSS gần nhất. Các phần tử/dữ liệu chỉ xuất hiện sau đăng nhập hoặc từ API ngoài không được giả lập trong preview.

Triển khai editor: chạy python3 tools/pack-design-editor.py, rồi npx wrangler deploy --config server/design/wrangler.jsonc trong môi trường Cloudflare đã đăng nhập. Chỉ bundle public assets; không gói secrets. Worker này độc lập với API nhạc/AI/voice.

Nếu Wrangler không hỗ trợ API deployment của phiên đăng nhập hiện tại, có thể dùng Direct Upload API chính thức: tạo bundle bằng npx wrangler deploy --dry-run --outdir /tmp/hsk-cloud-worker-bundle --config server/design/wrangler.jsonc, rồi python3 tools/deploy-design-editor.py --account-id ACCOUNT_ID --bundle /tmp/hsk-cloud-worker-bundle/worker.js (Python 3.11+). Công cụ chỉ triển khai Worker hsk-ui-designer và không in token.

## Kéo object và chỉnh Position / Border / Animation
Bấm giữ ngay trên chữ/nút rồi kéo để di chuyển. Kéo tay nắm ở cạnh/góc khung chọn để đổi kích thước. Tay nắm ✥ di chuyển object; tay nắm ⠿ vẫn đổi thứ tự cả khối. Giữ Shift khi kéo để khóa trục. Mũi tên dịch 1px, Shift + mũi tên dịch 10px khi chọn object trong bản xem. Một lần kéo chỉ tạo một bước Hoàn tác. Escape hủy lần kéo đang thực hiện.

Các tab Vị trí, Border, Animation, Chữ đưa bạn tới đúng nhóm trong bảng bên phải. X/Y giữ chỗ cũ; Position Absolute/Fixed thay đổi luồng theo CSS, Top/Left dùng khi Position khác Static. Border có độ dày, kiểu, màu picker/HEX/theme và bo từng góc. Animation có hiệu ứng có sẵn, thời lượng, độ trễ, nhịp, lặp, chiều, trạng thái và cách kích hoạt. Xem thử chỉ phát lại trong editor; thiết lập hợp lệ vẫn tự đồng bộ như trước. Hệ điều hành chọn giảm chuyển động sẽ giảm hiệu ứng.
