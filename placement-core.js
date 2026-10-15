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
function shuffled(a,random=Math.random){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function questions(random=Math.random){return Array.from({length:6},(_,i)=>items.filter(q=>q.level===i+1).map(q=>{const ids=shuffled(q.options.map((_,j)=>j),random);return {...q,options:ids.map(j=>q.options[j]),answer:ids.indexOf(q.answer)};})).flat();}
function weight(a){return a.correct?({sure:1,uncertain:.65,guess:.25}[a.confidence]||0):0;}
function levelStats(answers,level,skill){const rows=answers.filter(a=>a.level===level&&(!skill||a.skill===skill)&&!a.unavailable),n=rows.length;return {n,correct:rows.filter(a=>a.correct).length,weighted:rows.reduce((n,a)=>n+weight(a),0),fragile:rows.filter(a=>a.correct&&a.confidence!=='sure').length};}
function corePass(answers,level){const a=answers.filter(a=>a.level===level&&a.skill!=='listening');return a.length===4&&a.filter(a=>a.correct).length>=3&&a.reduce((n,a)=>n+weight(a),0)>=2.6;}
function shouldStop(answers){const level=Math.max(0,...answers.map(a=>a.level));return level>=6||level>=2&&!corePass(answers,level)&&!corePass(answers,level-1);}
function summarize(answers){
 const tested=Math.max(0,...answers.map(a=>a.level)),perLevel=Array.from({length:tested},(_,i)=>{const level=i+1;return {level,core:levelStats(answers.filter(a=>a.skill!=='listening'),level),listening:levelStats(answers,level,'listening'),passed:corePass(answers,level)};});
 let coreLevel=0,listenLevel=0;for(const l of perLevel){if(l.level===coreLevel+1&&l.passed)coreLevel=l.level;if(l.level===listenLevel+1&&l.listening.n===2&&l.listening.correct===2&&l.listening.weighted>=1.3)listenLevel=l.level;}
 const listeningComplete=perLevel.every(l=>l.listening.n===2),level=listeningComplete?Math.min(coreLevel,listenLevel):coreLevel;
 const bySkill=Object.fromEntries(skills.map(s=>{const a=answers.filter(a=>a.skill===s&&!a.unavailable);return [s,{n:a.length,correct:a.filter(a=>a.correct).length,fragile:a.filter(a=>a.correct&&a.confidence!=='sure').length,rate:a.length?a.reduce((n,a)=>n+weight(a),0)/a.length:null}];}));
 const weak=skills.filter(s=>bySkill[s].n&&bySkill[s].rate<.75).sort((a,b)=>bySkill[a].rate-bySkill[b].rate),inconsistent=perLevel.some(l=>l.level>coreLevel&&l.passed),fragile=answers.filter(a=>a.correct&&a.confidence!=='sure').length;
 return {version:1,level,coreLevel,listenLevel,listeningComplete,tested,perLevel,bySkill,weak,fragile,remembered:answers.filter(a=>a.correct&&a.confidence==='sure').length,forgotten:answers.filter(a=>!a.unavailable&&!a.correct).length,inconsistent,confidence:!listeningComplete||inconsistent||fragile>answers.length*.25?'Cần kiểm chứng thêm':'Định hướng ban đầu',startLevel:Math.min(6,Math.max(1,level+1))};
}
function roadmap(result,minutes=30,days=6){minutes=Math.min(120,Math.max(15,Number(minutes)||30));days=Math.min(7,Math.max(5,Number(days)||6));const focus=result.weak[0]||'reading',first=Math.max(1,result.perLevel.find(l=>!l.passed||l.listening.n===2&&l.listening.correct<2)?.level||result.startLevel);const review=Math.round(minutes*.35),skill=Math.round(minutes*.35);return {minutes,days,focus,reviewLevel:first,studyLevel:result.startLevel,daily:[{name:'Khôi phục từ và ôn cách quãng',minutes:review,route:'srs'},{name:'Củng cố '+labels[focus].toLowerCase(),minutes:skill,route:focus==='vocab'?'learn':'lessons'},{name:'Bài học và kiểm tra ngắn',minutes:minutes-review-skill,route:'lessons'}],phases:[{title:'Buổi 1–3 · Khôi phục nền tảng',detail:`Ôn nội dung HSK ${first}; bắt đầu từ lỗi và các câu nhớ mang máng, chưa cần học lại toàn bộ.`},{title:'Buổi 4–7 · Vá kỹ năng yếu',detail:`Ưu tiên ${labels[focus].toLowerCase()}, làm bài ngắn theo bài học. Ôn lại sau 1, 3 và 7 ngày.`},{title:'Buổi 8–12 · Học tiếp có kiểm tra',detail:`Học bài phù hợp ở HSK ${result.startLevel}; nếu sai nhiều thì quay lại phần nền tảng tương ứng.`},{title:'Buổi 13–14 · Kiểm chứng khả năng nhớ',detail:'Làm bài trộn không nhìn đáp án, rồi đánh giá lại. Chỉ tăng nhịp khi vẫn nhớ sau các buổi cách ngày.'}]};}
function validReport(r){return !!r&&r.version===1&&Number.isFinite(r.createdAt)&&Array.isArray(r.answers)&&r.answers.length>=12&&r.answers.length<=36&&r.answers.length%6===0&&r.answers.every(a=>a&&typeof a.id==='string')&&new Set(r.answers.map(a=>a.id)).size===r.answers.length&&r.answers.every(a=>{const q=items.find(q=>q.id===a.id);return q&&a.level===q.level&&a.level<=r.answers.length/6&&a.skill===q.skill&&typeof a.correct==='boolean'&&['sure','uncertain','guess'].includes(a.confidence)&&typeof a.unavailable==='boolean'&&(!a.unavailable||a.skill==='listening'&&!a.correct);});}
const api={KEY,items,skills,labels,questions,weight,levelStats,corePass,shouldStop,summarize,roadmap,validReport};root.HSKPlacementCore=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
