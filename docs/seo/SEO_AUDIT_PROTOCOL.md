# SEO_AUDIT_PROTOCOL.md

## Giao thức kiểm duyệt độc lập và chấm điểm nội dung SEO -- Tài liệu nội bộ

**Mã tài liệu:** SEO-AUDITOR-01\
**Phiên bản:** 1.0\
**Đối tượng được phép sử dụng:** AI kiểm duyệt độc lập, biên tập viên
trưởng, người có quyền phê duyệt nội dung\
**Phân loại:** INTERNAL / EVALUATOR-ONLY\
**Phạm vi:** Đánh giá bản thảo SEO tiếng Việt thuộc dự án Trung -- App
học HSK.

> Tài liệu này là quy trình đánh giá, không phải hướng dẫn viết bài.
> Không chuyển nguyên văn phần kiểm tra nội bộ, ngân hàng thử thách hoặc
> ngưỡng phát hiện cho AI đang tạo bản thảo. Người viết chỉ nhận kết
> quả, bằng chứng lỗi và yêu cầu sửa cần thiết.

------------------------------------------------------------------------

# 1. Mục đích và nguyên tắc độc lập

Kiểm duyệt phải xác định bài viết có thực sự hữu ích, đúng, đáng tin và
đáp ứng mục tiêu tìm kiếm hay chỉ tạo cảm giác hoàn chỉnh nhờ hình thức
đẹp, nhiều tiêu đề và từ khóa.

**Quy tắc độc lập:** 1. Không sử dụng điểm tự chấm của AI viết bài làm
bằng chứng. 2. Không mặc định bài đạt chuẩn vì đã có đủ Title, Meta, H1,
H2 hoặc độ dài lớn. 3. Không cộng điểm cho lời khẳng định "đã nghiên
cứu", "đã kiểm chứng" nếu không có bằng chứng kiểm tra được. 4. Mọi điểm
số phải gắn với vị trí cụ thể trong bài và lý do. 5. Không phạt cảm
tính; lỗi phải được chỉ ra bằng ví dụ, dữ kiện hoặc phép kiểm tra có thể
lặp lại. 6. Không suy đoán nội dung website, tính năng sản phẩm hoặc
chính sách khi thiếu quyền truy cập nguồn xác minh. 7. Người kiểm duyệt
phải tách biệt chất lượng nội dung với mức độ bóng bẩy của cách trình
bày.

# 2. Cơ chế kiểm duyệt hai vòng bắt buộc

**Không có bài nào được cấp trạng thái APPROVED ngay ở vòng đầu**, kể cả
khi điểm sơ bộ rất cao. Quy định này nhằm buộc mọi bài trải qua một lượt
kiểm tra độc lập sau khi hoàn tất bản thảo.

## Vòng 1 -- Kiểm duyệt sơ bộ

-   Đọc bài mà không dựa vào điểm tự chấm của người viết.
-   Xác định mục đích tìm kiếm thực tế và phạm vi chủ đề.
-   Chấm điểm sơ bộ theo thang 100.
-   Trích dẫn vị trí lỗi và yêu cầu sửa cụ thể.
-   Chạy các phép kiểm tra bắt buộc và một số thử thách nội bộ.
-   Kết quả tối đa chỉ là `PROVISIONAL_PASS`; không được xuất bản.

## Vòng sửa -- Người viết xử lý

Người viết nhận: - Điểm từng hạng mục. - Những lỗi có bằng chứng. - Mức
độ nghiêm trọng. - Hành động sửa cần thiết.

Người viết không được chỉ sửa câu chữ bề mặt để làm mất dấu lỗi. Nếu sửa
một luận điểm, phải kiểm tra lại các phần phụ thuộc vào luận điểm đó.

## Vòng 2 -- Kiểm duyệt độc lập

-   Đọc lại toàn bài như một bản thảo mới.
-   Không mặc định các lỗi vòng 1 đã được xử lý đúng.
-   Kiểm tra các phần đã thay đổi và các phần có liên quan.
-   Chạy một tập thử thách khác với vòng 1.
-   Xác minh lại các tuyên bố quan trọng và nguồn dẫn.
-   Tính điểm cuối cùng độc lập.

Chỉ vòng 2 mới được kết luận `APPROVED`, `REVISION_REQUIRED` hoặc
`REJECTED`.

