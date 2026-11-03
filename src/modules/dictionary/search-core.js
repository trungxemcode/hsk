const synonymGroups = [
 'vui|vui vẻ|vui mừng|niềm vui|vui sướng|hạnh phúc|hoan hỉ|sung sướng|phấn khởi|hân hoan',
 'buồn|buồn bã|đau buồn|sầu|ưu sầu|u sầu|sầu não',
 'đẹp|xinh|xinh đẹp|đẹp đẽ|mỹ lệ|tươi đẹp|đẹp mắt',
 'bố|ba|cha|thân phụ','mẹ|má|u|thân mẫu','bạn bè|bằng hữu|bạn hữu|bạn',
 'gia đình|nhà|gia quyến','trẻ em|trẻ con|con nít|thiếu nhi',
 'người già|người cao tuổi|lão nhân','vợ|bà xã|phu nhân','chồng|ông xã|phu quân',
 'giáo viên|thầy giáo|cô giáo|giảng viên','học sinh|học trò','bác sĩ|thầy thuốc|y sĩ',
 'tiếng trung|tiếng hán|tiếng trung quốc|hán ngữ','trái cây|hoa quả','cốc|ly',
 'xe hơi|ô tô|xe ô tô|xe con','xe máy|mô tô','xe đạp|xe đạp thường',
 'nhà hàng|quán ăn|tiệm ăn','cửa hàng|tiệm|cửa tiệm','ti vi|tivi|truyền hình|télévision',
 'máy tính|vi tính|computer','phim|điện ảnh','điện thoại|điện thoại di động',
 'công việc|việc làm|nghề nghiệp|công tác','tiền|tiền bạc|tiền tệ','lương|tiền lương|thù lao',
 'nhanh|nhanh chóng|mau|mau chóng|tốc độ cao','chậm|chậm chạp|từ từ',
 'lớn|to|to lớn|rộng lớn|vĩ đại','nhỏ|bé|nhỏ bé|bé nhỏ','nhiều|rất nhiều|đông|phong phú',
 'ít|ít ỏi|thiểu số','cao|cao lớn','thấp|thấp bé|lùn','dài|dài lâu','ngắn|ngắn ngủi',
 'giỏi|tài giỏi|tài năng|xuất sắc','thông minh|lanh lợi|sáng dạ|khôn ngoan',
 'tốt|tốt đẹp|tốt lành','xấu|tồi|tệ|tồi tệ','dễ|dễ dàng|đơn giản','khó|khó khăn|gian nan',
 'thích|yêu thích|ưa thích|ưa','yêu|yêu thương|thương yêu|thương|mến','ghét|chán ghét|căm ghét',
 'giận|tức giận|giận dữ|bực tức|phẫn nộ','sợ|sợ hãi|lo sợ|khiếp sợ',
 'lo lắng|lo âu|lo ngại|băn khoăn','bình tĩnh|điềm tĩnh|trấn tĩnh','yên tĩnh|im lặng|tĩnh lặng|yên lặng',
 'ồn ào|náo nhiệt|huyên náo','mệt|mệt mỏi|mệt nhọc','khỏe|khỏe mạnh|sức khỏe',
 'ốm|bệnh|đau ốm|bệnh tật','nóng|nóng bức|nóng nực','lạnh|lạnh lẽo|giá lạnh|rét',
 'ăn|ăn uống|dùng bữa','ngon|ngon miệng|ngon lành','uống|uống nước','ngủ|ngủ nghỉ|giấc ngủ',
 'nói|nói chuyện|trò chuyện|đàm thoại','xem|nhìn|ngắm|quan sát','nghe|lắng nghe',
 'học|học tập|học hành','đọc|đọc sách','viết|ghi|ghi chép','hiểu|hiểu biết|thấu hiểu',
 'biết|biết được|hay biết','nhớ|ghi nhớ|nhớ lại','quên|quên mất','hỏi|hỏi han|hỏi thăm',
 'trả lời|đáp|đáp lại|giải đáp','giúp|giúp đỡ|hỗ trợ|trợ giúp|chi viện',
 'mua|mua sắm|sắm','bán|bán hàng','cho|tặng|biếu|trao tặng',
 'đi|đi lại|di chuyển','đến|tới|đến nơi','về|trở về|quay lại|quay về',
 'bắt đầu|khởi đầu|khởi sự','kết thúc|chấm dứt|hoàn tất|hoàn thành',
 'làm|thực hiện|tiến hành','tìm|tìm kiếm|kiếm','mất|mất đi|thất lạc',
 'mở|mở ra|khai mở','đóng|đóng lại','đúng|chính xác|chuẩn xác','sai|sai lầm|nhầm|nhầm lẫn',
 'cảm ơn|cám ơn|cảm tạ','xin lỗi|tạ lỗi','xin chào|chào','tạm biệt|chào tạm biệt',
 'xin vui lòng|vui lòng|làm ơn','không sao|không có gì','hôm nay|ngày hôm nay',
 'hôm qua|ngày hôm qua','ngày mai|mai|hôm sau','buổi sáng|sáng','buổi tối|tối',
 'ngay lập tức|lập tức|ngay|tức thì','luôn luôn|luôn|lúc nào cũng','thỉnh thoảng|đôi khi|thi thoảng',
 'thường xuyên|thường|hay','cẩn thận|thận trọng|kỹ lưỡng','chăm chỉ|siêng năng|cần cù',
 'lười|lười biếng|biếng nhác','trung thực|thật thà|thành thật','lừa dối|lừa đảo|dối trá',
 'quan trọng|trọng yếu|thiết yếu','cần|cần thiết|nhu cầu','mong muốn|muốn|ước muốn|nguyện vọng',
 'hi vọng|hy vọng|mong đợi|trông đợi','thành công|thành đạt','thất bại|thua|thua cuộc',
 'cơ hội|thời cơ|dịp','vấn đề|sự việc|chuyện','ý kiến|quan điểm|ý tưởng',
 'phương pháp|cách|cách thức','kế hoạch|dự định','lý do|nguyên nhân|căn nguyên',
 'kết quả|hậu quả|thành quả','thay đổi|biến đổi|chuyển biến','phát triển|tiến bộ|tăng trưởng',
 'ngăn cản|cản trở|trở ngại|trở ngăn','bảo vệ|bảo hộ|giữ gìn','an toàn|an ninh',
 'nguy hiểm|nguy cơ|rủi ro','sạch|sạch sẽ|tinh khiết','bẩn|dơ|dơ bẩn',
 'rẻ|rẻ tiền|giá rẻ','đắt|đắt đỏ|mắc|giá cao','gần|gần gũi|lân cận','xa|xa xôi|xa cách',
 'du lịch|đi du lịch|tham quan','đất nước|quốc gia|nước','thế giới|toàn cầu',
 'thời tiết|khí hậu','mưa|trời mưa','nắng|ánh nắng|mặt trời','gió|cơn gió',
 'núi|núi non|sơn','sông|dòng sông','biển|đại dương','đường|con đường|đường phố',
 'quần áo|trang phục|y phục','giày|giày dép','tài sản|của cải','vốn|tư bản',
 'nghiên cứu|tìm hiểu|khảo cứu','thảo luận|bàn luận|trao đổi','đồng ý|tán thành|chấp thuận',
 'từ chối|khước từ|bác bỏ','cho phép|chấp nhận|phê chuẩn','cấm|cấm đoán|ngăn cấm',
 'bình thường|thông thường|thường lệ','đặc biệt|đặc thù|riêng biệt','thực tế|hiện thực',
 'chân thành|thành tâm|chân tình','tự tin|tin tưởng','kiên trì|bền bỉ|bền chí',
 'hào phóng|rộng rãi|rộng lượng','tiết kiệm|dè sẻn','lãng phí|phung phí',
 'ngạc nhiên|bất ngờ|kinh ngạc','nghi ngờ|hoài nghi','suy nghĩ|ngẫm nghĩ|nghiền ngẫm|tư duy',
 'nhanh nhẹn|linh hoạt|lanh lẹ','thư giãn|nghỉ ngơi|nghỉ','tập luyện|luyện tập|rèn luyện',
 'hẹn|cuộc hẹn|hẹn hò','kết hôn|lấy vợ|lấy chồng','sinh nhật|ngày sinh',
 'luật|pháp luật|luật pháp','quy tắc|quy định|nguyên tắc','trách nhiệm|bổn phận|nghĩa vụ'
].map(group => group.split('|').map(viText));
function splitSenses(w) {
  let text = String(w.mean || '').trim();
  const parens = text.match(/^([^()]+)\(([^()]+)\)\s*$/);
  // Higher levels often store a Sino-Vietnamese reading followed by its translation.
  if (parens && exact(parens[1]) === exact(w.hv)) text = parens[2];
  let depth = 0, piece = '', senses = [];
  for (const c of text) {
    if (c === '(') depth++;
    if (c === ')') depth = Math.max(0,depth-1);
    if (depth === 0 && /[,;\/]/.test(c)) { if (piece.trim()) senses.push(piece.trim()); piece=''; }
    else piece += c;
  }
  if (piece.trim()) senses.push(piece.trim());
  return [...new Set(senses)];
}
const bareSense = s => viText(s.replace(/\([^)]*\)/g,''));
function expandedTerms(q) {
  const normalized=viText(q), terms=new Set();
  for (const group of synonymGroups) {
    if(group.some(t=>hasAccent(q)?t===normalized:fold(t)===fold(q))) {
      // Short ambiguous aliases are useful as queries, but too broad as expansion targets.
      group.filter(t=>!['ba','u'].includes(t)).forEach(t=>terms.add(t));
    }
  }
  return [...terms];
}
function nearSenses(a,b) {
  const left=bareSense(a), right=bareSense(b);
  if (!left || !right) return false;
  if (left===right || phraseIn(left,right) || phraseIn(right,left)) return true;
  return synonymGroups.some(group=>group.includes(left)&&group.includes(right));
}

