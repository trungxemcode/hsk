# Đánh giá “Vẽ chữ để tra cứu” — 12/10/2026

**Kết luận: dừng ở thử nghiệm, chưa tích hợp vào app.** Bộ so hình tổng thể chưa đủ chính xác để đưa vào luồng tra từ. Thực hiện theo yêu cầu dừng khi nhận dạng nét tùy ý chưa đạt; giao diện tìm kiếm, từ điển, các chức năng khác và bản offline đang dùng chưa bị thay đổi.

## Dữ liệu và giấy phép

- Từ điển `words.js`: 5.011 mục từ, chứa 2.603 chữ Hán khác nhau. Không tạo từ điển thứ hai.
- Make Me a Hanzi `graphics.txt` có mẫu cho toàn bộ 2.603 chữ này. Không có chữ HSK hiện tại nằm ngoài tập mẫu.
- Tệp nguồn tải để thử: 30.778.076 byte, chỉ nằm trong thư mục tạm; không đưa bộ nguồn đầy đủ vào app.
- Dữ liệu mẫu rút gọn: 1.223.414 byte (~1,17 MiB); gzip: 379.271 byte (~370 KiB). Đây là kích thước mẫu thử; app chưa khai báo tải các tệp này.
- Chỉ trích hình nét `medians`, đảo trục Y, chuẩn hóa/ lượng tử hóa tọa độ và lọc theo chữ trong `words.js`; không trích nghĩa, pinyin hoặc thông tin từ điển.
- Nguồn: [Make Me a Hanzi](https://github.com/skishore/makemeahanzi), [COPYING](https://github.com/skishore/makemeahanzi/blob/master/COPYING). `graphics.txt` thuộc Arphic Public License, Copyright (C) 1999 Arphic Technology Co., Ltd. Đã đối chiếu với `hanzi-data-APL.txt` hiện có.
- SHA-256 nguồn: `a28c478b5178e98f67f510b2d52fde08a69dc664654ef43498253b9b764d46ee`.

## Phương pháp và kết quả

Prototype chạy cục bộ bằng JavaScript, không có API nhận dạng. Tất cả nét được gộp vào ảnh 32×32, so khoảng cách hình ảnh theo hai chiều. Không chấm thứ tự nét, không bắt buộc số nét, không dùng thư viện quiz luyện viết.

Đã thử ba cấu hình trong cùng prototype: giữ tỉ lệ ảnh, chuẩn hóa riêng hai trục và bổ sung khoảng cách bình phương/độ dày đặc nét. Hai cấu hình đầu chỉ đạt 50% top-10 trên mẫu rõ; bảng dưới là cấu hình cuối tốt hơn.

| Nhóm thử | Số trường hợp | Đúng trong 10 gợi ý | Tỉ lệ |
|---|---:|---:|---:|
| Mẫu hình học độc lập, rõ nét | 40 | 27 | 67,5% |
| Đổi kích thước/vị trí của 40 mẫu đó | 120 | 81 | 67,5% |
| Tỉ lệ và vị trí điểm nét bị nhiễu | 240 | 156 | 65,0% |
| Bỏ nét cuối của mẫu nhiều nét | 39 | 8 | 20,5% |

Các chữ thử gồm chữ đơn giản, cặp dễ nhầm (土/士, 木/本/末/未, 牛/午, 日/目, 田/由/甲/申) và 明/好/你. Chữ mất nét có thể biến thành một chữ khác; không xem việc đoán đúng tất cả mẫu mất nét là khả thi.

Đã đổi thứ tự nét và đảo chiều vẽ của cả 2.603 mẫu dữ liệu: ảnh gộp không thay đổi. Với 40 mẫu độc lập, danh sách gợi ý và điểm so hình cũng không thay đổi khi đảo thứ tự/chiều nét. Đây là bằng chứng tính bất biến thứ tự, **không phải** bằng chứng nhận dạng đúng chữ.

Trên Node.js 24/Windows ở máy phát triển, chuẩn bị mẫu khoảng 100 ms, một lần tra khoảng 2 ms. Chưa đo trên iPhone/Safari. Mẫu độc lập là các đường vẽ hình học biên soạn riêng và nhiễu kiểm soát, không phải một bộ viết tay người dùng đại diện. 120 mẫu biến đổi và 240 mẫu nhiễu đều bắt nguồn từ 40 mẫu gốc, không phải 400 người viết khác nhau.

Ngưỡng kỹ thuật tự đặt trước khi tích hợp: >=90% top-10 cho mẫu rõ và >=80% cho mẫu nhiễu. Đây không phải ngưỡng do người dùng quy định. Kết quả hiện tại không đạt.

## Phần chưa triển khai/kiểm tra

Chưa thêm nút, canvas, gợi ý hoặc bridge tìm từ; chưa thêm dữ liệu vào service worker/manifest và chưa đổi phiên bản offline. Vì đã dừng ở ngưỡng nhận dạng, chưa có kiểm tra pointer trên iPhone thật, Safari, stylus/chuột, chọn kết quả hoặc chế độ máy bay cho tính năng mới. Không báo các bước này là đã thành công.

Kiểm tra hồi quy: 8/8 test Worker có sẵn đã qua; diff của các tệp app/từ điển/offline/Worker hiện có rỗng. Test DOM và UI không chạy được vì môi trường chưa cài `jsdom` và `playwright`. Đã thử `tools/check-content.cjs` trên snapshot Git trong thư mục tạm; test thất bại với `RangeError: Array buffer allocation failed` ở phần tạo diff assertion của Node 24, trước khi cung cấp kết quả kiểm tra dữ liệu đầy đủ. Chưa kết luận nguyên nhân assertion này và không sửa các tệp ngoài phạm vi. Không báo toàn bộ test repo là đã qua.

## Tái hiện

Tải `graphics.txt` từ nguồn chính thức vào thư mục tạm, rồi chạy từ thư mục app:

```powershell
node tools/build-handwriting-data.cjs "$env:TEMP/hsk-handwriting-graphics.txt" "$env:TEMP/hsk-handwriting-model.json"
node tools/check-handwriting.cjs "$env:TEMP/hsk-handwriting-model.json" "$env:TEMP/hsk-handwriting-evaluation.json"
```

Lệnh kiểm tra trả mã 2 khi không đạt ngưỡng chất lượng. Chi tiết kết quả đã lưu trong `handwriting-evaluation.json`. Mã prototype chỉ nằm trong `tools/`; app không tải hoặc chạy nó.

## Phương án để quyết định

Đề xuất bước tiếp theo là đánh giá mô hình nhận dạng ảnh đã học từ chữ viết tay thật và chạy hoàn toàn cục bộ. Trước khi tích hợp vẫn phải xác minh giấy phép model/dataset, độ phủ 2.603 chữ, dung lượng, Safari/iPhone và độ chính xác trên mẫu độc lập. Hiện chưa chọn hoặc tải một model ML; không đề xuất chuyển nét vẽ lên dịch vụ ngoài.

Chỉ nên tiếp tục bước nghiên cứu đó nếu người dùng chấp nhận phạm vi đánh giá model lớn hơn. Không mở rộng prototype hiện tại bằng cách tăng số gợi ý quá 10 hoặc tự chọn chữ thay người dùng.