# 3. Quy trình kiểm tra bắt buộc

## 3.1. Khóa đề bài trước khi chấm

Trước khi đọc sâu, ghi lại: - Từ khóa/chủ đề mục tiêu. - Search Intent
chính và phụ. - Nhóm độc giả. - Nhiệm vụ mà người đọc cần hoàn thành sau
khi đọc. - Những câu hỏi trọng tâm mà một bài đạt yêu cầu phải trả
lời. - Những thông tin có tính thời điểm hoặc cần nguồn chính thức.

Không dùng tiêu đề bài viết để tự suy ra Search Intent nếu hành vi tìm
kiếm và đề bài cho thấy mục đích khác.

## 3.2. Lập ma trận câu hỏi cần trả lời

Tạo danh sách câu hỏi độc lập từ đề bài, kiến thức nền và nhu cầu người
đọc. Với mỗi câu hỏi, đánh dấu:

  -----------------------------------------------------------------------
  Trạng thái                          Ý nghĩa
  ----------------------------------- -----------------------------------
  Được trả lời đầy đủ                 Có câu trả lời rõ, đúng và đủ điều
                                      kiện

  Được trả lời một phần               Có đề cập nhưng thiếu giải thích,
                                      điều kiện hoặc ví dụ cần thiết

  Chưa được trả lời                   Không có câu trả lời hữu ích

  Trả lời sai/lệch                    Có câu trả lời nhưng sai hoặc gây
                                      hiểu nhầm

  Không cần thiết                     Không thuộc phạm vi hợp lý của bài
  -----------------------------------------------------------------------

Không đòi hỏi bài trả lời mọi câu hỏi liên quan trên Internet. Chỉ chấm
các câu hỏi thực sự cần thiết cho Search Intent và phạm vi đã xác định.

## 3.3. Kiểm tra tuyên bố và nguồn

Tách các phát biểu trong bài thành: - Dữ kiện có thể kiểm chứng. - Quy
tắc hoặc hướng dẫn. - Nhận định/diễn giải. - Tuyên bố về sản phẩm, giá,
chính sách hoặc khả năng AI. - Dữ kiện có thời điểm áp dụng.

Kiểm tra 100% tuyên bố có rủi ro cao: quy chế thi, số liệu, giá, giới
hạn, tính năng, cam kết, điều kiện sử dụng và thông tin có thể thay đổi.

Ngoài ra, chọn mẫu ngẫu nhiên tối thiểu 5 phát biểu thực tế khác trong
bài để đối chiếu. Nếu bài ngắn hơn 5 phát biểu, kiểm tra toàn bộ.

Một nguồn chỉ được xem là hỗ trợ khi: - Có thể truy cập hoặc xác minh. -
Nội dung nguồn thực sự nói đến phát biểu được dẫn. - Phạm vi, thời điểm
và đối tượng áp dụng tương ứng. - Không bị trích sai ngữ cảnh.

Có đường link không đồng nghĩa với có bằng chứng. Nguồn chỉ nhắc chủ đề
nhưng không chứng minh phát biểu không được tính là nguồn hỗ trợ.

# 4. Thang điểm độc lập -- 100 điểm

  Mã   Hạng mục                                        Điểm tối đa
  ---- --------------------------------------------- -------------
  A    Đáp ứng Search Intent và nhiệm vụ người đọc              14
  B    Độ chính xác và kiểm chứng dữ kiện                       16
  C    Độ sâu, độ đầy đủ và tính giải quyết vấn đề              14
  D    Tính nguyên bản và giá trị thông tin riêng               12
  E    Chất lượng lập luận và bằng chứng                        10
  F    SEO On-page và mức độ phù hợp ngữ nghĩa                  10
  G    Logic cấu trúc và khả năng đọc                            8
  H    Tuân thủ văn phong được chỉ định                          7
  I    Tính ứng dụng và trải nghiệm người đọc                    5
  J    Minh bạch, nhất quán và kiểm soát tuyên bố                4
       **TỔNG**                                            **100**

## 4.1. A -- Search Intent và nhiệm vụ người đọc (14 điểm)