// Người học thường ghi lại âm tiếng Trung theo thói quen tiếng Việt ("chửng mơ",
// "xây sừ") thay vì pinyin. Đây chỉ là lớp gợi ý để tạo ứng viên, không tự
// kết luận một chữ Hán duy nhất.
const VN_PHONETIC_INITIALS = [
  [/^(?:tr|ch)/, ['zh','ch','j','q','z']], [/^x/, ['x','s','sh']],
  [/^s/, ['sh','s','x']], [/^(?:d|gi|r)/, ['r','y','z']],
  [/^kh/, ['k','h','q']], [/^th/, ['t','c','ch']],
  [/^ph/, ['f','p']], [/^b/, ['b','p']], [/^p/, ['p','b']], [/^(?:ngh|ng)/, ['w','y','']], [/^nh/, ['r','n']]
];
const VN_PHONETIC_FINALS = [
  [/ưng$|ung$|âng$/, ['eng','ing','ang','en','un']], [/ư$/, ['i','u','e']],
  [/ơu$|ơ$/, ['e','ou','uo']], [/ây$|ai$/, ['ai','ei','ui']],
  [/ao$|au$/, ['ao','iao','ou']], [/oong$|ong$/, ['ong','uang','eng']],
  [/uyên$|iên$/, ['uan','ian','un']], [/iệt$|iếc$/, ['ie','ue']]
];
function stripVietnameseTone(value) {
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/\d/g,'').trim();
}
function expandVietnamesePhonetic(rawInput) {
  const syllables=stripVietnameseTone(rawInput).split(/\s+/).filter(Boolean);
  return syllables.map(syllable=>{
    const candidates=new Set([syllable]);
    for(const [pattern,replacements] of VN_PHONETIC_INITIALS)if(pattern.test(syllable)){
      const rest=syllable.replace(pattern,'');for(const replacement of replacements)candidates.add(replacement+rest);
    }
    for(const candidate of [...candidates])for(const [pattern,replacements] of VN_PHONETIC_FINALS)if(pattern.test(candidate))
      for(const replacement of replacements)candidates.add(candidate.replace(pattern,replacement));
    return [...candidates].filter(Boolean).slice(0,10);
  });
}
function flattenPhoneticHints(hints) {
  return [...new Set((Array.isArray(hints)?hints:[]).flatMap(group=>Array.isArray(group)?group:[group]).map(stripVietnameseTone).filter(Boolean))].slice(0,40);
}
function normalizePhoneticKey(value) {
  return stripVietnameseTone(value).replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,' ').trim();
}
function phoneticCandidateScore(pinyin,hints) {
  const pin=normalizePhoneticKey(pinyin).replace(/\s+/g,'');
  if(!pin)return 0;
  const groups=Array.isArray(hints)?hints.map(group=>(Array.isArray(group)?group:[group]).map(stripVietnameseTone).filter(Boolean).slice(0,8)).filter(Boolean):[];
  const combinations=[''];for(const group of groups){const next=[];for(const prefix of combinations)for(const value of group)next.push(prefix+value);combinations.splice(0,combinations.length,...next.slice(0,160));}
  const values=[...new Set([...flattenPhoneticHints(hints),...combinations])].map(x=>x.replace(/\s+/g,''));
  let best=0;
  const nearPhonetic=(a,b)=>{if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,d=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++d>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}return d+(i<a.length||j<b.length?1:0)<=1;};
  for(const value of values){if(pin===value)best=Math.max(best,100);else if(pin.startsWith(value)||value.startsWith(pin))best=Math.max(best,72);else if(value.length>=3&&pin.includes(value))best=Math.max(best,58);else if(value.length>=4&&nearPhonetic(pin,value))best=Math.max(best,42);}
  return best;
}

if(typeof window!=='undefined'&&window.HSKOpenDictionaryCore)Object.assign(window.HSKOpenDictionaryCore,{expandVietnamesePhonetic,flattenPhoneticHints,normalizePhoneticKey,phoneticCandidateScore});
