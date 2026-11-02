/* Exact-source reader: only two public hosts, bounded fetches, no AI calls. */
// Display-only bilingual title metadata, reviewed 2026-11-02; no passage bodies.
const OR_TITLES={
 "https://mandarinbean.com/i-didnt-laugh/": [
  "我没笑",
  "Tôi không cười"
 ],
 "https://mandarinbean.com/dads-work/": [
  "爸爸的工作",
  "Công việc của bố"
 ],
 "https://mandarinbean.com/who-i-am/": [
  "我是谁",
  "Tôi là ai"
 ],
 "https://mandarinbean.com/do-you-know-them/": [
  "你认识他们吗？",
  "Bạn có quen họ không?"
 ],
 "https://mandarinbean.com/you-have-grown-up/": [
  "你长大了",
  "Bạn đã lớn rồi"
 ],
 "https://mandarinbean.com/what-are-you-studying/": [
  "你在学什么？",
  "Bạn đang học gì?"
 ],
 "https://mandarinbean.com/my-family-2/": [
  "我的家人",
  "Gia đình tôi"
 ],
 "https://mandarinbean.com/what-to-do-tomorrow/": [
  "明天做什么？",
  "Ngày mai làm gì?"
 ],
 "https://mandarinbean.com/shopping-story/": [
  "买东西",
  "Mua đồ"
 ],
 "https://hskreading.com/have-time-to-play/": [
  "你有空吗？",
  "Bạn có rảnh không?"
 ],
 "https://hskreading.com/what-does-your-father-do/": [
  "你爸爸是干什么的？",
  "Bố bạn làm nghề gì?"
 ],
 "https://hskreading.com/home-for-a-day/": [
  "回家第一天",
  "Ngày đầu tiên về nhà"
 ],
 "https://hskreading.com/what-job-do-you-want/": [
  "工作",
  "Công việc"
 ],
 "https://hskreading.com/baidu/": [
  "百度",
  "Baidu"
 ],
 "https://hskreading.com/lets-go-to-the-park/": [
  "我们去公园玩吧",
  "Chúng ta đi công viên chơi nhé"
 ],
 "https://hskreading.com/where-do-you-come-from/": [
  "你是哪国人？",
  "Bạn là người nước nào?"
 ],
 "https://hskreading.com/favourite-animals/": [
  "最喜欢的动物",
  "Con vật yêu thích nhất"
 ],
 "https://hskreading.com/the-chinese-flag/": [
  "中国的国旗",
  "Quốc kỳ Trung Quốc"
 ],
 "https://hskreading.com/china/": [
  "中国",
  "Trung Quốc"
 ],
 "https://mandarinbean.com/visiting-sister/": [
  "看姐姐",
  "Thăm chị gái"
 ],
 "https://mandarinbean.com/a-happy-day/": [
  "高兴的一天",
  "Một ngày vui vẻ"
 ],
 "https://mandarinbean.com/chinese-children-are-too-overweight/": [
  "中国孩子太胖了",
  "Trẻ em Trung Quốc quá béo"
 ],
 "https://mandarinbean.com/swimming-lesson-2/": [
  "游泳课",
  "Lớp học bơi"
 ],
 "https://mandarinbean.com/how-old-is-your-dad/": [
  "爸爸多少岁？",
  "Bố bạn bao nhiêu tuổi?"
 ],
 "https://mandarinbean.com/ice-cream/": [
  "冰淇淋",
  "Kem"
 ],
 "https://mandarinbean.com/stop-talking/": [
  "别说话了",
  "Đừng nói nữa"
 ],
 "https://mandarinbean.com/lantern-festival/": [
  "元宵节",
  "Tết Nguyên tiêu"
 ],
 "https://mandarinbean.com/spring-festival/": [
  "春节",
  "Tết Nguyên đán"
 ],
 "https://hskreading.com/lets-go-to-the-zoo/": [
  "我们一起去动物园吧",
  "Chúng ta cùng đi sở thú nhé"
 ],
 "https://hskreading.com/why-are-you-late/": [
  "你怎么迟到了？",
  "Sao bạn đến muộn?"
 ],
 "https://hskreading.com/what-does-your-mother-do/": [
  "你妈妈在哪里工作？",
  "Mẹ bạn làm việc ở đâu?"
 ],
 "https://hskreading.com/home-for-a-week/": [
  "回家一星期",
  "Về nhà một tuần"
 ],
 "https://hskreading.com/is-being-a-teacher-good/": [
  "当老师好吗？",
  "Làm giáo viên có tốt không?"
 ],
 "https://hskreading.com/wechat-is-popular/": [
  "微信",
  "WeChat"
 ],
 "https://hskreading.com/the-tortoise-and-the-hare/": [
  "龟兔赛跑",
  "Rùa và thỏ chạy đua"
 ],
 "https://hskreading.com/dumplings/": [
  "饺子",
  "Sủi cảo"
 ],
 "https://hskreading.com/come-and-see-china/": [
  "来中国玩吧",
  "Đến Trung Quốc chơi nhé"
 ],
 "https://hskreading.com/where-is-the-park/": [
  "公园在哪里？",
  "Công viên ở đâu?"
 ],
 "https://mandarinbean.com/wang-pengs-day/": [
  "王朋的一天",
  "Một ngày của Vương Bằng"
 ],
 "https://mandarinbean.com/ears/": [
  "耳朵",
  "Đôi tai"
 ],
 "https://mandarinbean.com/the-strange-person/": [
  "奇怪的人",
  "Người kỳ lạ"
 ],
 "https://mandarinbean.com/eating-pizza/": [
  "吃披萨",
  "Ăn pizza"
 ],
 "https://mandarinbean.com/colors-and-mood/": [
  "颜色和心情",
  "Màu sắc và tâm trạng"
 ],
 "https://mandarinbean.com/strawberry-flavor/": [
  "草莓味",
  "Vị dâu tây"
 ],
 "https://mandarinbean.com/different-working-hours/": [
  "不同的工作时间",
  "Giờ làm việc khác nhau"
 ],
 "https://mandarinbean.com/autumn-outing/": [
  "秋游",
  "Du ngoạn mùa thu"
 ],
 "https://mandarinbean.com/walking-in-high-temperatures/": [
  "高温下行走",
  "Đi bộ trong thời tiết nắng nóng"
 ],
 "https://hskreading.com/can-you-give-me-a-discount/": [
  "能打折吗？",
  "Có thể giảm giá không?"
 ],
 "https://hskreading.com/home-for-a-month/": [
  "回家一个月",
  "Về nhà một tháng"
 ],
 "https://hskreading.com/graduation/": [
  "毕业",
  "Tốt nghiệp"
 ],
 "https://hskreading.com/didi/": [
  "滴滴",
  "DiDi"
 ],
 "https://hskreading.com/mend-fold-after-sheep-lost/": [
  "亡羊补牢",
  "Mất bò mới lo làm chuồng"
 ],
 "https://hskreading.com/about-guilin/": [
  "桂林",
  "Quế Lâm"
 ],
 "https://hskreading.com/about-nanjing/": [
  "南京",
  "Nam Kinh"
 ],
 "https://hskreading.com/how-can-we-get-to-the-park/": [
  "怎么去公园？",
  "Đi công viên thế nào?"
 ],
 "https://hskreading.com/renting-a-house/": [
  "租房子",
  "Thuê nhà"
 ],
 "https://hskreading.com/how-to-pay-in-china/": [
  "在中国怎么给钱？",
  "Thanh toán ở Trung Quốc thế nào?"
 ],
 "https://mandarinbean.com/shut-up/": [
  "闭嘴",
  "Im miệng"
 ],
 "https://mandarinbean.com/sleeping-with-a-winter-melon/": [
  "抱冬瓜睡觉",
  "Ôm bí đao ngủ"
 ],
 "https://mandarinbean.com/little-brother-goes-to-the-bathroom/": [
  "弟弟上厕所",
  "Em trai đi vệ sinh"
 ],
 "https://mandarinbean.com/punch-the-little-monkey/": [
  "小猴子Punch",
  "Chú khỉ nhỏ Punch"
 ],
 "https://mandarinbean.com/china-first-frozen-person/": [
  "中国第一位“冷冻人”",
  "Người đầu tiên được bảo quản đông lạnh ở Trung Quốc"
 ],
 "https://mandarinbean.com/mother-feeds-baby-sleeping-pills-before-going-to-work/": [
  "妈妈给宝宝喂安眠药后去上班？",
  "Mẹ cho con uống thuốc ngủ rồi đi làm?"
 ],
 "https://mandarinbean.com/how-to-stay-healthy-in-winter/": [
  "冬季如何保持健康",
  "Giữ gìn sức khỏe vào mùa đông"
 ],
 "https://mandarinbean.com/looking-for-mother/": [
  "找妈妈",
  "Tìm mẹ"
 ],
 "https://mandarinbean.com/learning-to-say-no/": [
  "学会说“不”",
  "Học cách nói không"
 ],
 "https://hskreading.com/ive-started-eating-healthy-food/": [
  "健康饮食的小对话",
  "Cuộc trò chuyện về ăn uống lành mạnh"
 ],
 "https://hskreading.com/dou-yin-chinese-video-app/": [
  "抖音",
  "Douyin"
 ],
 "https://hskreading.com/winter-holiday-is-here/": [
  "寒假到了",
  "Kỳ nghỉ đông đến rồi"
 ],
 "https://hskreading.com/tree-planting-day/": [
  "种树节",
  "Ngày trồng cây"
 ],
 "https://hskreading.com/i-want-to-buy-some-dumpling-flour/": [
  "我想买饺子面粉",
  "Tôi muốn mua bột làm sủi cảo"
 ],
 "https://hskreading.com/criticism-at-work/": [
  "来我办公室",
  "Đến văn phòng tôi"
 ],
 "https://hskreading.com/time-flies-things-i-did-in-2018/": [
  "光阴似箭",
  "Thời gian thấm thoắt thoi đưa"
 ],
 "https://hskreading.com/artifical-intelligence/": [
  "人工智能",
  "Trí tuệ nhân tạo"
 ],
 "https://hskreading.com/twins/": [
  "双胞胎",
  "Cặp song sinh"
 ],
 "https://hskreading.com/body-language/": [
  "微表情",
  "Biểu cảm thoáng qua"
 ],
 "https://mandarinbean.com/are-you-experiencing-autumn-fatigue/": [
  "你“秋乏”了吗？",
  "Bạn có mệt mỏi vào mùa thu không?"
 ],
 "https://mandarinbean.com/yunnan-travel-fever/": [
  "云南旅游热",
  "Cơn sốt du lịch Vân Nam"
 ],
 "https://mandarinbean.com/gym-card-refund/": [
  "健身房退卡",
  "Hoàn tiền thẻ tập gym"
 ],
 "https://mandarinbean.com/confucius/": [
  "孔子",
  "Khổng Tử"
 ],
 "https://mandarinbean.com/dumplings-and-tangyuan/": [
  "饺子和汤圆",
  "Sủi cảo và bánh trôi"
 ],
 "https://mandarinbean.com/openclaw-artificial-intelligence-enters-a-new-era/": [
  "OpenClaw：人工智能进入新时代",
  "OpenClaw: Trí tuệ nhân tạo bước vào thời đại mới"
 ],
 "https://mandarinbean.com/dont-fully-trust-ai-either/": [
  "AI也不能全信",
  "Cũng không thể hoàn toàn tin AI"
 ],
 "https://mandarinbean.com/declining-incomes-for-doctors-in-multiple-regions/": [
  "多地医生收入下降",
  "Thu nhập bác sĩ ở nhiều nơi giảm"
 ],
 "https://mandarinbean.com/marriage-subsidies/": [
  "结婚补贴",
  "Trợ cấp kết hôn"
 ],
 "https://hskreading.com/christmas-in-china/": [
  "中国式的圣诞节",
  "Giáng sinh kiểu Trung Quốc"
 ],
 "https://hskreading.com/about-the-jingdong-ceo/": [
  "京东CEO刘强东事件最新进展",
  "Diễn biến mới nhất vụ việc của CEO JD.com Lưu Cường Đông"
 ],
 "https://hskreading.com/domestic-violence/": [
  "家庭暴力",
  "Bạo lực gia đình"
 ],
 "https://hskreading.com/splitting-the-bill/": [
  "AA制",
  "Chia tiền theo đầu người"
 ],
 "https://hskreading.com/civilized-society/": [
  "什么是文明的社会？",
  "Thế nào là một xã hội văn minh?"
 ],
 "https://hskreading.com/a-chinese-business-tycoon/": [
  "王思聪",
  "Vương Tư Thông"
 ],
 "https://hskreading.com/blind-people-and-guide-dogs/": [
  "导盲犬",
  "Chó dẫn đường"
 ],
 "https://hskreading.com/pork-vs-beef/": [
  "为什么中国人比较喜欢吃猪肉？",
  "Vì sao người Trung Quốc thích ăn thịt lợn hơn?"
 ],
 "https://hskreading.com/black-friday/": [
  "黑五",
  "Black Friday"
 ],
 "https://hskreading.com/bicycle-thieves-news-report/": [
  "民警午夜抓获偷车贼",
  "Cảnh sát bắt tên trộm xe lúc nửa đêm"
 ],
 "https://mandarinbean.com/ancient-chinese-wooden-architecture/": [
  "中国古代的木构建筑",
  "Kiến trúc gỗ thời Trung Quốc cổ đại"
 ],
 "https://mandarinbean.com/xian-a-must-visit-travel-destination/": [
  "西安 —— 你不能错过的旅游目的地",
  "Tây An: Điểm đến du lịch không thể bỏ lỡ"
 ],
 "https://mandarinbean.com/foreign-tourists-fall-in-love-with-chinese-eyeglasses/": [
  "外国游客爱上中国眼镜",
  "Du khách nước ngoài yêu thích kính mắt Trung Quốc"
 ],
 "https://mandarinbean.com/nuwa-mends-the-sky/": [
  "女娲补天",
  "Nữ Oa vá trời"
 ],
 "https://mandarinbean.com/the-mountain-city-of-chongqing/": [
  "山城重庆",
  "Trùng Khánh: Thành phố núi"
 ],
 "https://mandarinbean.com/the-three-gorges-of-the-yangtze-river/": [
  "长江三峡",
  "Tam Hiệp trên sông Trường Giang"
 ],
 "https://mandarinbean.com/chinese-children-are-getting-fatter/": [
  "中国孩子越来越胖了",
  "Trẻ em Trung Quốc ngày càng béo"
 ],
 "https://mandarinbean.com/als-patient-sees-hope/": [
  "渐冻症病人见到希望",
  "Người mắc bệnh xơ cứng teo cơ nhìn thấy hy vọng"
 ],
 "https://mandarinbean.com/chinas-winter-tourism/": [
  "中国冬季旅游",
  "Du lịch mùa đông ở Trung Quốc"
 ],
 "https://hskreading.com/the-forbidden-city/": [
  "故宫",
  "Tử Cấm Thành"
 ],
 "https://hskreading.com/chinese-woman-detained-in-canada/": [
  "中国女子在加拿大被拘留",
  "Người phụ nữ Trung Quốc bị tạm giữ ở Canada"
 ],
 "https://hskreading.com/journey-to-the-west/": [
  "西游记",
  "Tây Du Ký"
 ],
 "https://hskreading.com/classroom-management/": [
  "教室管控能力",
  "Khả năng quản lý lớp học"
 ],
 "https://hskreading.com/reporting-crime/": [
  "人民的安全",
  "Sự an toàn của nhân dân"
 ],
 "https://hskreading.com/respecting-chinese-culture/": [
  "尊重中国文化，融入世界潮流",
  "Tôn trọng văn hóa Trung Quốc, hòa nhập với xu thế thế giới"
 ],
 "https://hskreading.com/is-intelligence-innate/": [
  "聪明是天生的吗？",
  "Thông minh có phải do bẩm sinh?"
 ],
 "https://hskreading.com/the-story-of-jing-dong/": [
  "深陷绯闻中的刘强东",
  "Lưu Cường Đông vướng sâu vào tai tiếng"
 ],
 "https://hskreading.com/back-to-school/": [
  "开学啦！",
  "Khai giảng rồi!"
 ],
 "https://hskreading.com/technology-and-life/": [
  "科技与生命",
  "Công nghệ và sự sống"
 ]
};
const OR_HOSTS=['mandarinbean.com','hskreading.com'];
const OR_VOID=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
function orDecode(s){return String(s).replace(/&#(x[0-9a-f]+|[0-9]+);|&(amp|lt|gt|quot|apos|nbsp|#039);/gi,(all,n,k)=>{if(n){const v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return v>0&&v<=0x10ffff&&!(v>=0xd800&&v<=0xdfff)?String.fromCodePoint(v):'';}return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ','#039':"'"}[k.toLowerCase()]||all;});}
function orTree(html){
 const root={tag:'root',attrs:{},children:[]},stack=[root];let nodes=0;
 for(const match of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][^>]*>|[^<]+/g)){
  const token=match[0];if(++nodes>45000)throw Error('Trang quá phức tạp.');
  if(token.startsWith('<!--')||token.startsWith('<!'))continue;
  if(token[0]!=='<'){stack.at(-1).children.push(orDecode(token));continue;}
  const close=token.startsWith('</'),tag=token.match(/^<\/?([a-z0-9-]+)/i)?.[1].toLowerCase();if(!tag)continue;
  if(close){for(let i=stack.length-1;i>0;i--)if(stack[i].tag===tag){stack.length=i;break;}continue;}
  const attrs={};for(const a of token.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))attrs[a[1].toLowerCase()]=orDecode(a[2]??a[3]??a[4]??'');
  const node={tag,attrs,children:[]};stack.at(-1).children.push(node);if(!OR_VOID.has(tag)&&!token.endsWith('/>'))stack.push(node);
 }return root;
}
function orAll(node,predicate){const out=[];function visit(n){if(typeof n!=='object'||['script','style','noscript'].includes(n.tag))return;if(predicate(n))out.push(n);for(const c of n.children)visit(c);}visit(node);return out;}
function orClass(n,c){return (n.attrs.class||'').split(/\s+/).includes(c);}
function orText(node,mode='hanzi'){
 if(typeof node==='string')return node;
 if(['script','style','nav','noscript','button','input'].includes(node.tag))return '';
 if(mode==='hanzi'&&(node.tag==='rt'||node.tag==='rp'||orClass(node,'tr')))return '';
 if(node.tag==='ruby'&&mode==='pinyin'){const rt=orAll(node,n=>n.tag==='rt')[0];return rt?orText(rt,'raw')+' ':'';}
 if(node.tag==='br')return '\n';
 return node.children.map(c=>orText(c,mode)).join('');
}
function orAnnotations(node){
 const result=[];let prefix='';
 function visit(n){if(typeof n==='string'){prefix+=n;return;}if(['script','style','nav','noscript','button','input','rt','rp'].includes(n.tag)||orClass(n,'tr'))return;if(n.tag==='ruby'){const text=orClean(n),rt=orAll(n,x=>x.tag==='rt')[0];if(rt&&/^[\u3400-\u9fff]+$/u.test(text))result.push({start:Array.from(prefix.replace(/\r/g,'').replace(/[ \t]+/g,' ').trimStart()).length,text,pinyin:orClean(rt,'raw')});prefix+=text;return;}if(n.tag==='br'){prefix+='\n';return;}for(const child of n.children)visit(child);}
 visit(node);return result;
}
function orClean(n,mode='hanzi'){return orText(n,mode).replace(/\r/g,'').replace(/[ \t]+/g,' ').trim();}
export function originalReadingURL(value){
 try{const u=new URL(value);if(u.protocol!=='https:'||!OR_HOSTS.includes(u.hostname)||u.username||u.password||u.port||u.search||u.hash||!/^\/[a-z0-9][a-z0-9-]{0,180}\/$/.test(u.pathname))return null;
 if(/^\/(?:login|pricing|about|all-lessons|privacy-policy|terms-of-use|wp-admin|wp-login|feed)\/$/.test(u.pathname))return null;return u.href;}catch{return null;}
}
export function extractOriginalReading(html,url){
 const canonical=originalReadingURL(url);if(!canonical)throw Error('URL bài đọc không hợp lệ.');
 const root=orTree(html),host=new URL(url).hostname;let content,paragraphs,title;
 if(host==='mandarinbean.com'){
  const holder=orAll(root,n=>orClass(n,'elementor-widget-theme-post-content'))[0];if(!holder)throw Error('Không tìm thấy bài đọc nguyên gốc.');
  content=orAll(holder,n=>orClass(n,'elementor-widget-container'))[0];if(!content)throw Error('Cấu trúc nguồn đã thay đổi.');
  paragraphs=orAll(content,n=>n.tag==='p').map(n=>({hanzi:orClean(n),pinyin:orAll(n,x=>x.tag==='ruby').length?orClean(n,'pinyin'):'',annotations:orAnnotations(n)}));
  const h=orAll(root,n=>n.tag==='h2'&&orAll(n,x=>orClass(x,'si')).length)[0];title=h?orClean(h):'';
 }else{
  const article=orAll(root,n=>n.tag==='article'&&orClass(n,'type-post'))[0];
  content=article&&orAll(article,n=>orClass(n,'post-content'))[0];if(!content)throw Error('Không tìm thấy nội dung bài đọc.');
  // Current HSK Reading uses plain h2 headings; older pages used class=cjk.
  const heading=orAll(content,n=>n.tag==='h2'&&/[\u3400-\u9fff]/u.test(orClean(n))&&!/^(?:问题|問題|练习|練習|答案|翻译|翻譯|词汇|詞彙)[：:？?。.!！\s]*$/u.test(orClean(n)))[0];
  if(!heading&&!OR_TITLES[canonical])throw Error('Cấu trúc nguồn đã thay đổi.');
  title=heading?orClean(heading):OR_TITLES[canonical]?.[0];
  // Collect only the passage after its Chinese heading and before translation/questions.
  const flat=orAll(content,n=>['h2','p','input','button'].includes(n.tag));let started=!heading;paragraphs=[];
  for(const n of flat){if(n===heading){started=true;continue;}if(!started)continue;if(['h2','input','button'].includes(n.tag))break;
   const text=orClean(n);if(/[\u3400-\u9fff]/u.test(text))paragraphs.push({hanzi:text,pinyin:''});
  }
 }
 paragraphs=(paragraphs||[]).filter(p=>/[\u3400-\u9fff]/u.test(p.hanzi));
 const text=paragraphs.map(p=>p.hanzi).join('\n');if(text.length<12||text.length>24000||paragraphs.length>100)throw Error('Không xác minh được bài đọc đầy đủ; chưa hiển thị nội dung.');
 const fallback=orAll(root,n=>n.tag==='h1')[0];title=title||(fallback?orClean(fallback):'Bài đọc gốc');
 return {url:canonical,title,titleZh:OR_TITLES[canonical]?.[0]||title,titleVi:OR_TITLES[canonical]?.[1]||'',site:host==='mandarinbean.com'?'Mandarin Bean':'HSK Reading',status:'original',paragraphs,fetchedAt:new Date().toISOString()};
}
export function extractOriginalIndex(html,host,hsk){
 const root=orTree(html),cards=orAll(root,n=>host==='mandarinbean.com'?n.attrs['data-elementor-type']==='loop-item':n.tag==='article');const found=new Map();
 for(const card of cards){
  const links=orAll(card,n=>n.tag==='a'&&n.attrs.href);
  const level=card.attrs.class?.match(/(?:tag-hsk|category-hsk-)([1-6])\b/)?.[1]||links.map(n=>n.attrs.href.match(/\/(?:tag\/hsk|category\/hsk-)([1-6])\//)?.[1]).find(Boolean);
  if(Number(level)!==hsk)continue;
  const link=links.find(n=>originalReadingURL(n.attrs.href)&&orClean(n));if(!link||new URL(link.attrs.href).hostname!==host)continue;
  const titleLinks=links.filter(n=>n.attrs.href===link.attrs.href&&orClean(n));const title=titleLinks.map(n=>orClean(n)).find(t=>/[\u3400-\u9fff]/u.test(t))||orClean(link);
  const bilingual=OR_TITLES[link.attrs.href];found.set(link.attrs.href,{url:link.attrs.href,title,titleZh:bilingual?.[0]||title,titleVi:bilingual?.[1]||'',hsk,site:host==='mandarinbean.com'?'Mandarin Bean':'HSK Reading'});
 }return [...found.values()].slice(0,30);
}
async function orBounded(response){
 if(!response.ok)throw Error('Nguồn trả lỗi '+response.status);
 if(!/text\/html/i.test(response.headers.get('content-type')||''))throw Error('Nguồn không trả trang HTML.');
 const reader=response.body.getReader(),decoder=new TextDecoder();let size=0,text='';
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>650000)throw Error('Trang nguồn vượt kích thước cho phép.');text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}finally{await reader.cancel().catch(()=>{});}
}
export function createOriginalReadingService(fetchFn=fetch,{now=Date.now,cacheAPI=null}={}){
 const memory=new Map(),pending=new Map();
 async function cached(key,ttl,job){
  const saved=memory.get(key);if(saved&&saved.until>now())return saved.value;
  if(pending.has(key))return pending.get(key);
  const promise=(async()=>{const request=new Request('https://hsk-reading-cache.invalid/'+encodeURIComponent(key));
   if(cacheAPI)try{const hit=await cacheAPI.match(request);if(hit){const data=await hit.json();if(data.until>now())return data.value;}}catch{}
   const value=await job(),until=now()+ttl;if(memory.size>=80)memory.delete(memory.keys().next().value);memory.set(key,{until,value});
   if(cacheAPI)try{await cacheAPI.put(request,Response.json({until,value},{headers:{'Cache-Control':'public,max-age='+Math.floor(ttl/1000)}}));}catch{}
   return value;
  })();pending.set(key,promise);try{return await promise;}finally{pending.delete(key);}
 }
 async function download(url){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{return await orBounded(await fetchFn(url,{redirect:'manual',signal:controller.signal,headers:{Accept:'text/html'}}));}finally{clearTimeout(timer);}
 }
 return async body=>{
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['op','hsk','url'].includes(k)))return {status:400,data:{error:'Yêu cầu bài gốc không hợp lệ.'}};
  try{
   if(body.op==='list'&&Number.isInteger(body.hsk)&&body.hsk>=1&&body.hsk<=6&&body.url==null){
    const hsk=body.hsk,results=await Promise.allSettled(OR_HOSTS.map(host=>cached('index-v2:'+host+':'+hsk,6*3600000,async()=>{
     const path=host==='mandarinbean.com'?'/tag/hsk'+hsk+'/':'/category/hsk-'+hsk+'/';
     const items=extractOriginalIndex(await download('https://'+host+path),host,hsk);if(!items.length)throw Error('Chưa đọc được danh sách từ '+host);return items;
    })));
    const items=results.flatMap(r=>r.status==='fulfilled'?r.value:[]),unavailable=OR_HOSTS.filter((_,i)=>results[i].status==='rejected');
    return {status:items.length?200:502,data:{items,unavailable,checkedAt:new Date(now()).toISOString(),...(items.length?{}:{error:'Hai nguồn chưa phản hồi hoặc đã thay đổi cấu trúc. Không tạo bài thay thế.'})}};
   }
   if(body.op==='article'&&body.hsk==null&&originalReadingURL(body.url)){
    const article=await cached('article-v2:'+body.url,12*3600000,async()=>extractOriginalReading(await download(body.url),body.url));
    return {status:200,data:{article}};
   }
   return {status:400,data:{error:'Chỉ nhận URL bài đọc từ Mandarin Bean và HSK Reading.'}};
  }catch(error){return {status:502,data:{error:'Chưa lấy được nguyên văn bài nguồn. '+(error.name==='AbortError'?'Nguồn phản hồi quá chậm.':error.message)+' Không dùng AI viết lại.'}};}
 };
}