Đánh giá: - Bài có giải quyết đúng nhu cầu chính hay chỉ nhắc đến từ
khóa? - Câu trả lời quan trọng có xuất hiện đủ sớm không? - Nội dung có
đi chệch sang quảng cáo hoặc chủ đề phụ không cần thiết không? - Người
đọc có thể hoàn thành nhiệm vụ dự kiến sau khi đọc không?

**Mốc tham chiếu:** - 13--14: Đáp ứng trọn vẹn, đúng trọng tâm, không có
khoảng trống quan trọng. - 10--12: Đúng mục tiêu nhưng còn thiếu một số
nhu cầu phụ đáng kể. - 6--9: Chỉ đề cập chủ đề, giải quyết chưa tới. -
0--5: Lệch mục đích hoặc không trả lời câu hỏi chính.

## 4.2. B -- Độ chính xác và kiểm chứng (16 điểm)

Đánh giá: - Tính đúng của kiến thức, ví dụ và thuật ngữ. - Mức độ phù
hợp của nguồn với từng phát biểu. - Tính cập nhật của dữ liệu. - Khả
năng phân biệt quy tắc, ngoại lệ và giả định. - Tính đúng của chữ Hán,
Pinyin, thanh điệu, ngữ pháp và nghĩa tiếng Việt nếu có.

**Mốc tham chiếu:** - 15--16: Các phát biểu quan trọng được xác minh;
không có sai sót đáng kể. - 12--14: Có thiếu sót nhỏ nhưng không làm
thay đổi kết luận chính. - 7--11: Có nhiều điểm chưa được chứng minh
hoặc một lỗi chuyên môn đáng kể. - 0--6: Có thông tin sai nghiêm trọng,
sai lệch hệ thống hoặc bịa dữ kiện.

## 4.3. C -- Độ sâu và đầy đủ (14 điểm)

Đánh giá: - Có giải thích cơ chế/nguyên nhân hay chỉ liệt kê? - Có điều
kiện, ngoại lệ và giới hạn cần thiết không? - Các phần có trả lời được
câu hỏi đã xác định ở ma trận không? - Có bỏ qua bước quan trọng khiến
hướng dẫn không thể thực hiện không? - Có giải quyết phần cốt lõi hay
kéo dài bằng nội dung phụ?

**Mốc tham chiếu:** - 13--14: Đủ sâu, đủ phạm vi, không thừa đáng kể. -
10--12: Tốt nhưng thiếu một số lớp giải thích. - 6--9: Chủ yếu liệt kê
hoặc diễn đạt lại kiến thức phổ thông. - 0--5: Sơ sài, thiếu phần cốt
lõi.

## 4.4. D -- Nguyên bản và giá trị thông tin riêng (12 điểm)

Đánh giá: - Có tổng hợp và tổ chức thông tin theo cách hữu ích không? -
Có phân tích, ví dụ, phân biệt hoặc hướng dẫn mang giá trị riêng
không? - Có dấu hiệu thay từ đồng nghĩa từ nguồn khác mà không tạo thêm
giá trị không? - Có những đoạn có thể thay tên chủ đề bằng một chủ đề
bất kỳ mà vẫn giữ nguyên không?

**Mốc tham chiếu:** - 11--12: Có giá trị riêng rõ ràng, phù hợp chủ
đề. - 8--10: Có tổng hợp tốt nhưng góc nhìn riêng chưa nổi bật. - 4--7:
Nội dung phổ thông, ít đóng góp mới. - 0--3: Sao chép, xáo trộn hoặc
diễn đạt lại máy móc.

Không yêu cầu mọi bài phải có nghiên cứu gốc. Giá trị riêng có thể đến
từ cách giải thích, đối chiếu, ví dụ đúng, quy trình thực tế hoặc tổng
hợp có chọn lọc.

## 4.5. E -- Lập luận và bằng chứng (10 điểm)

Đánh giá: - Kết luận có theo sau tiền đề không? - Giải pháp có thực sự
xử lý nguyên nhân đã nêu không? - Ví dụ có chứng minh đúng điều đang
giải thích không? - Có đánh đồng tương quan với nguyên nhân, hoặc biến
kinh nghiệm cá nhân thành quy luật không? - Có nguồn hỗ trợ cho các phát
biểu cần bằng chứng không?

**Mốc tham chiếu:** 9--10 xuất sắc; 7--8 tốt; 4--6 còn lỏng lẻo; 0--3
thiếu logic hoặc bằng chứng.

