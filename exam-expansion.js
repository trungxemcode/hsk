/* Independently authored exercises; references describe formats, never source questions. */
(function(root){'use strict';
function expand(B){if(B.expansionVersion)return B;
B.types.push(
{id:'sentenceMatch',name:'Ghép câu theo tình huống',skill:'Đọc',levels:[1,2,3],format:'choice',note:'Chọn câu nối tiếp phù hợp ý nghĩa; luyện một cặp mỗi lượt.'},
{id:'listenDetail',name:'Nghe lấy chi tiết và hàm ý',skill:'Nghe',levels:[2,3,4,5,6],format:'choice',note:'Từ thời gian, nơi chốn đến mục đích và hàm ý. Giọng máy.'},
{id:'equivalent',name:'Chọn ý diễn đạt tương đương',skill:'Đọc',levels:[5],format:'choice',note:'Đối chiếu ý nghĩa cả câu, tránh phương án đổi phạm vi hoặc quan hệ logic.'});
const add=(type,level,rows)=>rows.forEach((r,i)=>{const [text,a,b,c,explanation]=r,listen=type==='listenDetail',parts=listen?text.split('§'):[];B.items.push({id:'original-expansion-'+type+'-'+level+'-'+(i+1),type,level,prompt:listen?parts[1]:text,...(listen?{audio:parts[0]}:{}),options:[a,b,c],answer:0,explanation,provenance:'original-20261013'});});
add('sentenceMatch',1,[
['今天是星期六。','明天是星期日。','昨天是星期日。','明天是星期五。','星期六 tiếp theo là 星期日; phân biệt 明天 và 昨天.'],
['我在学校工作。我的学生很多。','我是老师。','我是医生。','我是学生。','Người làm ở trường và có học sinh là giáo viên.'],
['杯子里没有水了。','我想买水。','我不想喝水。','杯子里有很多水。','Câu nối có thể nêu nhu cầu mua nước; hai câu còn lại không nối theo nhu cầu hoặc trái thông tin.'],
['爸爸今天不在家。','他在医院工作。','他今天在家看书。','他是我爸爸。','Chọn câu giải thích nơi ở hiện tại, tránh câu trái 不在家 hoặc chỉ lặp quan hệ.'],
['我买了三个苹果，又买了两个。','我有五个苹果。','我有一个苹果。','我有三个苹果。','Ba cộng hai bằng năm.'],
['我们八点去学校。现在七点。','我们现在不去。','我们现在在学校。','我们九点去。','Chưa đến giờ tám giờ; không có bằng chứng đang ở trường.'],
['她会说汉语。','她可以用汉语说自己的名字。','她不会说汉语。','她不认识汉字，所以不会说汉语。','会说 chỉ khả năng nói; không suy ra khả năng đọc chữ.'],
['这本书是我的，不是他的。','这本书不是他的。','这本书是他的。','这本书不是我的。','Câu đầu giữ nguyên phủ định quyền sở hữu của người nam; các câu khác trái thông tin.'],
['妈妈想喝茶，不想喝水。','我给妈妈买茶。','我给妈妈买水。','妈妈不想喝茶。','Chọn hành động đáp ứng mong muốn uống trà.'],
['今天太热了。','我想喝一点儿水。','今天很冷。','我想买很多衣服。','Uống nước nối hợp lý với trời nóng; không chọn câu phủ định nóng.'],
['他的女儿今年六岁。','明年她七岁。','明年她五岁。','今年她七岁。','明年 tăng thêm một tuổi; chú ý mốc năm.'],
['我没有钱，不能买这本书。','我今天不买这本书。','我今天买了这本书。','我有很多钱。','Không thể mua nên hôm nay không mua; hai câu còn lại mâu thuẫn.']]);
add('sentenceMatch',2,[
['这件衣服太大了。','请给我一件小一点儿的。','请给我一件更大的。','这件衣服很小。','小一点儿 đáp ứng nhu cầu khi áo quá rộng.'],
['我已经吃过午饭了。','现在不想再吃了。','我还没吃午饭。','我每天都不吃午饭。','已经…了 khác 还没 và không có nghĩa ngày nào cũng không ăn.'],
['火车还有十分钟就开了。','我们快一点儿吧。','我们明天再去车站。','火车昨天开了。','Còn mười phút nên cần đi nhanh; không đổi mốc thời gian.'],
['他比我高，但是比我弟弟矮。','我弟弟比他高。','他比我弟弟高。','我比他高。','Thứ tự chiều cao: em trai > anh ấy > tôi.'],
['电影票在桌子上。','你可以去桌子上找。','电影票在书包里。','我没买电影票。','找 trên bàn đúng thông tin vị trí đã cung cấp.'],
['外面下雨了，我没带伞。','你可以用我的伞。','今天没有下雨。','你已经带了伞。','Đề nghị cho mượn ô phù hợp thiếu ô lúc mưa.']]);
add('listenDetail',2,[
['女：你几点来？男：我八点下班，九点到你家。§他几点到？','九点','八点','七点','八点 là giờ tan làm; 九点 mới là giờ đến.'],
['男：你想吃米饭吗？女：我刚吃过，想喝点儿茶。§她现在想要什么？','茶','米饭','咖啡','Người nữ vừa ăn rồi, hiện muốn uống trà.'],
['女：今天去买衣服吗？男：今天没时间，明天下午去吧。§他们什么时候去？','明天下午','今天下午','明天上午','Lời đề nghị đổi lịch rõ ràng sang chiều mai.'],
['男：你的狗几岁了？女：去年两岁，今年三岁。§狗今年几岁？','三岁','两岁','四岁','Năm ngoái hai tuổi, năm nay ba tuổi.'],
['女：你怎么去学校？男：今天坐公共汽车，明天走路。§他今天怎么去？','坐公共汽车','走路','坐飞机','Phân biệt phương tiện hôm nay với kế hoạch ngày mai.'],
['男：这两个杯子多少钱？女：一个二十块，两个四十块。§两个杯子多少钱？','四十块','二十块','六十块','Câu hỏi hỏi tổng hai cốc, không hỏi giá một cốc.']]);
add('sentenceMatch',3,[
['这次比赛虽然没赢，但是我们学到了很多。','结果不理想，收获却不少。','因为赢了，所以没有收获。','我们没有参加比赛。','虽然…但是… nhấn mạnh vẫn có thu hoạch dù không thắng.'],
['我先去图书馆还书，然后去超市买东西。','买东西以前，我要先还书。','还书以前，我要先买东西。','我只去超市。','先…然后… xác định trình tự trả sách trước.'],
['这道题我想了很久，还是没想出来。','我还不知道答案。','我马上知道了答案。','我没看过这道题。','还是没想出来 nghĩa là vẫn chưa tìm ra đáp án.'],
['大家都到齐了，我们可以出发了。','不用再等别人了。','还有很多人没来。','我们已经回来很久了。','到齐 là mọi người đã có mặt đủ.'],
['如果明天天气好，我们就去爬山。','去不去爬山，要看天气。','不管天气怎么样，我们都去爬山。','明天一定下雨。','Nếu…thì… là điều kiện; không khẳng định chắc chắn đi hay trời mưa.'],
['他一边做饭，一边听广播。','这两件事是同时做的。','他做完饭才听广播。','他没有听广播。','一边…一边… biểu thị đồng thời.']]);
add('listenDetail',3,[
['女：你昨天不是说去看电影吗？男：后来朋友生病了，我陪他去了医院。§他昨天做了什么？','陪朋友看病','去看电影','去医院工作','后来 đổi kế hoạch; hành động thực tế là đưa bạn đi khám.'],
['男：这本书你看完了吗？女：还差最后两页，今晚就能还给你。§她现在的情况是？','快看完了','还没开始看','已经还了书','还差最后两页 cho biết sắp đọc xong.'],
['女：你为什么换房间？男：原来的房间离马路太近，晚上睡不好。§他换房间的原因是？','想安静地睡觉','房间太便宜','想住得离马路更近','Tiếng đường làm ngủ không tốt; không có bằng chứng giá phòng.'],
['男：这双鞋怎么样？女：颜色不错，就是有点儿小。§她觉得鞋有什么问题？','大小不合适','颜色不好看','价格太高','就是 có thể dẫn điểm chưa hài lòng: giày hơi nhỏ.'],
['女：你把照片发给老师了吗？男：发了，不过忘了写名字，我得再发一次。§他接下来要做什么？','补上名字再发','去拍新照片','给老师打电话','忘了写名字 là lỗi cần bổ sung khi gửi lại.'],
['男：咱们坐地铁去吧。女：今天地铁人太多，骑车只要十五分钟。§女的建议怎么去？','骑车','坐地铁','坐出租车','Nêu thời gian đi xe đạp để đề xuất lựa chọn khác tàu điện.']]);
add('listenDetail',4,[
['男：会议八点半开始，我们八点出门够吗？女：路上至少要四十分钟，最好提前二十分钟出发。§女的主要提醒什么？','出门时间应提早','会议取消了','路上只需二十分钟','八点出门需四十 phút sẽ muộn; đề nghị xuất phát sớm hơn.'],
['女：你怎么只买了一张票？男：小刘临时加班，另一张已经退了。§小刘为什么不去？','工作安排改变','没找到售票处','不喜欢看演出','临时加班 là lý do; vé đã trả là kết quả.'],
['男：这份报告要重新写吗？女：不用，数据没问题，把结论说明白就行。§报告需要怎样修改？','解释清楚结论','更换所有数据','从头重写','不用 phủ định viết lại toàn bộ, chỉ cần làm rõ kết luận.'],
['女：这么多作业，你怎么还在看电视？男：我已经做完了，想休息十分钟。§男的为什么看电视？','完成任务后休息','放弃做作业','电视里正在讲作业','已经做完了 là tiền đề, không suy đoán đang bỏ việc.'],
['男：这个活动为什么改到室内？女：本来想在公园举行，可是天气预报说明天会下大雨。§活动改变地点的原因是？','可能受到天气影响','室内门票更便宜','公园已经关闭','预报 về mưa khiến đổi địa điểm; không có thông tin đóng công viên.'],
['女：你对新工作满意吗？男：工资跟以前差不多，不过能学到不少东西。§男的看重新工作的什么？','学习的机会','工资明显提高','每天不用工作','不过 chuyển sang ưu điểm cơ hội học; lương không tăng rõ rệt.']]);
add('gap',4,[
['这些资料很重要，请你＿＿保存。','仔细','突然','从来','仔细 bổ nghĩa cách giữ tài liệu cẩn thận.'],
['他＿＿答应帮忙，就一定会做到。','既然','虽然','不但','既然…就… liên kết tiền đề đã nhận lời với trách nhiệm thực hiện.'],
['我想去听音乐会，＿＿今天晚上要加班，只好放弃了。','可是','因此','于是','Mong muốn đi nhưng phải làm thêm: quan hệ chuyển ngoặt.'],
['这件事还没调查清楚，不要急着下＿＿。','结论','礼物','地址','下结论 là kết hợp cố định, nghĩa là đưa ra kết luận.'],
['医生提醒他，每天＿＿运动比周末一次练很久更合适。','坚持','参观','通知','坚持运动 biểu thị duy trì vận động thường xuyên.'],
['你先把表格填好，＿＿交给前台的工作人员。','再','也','从','先…再… thể hiện hai bước theo trình tự.']]);
add('listenDetail',5,[
['女：这个项目不是已经批准了吗？男：预算是通过了，可负责人要求先做小范围测试，再决定全面推广。§项目目前处于什么阶段？','准备先进行试验','全面推广已经完成','预算申请被拒绝','预算获批 không đồng nghĩa đã triển khai toàn diện.'],
['男：顾客说价格太高，我们要降价吗？女：先问清他比较的是哪种服务，报价里包含的项目可能不一样。§女的建议先做什么？','核对比较条件','立即降低所有价格','拒绝与顾客沟通','Cần đối chiếu phạm vi dịch vụ trước khi kết luận giá cao.'],
['女：你不是说这本书不好读吗？男：前两章有点儿难，读下去以后，作者的思路反而越来越清楚。§男的对这本书的看法有什么变化？','逐渐理解了作者的思路','越读越无法理解','从一开始就觉得很容易','前…以后…反而… mô tả chuyển biến tích cực, không phủ nhận khó lúc đầu.'],
['男：报名的人比预计多了，我们增加名额吧。女：人数可以增加，但老师和设备也得跟上，否则效果会打折。§女的最关注什么？','教学条件是否足够','报名费能否提高','报名表是否漂亮','Không chỉ tăng số chỗ; cần nhân lực và thiết bị bảo đảm chất lượng.'],
['女：这位专家的意见跟我们的计划不一样。男：先看看他的依据，也许他掌握了我们没注意到的情况。§男的态度是什么？','愿意检查不同意见的依据','立即完全放弃计划','认为专家一定错误','先看看依据 thể hiện thái độ xem xét, không chấp nhận hay bác bỏ ngay.'],
['男：这次调查只有六个人回复，能公布结论吗？女：可以介绍这些人的意见，但别把它说成所有顾客的选择。§女的提醒什么？','不要扩大结论的适用范围','六个人代表全部顾客','调查结果完全不能介绍','Có thể báo cáo phản hồi nhưng không khái quát vượt mẫu nhỏ.']]);
add('equivalent',5,[
['除非提前预约，否则周末很难找到座位。','周末想有座位，最好先预约。','预约后周末一定没有座位。','只有工作日才允许预约。','除非…否则… nêu điều kiện; không nói cấm đặt chỗ vào cuối tuần.'],
['这次调整并非为了减少服务，而是为了把人员安排得更合理。','调整的目的是优化人员安排。','调整的唯一目的是取消服务。','工作人员的人数已经减少了一半。','并非…而是… bác bỏ mục đích giảm dịch vụ, nêu mục đích bố trí nhân sự.'],
['他没有直接否定建议，只是要求补充证据。','他希望先获得更多依据。','他已经同意马上执行。','他认为建议完全没有价值。','Yêu cầu chứng cứ thêm không đồng nghĩa đồng ý thực hiện hay phủ định hoàn toàn.'],
['与其等问题出现后再处理，不如现在就做好准备。','提前准备比事后处理更好。','只要等待就能避免问题。','现在不需要任何准备。','与其…不如… biểu thị lựa chọn được đánh giá tốt hơn.'],
['没有收到投诉，并不意味着每位顾客都满意。','不能仅凭没有投诉判断大家都满意。','所有顾客都已经投诉了。','只要有人投诉，所有人就都不满意。','Phủ định suy luận quá mức; không khẳng định có bao nhiêu người không hài lòng.'],
['活动能否继续，取决于下个月是否有足够的经费。','资金情况会影响活动是否继续。','活动已经永久结束。','经费多少都不会影响活动。','能否…取决于… giữ trạng thái có điều kiện, chưa có quyết định cuối cùng.']]);
add('listenDetail',6,[
['女：试行期间效率提高了，我们是否可以直接推广？男：还不能只看平均值。部分复杂问题处理得更慢，先弄清哪些环节受益、哪些人承担了额外成本。§男的强调什么？','推广前应检查收益和负担的分布','平均效率提高就足以证明所有人受益','只需增加处理复杂问题的费用','Trung bình tốt hơn chưa phản ánh phân bố lợi ích và chi phí; cần phân tích nhóm chịu ảnh hưởng.'],
['男：受访者都支持新方案，这算不算充分证据？女：还得看看没有接受访问的人是谁。如果忙碌的人更容易被漏掉，支持率就可能偏高。§女的担心什么？','样本选择可能造成偏差','所有受访者都在故意说谎','访问次数越多结论越不可靠','Không tham gia khảo sát có thể liên quan đặc điểm đối tượng, tạo thiên lệch mẫu.'],
['女：这个数字连续三个月上升，是否证明措施有效？男：也可能是季节变化或统计方式调整。我们得把这些因素分开，不能仅凭同时发生就认定因果关系。§男的反对哪种判断？','直接把同期变化当作因果证据','研究季节对数字的影响','确认统计方法是否一致','Cùng xảy ra không tự chứng minh nguyên nhân; các yếu tố khác cần kiểm tra.'],
['男：要不要把所有审批步骤都取消？女：重复填写可以删掉，但确认责任和处理特殊情况的环节未必多余。简化不是把每一道手续都当成障碍。§女的主张是什么？','区分无效重复与必要程序','保留全部手续且不作检查','任何审批步骤都必须取消','Lược bỏ thao tác lặp không cần thiết nhưng giữ bước có chức năng thực tế.'],
['女：员工没有提出异议，是不是表示接受？男：未必。如果提出意见会影响考核，沉默可能只是一种自我保护。得让人有安全表达的渠道。§男的认为沉默可能意味着什么？','担心表达意见带来不利后果','毫无保留地赞同安排','完全不了解工作内容','Điều kiện bày tỏ ý kiến có thể ảnh hưởng hành vi; không suy ra đồng ý từ im lặng.'],
['男：这次合作没有达到原来的目标，是否就毫无价值？女：要区分目标未实现与过程没有收获。哪些经验可以迁移到下一次，也需要记录，而不是只给一个成功或失败的标签。§女的建议如何评价合作？','同时检查目标与可利用的经验','只看是否获得成功标签','未达目标就删除全部记录','Đánh giá mục tiêu và bài học có thể áp dụng, tránh nhị nguyên thành công/thất bại.']]);
add('sentenceGap',6,[
['研究团队发现，使用新工具的员工处理简单问题更快，但处理复杂问题未必更好。＿＿。因此，报告建议根据任务特点选择工具，而不是统一规定一种做法。','这说明工具的效果会随任务类型变化','这证明工具对所有任务都完全无效','因此所有员工都不再需要培训','Câu điền khái quát đúng khác biệt theo nhiệm vụ, nối sang đề nghị lựa chọn phù hợp.'],
['社区打算减少夜间照明以节约能源。居民指出，有些路段的老人仍需在晚上出行。＿＿。最后，社区保留关键路段的照明，只调整使用率低的区域。','节能方案还需要考虑通行安全','所有居民都拒绝任何节能措施','晚上已经没有任何人出门','Bổ sung tiêu chí an toàn để giải thích việc giữ các đoạn cần thiết.'],
['学校用到馆次数评价图书馆使用情况，却发现电子资料的访问没有计入。＿＿。补充记录后，图书馆的实际使用量明显高于原先统计。','原来的指标没有覆盖全部使用方式','学生从来不使用电子资料','统计数字越少就说明服务越好','Thiếu một phương thức sử dụng là lý do bổ sung chỉ số, không phải phủ định dùng tài liệu điện tử.'],
['公司邀请员工匿名提出建议。然而，表格要求填写具体部门、岗位和入职日期。＿＿。后来，公司删去了不必要的信息，反馈数量才逐渐增加。','这些信息可能使提交者仍被识别','员工因此能够完全放心表达','所有建议都已经不需要处理','Thông tin kết hợp có thể nhận diện người gửi dù không hỏi tên; xóa bớt thông tin giải quyết lo ngại.'],
['一家餐厅统计了已完成的订单，却没有记录顾客因等候过久而离开的情况。＿＿。经理决定同时观察排队人数和离开原因，再调整服务流程。','仅凭这些订单很难看出全部流失情况','没有完成订单的人一定都不想吃饭','只要订单增加就不需要观察排队','Dữ liệu đơn hoàn tất thiếu người rời đi, nên cần quan sát bổ sung.'],
['展览把说明文字缩短以后，参观者阅读得更快，但有人表示看不懂作品背景。＿＿。策展人最终保留简短介绍，并提供可选择的详细说明。','减少阅读时间不等于提高理解程度','介绍越短就一定越容易理解','所有参观者都希望取消背景说明','Cần phân biệt tốc độ đọc với mức hiểu; hai tầng giới thiệu đáp ứng nhu cầu khác nhau.']]);
B.expansionVersion=1;return B;}
if(typeof module==='object'&&module.exports)module.exports=expand;else expand(root.HSKExamBank);
})(typeof window==='object'?window:globalThis);
