/* Original orientation questions aligned with the app's HSK 1–6 (2.0) curriculum. Not a standardized HSK score. */
(function(root){'use strict';
const KEY='hsk-placement-v1',skills=['vocab','grammar','reading','listening'],labels={vocab:'Từ vựng',grammar:'Ngữ pháp',reading:'Đọc hiểu',listening:'Nghe'};
const items=[];
function add(level,skill,prompt,options,explanation,audio='',tags=[]){items.push({id:`placement-${level}-${skill}-${items.filter(q=>q.level===level&&q.skill===skill).length+1}`,level,skill,prompt,options,answer:0,explanation,audio,tags});}
const vocab=[
 [['出租车','taxi','tàu hỏa','xe đạp','máy bay'],['打电话','gọi điện thoại','xem phim','đọc sách','nghe nhạc']],
 [['穿','mặc','mượn','bán','hỏi'],['但是','nhưng','bởi vì','vì thế','sau đó']],
 [['必须','phải, cần phải','có thể tùy ý','có lẽ','đã từng'],['变化','sự thay đổi','cuộc thi','phương hướng','văn phòng']],
 [['报名','đăng ký','tốt nghiệp','xin lỗi','ôm'],['标准','tiêu chuẩn','ví dụ','mức giá','khoảng cách']],
 [['办理','làm thủ tục','từ chối','so sánh','sắp xếp đồ đạc'],['保持','duy trì','bao gồm','bảo hành','thay thế']],
 [['暗示','ám chỉ, gợi ý gián tiếp','tuyên bố công khai','bác bỏ hoàn toàn','tường thuật chi tiết'],['昂贵','đắt đỏ','khan hiếm','cũ kỹ','tinh tế']]
];
vocab.forEach((rows,i)=>rows.forEach(([han,...options])=>add(i+1,'vocab','Chọn nghĩa của '+han,options,han+' nghĩa là '+options[0]+'.','',[han])));
const rows=[
 [1,'grammar','Chọn câu đúng:',['我在学校学习。','我学习在学校。','在学习我学校。','学校我在学习的。'],'我 + 在学校 (ở trường) + 学习 (học): cụm địa điểm đứng trước động từ.'],
 [1,'reading','今天星期三，明天我去学校。\n我什么时候去学校？',['星期四','星期二','星期三','星期一'],'Hôm nay thứ Tư (星期三), ngày mai là thứ Năm (星期四).'],
 [1,'listening','Người nói muốn uống gì?',['茶','水','咖啡','牛奶'],'我想喝茶: tôi muốn uống trà.','我不喝水，我想喝茶。'],
 [1,'listening','Ai là giáo viên?',['妈妈','爸爸','哥哥','姐姐'],'妈妈是老师: mẹ là giáo viên.','我妈妈是老师，爸爸是医生。'],
 [2,'grammar','他今天___昨天忙。',['比','给','从','向'],'比 dùng so sánh: hôm nay anh ấy bận hơn hôm qua.'],
 [2,'reading','小李每天六点起床，七点去公司。今天他八点才起床。\n今天他起床的时间怎么样？',['比平时晚','比平时早','和平时一样','没有起床'],'Bình thường dậy 6 giờ, hôm nay 8 giờ mới dậy: muộn hơn thường ngày.'],
 [2,'listening','Vì sao họ không đi đá bóng?',['下雨了','太热了','没有时间','身体不好'],'下雨了 chỉ nguyên nhân: trời mưa.','外面下雨了，我们今天不去踢足球了，在家看电影吧。'],
 [2,'listening','Người nói sẽ về lúc nào?',['明天晚上','今天晚上','明天早上','今天中午'],'明天晚上回来: tối mai về.','我今天不能回家，明天晚上回来。你不用等我吃饭。'],
 [3,'grammar','我把作业___，才出去玩。',['做完了','完了做','了做完','做了完的'],'把 + tân ngữ + động từ + bổ ngữ kết quả: 把作业做完了.'],
 [3,'reading','这家饭馆虽然不大，但是菜做得很好，所以每天都有很多客人。\n客人多的主要原因是什么？',['菜的味道好','饭馆很大','价格最低','离家很近'],'菜做得很好 là lý do được nêu; không có thông tin về giá hoặc khoảng cách.'],
 [3,'listening','Cuộc họp bắt đầu khi nào?',['三点半','三点','两点半','四点'],'三点改到三点半: đổi từ 3 giờ sang 3 giờ rưỡi.','原来的会议是下午三点，现在改到三点半。请大家提前十分钟到。'],
 [3,'listening','Họ sẽ làm gì trước?',['去银行','去超市','直接回家','去车站'],'先去银行，再去超市: đến ngân hàng trước, rồi đến siêu thị.','我们先去银行，再去超市买菜，买完以后就回家。'],
 [4,'grammar','___你认真准备，就能把这次演讲做好。',['只要','只有','尽管','即使'],'只要…就…: chỉ cần…thì…; 只有 thường kết hợp với 才.'],
 [4,'reading','为了减少浪费，公司不再给所有员工印发会议材料，需要纸质版的人可以提前申请。\n公司采取了什么办法？',['按需要提供纸质材料','取消所有会议','禁止员工用纸','要求所有人提前到场'],'按需要提供 là cung cấp theo nhu cầu; vẫn có thể xin bản giấy, không phải cấm dùng giấy.'],
 [4,'listening','Người nói đề nghị làm gì?',['先核对数据再提交','马上提交报告','删除所有数据','推迟到下个月'],'Đề nghị đối chiếu dữ liệu trước khi nộp để tránh sửa nhiều lần.','报告的内容已经差不多了，不过数据还没有核对。我建议先检查一下再提交，免得以后反复修改。'],
 [4,'listening','Vé cũ có dùng được không?',['可以，但要换座位','不能，必须重新买','只能明天用','只能站着看'],'Vẫn dùng vé cũ, nhân viên bố trí chỗ mới.','由于演出场地调整，原来的座位安排取消了。大家可以凭原票入场，工作人员会安排新的座位。'],
 [5,'grammar','___已经发现问题，就应该及时处理，而不是继续拖延。',['既然','哪怕','除非','无论'],'既然…就…: đã…thì…; lập luận từ một tình huống đã xác lập.'],
 [5,'reading','商店推出了免费维修服务，起初成本有所增加，几个月后老顾客介绍来的新顾客明显增多。经理认为，不能只看眼前的支出。\n经理最可能强调什么？',['服务有助于建立长期信任','维修成本可以完全忽略','所有顾客只在意价格','免费服务不会带来成本'],'Chi phí trước mắt đổi lấy niềm tin và khách hàng lâu dài; bài không nói chi phí bằng 0.'],
 [5,'listening','Quan điểm chính của người nói là gì?',['要在效率和质量之间取得平衡','速度越快越好','应该完全取消检查','只需要增加员工'],'Không được cắt bước kiểm tra cần thiết chỉ để chạy theo tốc độ.','缩短流程确实能提高效率，但如果把必要的检查也省掉，出了问题反而要花更多时间补救。所以我们不能只追求速度。'],
 [5,'listening','Vì sao dự án được chia thành từng giai đoạn?',['先验证需求，降低投入风险','资金已经全部用完','团队拒绝接受反馈','产品已经彻底失败'],'Thử quy mô nhỏ để xác nhận nhu cầu thật trước khi đầu tư toàn diện.','我们决定先在一个社区试行，收集反馈后再推广。这样做不是缺乏信心，而是希望在全面投入之前确认用户真正需要什么。'],
 [6,'grammar','Chọn câu có lỗi diễn đạt:',['通过这次讨论，使我们明确了方向。','这次讨论使我们明确了方向。','通过这次讨论，我们明确了方向。','我们在这次讨论中明确了方向。'],'通过… khiến cụm đầu thành trạng ngữ; thêm 使 làm câu thiếu chủ ngữ phù hợp. Ba cách còn lại đều có cấu trúc hoàn chỉnh.'],
 [6,'reading','评价一项公共服务，若只统计办理数量，容易把复杂个案视作效率的障碍。然而，恰恰是那些难以标准化的需求，更能检验制度能否兼顾公平。指标应帮助发现问题，而不应成为回避问题的理由。\n作者主要反对什么？',['用单一数量指标替代对服务价值的判断','利用任何数据改进服务','为复杂个案制定处理机制','在公共服务中关注公平'],'Phản đối dùng chỉ tiêu số lượng đơn nhất thay thế đánh giá giá trị; không phủ nhận mọi dữ liệu.'],
 [6,'listening','Người nói phân biệt điều gì?',['信息传播的热度与事实的可靠性','信息数量与储存成本','个人喜好与法律责任','技术进步与就业机会'],'Được lan truyền nhiều không đồng nghĩa đã được kiểm chứng.','一个观点被反复转发，只能说明它受到了关注，并不意味着它已经得到证实。如果把传播热度当作事实依据，我们就容易在看似一致的声音中忽略证据本身。'],
 [6,'listening','Hàm ý của người nói là gì?',['评价改革应考察实际影响而非形式变化','程序越复杂越能保证公平','所有改革都不值得尝试','只要采用新技术就一定成功'],'Đổi biểu mẫu hoặc tên gọi chưa đủ; cần nhìn vào trải nghiệm và quyền lợi thực tế.','如果所谓的改革只是把纸质表格搬到屏幕上，却没有减少重复填报，也没有解决不同部门之间的信息壁垒，那么形式虽然更新了，使用者的负担未必减轻。']
];rows.forEach(r=>add(...r));
const screenItems=items.slice();
// Original verification items: separate from the first screening pass, two per skill and level.
const probes=[
[1,'vocab','Chọn nghĩa của 昨天',['hôm qua','hôm nay','ngày mai','tuần sau'],'昨天 là hôm qua.','',['昨天']],
[1,'vocab','Chọn nghĩa của 买',['mua','bán','đọc','nghe'],'买 nghĩa là mua.','',['买']],
[1,'grammar','我___中国人。',['是','有','在','去'],'是 nối chủ ngữ với danh từ chỉ thân phận.'],
[1,'grammar','Chọn câu hỏi tên đúng:',['你叫什么名字？','你名字什么叫？','什么你名字叫？','叫你什么的名字？'],'你叫什么名字 là câu hỏi tên.'],
[1,'reading','小王有一个女儿，没有儿子。\n小王有几个女儿？',['一个','两个','三个','没有'],'一个女儿: một con gái.'],
[1,'reading','现在八点，我九点去学校。\n我几点去学校？',['九点','八点','七点','十点'],'九点去学校: đến trường lúc chín giờ.'],
[1,'listening','Người nói muốn ăn gì?',['米饭','面条','水果','面包'],'想吃米饭: muốn ăn cơm.','我想吃米饭，不想吃面条。'],
[1,'listening','Ai ở nhà?',['爸爸','妈妈','老师','朋友'],'爸爸在家: bố ở nhà.','妈妈去商店了，爸爸在家。'],
[2,'vocab','Chọn nghĩa của 便宜',['rẻ','đắt','xa','muộn'],'便宜 nghĩa là rẻ.','',['便宜']],
[2,'vocab','Chọn nghĩa của 可能',['có thể, có khả năng','chắc chắn đã xong','không bao giờ','ngay lập tức'],'可能 diễn tả khả năng.','',['可能']],
[2,'grammar','他已经回家___。',['了','着','过','地'],'已经…了 diễn tả việc đã xảy ra.'],
[2,'grammar','这件衣服比那件___。',['贵','最贵','很贵了','贵比'],'A 比 B + tính từ: so sánh hai sự vật.'],
[2,'reading','小刘生病了，所以今天没去上班。\n他今天为什么没上班？',['身体不舒服','公司放假','他要旅行','他起晚了'],'生病了: bị bệnh, không phải nghỉ lễ.'],
[2,'reading','我买了两张票，想和妹妹一起看电影。\n谁和我一起看电影？',['妹妹','哥哥','爸爸','同事'],'和妹妹一起: cùng em gái.'],
[2,'listening','Chiếc áo có màu gì?',['红色','白色','黑色','蓝色'],'红色的那件衣服: chiếc áo đỏ.','请把红色的那件衣服给我，不要白色的。'],
[2,'listening','Người nói đi bằng gì?',['公共汽车','出租车','自行车','火车'],'坐公共汽车: đi xe buýt.','今天我不坐出租车，坐公共汽车去公司。'],
[3,'vocab','Chọn nghĩa của 准备',['chuẩn bị','quyết định thắng','lãng phí','từ chối'],'准备 nghĩa là chuẩn bị.','',['准备']],
[3,'vocab','Chọn nghĩa của 终于',['cuối cùng','thường xuyên','bỗng nhiên','đặc biệt'],'终于 diễn tả kết quả cuối cùng sau chờ đợi hoặc nỗ lực.','',['终于']],
[3,'grammar','他跑___比我快。',['得','的','地','了'],'Động từ + 得 + bổ ngữ mức độ: 跑得快.'],
[3,'grammar','我一到家___给你打电话。',['就','才会的','只','把'],'一…就…: vừa…thì…'],
[3,'reading','姐姐觉得坐地铁比开车方便，因为不用找停车的地方。\n姐姐为什么喜欢坐地铁？',['不用找停车位','地铁票免费','她不会开车','地铁站就在家里'],'Lý do được nêu là không phải tìm chỗ đỗ xe.'],
[3,'reading','小张本来想买手机，后来发现旧手机还能用，就决定先不买了。\n小张最后决定怎样做？',['暂时不买手机','马上买新手机','把旧手机卖掉','借别人的手机'],'先不买了: tạm thời chưa mua.'],
[3,'listening','Họ hẹn gặp ở đâu?',['图书馆门口','学校门口','银行里面','饭馆里面'],'改到图书馆门口: đổi sang cửa thư viện.','我们不在学校门口见了，改到图书馆门口吧，那儿比较安静。'],
[3,'listening','Vì sao người nói đến muộn?',['路上堵车','忘了时间','没带车票','走错了楼'],'路上堵车: tắc đường.','对不起，我出门并不晚，可是路上堵车，所以迟到了。'],
[4,'vocab','Chọn nghĩa của 负责',['chịu trách nhiệm','đưa ra phản đối','tạm thời nghỉ ngơi','làm việc miễn phí'],'负责 nghĩa là chịu trách nhiệm.','',['负责']],
[4,'vocab','Chọn nghĩa của 经验',['kinh nghiệm','kết quả thi','điều kiện thời tiết','chi phí sinh hoạt'],'经验 là kinh nghiệm tích lũy.','',['经验']],
[4,'grammar','___遇到什么困难，我们都不会放弃。',['无论','只有','尽管的','既然'],'无论…都…: bất kể…đều…'],
[4,'grammar','他___完成了任务，而且还帮助了别人。',['不仅','即使','除非','为了'],'不仅…而且…: không chỉ…mà còn…'],
[4,'reading','商店规定，商品没有使用过且保留收据的顾客，可在七天内申请退货。小陈的收据丢了。\n按规定，小陈退货面临什么问题？',['缺少必要的凭证','商品一定用过了','购买时间超过一年','商店已经关门'],'保留收据 là điều kiện; bài chỉ nói thiếu hóa đơn, không nói đã dùng.'],
[4,'reading','为了方便员工，公司允许大家在八点到九点之间开始工作，只要每天完成规定的工作时间即可。\n这项安排的特点是什么？',['上班时间有一定弹性','员工可以随时下班','每天不必完成工时','公司取消了考勤'],'Bắt đầu trong khoảng tám đến chín giờ nhưng vẫn đủ giờ quy định.'],
[4,'listening','Khách hàng nên làm gì trước?',['保留付款记录并联系客服','直接重新付款','删除所有订单','马上去银行借钱'],'Giữ bằng chứng thanh toán và liên hệ hỗ trợ trước.','如果付款后订单仍显示未支付，请先保留付款记录，再联系客服处理，不要重复付款。'],
[4,'listening','Lý do thay đổi giờ giao hàng là gì?',['天气影响运输','顾客取消订单','仓库搬到外地','商品价格下降'],'大雨影响运输: mưa lớn ảnh hưởng vận chuyển.','原定今天上午送到的货物，因为大雨影响了运输，预计下午才能到，请大家理解。'],
[5,'vocab','Chọn nghĩa của 采取',['áp dụng, thực hiện biện pháp','hủy bỏ hợp đồng','thu thập quần áo','đưa ra lời khen'],'采取 thường kết hợp với 措施、行动.','',['采取']],
[5,'vocab','Chọn nghĩa của 逐渐',['dần dần','ngay tức khắc','hoàn toàn không','cực kỳ hiếm'],'逐渐 diễn tả thay đổi từ từ.','',['逐渐']],
[5,'grammar','___亲自调查，才知道问题出在哪里。',['只有','只要','无论','尽管'],'只有…才…: chỉ khi…thì mới…'],
[5,'grammar','与其反复抱怨，___想办法解决问题。',['不如','否则','甚至','却是'],'与其…不如…: thay vì…thà…'],
[5,'reading','某企业没有立即扩大生产，而是先向老客户调查产品使用中遇到的问题。管理者认为，改进现有产品比盲目增加产量更有价值。\n该企业首先关注什么？',['现有用户的实际体验','竞争对手的广告数量','工厂建筑的外观','短期内产量的排名'],'Khảo sát trải nghiệm người dùng hiện có trước khi mở rộng sản lượng.'],
[5,'reading','一位教师让学生修改自己的旧文章，而不是不断写新文章。她认为，发现并纠正反复出现的问题，才有助于真正进步。\n教师强调什么？',['重视对已有错误的反思','写作数量决定全部成绩','旧文章没有修改价值','学生应避免独立写作'],'Nhận diện và sửa lỗi lặp quan trọng hơn chỉ tăng số bài viết.'],
[5,'listening','Tác giả khuyên cách đọc nào?',['先理解整体意思再处理生词','每个生词都必须立即查','只读已经完全学过的材料','完全忽略所有生词'],'Nắm ý chung rồi mới xử lý từ mới để không đứt mạch đọc.','阅读时如果每碰到一个生词就停下来，往往会失去对全文的理解。不妨先把握主要意思，再处理影响理解的词。'],
[5,'listening','Vì sao chưa áp dụng phương án ngay?',['还需要验证实际效果','所有人都明确反对','预算已经被取消','方案内容完全相同'],'Cần thử nghiệm trước khi quyết định triển khai toàn diện.','这个方案在理论上很有吸引力，但是否适合我们的实际情况，还需要通过小范围试验来验证。'],
[6,'vocab','Chọn nghĩa của 权衡',['cân nhắc lợi hại','tuyên bố chiến thắng','tách rời hoàn toàn','tự động chấp thuận'],'权衡 là cân nhắc, so sánh các mặt lợi hại.','',['权衡']],
[6,'vocab','Chọn nghĩa của 缺陷',['khiếm khuyết','tiềm năng lớn','thành quả chung','sự thay thế'],'缺陷 là điểm thiếu sót, khiếm khuyết.','',['缺陷']],
[6,'grammar','Chọn câu diễn đạt không đúng:',['他能否成功，取决于他付出的努力程度是关键。','他能否成功，取决于他付出的努力。','他付出的努力，是影响成功的重要因素。','努力的程度会影响他成功的可能性。'],'Câu đầu chồng hai kết cấu 取决于… và …是关键, làm cấu trúc lẫn lộn.'],
[6,'grammar','Chọn câu diễn đạt nhất quán:',['是否采用这项技术，需要综合考虑成本和效果。','是否采用这项技术，必须采用。','这项技术是否被采用了尚未。','考虑是否技术采用需要成本效果。'],'是否…需要综合考虑… trình bày lựa chọn nhất quán, hoàn chỉnh.'],
[6,'reading','当评价体系只奖励容易量化的成果时，长期投入而短期难见成效的工作便可能被低估。这并非说明量化毫无意义，而是提醒管理者警惕指标对行为的反向塑造。\n作者的核心提醒是什么？',['评价指标可能改变人们的行为选择','所有量化评价都应立即取消','短期成果必然比长期工作更重要','管理者不应使用任何评价体系'],'Tác giả cảnh báo tác động ngược của chỉ tiêu, không phủ định toàn bộ việc định lượng.'],
[6,'reading','公共讨论中，表达鲜明的立场往往比承认问题的复杂性更容易获得支持。然而，真正负责任的决策，需要保留对不确定因素的审视，而不是用情绪上的一致代替证据。\n作者更支持哪种态度？',['在证据基础上审慎处理不确定性','优先追求所有人情绪上的一致','只接受最鲜明且单一的立场','因为问题复杂就拒绝做出决策'],'Ủng hộ thận trọng dựa trên bằng chứng và xem xét tính bất định.'],
[6,'listening','Người nói phê bình điều gì?',['把形式上的参与当成真实的影响力','让公众了解决策过程','在讨论前收集不同意见','为参与者提供必要信息'],'Có mặt nhưng không ảnh hưởng quyết định chỉ là tham gia hình thức.','如果参与者虽然被邀请到场，却既不能了解关键资料，也无法影响任何决定，那么这种参与很可能只停留在形式上。'],
[6,'listening','Điều kiện của đổi mới có giá trị là gì?',['解决真实问题并接受效果检验','只需采用更新的名词','必须完全否定过去经验','首先保证宣传足够热烈'],'Đổi mới phải giải quyết vấn đề thật và được kiểm chứng bằng kết quả.','创新的价值不在于名称是否新颖，而在于它是否回应了真实需求，并且能够经受实际效果的检验。']
];probes.forEach(r=>add(...r));const probeItems=items.slice(screenItems.length);
function shuffled(a,random=Math.random){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function questions(random=Math.random){return Array.from({length:6},(_,i)=>screenItems.filter(q=>q.level===i+1).map(q=>{const ids=shuffled(q.options.map((_,j)=>j),random);return {...q,options:ids.map(j=>q.options[j]),answer:ids.indexOf(q.answer)};})).flat();}
function weight(a){return a.correct?({sure:1,uncertain:.65,guess:.25}[a.confidence]||0):0;}
function levelStats(answers,level,skill){const rows=answers.filter(a=>a.level===level&&(!skill||a.skill===skill)&&!a.unavailable),n=rows.length;return {n,correct:rows.filter(a=>a.correct).length,weighted:rows.reduce((n,a)=>n+weight(a),0),fragile:rows.filter(a=>a.correct&&a.confidence!=='sure').length};}
function corePass(answers,level){const a=answers.filter(a=>a.level===level&&a.skill!=='listening');return a.length>=4&&a.filter(a=>a.correct).length>=Math.ceil(a.length*.75)&&a.reduce((n,a)=>n+weight(a),0)+1e-9>=a.length*.65;}
function shouldStop(answers){const level=Math.max(0,...answers.map(a=>a.level));return level>=6||level>=2&&!corePass(answers,level)&&!corePass(answers,level-1);}
function summarize(answers){
 const tested=Math.max(0,...answers.map(a=>a.level)),perLevel=Array.from({length:tested},(_,i)=>{const level=i+1;return {level,core:levelStats(answers.filter(a=>a.skill!=='listening'),level),listening:levelStats(answers,level,'listening'),passed:corePass(answers,level)};});
 let coreLevel=0,listenLevel=0;for(const l of perLevel){if(l.level===coreLevel+1&&l.passed)coreLevel=l.level;if(l.level===listenLevel+1&&l.listening.n>=2&&l.listening.correct>=Math.ceil(l.listening.n*.8)&&l.listening.weighted+1e-9>=l.listening.n*.65)listenLevel=l.level;}
 const listeningComplete=perLevel.every(l=>l.listening.n>=2),level=listeningComplete?Math.min(coreLevel,listenLevel):coreLevel;
 const bySkill=Object.fromEntries(skills.map(s=>{const a=answers.filter(a=>a.skill===s&&!a.unavailable);return [s,{n:a.length,correct:a.filter(a=>a.correct).length,fragile:a.filter(a=>a.correct&&a.confidence!=='sure').length,rate:a.length?a.reduce((n,a)=>n+weight(a),0)/a.length:null}];}));
 const weak=skills.filter(s=>bySkill[s].n&&bySkill[s].rate<.75).sort((a,b)=>bySkill[a].rate-bySkill[b].rate),inconsistent=perLevel.some(l=>l.level>coreLevel&&l.passed),fragile=answers.filter(a=>a.correct&&a.confidence!=='sure').length;
 return {version:1,level,coreLevel,listenLevel,listeningComplete,tested,perLevel,bySkill,weak,fragile,remembered:answers.filter(a=>a.correct&&a.confidence==='sure').length,forgotten:answers.filter(a=>!a.unavailable&&!a.correct).length,inconsistent,confidence:!listeningComplete||inconsistent||fragile>answers.length*.25?'Cần kiểm chứng thêm':'Định hướng ban đầu',startLevel:Math.min(6,Math.max(1,level+1))};
}
const advice={vocab:'Ôn các từ chưa chắc bằng thẻ và SRS, rồi chọn nghĩa trong câu mới.',grammar:'Viết lại câu sai, xác định vị trí từ và làm bài điền từ hoặc sắp xếp câu.',reading:'Đọc đoạn ngắn, gạch từ khóa và tìm câu làm bằng chứng trước khi chọn đáp án.',listening:'Nghe đoạn ngắn hai lượt: lượt đầu nắm ý, lượt sau đối chiếu từ khóa; làm câu nghe mới sau đó.'};
function diagnose(answers){
 const result=summarize(answers),rows=skills.map(skill=>{const a=answers.filter(a=>a.skill===skill&&!a.unavailable),sure=a.filter(a=>a.correct&&a.confidence==='sure'),miss=a.filter(a=>!a.correct),fragile=a.filter(a=>a.correct&&a.confidence!=='sure'),stats=result.bySkill[skill];return {skill,label:labels[skill],n:a.length,correct:stats.correct,sure:sure.length,fragile:fragile.length,wrong:miss.length,rate:stats.rate,status:!a.length?'unassessed':a.length>=3&&stats.rate>=.75&&sure.length>=2?'strength':a.length>=2&&stats.rate<.75?'weakness':'developing',levels:[...new Set(a.map(x=>x.level))],evidence:sure.map(x=>x.id),needsReview:[...miss,...fragile].map(x=>x.id),advice:advice[skill]};});
 return {rows,strengths:rows.filter(x=>x.status==='strength'),weaknesses:rows.filter(x=>x.status==='weakness'),developing:rows.filter(x=>x.status==='developing'),limits:[...(!result.listeningComplete?['Phần nghe chưa đủ mẫu ở các cấp đã kiểm tra; chưa chốt trình độ nghe.']:[]),'Nói và viết tự do chưa được đánh giá.',...(rows.some(x=>x.n>0&&x.n<3)?['Kỹ năng có dưới 3 câu chỉ là tín hiệu ban đầu, cần kiểm chứng thêm.']:[])]};
}
function roadmap(result,minutes=30,days=6){minutes=Math.min(120,Math.max(15,Number(minutes)||30));days=Math.min(7,Math.max(5,Number(days)||6));const focus=result.weak[0]||skills.filter(s=>result.bySkill[s].n&&(result.bySkill[s].correct<result.bySkill[s].n||result.bySkill[s].fragile>0)).sort((a,b)=>result.bySkill[a].rate-result.bySkill[b].rate)[0]||'reading',first=Math.max(1,result.perLevel.find(l=>!l.passed||l.core.correct<l.core.n||l.core.fragile>0||l.listening.n>0&&(l.listening.correct<l.listening.n||l.listening.fragile>0))?.level||result.startLevel);const review=Math.round(minutes*.35),skill=Math.round(minutes*.35);return {minutes,days,focus,reviewLevel:first,studyLevel:result.startLevel,daily:[{name:'Khôi phục từ và ôn cách quãng',minutes:review,route:'srs'},{name:'Củng cố '+labels[focus].toLowerCase(),minutes:skill,route:focus==='vocab'?'learn':'lessons'},{name:'Bài học và kiểm tra ngắn',minutes:minutes-review-skill,route:'lessons'}],phases:[{title:'Buổi 1–3 · Khôi phục nền tảng',detail:`Ôn nội dung HSK ${first}; bắt đầu từ lỗi và các câu nhớ mang máng, chưa cần học lại toàn bộ.`},{title:'Buổi 4–7 · Vá kỹ năng yếu',detail:`Ưu tiên ${labels[focus].toLowerCase()}, làm bài ngắn theo bài học. Ôn lại sau 1, 3 và 7 ngày.`},{title:'Buổi 8–12 · Học tiếp có kiểm tra',detail:`Học bài phù hợp ở HSK ${result.startLevel}; nếu sai nhiều thì quay lại phần nền tảng tương ứng.`},{title:'Buổi 13–14 · Kiểm chứng khả năng nhớ',detail:'Làm bài trộn không nhìn đáp án, rồi đánh giá lại. Chỉ tăng nhịp khi vẫn nhớ sau các buổi cách ngày.'}]};}
function validAnswer(a,strict=false){const q=a&&items.find(q=>q.id===a.id);return !!q&&a.level===q.level&&a.skill===q.skill&&typeof a.correct==='boolean'&&['sure','uncertain','guess'].includes(a.confidence)&&typeof a.unavailable==='boolean'&&(!a.unavailable||a.skill==='listening'&&!a.correct)&&(!strict||((a.selected===null||q.options.includes(a.selected))&&a.correct===(a.selected===q.options[0])&&(!a.unavailable||a.selected===null)));}
function adaptivePath(ids,meta){
 if(!meta||meta.version!==1||meta.stopMode!==undefined&&meta.stopMode!=='evidence'||!['screen','verify'].includes(meta.stage))return false;
 if(meta.stage==='screen')return ids.length===36&&ids.every((id,i)=>screenItems.some(q=>q.id===id&&q.level===Math.floor(i/6)+1));
 const n=meta.ceiling,lower=n-1;if(meta.stopMode==='evidence'){return Number.isInteger(n)&&n>=2&&n<=6&&meta.lower===lower&&ids.length>=n*6+8&&ids.length<=n*6+16&&ids.slice(0,n*6).every((id,i)=>screenItems.some(q=>q.id===id&&q.level===Math.floor(i/6)+1))&&ids.slice(n*6).every(id=>probeItems.some(q=>q.id===id&&(q.level===lower||q.level===n)));}if(!Number.isInteger(n)||n<2||n>6||meta.lower!==lower||ids.length!==n*6+12)return false;
 return ids.slice(0,n*6).every((id,i)=>screenItems.some(q=>q.id===id&&q.level===Math.floor(i/6)+1))&&ids.slice(n*6).every(id=>probeItems.some(q=>q.id===id&&q.level>=lower&&q.level<=n))&&[lower,n].every(level=>ids.slice(n*6).filter(id=>probeItems.find(q=>q.id===id)?.level===level).length===6);
}
function validReport(r){if(!r||r.version!==1||!Number.isFinite(r.createdAt)||!Array.isArray(r.answers)||r.answers.length<12||r.answers.length>52||(!r.adaptive?.stopMode&&r.answers.length%6)||new Set(r.answers.map(a=>a?.id)).size!==r.answers.length||!r.answers.every(a=>validAnswer(a,!!r.adaptive)))return false;if(r.adaptive){if(!adaptivePath(r.answers.map(a=>a.id),r.adaptive))return false;if(r.adaptive.stopMode==='evidence'&&r.adaptive.stage==='verify'){const clear=stoppingEvidence(r).clear;return r.adaptive.stopReason===(clear?'sufficient':'bank-exhausted')&&(clear||r.answers.length===r.adaptive.ceiling*6+16);}return true;}return r.answers.length<=36&&r.answers.every(a=>screenItems.some(q=>q.id===a.id)&&a.level<=r.answers.length/6);}
function validDraft(d,owner){if(!d||d.version!==1||d.owner!==owner||!Array.isArray(d.questions)||d.questions.length>52||new Set(d.questions.map(q=>q?.id)).size!==d.questions.length||!Array.isArray(d.answers)||d.answers.length>=d.questions.length||!d.questions.every(q=>{const b=items.find(b=>b.id===q?.id);return b&&q.level===b.level&&q.skill===b.skill&&q.prompt===b.prompt&&q.audio===b.audio&&q.explanation===b.explanation&&Array.isArray(q.options)&&q.options.length===4&&new Set(q.options).size===4&&b.options.every(o=>q.options.includes(o))&&q.options[q.answer]===b.options[0];})||!d.answers.every((a,i)=>a.id===d.questions[i].id&&validAnswer(a,!!d.adaptive)))return false;return d.adaptive?adaptivePath(d.questions.map(q=>q.id),d.adaptive):d.questions.length===36&&d.questions.every((q,i)=>screenItems.some(b=>b.id===q.id)&&q.level===Math.floor(i/6)+1);}
function priorities(answers,level){return skills.slice().sort((a,b)=>{const x=levelStats(answers,level,a),y=levelStats(answers,level,b);return (x.n?x.weighted/x.n:.5)-(y.n?y.weighted/y.n:.5);});}
function prioritize(d,skill,keepCurrent=false){if(d.adaptive?.stage!=='verify'||!skills.includes(skill))return;const start=d.answers.length+(keepCurrent?1:0),i=d.questions.findIndex((q,i)=>i>=start&&q.skill===skill);if(i>start)d.questions.splice(start,0,...d.questions.splice(i,1));}
// Evidence rules are deterministic: AI may prioritize skills, never declare certainty.
function stoppingEvidence(d){
 const m=d.adaptive,n=d.answers.length-m.ceiling*6,missing=[];
 for(const level of [m.lower,m.ceiling])for(const skill of skills){
  const a=d.answers.filter(a=>a.level===level&&a.skill===skill),usable=a.filter(a=>!a.unavailable);
  if(skill==='listening'&&a.length>=3&&!usable.length)continue;
  const count=skill==='listening'?3:2,rate=usable.filter(a=>a.correct).length/(usable.length||1),weighted=usable.reduce((v,a)=>v+weight(a),0)/(usable.length||1);
  if(usable.length<count||!(rate<=.35||rate>=.8&&weighted>=.75))missing.push({level,skill});
 }
 return {clear:n>=8&&!missing.length,missing};
}
function advance(d,random=Math.random){
 if(!d.adaptive)return d.answers.length>=36||d.answers.length>=12&&d.answers.length%6===0&&shouldStop(d.answers);
 if(d.adaptive.stage==='verify'){if(d.adaptive.stopMode==='evidence'){const evidence=stoppingEvidence(d);if(evidence.clear||d.answers.length>=d.questions.length){d.adaptive.stopReason=evidence.clear?'sufficient':'bank-exhausted';d.questions=d.questions.slice(0,d.answers.length);return true;}const skill=d.adaptive.nextSkill;delete d.adaptive.nextSkill;const next=d.questions.findIndex((q,i)=>i>=d.answers.length&&evidence.missing.some(x=>x.level===q.level&&x.skill===q.skill)&&(skills.includes(skill)?q.skill===skill:true));if(next>d.answers.length)d.questions.splice(d.answers.length,0,...d.questions.splice(next,1));return false;}if(d.answers.length>=d.questions.length)return true;const skill=d.adaptive.nextSkill;delete d.adaptive.nextSkill;prioritize(d,skills.includes(skill)?skill:priorities(d.answers,d.adaptive.ceiling)[0]);return false;}
 const n=d.answers.length;if(n<12||n%6)return false;const level=n/6,listen=levelStats(d.answers,level,'listening'),failed=!corePass(d.answers,level)||level===2&&!corePass(d.answers,1)||listen.n>=2&&(listen.correct/listen.n<.75||listen.weighted/listen.n<.6);
 if(failed){const lower=level-1,priority=priorities(d.answers,level);const extras=[];for(const hsk of [lower,level]){const pool=probeItems.filter(q=>q.level===hsk),chosen=d.adaptive.stopMode==='evidence'?pool.slice():skills.map(skill=>pool.find(q=>q.skill===skill));if(d.adaptive.stopMode!=='evidence')for(const skill of priority.slice(0,2))chosen.push(pool.find(q=>q.skill===skill&&!chosen.includes(q)));extras.push(...shuffled(chosen,random).map(q=>{const ids=shuffled([0,1,2,3],random);return {...q,options:ids.map(i=>q.options[i]),answer:ids.indexOf(0)};}));}d.questions=d.questions.slice(0,n).concat(extras);d.adaptive={version:1,stage:'verify',ceiling:level,lower,aiChecks:0,...(d.adaptive.stopMode==='evidence'?{stopMode:'evidence'}:{})};prioritize(d,priority[0]);return false;}
 return level>=6;
}
const api={KEY,items,screenItems,probeItems,skills,labels,questions,weight,levelStats,corePass,shouldStop,summarize,diagnose,roadmap,validReport,validDraft,priorities,prioritize,advance,stoppingEvidence};root.HSKPlacementCore=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