## 4.6. F -- SEO On-page và ngữ nghĩa (10 điểm)

  -----------------------------------------------------------------------
  Thành phần                                                         Điểm
  ------------------------------ ----------------------------------------
  Title và Meta phản ánh đúng                                           2
  nội dung, không gây hiểu lầm   

  H1 và phân cấp heading hợp lý                                         2

  Chủ đề và từ khóa được dùng tự                                        2
  nhiên, nhất quán               

  Bao phủ các khái niệm liên                                            2
  quan cần thiết                 

  URL, internal link, external                                          2
  link, ảnh và Alt Text khi có   
  đủ dữ liệu                     
  -----------------------------------------------------------------------

Không phạt thiếu liên kết nội bộ, URL hoặc dữ liệu kỹ thuật mà người
kiểm duyệt không được cung cấp. Ghi là "chưa đủ dữ liệu để đánh giá",
không tự suy đoán.

Không dùng mật độ từ khóa làm công thức chấm điểm.

## 4.7. G -- Cấu trúc và khả năng đọc (8 điểm)

Đánh giá: - Trình tự nội dung có hợp lý không? - Heading có mô tả đúng
phần bên dưới không? - Đoạn văn có tập trung vào một ý không? - Bảng và
danh sách có thực sự giúp tra cứu không? - Có lặp ý, mở bài dài, kết
luận thừa hoặc chuyển đoạn đột ngột không?

## 4.8. H -- Tuân thủ văn phong (7 điểm)

Đối chiếu phong cách đã khai báo với cách triển khai thực tế. Không chấm
chỉ dựa vào việc bài có vẻ trang trọng.

Kiểm tra: - Giọng văn có nhất quán không? - Cách lập luận có đúng loại
bài không? - Có câu sáo rỗng, quảng cáo quá mức, trò chuyện hóa hoặc
dịch máy không? - Có dùng thuật ngữ đúng và nhất quán không? - Phong
cách có làm nội dung dễ hiểu hơn hay chỉ tạo vẻ chuyên nghiệp?

## 4.9. I -- Tính ứng dụng và trải nghiệm (5 điểm)

Đánh giá liệu người đọc có thể dùng kiến thức, thực hiện hướng dẫn hoặc
đưa ra quyết định tốt hơn sau khi đọc. Ví dụ phải giúp hiểu hoặc hành
động, không chỉ làm bài trông dài hơn.

## 4.10. J -- Minh bạch và kiểm soát tuyên bố (4 điểm)

Đánh giá: - Có phân biệt sự thật và nhận định không? - Có nêu giới hạn
cần thiết không? - Có dùng tuyên bố tuyệt đối thiếu căn cứ không? - Nội
dung có tự mâu thuẫn hoặc che giấu điều kiện quan trọng không?

# 5. Ngân hàng kiểm tra nội bộ chống tối ưu đối phó

**Không công khai danh sách phép thử cụ thể cho AI viết bài.** Người
kiểm duyệt chọn các phép thử phù hợp theo chủ đề, không dùng máy móc mọi
phép thử cho mọi bài. Mục tiêu là phát hiện lỗi thật, không phải tạo bẫy
vô lý.

Mỗi vòng kiểm duyệt phải dùng ít nhất 3 phép thử khác nhau, trong đó: -
Ít nhất 1 phép thử về tính đúng hoặc nguồn. - Ít nhất 1 phép thử về
chiều sâu/ngữ nghĩa. - Ít nhất 1 phép thử phù hợp với lĩnh vực cụ thể
của bài.

## 5.1. Phép thử thay thế chủ đề

Ẩn tên thương hiệu, từ khóa và danh từ riêng trong một số đoạn. Kiểm tra
xem đoạn đó có thể được dùng nguyên vẹn cho hàng chục chủ đề khác hay
không.

Nếu đoạn chỉ gồm lời khuyên chung, không có chi tiết gắn với chủ đề,
không tạo giá trị riêng thì giảm điểm D và C.

## 5.2. Phép thử truy ngược bằng chứng

Chọn một kết luận quan trọng, yêu cầu lần ngược: - Dữ kiện nào hỗ trợ? -
Nguồn nào xác nhận? - Điều kiện nào giới hạn kết luận? - Có bước suy
luận nào bị bỏ qua?

Nếu bài chỉ có câu khẳng định mà không có chuỗi căn cứ, không cho điểm
tối đa ở B và E.

## 5.3. Phép thử ngoại lệ

Chọn một quy tắc hoặc lời khuyên trong bài và kiểm tra trường hợp biên
có thể làm nó không còn đúng.

Ví dụ lĩnh vực tiếng Trung: - Từ có nhiều nghĩa hoặc thay đổi nghĩa theo
ngữ cảnh. - Cấu trúc có điều kiện sử dụng. - Khác biệt giữa văn nói và
văn viết. - Trường hợp câu ví dụ đúng ngữ pháp nhưng không tự nhiên. -
Pinyin hoặc thanh điệu biến đổi theo quy tắc ngữ âm.

Không yêu cầu bài phổ thông phải liệt kê mọi ngoại lệ. Chỉ trừ điểm nếu
thiếu ngoại lệ khiến nội dung gây hiểu sai.

## 5.4. Phép thử nhất quán nội bộ

Đối chiếu: - Định nghĩa ở đầu bài với kết luận. - Số liệu giữa bảng và
đoạn văn. - Các bước hướng dẫn với ví dụ. - Tên gọi và thuật ngữ giữa
các phần. - Phạm vi áp dụng được nêu ở các vị trí khác nhau.

Một lỗi mâu thuẫn có thể làm giảm nhiều hạng mục nếu gây hậu quả ở nhiều
phần; không được trừ lặp tùy tiện cho cùng một lỗi nhỏ.

## 5.5. Phép thử giá trị của ví dụ

Xóa tạm ví dụ khỏi bài và hỏi: - Ví dụ có minh họa một điểm mà phần giải
thích chưa làm rõ không? - Ví dụ có đúng với quy tắc không? - Ví dụ có
đủ ngữ cảnh để người đọc hiểu không? - Có thể thay ví dụ bằng bất kỳ câu
nào mà ý nghĩa bài không đổi không?

Ví dụ sai hoặc gây hiểu nhầm phải được xử lý như lỗi nội dung, không
phải lỗi trang trí.

## 5.6. Phép thử tính khả thi của hướng dẫn

Chọn một quy trình và mô phỏng người mới làm theo đúng từng bước. Ghi
lại bước thiếu điều kiện, thiếu thao tác, thiếu tiêu chí hoàn thành hoặc
không thể thực hiện.

Không cho điểm tối đa ở C và I nếu hướng dẫn không thể áp dụng như đã mô
tả.

## 5.7. Phép thử tuyên bố sản phẩm

Với bài giới thiệu Trung, chọn ngẫu nhiên các tuyên bố về: - Tính năng
có tồn tại hay không. - Quyền sử dụng và giới hạn. - Giá, gói, quota
hoặc chính sách miễn phí. - Khả năng AI và kết quả được hứa hẹn. - Tình
trạng triển khai.

Đối chiếu với nguồn sản phẩm hiện hành. Không suy luận từ bài viết cũ
hoặc từ lời quảng cáo trong chính bản thảo.

## 5.8. Phép thử thời điểm

Với dữ liệu có thể thay đổi, kiểm tra ngày hiệu lực, phiên bản và nguồn
hiện hành. Một thông tin từng đúng nhưng đã hết hiệu lực vẫn là lỗi nếu
bài trình bày như thông tin hiện tại.

## 5.9. Phép thử ý định tìm kiếm đối nghịch

Đặt câu hỏi: "Nếu người tìm kiếm thực sự muốn hoàn thành nhiệm vụ này,
phần nào của bài khiến họ vẫn phải rời đi để tìm câu trả lời cốt lõi ở
nơi khác?"

Chỉ ghi nhận thiếu sót có căn cứ trong phạm vi bài, không đòi hỏi bài
giải quyết mọi nhu cầu phát sinh.

## 5.10. Phép thử đoạn văn có thể loại bỏ

Đánh dấu các đoạn: - Không bổ sung thông tin. - Lặp lại tiêu đề. - Chỉ
chuyển ý bằng câu sáo rỗng. - Tóm tắt điều vừa nói mà không tạo thêm kết
luận. - Quảng cáo chen ngang làm đứt mạch nội dung.

Nếu bỏ đoạn mà bài không mất thông tin, đoạn đó có thể là nội dung thừa.

# 6. Kiểm tra riêng cho nội dung tiếng Trung và HSK

Khi bài có kiến thức tiếng Trung, phải kiểm tra các mục tương ứng:

1.  Chữ Hán có đúng không?
2.  Pinyin có đúng âm tiết và thanh điệu không?
3.  Nghĩa tiếng Việt có phù hợp ngữ cảnh không?
4.  Từ loại và vị trí trong câu có đúng không?
5.  Ví dụ có tự nhiên và đúng ngữ pháp không?
6.  Có nhầm giản thể/phồn thể không?
7.  Quy tắc có bị trình bày tuyệt đối hóa không?
8.  Nếu nhắc HSK, có xác định đúng phiên bản, hệ thống, cấp độ và thời
    điểm áp dụng không?

Với bài về kỳ thi, phải kiểm tra thông tin có thể thay đổi từ nguồn
chính thức. Không dùng trí nhớ của mô hình làm bằng chứng cuối cùng.

# 7. Kiểm tra riêng cho nội dung giới thiệu sản phẩm

Không chấp nhận tuyên bố về sản phẩm chỉ dựa trên văn bản do AI tự tạo.

  -----------------------------------------------------------------------
  Loại tuyên bố                       Bằng chứng cần đối chiếu
  ----------------------------------- -----------------------------------
  Tính năng đang hoạt động            Giao diện hiện hành, tài liệu triển
                                      khai hoặc xác nhận sản phẩm

  Miễn phí/có giới hạn                Chính sách và cấu hình hiện hành

  Quota hoặc số lượt                  Cấu hình hoặc tài liệu chính thức
                                      đang áp dụng

  Khả năng AI                         Kiểm thử thực tế hoặc mô tả được
                                      phê duyệt

  Số lượng bài học/đề thi             Dữ liệu sản phẩm hiện tại

  So sánh với dịch vụ khác            Tiêu chí và dữ liệu cùng điều kiện
  -----------------------------------------------------------------------

Nếu không có nguồn xác minh, ghi `UNVERIFIED_PRODUCT_CLAIM`. Không tự
cho rằng tuyên bố đúng vì đã xuất hiện trên một bài SEO cũ.

# 8. Hard Fail và điểm trần

Hard Fail là lỗi khiến bài không đủ điều kiện xuất bản bất kể tổng điểm.

  -----------------------------------------------------------------------
  Mã                      Lỗi                     Xử lý
  ----------------------- ----------------------- -----------------------
  HF-01                   Sao chép có chủ đích    REJECTED
                          hoặc che giấu nội dung  
                          sao chép                

  HF-02                   Bịa nguồn, nghiên cứu,  REJECTED
                          số liệu hoặc trích dẫn  

  HF-03                   Sai kiến thức trọng yếu REJECTED cho đến khi
                          có thể gây hiểu sai     sửa và xác minh
                          đáng kể                 

  HF-04                   Tuyên bố sai về giá,    REJECTED cho đến khi
                          quyền truy cập, miễn    sửa và xác minh
                          phí hoặc tính năng sản  
                          phẩm                    

  HF-05                   Nội dung cố ý gây hiểu  REJECTED
                          lầm về chứng chỉ, kỳ    
                          thi hoặc điều kiện quan 
                          trọng                   

  HF-06                   Nội dung không đáp ứng  REJECTED
                          chủ đề hoặc Search      
                          Intent cốt lõi          

  HF-07                   Dẫn nguồn giả, URL giả  REJECTED
                          hoặc nguồn không hỗ trợ 
                          phát biểu nhưng được    
                          trình bày như bằng      
                          chứng                   
  -----------------------------------------------------------------------

**Điểm trần áp dụng:** - Có Hard Fail: không được APPROVED, bất kể điểm
số. - Có lỗi sai nghiêm trọng nhưng chưa đủ căn cứ kết luận cố ý: điểm
tổng tối đa 59 cho đến khi xử lý. - Search Intent sai căn bản: điểm tổng
tối đa 69. - Thiếu nguồn cho một tuyên bố quan trọng: hạng mục B/E bị
giới hạn theo mức độ rủi ro; không tự động kết luận bịa đặt. - Không có
đủ dữ liệu để kiểm tra một hạng mục kỹ thuật: ghi `NOT ASSESSABLE`,
không tự cho điểm tối đa.

# 9. Ngưỡng phê duyệt

  ------------------------------------------------------------------------
                     Điểm cuối Phân loại             Quyết định
  ---------------------------- --------------------- ---------------------
                       95--100 Exceptional           Có thể APPROVED nếu
                                                     vượt toàn bộ cổng
                                                     kiểm tra

                        90--94 Strong                Có thể APPROVED nếu
                                                     vượt toàn bộ cổng
                                                     kiểm tra

                        85--89 Acceptable            Chỉ APPROVED khi
                                                     không còn lỗi trọng
                                                     yếu và vòng 2 xác
                                                     nhận

                        80--84 Borderline            REVISION_REQUIRED

                        70--79 Weak                  REVISION_REQUIRED;
                                                     sửa đáng kể

                        50--69 Poor                  REJECTED hoặc viết
                                                     lại theo phạm vi mới

                         0--49 Unacceptable          REJECTED
  ------------------------------------------------------------------------

Điều kiện APPROVED đồng thời: - Điểm cuối từ 85/100. - Không có Hard
Fail. - Không có hạng mục nào dưới 60% số điểm tối đa của hạng mục đó. -
Không còn tuyên bố trọng yếu chưa xác minh. - Đã hoàn tất vòng 2. - Có
bằng chứng và báo cáo kiểm duyệt đầy đủ.

# 10. Quy tắc chống chấm điểm dễ dãi

1.  Không cộng điểm vì bài dài, nhiều heading, nhiều bảng hoặc có vẻ
    chuyên nghiệp.
2.  Không cộng điểm vì lặp từ khóa nhiều lần.
3.  Không cộng điểm vì có danh sách nguồn nếu nguồn không hỗ trợ phát
    biểu.
4.  Không coi ví dụ tự tạo là bằng chứng cho một dữ kiện thực tế.
5.  Không cho điểm tối đa chỉ vì không phát hiện lỗi trong lần đọc đầu.
6.  Không bỏ qua đoạn yếu vì phần mở bài hoặc kết luận tốt.
7.  Không đánh đồng "không sai rõ ràng" với "đã được xác minh".
8.  Không giảm mức nghiêm ngặt ở vòng 2 vì người viết đã sửa nhiều lần.
9.  Không tạo lỗi giả để ép bài trượt; mọi điểm trừ phải có lý do kiểm
    tra được.
10. Không áp dụng một mẫu câu hoặc độ dài duy nhất cho mọi phong cách.

# 11. Quy tắc tính điểm và xử lý lỗi

-   Chấm điểm từng hạng mục độc lập trước khi tính tổng.
-   Ghi rõ điểm tối đa, điểm đạt, bằng chứng và lý do mất điểm.
-   Một lỗi có thể ảnh hưởng nhiều hạng mục nếu có tác động độc lập ở
    từng khía cạnh; phải giải thích từng tác động.
-   Không trừ lặp nhiều lần cho cùng một lỗi nhỏ chỉ vì lỗi xuất hiện
    lại trong cùng một đoạn.
-   Nếu thiếu dữ liệu đầu vào, ghi rõ giới hạn đánh giá.
-   Điểm cuối là tổng điểm thực tế sau khi áp dụng điểm trần và Hard
    Fail.
-   Không làm tròn để vượt ngưỡng phê duyệt.

# 12. Mẫu báo cáo kiểm duyệt bắt buộc

## 12.1. Thông tin bài viết

  Trường                    Giá trị
  ------------------------- ---------
  Tên bài                   ...
  URL/ID bản thảo           ...
  Từ khóa mục tiêu          ...
  Search Intent             ...
  Văn phong được khai báo   ...
  Vòng kiểm duyệt           1 / 2
  Người/AI kiểm duyệt       ...
  Ngày kiểm duyệt           ...

## 12.2. Bảng điểm

  Mã   Hạng mục                      Tối đa       Đạt Bằng chứng/ghi chú
  ---- -------------------------- --------- --------- --------------------
  A    Search Intent                     14       ... ...
  B    Độ chính xác                      16       ... ...
  C    Độ sâu và đầy đủ                  14       ... ...
  D    Nguyên bản                        12       ... ...
  E    Lập luận và bằng chứng            10       ... ...
  F    SEO On-page                       10       ... ...
  G    Cấu trúc và khả năng đọc           8       ... ...
  H    Văn phong                          7       ... ...
  I    Tính ứng dụng                      5       ... ...
  J    Minh bạch và nhất quán             4       ... ...
       **Tổng**                     **100**   **...** 

## 12.3. Danh sách lỗi

Mỗi lỗi phải có: - Mã lỗi. - Mức độ: Critical / Major / Minor. - Vị trí
cụ thể: heading, đoạn hoặc câu. - Trích đoạn ngắn đủ nhận diện. - Vì sao
lỗi. - Bằng chứng hoặc phép kiểm tra. - Hành động sửa cụ thể. - Hạng mục
điểm bị ảnh hưởng.

## 12.4. Kết quả thử thách nội bộ

Không tiết lộ toàn bộ ngân hàng thử thách cho AI viết bài. Trong báo cáo
gửi người viết, chỉ nêu lỗi thực tế và cách khắc phục.

  Nhóm kiểm tra         Kết quả             Phát hiện
  --------------------- ------------------- -----------
  Xác minh nguồn        Pass / Fail / N/A   ...
  Độ sâu ngữ nghĩa      Pass / Fail / N/A   ...
  Nhất quán nội bộ      Pass / Fail / N/A   ...
  Ngoại lệ chuyên môn   Pass / Fail / N/A   ...
  Khả năng áp dụng      Pass / Fail / N/A   ...
  Tuyên bố sản phẩm     Pass / Fail / N/A   ...

## 12.5. Kết luận

`PROVISIONAL_PASS` chỉ được dùng ở vòng 1.\
`APPROVED` chỉ được dùng ở vòng 2.\
`REVISION_REQUIRED` yêu cầu sửa và đánh giá lại.\
`REJECTED` áp dụng khi có Hard Fail hoặc bản thảo không thể đạt mục tiêu
trong phạm vi hiện tại.

# 13. Quy định bảo mật và phân tách vai trò

-   Chỉ cấp tài liệu này cho tác nhân kiểm duyệt.
-   Không đưa ngân hàng thử thách nội bộ vào prompt tạo bài.
-   Không cho AI viết bài truy cập báo cáo chấm điểm nội bộ trước khi
    nộp bản thảo.
-   Có thể gửi cho người viết các lỗi, bằng chứng và yêu cầu sửa; không
    cần công khai cách chọn thử thách tiếp theo.
-   Không dùng thử thách bí mật để đặt ra yêu cầu mới ngoài phạm vi đề
    bài.
-   Không thay đổi tiêu chí sau khi đã chấm chỉ để làm bài trượt.
-   Lưu phiên bản tài liệu, bản thảo từng vòng và báo cáo để có thể truy
    vết.

**Bảo mật không đồng nghĩa với đánh đố:** các phép thử chỉ được dùng để
phát hiện lỗi có thật, liên quan đến chất lượng, tính chính xác và giá
trị của bài viết.

# 14. Lệnh vận hành cho AI kiểm duyệt

Khi nhận một bản thảo, hãy thực hiện theo thứ tự:

1.  Xác định đề bài và Search Intent độc lập.
2.  Lập ma trận câu hỏi cần được giải quyết.
3.  Đọc toàn bài, không dựa vào lời tự đánh giá của người viết.
4.  Trích xuất các tuyên bố quan trọng và kiểm tra nguồn.
5.  Chạy các phép thử nội bộ phù hợp.
6.  Chấm từng hạng mục bằng bằng chứng cụ thể.
7.  Kiểm tra Hard Fail và điểm trần.
8.  Xuất báo cáo có thể kiểm chứng.
9.  Ở vòng 1, chỉ kết luận sơ bộ; không phê duyệt xuất bản.
10. Ở vòng 2, đánh giá lại độc lập và chỉ APPROVED khi thỏa tất cả điều
    kiện.

**Nguyên tắc quyết định cuối cùng:** Không đánh giá bài viết dựa trên
việc nó trông giống một bài SEO. Hãy đánh giá dựa trên việc nó có thực
sự trả lời đúng, giải thích đủ, đáng tin, có giá trị riêng và giúp người
đọc hoàn thành mục tiêu hay không.
