
'use strict';
const $ = id => document.getElementById(id);
const DAY = 86400000, STORE_KEY = 'hsk-flashcards-progress-v1';
let records = Object.create(null);
function storageWarning() {
  $('storageNotice').hidden = false;
  $('storageNotice').textContent = 'Trình duyệt không lưu được tiến độ. Các thay đổi hiện chỉ được giữ trong phiên đang mở.';
}
try {
  const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
  if (saved && saved.version === 1 && saved.words && typeof saved.words === 'object') {
    for (const [k,r] of Object.entries(saved.words)) {
      if (r && ['known','unknown'].includes(r.status) && Number.isFinite(r.due) && Number.isFinite(r.interval) && r.interval >= 0 && Number.isFinite(r.ease) && r.ease >= 1.3 && Number.isInteger(r.reps) && r.reps >= 0) records[k] = r;
    }
  }
} catch (e) { storageWarning(); }
function saveRecords() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({version:1, words:records})); }
  catch (e) { storageWarning(); }
}
const wordKey = w => w.learningKey || `${w.hsk}|${w.han}|${w.pin}`;
for (const w of words) {
  w.learningKey=wordKey(w);
  Object.assign(w,exampleMetadata.corrections[wordKey(w)]||{});
  w.originalExampleMetadata=exampleMetadata.original[wordKey(w)]||{};
  w.practice=checkedPracticeExamples.entries[wordKey(w)]||null;
  const extra=dictionarySupplement.entries[wordKey(w)];
  w.dictionary=extra;
  let base=w.mean;
  const m=base.match(/^([^()]+)\(([^()]+)\)\s*$/);
  if(m&&m[1].trim().toLocaleLowerCase('vi')===w.hv.toLocaleLowerCase('vi'))base=m[2];
  const meanings=[base,...(extra?.meanings||[]).map(m=>m.gloss),...(w.practice?.meanings||[]),extra?.example?.meaning,w.originalExampleMetadata.meaning].filter(Boolean);
  w.mean=[...new Set(meanings)].join('; ');
}
const dictionaryReport=dictionarySupplement.report;
function pinyinLine(pin) {
  const p=document.createElement('p');p.className='example-pinyin';p.lang='zh-Latn';p.textContent=pin||'';return p;
}
$('dictionaryCoverage').textContent=`Hanzii: đã đối chiếu ${dictionaryReport.matched.toLocaleString('vi')} / ${dictionaryReport.total.toLocaleString('vi')} mục`;
$('dictionaryCoverageDetail').textContent=`Bản bổ sung ngày 09/10/2026: mở rộng nghĩa cho ${dictionaryReport.expandedWords} từ và thêm ${dictionaryReport.addedExamples} câu ví dụ ngắn. Đã bổ sung bộ 3–4 ví dụ cho ${checkedPracticeExamples.report.covered.toLocaleString('vi')} / ${dictionaryReport.total.toLocaleString('vi')} mục; câu biên soạn được ghi rõ, tách khỏi câu gốc. HSK 1–6 đã đủ 3–4 ví dụ mỗi mục. Còn ${dictionaryReport.notMatched.toLocaleString('vi')} mục chưa đối chiếu; các mục đó dùng dữ liệu có sẵn. Đây là tiến độ bổ sung dữ liệu, không phải tiến độ học.`;
function renderDictionaryExample(container,w) {
  container.replaceChildren();
  const extra=w.dictionary;
  if(!extra&&!w.practice){container.hidden=true;return;}
  container.hidden=false;
  const box=document.createElement('div');box.className='dictionary-extra';
  if(container.id==='srsDictionaryExample')box.append(wordRelationDetails(w));
  if(extra?.meanings.length) {
    const details=document.createElement('details'), summary=document.createElement('summary');
    summary.className='dictionary-source';summary.textContent=`Nghĩa bổ sung (${extra.meanings.length})`;details.append(summary);
    const groups=new Map();
    for(const m of extra.meanings) {if(!groups.has(m.pos))groups.set(m.pos,[]);groups.get(m.pos).push(m.gloss);}
    for(const [pos,glosses] of groups) {const p=document.createElement('p');p.textContent=`${pos}: ${glosses.join('; ')}`;details.append(p);}
    box.append(details);
  }
  if(w.practice) {
    const title=document.createElement('h3');title.textContent=`Ví dụ cách dùng (${w.practice.examples.length})`;box.append(title);
    for(const [i,e] of w.practice.examples.entries()) {
      const item=document.createElement('section');item.className='practice-example';
      const label=document.createElement('p');label.className='example-sense';label.textContent=`${i+1}. Nghĩa: ${e.meaning || e.sense}`;
      const cn=document.createElement('p');cn.className='dictionary-cn';cn.textContent=e.cn;
      const vi=document.createElement('p');vi.textContent=e.vi;
      const note=document.createElement('small');note.className='example-origin';note.textContent=e.origin==='hanzii'?'Câu gốc · Hanzii':e.origin==='original'?'Câu trong dữ liệu gốc':'Câu biên soạn · đối chiếu nghĩa và cách dùng với Hanzii';
      item.append(label,cn,pinyinLine(e.pin),vi);
      if(e.sense&&e.sense!==e.meaning){const usage=document.createElement('small');usage.className='example-origin';usage.textContent=`Cách dùng: ${e.sense}`;item.append(usage);}
      item.append(note);box.append(item);
    }
  } else if(extra?.example && extra.example.cn!==w.exCn) {
    const title=document.createElement('h3');title.textContent='Ví dụ bổ sung · Hanzii';box.append(title);
    const cn=document.createElement('p');cn.className='dictionary-cn';cn.textContent=extra.example.cn;
    const vi=document.createElement('p');vi.textContent=extra.example.vi;box.append(cn,pinyinLine(extra.example.pin),vi);
  }
  let source;
  try{source=new URL(w.practice?.checkedAgainst||extra?.url);}catch(e){source=null;}
  if(source?.protocol==='https:'&&source.hostname==='hanzii.net'&&source.pathname.startsWith('/search/word/')) {
    const a=document.createElement('a');a.className='dictionary-source';a.textContent='Nguồn đối chiếu nghĩa · Hanzii ↗';a.href=source.href;a.target='_blank';a.rel='noopener noreferrer';box.append(a);
  }
  container.append(box);
}
const recordOf = w => records[wordKey(w)];
const statusOf = w => recordOf(w)?.status || 'unknown';
// Match whole Vietnamese words/phrases; diacritics are optional for search only.
const fold = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g,' ').trim().replace(/\s+/g,' ');
const exact = s => String(s || '').normalize('NFC').toLocaleLowerCase('vi').trim().replace(/\s+/g,' ');
const phraseIn = (text, phrase) => phrase && (` ${text} `).includes(` ${phrase} `);
const viText = s => String(s || '').normalize('NFC').toLocaleLowerCase('vi').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
const hasAccent = s => /[\u0300-\u036f]/.test(String(s).normalize('NFD')) || /[đĐ]/.test(s);
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
const sensesMap = new Map(words.map(w => [w,splitSenses(w)]));
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
function typoSimilar(a,b) {
  if(a.length < 5 || b.length < 5 || Math.abs(a.length-b.length)>1) return false;
  let previous=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++) {
    const row=[i];
    for(let j=1;j<=b.length;j++) row[j]=Math.min(row[j-1]+1,previous[j]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));
    previous=row;
  }
  return previous[b.length]<=1;
}
const randomItem = arr => arr[Math.floor(Math.random()*arr.length)];
function shuffled(arr) { const copy=[...arr]; for(let i=copy.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]];} return copy; }
let activeLevel='all', mode='learn', currentWords=[], index=0;
const levelWords = () => activeLevel==='all' ? words : words.filter(w=>String(w.hsk)===activeLevel);
function matchStatus(w,scope) { return scope==='all' || (scope==='due' ? !!recordOf(w)&&recordOf(w).due<=Date.now() : statusOf(w)===scope); }
function stats() {
 const pool=levelWords(), known=pool.filter(w=>statusOf(w)==='known').length;
 $('learningStats').textContent=`Đã thuộc: ${known} · Chưa thuộc: ${pool.length-known} (gồm chưa đánh dấu)`;
 const due=pool.filter(w=>recordOf(w)&&recordOf(w).due<=Date.now()).length;
 const unseen=pool.filter(w=>!recordOf(w)).length;
 const future=pool.filter(w=>recordOf(w)&&recordOf(w).due>Date.now()).map(w=>recordOf(w).due);
 $('srsStats').textContent=`Đến hạn: ${due} · Chưa ôn: ${unseen} · Đã có lịch: ${pool.length-unseen}`+(future.length ? ` · Lần ôn kế tiếp: ${new Date(Math.min(...future)).toLocaleString('vi-VN')}`:'');
 updateQuizScopeInfo();
}
function makeMasteryTools(w) {
 const wrap=document.createElement('div'); wrap.className='mastery-tools';
 for(const [status,label,symbol] of [['known','Đã thuộc','✓'],['unknown','Chưa thuộc','×']]) {
  const b=document.createElement('button'); b.type='button'; b.className=`mastery-btn ${status}`; b.textContent=`${symbol} ${label}`; b.title=label; b.setAttribute('aria-label',`${label}: ${w.han}`); b.setAttribute('aria-pressed',String(recordOf(w)?.status===status));
  b.onclick=e=>{e.stopPropagation();markWord(w,status);}; wrap.append(b);
 }
 return wrap;
}
function markWord(w,status) {
 const old=recordOf(w);
 records[wordKey(w)]={...(old || {ease:2.5,reps:0,interval:0,lapses:0}),status,due:status==='known' ? (old?.status==='known' ? old.due : Date.now()+DAY) : Date.now(),interval:status==='known'?Math.max(old?.interval||0,1):0,lastMarked:Date.now()};
 saveRecords(); const before=currentWords[index], wasFlipped=$('flashcard').classList.contains('flipped'); rebuildDeck(before);
 if(wasFlipped && currentWords[index]===before)$('flashcard').classList.add('flipped');
 if(mode==='search')renderSearch(); stats();
}
function rebuildDeck(preserve) {
 const oldIndex=index;
 currentWords=levelWords().filter(w=>matchStatus(w,$('masteryFilter').value));
 index=preserve?currentWords.indexOf(preserve):0;
 if(index<0)index=Math.min(oldIndex,Math.max(0,currentWords.length-1));
 updateCard();
}
function updateCard() {
 $('flashcard').classList.remove('flipped'); $('example').classList.remove('show'); $('jumpStatus').textContent='';
 const empty=!currentWords.length;
 for(const id of ['prev','next','shuffle','exampleBtn','jumpBtn','jumpInput'])$(id).disabled=empty;
 document.querySelectorAll('#flashcard .mastery-tools,#flashcard .status-label').forEach(e=>e.remove());
 if(empty) { renderCardRelations(null); $('han').textContent='Không có từ'; $('pin').textContent='Thử chọn HSK hoặc trạng thái khác'; $('mean').textContent=''; $('hv').textContent=''; $('hskTag').textContent=''; $('exCn').textContent='';$('exPin').textContent='';$('exVi').textContent='';$('dictionaryExamples').replaceChildren();$('dictionaryExamples').hidden=true;$('progress').textContent='Thẻ: 0 / 0'; stats(); return; }
 index=(index+currentWords.length)%currentWords.length;
 const w=currentWords[index];
 for(const id of ['han','pin','mean'])$(id).textContent=w[id]||'';
 $('hv').textContent=w.hv?`HV: ${w.hv}`:'';
 $('hskTag').textContent=`HSK ${w.hsk}`; $('hskTag').className=`hsk-tag hsk${w.hsk}-tag`;
 $('exCn').textContent=w.practice?'':w.exCn||''; $('exPin').textContent=w.practice?'':w.originalExampleMetadata.pin||''; $('exVi').textContent=w.practice?'':w.exVi||'';
 renderDictionaryExample($('dictionaryExamples'),w);
 renderCardRelations(w);
 $('exampleBtn').hidden=!(w.exCn||w.exVi||w.dictionary);
 $('progress').textContent=`Thẻ: ${index+1} / ${currentWords.length}`;
 $('jumpInput').max=currentWords.length;
 $('flashcard').append(makeMasteryTools(w));
 document.querySelectorAll('#flashcard .front,#flashcard .back').forEach(face=>{
  const label=document.createElement('span'); label.className='status-label';label.textContent=recordOf(w)?(statusOf(w)==='known'?'✓ Đã thuộc':'× Chưa thuộc'):'Chưa đánh dấu';face.append(label);
 });
 stats();
}
function switchMode(next) {
 mode=next;
 for(const name of ['learn','search','quiz','srs','mistakes','compare'])$(name+'Panel').hidden=name!==mode;
 document.querySelectorAll('[data-mode]').forEach(b=>{ b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-pressed',String(b.dataset.mode===mode));});
 if(mode==='search')$('searchInput').focus();if(mode==='mistakes')renderMistakes();if(mode==='compare')renderComparisons(); stats();
}
let searchMatches=[], visibleResults=40, searchTimer;
function searchScore(w,q,terms) {
 const senses=sensesMap.get(w), vietnamese=senses.map(viText);
 const meanings=senses.map(s=>hasAccent(q)?viText(s):fold(s)), query=hasAccent(q)?viText(q):fold(q);
 if(meanings.some(s=>s===query))return 100;
 if(meanings.some(s=>phraseIn(s,query)))return 90;
 // Synonym expansion preserves accents (bố ≠ bỏ). A short alias must be a whole sense.
 if(vietnamese.some(s=>terms.some(t=>t.split(' ').length===1?bareSense(s)===t:phraseIn(s,t))))return 75;
 const tokens=query.split(' ');
 if(tokens.length>1 && meanings.some(s=>tokens.filter(t=>phraseIn(s,t)).length>=Math.max(2,Math.ceil(tokens.length*.75))))return 45;
 if(senses.some(s=>typoSimilar(fold(q),fold(s))))return 25;
 return 0;
}
function runSearch() {
 clearTimeout(searchTimer); const q=fold($('searchInput').value); visibleResults=40;
 if(!q){searchMatches=[];renderSearch();return;}
 const terms=expandedTerms($('searchInput').value);
 searchMatches=levelWords().map((w,i)=>({w,score:searchScore(w,$('searchInput').value,terms),i})).filter(r=>r.score>0).sort((a,b)=>Number(a.w.hsk)-Number(b.w.hsk)||b.score-a.score||a.i-b.i);
 renderSearch();
}
function renderSearch() {
 $('searchResults').replaceChildren(); const q=fold($('searchInput').value);
 $('searchSummary').textContent=!q?'Nhập nghĩa để tìm từ.':searchMatches.length?`${searchMatches.length} kết quả · HSK thấp → cao · Đang hiển thị ${Math.min(visibleResults,searchMatches.length)} từ`:'Không tìm thấy. Thử một cụm ngắn hơn hoặc một cách diễn đạt gần nghĩa khác.';
 for(const {w} of searchMatches.slice(0,visibleResults)) {
  const card=document.createElement('article');card.className='result-card';card.append(makeMasteryTools(w));
  const tag=document.createElement('span');tag.className=`hsk-tag hsk${w.hsk}-tag`;tag.textContent=`HSK ${w.hsk}`;card.append(tag);
  const open=document.createElement('button');open.className='result-open';open.textContent=w.han;open.title='Mở từ này trong thẻ từ vựng';
  open.onclick=()=>{$('masteryFilter').value='all';rebuildDeck(w);switchMode('learn');$('flashcard').focus();};card.append(open);
  for(const value of [w.pin,w.mean]) {const p=document.createElement('p');p.textContent=value;card.append(p);}
  const label=document.createElement('small');label.textContent=recordOf(w)?statusOf(w)==='known'?'✓ Đã thuộc':'× Chưa thuộc':'Chưa đánh dấu';card.append(label,wordRelationDetails(w));$('searchResults').append(card);
 }
 $('searchMore').hidden=visibleResults>=searchMatches.length;
}
// Adaptive spaced repetition. Due dates are timestamps, so the schedule survives closing the file.
function nextSchedule(w,rating,now=Date.now()) {
 const old=recordOf(w)||{ease:2.5,reps:0,interval:0,lapses:0}; let ease=old.ease, interval,reps=old.reps,lapses=old.lapses||0;
 if(rating==='again'){interval=10/1440;ease=Math.max(1.3,ease-.2);reps=0;lapses++;}
 else if(rating==='hard'){interval=Math.max(1,old.interval*1.2);ease=Math.max(1.3,ease-.15);reps++;}
 else if(rating==='easy'){interval=old.reps===0?4:Math.max(4,old.interval*ease*1.3);ease=Math.min(3.5,ease+.15);reps++;}
 else {interval=old.reps===0?1:old.reps===1?3:Math.max(1,old.interval*ease);reps++;}
 return {...old,ease,interval,reps,lapses,due:now+Math.round(interval*DAY),lastReview:now,status:['good','easy'].includes(rating)?'known':'unknown'};
}
function review(w,rating) {records[wordKey(w)]=nextSchedule(w,rating);saveRecords();stats();}
function intervalLabel(days) {return days<1?`${Math.round(days*1440)} phút`:`${Number(days.toFixed(1))} ngày`;}
// Both quiz directions use true senses from the source data, not invented translations.
let quizSession=null, question=null;
function quizLevelWords() {
 const selection=$('quizLevelMode').value;
 if(selection==='all')return words;
 const from=Number(selection==='single'?$('quizSingleLevel').value:$('quizLevelFrom').value);
 const to=Number(selection==='single'?$('quizSingleLevel').value:$('quizLevelTo').value);
 return words.filter(w=>Number(w.hsk)>=from && Number(w.hsk)<=to);
}
function quizLevelLabel() {
 const selection=$('quizLevelMode').value;
 if(selection==='all')return 'HSK 1–6';
 if(selection==='single')return `HSK ${$('quizSingleLevel').value}`;
 const from=$('quizLevelFrom').value, to=$('quizLevelTo').value;
 return from===to?`HSK ${from}`:`HSK ${from}–${to}`;
}
const contextQuizMap = new Map(contextQuizBank.map(item=>[item.key,item]));
const contextMode = direction => ['blank','usage'].includes(direction);
const quizTypeLabels={han:'Chữ Hán → nghĩa',mean:'Nghĩa → chữ Hán',blank:'Điền từ',usage:'Nghĩa theo ngữ cảnh',contrast:'Phân biệt từ dễ nhầm'};
function selectedQuizTypes(direction=$('quizDirection').value) {
 if(direction==='combined')return [...document.querySelectorAll('input[name="quizType"]:checked')].map(input=>input.value);
 return direction==='mixed'?['han','mean']:[direction];
}
function quizTypeSchedule(types,count) {
 const plan=[];while(plan.length<count)plan.push(...shuffled(types));return plan.slice(0,count);
}
function quizEligibleWords(pool,direction) {
 const types=selectedQuizTypes(direction);if(!types.length)return [];
 return pool.filter(w=>matchStatus(w,$('quizScope').value)&&types.every(type=>contextMode(type)?contextQuizMap.has(wordKey(w)):sensesMap.get(w).length));
}
function contextSpans(han,cn) {
 if(han==='愈……愈……') {
  const spans=[...cn.matchAll(/愈/g)].map(m=>[m.index,m.index+1]);return spans.length>=2?spans.slice(0,2):[];
 }
 const labels=han==='哪里 (哪儿)'?['哪里','哪儿']:[han.split(/[（(]/)[0].trim()];
 for(const label of labels) {
  const spans=[];let from=0,index;
  while(label && (index=cn.indexOf(label,from))!==-1){spans.push([index,index+label.length]);from=index+label.length;}
  if(spans.length)return spans;
 }
 return [];
}
function contextExampleItem(han,e) {
 const spans=contextSpans(han,e.cn);if(!spans.length)return null;
 let blank=e.cn;for(const [a,b] of [...spans].reverse())blank=blank.slice(0,a)+'＿＿＿'+blank.slice(b);
 const [a,b]=spans[0],label=e.cn.slice(a,b),sense=e.sense||e.meaning||'';
 return {cn:e.cn,blank,answer:han==='愈……愈……'?han:label,vi:e.vi,pin:e.pin,sense,origin:e.origin,explanation:`Trong câu “${e.cn}”, từ “${label}” mang nghĩa “${sense}”. Đối chiếu với bản dịch: ${e.vi}`};
}
function contextCases(w,entry=contextQuizMap.get(wordKey(w))) {
 if(!entry)return [];
 return w.practice.examples.map(e=>contextExampleItem(w.han,e)).filter(e=>e&&e.sense&&e.pin);
}
const contextRotation = new Map();
function nextContext(w,direction,cases) {
 const key=wordKey(w)+'|'+direction;
 let state=contextRotation.get(key);
 if(!state||!state.pending.length||state.count!==cases.length) {
  const order=shuffled(cases.map((_,i)=>i));
  if(state&&order.length>1&&order[0]===state.last)[order[0],order[1]]=[order[1],order[0]];
  state={pending:order,last:state?.last,count:cases.length};contextRotation.set(key,state);
 }
 const index=state.pending.shift();state.last=index;return cases[index];
}
function createContextQuestion(w,direction,candidatePool=quizLevelWords()) {
 const cases=contextCases(w);if(!cases.length)return null;
 const item=nextContext(w,direction,cases);
 if(direction==='blank') {
  const base=createQuestion(w,'mean',candidatePool);if(!base)return null;
  return {...base,direction,item,options:shuffled(base.options.map(option=>option.correct?{...option,text:item.answer||w.han}:option))};
 }
 const own=sensesMap.get(w),seen=new Set([exact(item.sense)]),wrong=[];
 for(const candidate of shuffled(candidatePool)) {
  if(candidate.han===w.han)continue;
  const other=sensesMap.get(candidate);
  if(other.some(s=>nearSenses(s,item.sense)||own.some(t=>nearSenses(s,t))))continue;
  const text=randomItem(other);if(!text||seen.has(exact(text)))continue;
  seen.add(exact(text));wrong.push({text,correct:false,w:candidate});if(wrong.length===3)break;
 }
 if(wrong.length<3)return null;
 return {w,direction,item,sense:item.sense,answered:false,options:shuffled([{text:item.sense,correct:true,w},...wrong])};
}
function updateQuizScopeInfo() {
 $('quizCombinedTypes').hidden=$('quizDirection').value!=='combined';
 $('quizSingleRow').hidden=$('quizLevelMode').value!=='single';
 $('quizRangeRow').hidden=$('quizLevelMode').value!=='range';
 const pool=quizLevelWords(), eligible=quizEligibleWords(pool,$('quizDirection').value);
 const count=Number($('quizCount').value);
 $('quizPoolPreview').textContent=`${quizLevelLabel()} · ${pool.length} từ · ${eligible.length} từ trong nhóm đã chọn`+(Number.isInteger(count)&&count>0&&count<=100?` · Lượt ôn: ${Math.min(count,eligible.length)} câu`:'')+($('quizDirection').value==='combined'?` · Trộn: ${selectedQuizTypes().map(type=>quizTypeLabels[type]).join(', ')||'chưa chọn dạng'}`:'')+(selectedQuizTypes().some(contextMode)?` · ${contextQuizMap.size.toLocaleString('vi-VN')} mục; mỗi từ có cả hai dạng câu hỏi.`:'');
}
function resetQuiz(message='Đã đổi phạm vi ôn. Bấm Bắt đầu để tạo lượt mới.') {
 quizSession=null;question=null;$('quizPrompt').textContent='';$('quizOptions').replaceChildren();$('quizNext').hidden=true;$('quizProgress').textContent='';$('quizFeedback').textContent=message;
}
function createQuestion(w,direction,candidatePool=quizLevelWords()) {
 if(contextMode(direction))return createContextQuestion(w,direction,candidatePool);
 const senses=sensesMap.get(w);if(!senses.length)return null;
 const sense=randomItem(senses), label=direction==='han'?sense:w.han;
 const distractors=[], seen=new Set([exact(label)]);
 // Keep every answer within the selected HSK range, regardless of mastery filters.
 const candidates=shuffled(candidatePool);
 for(const candidate of candidates) {
  if(candidate.han===w.han)continue;
  const cs=sensesMap.get(candidate);
  // A word sharing any sense or a known near-synonym cannot become a wrong choice.
  if(cs.some(s=>senses.some(t=>nearSenses(s,t))))continue;
  const text=direction==='han'?randomItem(cs):candidate.han;
  if(!text||seen.has(exact(text)))continue;
  seen.add(exact(text));distractors.push({text,correct:false,w:candidate});if(distractors.length===3)break;
 }
 if(distractors.length<3)return null;
 return {w,direction,sense,options:shuffled([{text:label,correct:true,w},...distractors]),answered:false};
}
function startQuiz(e) {
 e?.preventDefault(); const types=selectedQuizTypes();
 if(!types.length){resetQuiz('Chọn ít nhất một dạng câu hỏi để bắt đầu kiểm tra tổng hợp.');return;}
 const count=Number($('quizCount').value);
 if(!Number.isInteger(count)||count<1||count>100){$('quizFeedback').textContent='Nhập số câu từ 1 đến 100.';return;}
 const candidates=quizLevelWords();
 const pool=shuffled(quizEligibleWords(candidates,$('quizDirection').value));
 quizSession={pool:pool.slice(0,count),candidates,levelLabel:quizLevelLabel(),position:0,score:0,direction:$('quizDirection').value,types,plan:quizTypeSchedule(types,Math.min(count,pool.length))};
 $('quizNext').hidden=true; $('quizOptions').replaceChildren();$('quizPrompt').textContent='';
 if(!pool.length){quizSession=null;$('quizProgress').textContent='';$('quizFeedback').textContent=contextMode($('quizDirection').value)?'Chế độ này có câu hỏi cho HSK 1–6. Hãy chọn một cấp HSK từ 1 đến 6 và nhóm từ phù hợp.':'Không có từ trong nhóm đã chọn. Hãy đổi nhóm từ hoặc HSK.';return;}
 renderQuestion();
}
function renderQuestion() {
 const s=quizSession;if(!s)return;
 if(s.position>=s.pool.length){$('quizProgress').textContent='Hoàn thành';$('quizPrompt').textContent=`${s.score} / ${s.pool.length} câu đúng`;$('quizOptions').replaceChildren();$('quizFeedback').textContent='Lịch ôn đã được cập nhật. Chọn Bắt đầu / Làm lại để tạo lượt mới.';$('quizNext').hidden=true;question=null;return;}
 const direction=s.plan?.[s.position]||(s.direction==='mixed'?randomItem(['han','mean']):s.direction);
 question=s.savedQuestions?{...s.savedQuestions[s.position],answered:false,options:shuffled(s.savedQuestions[s.position].options.map(option=>({...option})))}:createQuestion(s.pool[s.position],direction,s.candidates);
 $('quizOptions').replaceChildren();$('quizNext').hidden=true;$('quizFeedback').textContent='';
 $('quizProgress').textContent=`Câu ${s.position+1} / ${s.pool.length} · Đúng: ${s.score} · Phạm vi: ${s.levelLabel} · Từ HSK ${s.pool[s.position].hsk} · ${quizTypeLabels[direction]}`;
 if(!question){$('quizPrompt').textContent='Không đủ đáp án khác biệt để tạo câu này.';$('quizNext').hidden=false;return;}
 $('quizPrompt').style.whiteSpace='pre-line';
 if(direction==='contrast')$('quizPrompt').textContent=question.prompt+(question.prompt.includes('＿＿＿')?'':'\n'+question.item.cn);
 else if(contextMode(direction))$('quizPrompt').textContent=direction==='blank'?`Chọn từ phù hợp để điền vào chỗ trống:\n${question.item.blank}\nGợi ý nghĩa: ${question.item.vi}`:`Trong câu sau, “${question.item.answer}” mang nghĩa nào phù hợp nhất?\n${question.item.cn}\n${question.item.pin}`;
 else $('quizPrompt').textContent=(direction==='han'?'Chọn nghĩa của: ':'Chọn từ có nghĩa: ')+(direction==='han'?question.w.han:question.sense);
 question.options.forEach((option,i)=>{
  const b=document.createElement('button');b.textContent=`${String.fromCharCode(65+i)}. ${option.text}`;
  b.onclick=()=>answerQuiz(i);$('quizOptions').append(b);
 });
}
function answerQuiz(i) {
 if(!question||question.answered)return;question.answered=true;
 const chosen=question.options[i];const correct=chosen.correct;if(correct)quizSession.score++;
 [...$('quizOptions').children].forEach((b,j)=>{b.disabled=true;if(question.options[j].correct)b.classList.add('correct');else if(j===i)b.classList.add('wrong');});
 recordQuizMistake(question,chosen);
 review(question.w,correct?'good':'again');
 const w=question.w;
 $('quizFeedback').textContent=`${correct?'✓ Chính xác!':'× Chưa đúng.'}\n${w.han} · ${w.pin}\nNghĩa: ${w.mean}\nÔn lại sau ${intervalLabel(recordOf(w).interval)}.`;
 if(question.item)$('quizFeedback').textContent+=`\n\nCâu đúng: ${question.item.cn}\n${question.item.pin}\n${question.item.vi}\n\nGiải thích: ${question.item.explanation}`;
 if(question.item && !correct && question.item.incorrectReasons?.[chosen.text])$('quizFeedback').textContent+=`\nLỗi ở đáp án bạn chọn: ${question.item.incorrectReasons[chosen.text]}`;
 $('quizNext').textContent=quizSession.position===quizSession.pool.length-1?'Xem kết quả':'Câu tiếp theo';$('quizNext').hidden=false;
}
let srsSession=null;
function startSrs() {
 const pool=levelWords(), due=pool.filter(w=>recordOf(w)&&recordOf(w).due<=Date.now()).sort((a,b)=>recordOf(a).due-recordOf(b).due);
 const fresh=shuffled(pool.filter(w=>!recordOf(w))).slice(0,10);
 srsSession={queue:[...due,...fresh],total:due.length+fresh.length,done:0};$('srsMessage').textContent='';renderSrs();
}
function renderSrs() {
 const s=srsSession;if(!s)return;stats();$('srsRatings').hidden=true;$('srsAnswer').hidden=true;$('srsReveal').hidden=false;
 if(!s.queue.length){$('srsCard').hidden=true;$('srsProgress').textContent=s.total?`Hoàn thành ${s.done} / ${s.total} từ`:'Chưa có từ cần ôn';
  $('srsMessage').textContent=(s.total?'Đã hoàn thành phiên ôn. ':'')+'Bấm Bắt đầu phiên ôn để kiểm tra từ đến hạn hoặc học thêm từ mới.';return;}
 const w=s.queue[0];$('srsCard').hidden=false;$('srsProgress').textContent=`Từ ${s.done+1} / ${s.total} · Đã ôn: ${s.done}`;
 $('srsHan').textContent=w.han;$('srsLevel').textContent=`HSK ${w.hsk}`;$('srsLevel').className=`hsk-tag hsk${w.hsk}-tag`;
 $('srsPin').textContent=w.pin;$('srsMean').textContent=w.mean;$('srsHv').textContent=w.hv?`HV: ${w.hv}`:'';$('srsExample').replaceChildren();if(!w.practice){const cn=document.createElement('p');cn.className='dictionary-cn';cn.textContent=w.exCn||'';const vi=document.createElement('p');vi.textContent=w.exVi||'';$('srsExample').append(cn,pinyinLine(w.originalExampleMetadata.pin),vi);}
 renderDictionaryExample($('srsDictionaryExample'),w);
 document.querySelectorAll('[data-rating]').forEach(b=>b.querySelector('small').textContent=intervalLabel(nextSchedule(w,b.dataset.rating).interval));
}
function rateSrs(rating) {
 if(!srsSession?.queue.length||$('srsAnswer').hidden)return;
 const w=srsSession.queue.shift();review(w,rating);srsSession.done++;
 $('srsMessage').textContent=`${w.han}: ôn lại ${new Date(recordOf(w).due).toLocaleString('vi-VN')} (${intervalLabel(recordOf(w).interval)}).`;renderSrs();
}
function clearSessions() {
 resetQuiz('Đã đổi HSK. Bấm Bắt đầu để tạo lượt mới.');
 srsSession=null;$('srsCard').hidden=true;$('srsRatings').hidden=true;$('srsProgress').textContent='';$('srsMessage').textContent='Đã đổi HSK. Bấm Bắt đầu phiên ôn.';
}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{rebuildDeck(currentWords[index]);switchMode(b.dataset.mode);});
document.querySelectorAll('.filter-btn').forEach(b=>{
 const count=b.dataset.filter==='all'?words.length:words.filter(w=>String(w.hsk)===b.dataset.filter).length;
 b.textContent=`${b.dataset.filter==='all'?'TẤT CẢ':'HSK '+b.dataset.filter} (${count})`;
 b.onclick=()=>{activeLevel=b.dataset.filter;document.querySelectorAll('.filter-btn').forEach(t=>t.classList.toggle('active',t===b));
  $('quizLevelMode').value=activeLevel==='all'?'all':'single';if(activeLevel!=='all')$('quizSingleLevel').value=activeLevel;
  rebuildDeck();runSearch();clearSessions();renderMistakes();renderComparisons();};
});
$('masteryFilter').onchange=()=>rebuildDeck();
$('flashcard').onclick=e=>{if(currentWords.length&&!e.target.closest('button'))$('flashcard').classList.toggle('flipped');};
$('flashcard').onkeydown=e=>{if(e.target===$('flashcard')&&['Enter',' '].includes(e.key)){e.preventDefault();$('flashcard').click();}};
$('next').onclick=()=>{index++;updateCard();};$('prev').onclick=()=>{index--;updateCard();};
$('shuffle').onclick=()=>{if(currentWords.length>1){index=(index+1+Math.floor(Math.random()*(currentWords.length-1)))%currentWords.length;}updateCard();};
$('exampleBtn').onclick=()=>$('example').classList.toggle('show');
$('reset').title='Trở về bộ thẻ ban đầu; giữ tiến độ học và lịch SRS';
$('reset').onclick=()=>{$('masteryFilter').value='all';document.querySelector('[data-filter="all"]').click();};
function jumpToCard(){const n=Number($('jumpInput').value);if(!Number.isInteger(n)||n<1||n>currentWords.length){$('jumpStatus').textContent=`Nhập số nguyên từ 1 đến ${currentWords.length}.`;return;}index=n-1;updateCard();$('jumpStatus').textContent=`Đã nhảy đến thẻ số ${n}.`;$('jumpInput').value='';}
$('jumpBtn').onclick=jumpToCard;$('jumpInput').onkeydown=e=>{if(e.key==='Enter')jumpToCard();};
$('searchForm').onsubmit=e=>{e.preventDefault();runSearch();};$('searchInput').oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(runSearch,180);};
$('searchMore').onclick=()=>{visibleResults+=40;renderSearch();};
$('quizForm').onsubmit=startQuiz;$('quizNext').onclick=()=>{if(quizSession){quizSession.position++;renderQuestion();}};
 for(const id of ['quizLevelMode','quizSingleLevel','quizLevelFrom','quizLevelTo','quizScope','quizDirection'])$(id).onchange=()=>{
  if(id==='quizLevelFrom' && Number($('quizLevelFrom').value)>Number($('quizLevelTo').value))$('quizLevelTo').value=$('quizLevelFrom').value;
  if(id==='quizLevelTo' && Number($('quizLevelTo').value)<Number($('quizLevelFrom').value))$('quizLevelFrom').value=$('quizLevelTo').value;
  resetQuiz();updateQuizScopeInfo();
 };
 $('quizCount').oninput=updateQuizScopeInfo;
$('srsStart').onclick=startSrs;$('srsReveal').onclick=()=>{$('srsAnswer').hidden=false;$('srsReveal').hidden=true;$('srsRatings').hidden=false;};
document.querySelectorAll('[data-rating]').forEach(b=>b.onclick=()=>rateSrs(b.dataset.rating));
setInterval(stats,30000);
rebuildDeck();renderSearch();

for(const input of document.querySelectorAll('input[name="quizType"]'))input.onchange=()=>{resetQuiz('Đã đổi dạng kiểm tra tổng hợp. Bấm Bắt đầu để tạo lượt mới.');updateQuizScopeInfo();};

function relationPairGuide(w,item){
 const detail=relationElement('div','','relation-pair-guide');
 const group=confusableGroups.find(g=>g.category!=='other'&&g.members.some(m=>m.key===wordKey(w))&&g.members.some(m=>m.han===item.han));
 detail.append(relationElement('h6','So sánh nghĩa'));
 if(group){
  detail.append(relationElement('p',group.intro));
  for(const m of group.members.filter(m=>m.key===wordKey(w)||m.han===item.han))detail.append(relationElement('p',m.note));
  detail.append(relationElement('p','Lưu ý cách dùng: '+group.caution));
  const qs=group.questions.filter(q=>q.key===wordKey(w)||group.members.some(m=>m.han===item.han&&m.key===q.key));
  for(const q of qs.slice(0,2)){
   const ex=relationElement('div','','relation-pair-example');ex.append(relationElement('strong',q.cn),relationElement('span',q.pin,'relation-pin'),relationElement('span',q.vi,'relation-meaning'),relationElement('p',q.explanation));detail.append(ex);
  }
  detail.append(relationElement('small','Giải thích biên soạn dựa trên các nghĩa và cấu trúc đã đối chiếu Hanzii. Ví dụ minh họa cách dùng, không mặc định đổi được từ trong câu.'));
 }else{
  detail.append(relationElement('p',w.han+' ('+w.pin+'): '+w.mean));
  const variants=wordRelationsData.lexicon[item.han]||[];
  for(const v of variants)detail.append(relationElement('p',item.han+' ('+v.pinyin+'): '+v.mean));
  if(!variants.length)detail.append(relationElement('p',item.han+': '+(item.mean||'Chưa có nghĩa riêng ở nguồn.')));
  detail.append(relationElement('p','So sánh theo nghĩa và cách đọc trên Hanzii. Chưa có phần phân biệt cách dùng đã đối chiếu riêng cho cặp này.'));
 }
 return detail;
}
// Dictionary relations are facts observed in Hanzii, never inferred from matching translations.
var relationWordIndex;
function relationElement(tag,text,cls){const el=document.createElement(tag);el.textContent=text||'';if(cls)el.className=cls;return el;}
function relationIndex(){if(!relationWordIndex){relationWordIndex=new Map();for(const w of words)relationWordIndex.set(wordKey(w),w);}return relationWordIndex;}
function openRelatedWord(key){const w=relationIndex().get(key);if(!w)return;document.querySelector(`[data-filter="${w.hsk}"]`).click();$('masteryFilter').value='all';rebuildDeck(w);switchMode('learn');$('flashcard').focus();}
function wordRelationDetails(w){
 const r=wordRelationsData.entries[wordKey(w)],box=relationElement('details','', 'word-relations');
 box.open=true;
 const syn=r?.synonyms||[],ant=r?.antonyms||[],counter=r?.counterparts||[];
 box.append(relationElement('summary',`Đồng nghĩa / gần nghĩa (${syn.length}) · Trái nghĩa (${ant.length})${counter.length?' · Đối ứng ('+counter.length+')':''}`));
 if(!r?.checked){box.append(relationElement('p','Chưa có dữ liệu quan hệ từ đã đối chiếu cho mục này.','hint'));return box;}
 if(r.status==='reading-not-listed')box.append(relationElement('p','Nguồn chưa liệt kê quan hệ từ khớp với cách đọc đang học; không dùng danh sách của cách đọc khác.','hint'));
 if(r.status==='not-listed')box.append(relationElement('p','Hanzii chưa có mục quan hệ từ khớp riêng cho từ hoặc cấu trúc này.','hint'));
 box.append(relationElement('p',`Quan hệ từ của ${w.han} (${w.pin}).`,'hint'));
 box.append(relationElement('p','Danh sách Hanzii liệt kê theo các nghĩa của từ. Từ gần nghĩa có thể khác cấu trúc, sắc thái hoặc cách kết hợp; không mặc định thay thế trong mọi câu.','hint'));
 for(const [title,list,empty] of [['Đồng nghĩa / gần nghĩa',syn,'Hanzii chưa liệt kê từ đồng nghĩa / gần nghĩa cho mục này.'],['Trái nghĩa',ant,'Hanzii chưa liệt kê từ trái nghĩa cho mục này.'],['Từ đối ứng',counter,'']]){
  if(title==='Từ đối ứng'&&!list.length)continue;
  box.append(relationElement('h4',title));if(!list.length){box.append(relationElement('p',empty,'hint'));continue;}
  const grid=relationElement('div','', 'relation-list');
  for(const item of list){const known=item.key&&relationIndex().get(item.key);const entry=relationElement(known?'button':'div','', 'relation-word');if(known){entry.type='button';entry.title='Mở thẻ '+item.han;entry.onclick=e=>{e.stopPropagation();openRelatedWord(item.key);};}
   entry.append(relationElement('strong',item.han));const variants=wordRelationsData.lexicon[item.han]||[];if(variants.length){for(const v of variants){entry.append(relationElement('span',v.pinyin||'Phiên âm chưa có ở nguồn tra cứu','relation-pin'),relationElement('span',v.mean||'Nghĩa riêng chưa có ở nguồn tra cứu','relation-meaning'));}if(variants.length>1)entry.append(relationElement('small','Nhiều cách đọc: xem nghĩa ở từng dòng.'));}else{entry.append(relationElement('span',item.pin||'Phiên âm chưa có ở nguồn tra cứu','relation-pin'),relationElement('span',item.mean||'Nghĩa riêng chưa có ở nguồn tra cứu','relation-meaning'));}if(known)entry.append(relationElement('small',`Mở thẻ: ${known.pin} · HSK ${known.hsk}`));else entry.append(relationElement('small','Ngoài danh sách học hiện tại'));grid.append(entry);}
  box.append(grid);if(title==='Đồng nghĩa / gần nghĩa'){const guides=relationElement('div','','relation-pair-guides');for(const item of list){const wrap=relationElement('section','','relation-pair');wrap.append(relationElement('h5',w.han+' ↔ '+item.han),relationPairGuide(w,item));guides.append(wrap);}box.append(guides);}if(title==='Từ đối ứng')box.append(relationElement('p','Khác vai trò hoặc quan hệ đối ứng, không phải phủ định nghĩa của nhau.','hint'));
 }
 const lessons=confusableGroups.filter(g=>g.category!=='other'&&g.members.some(m=>m.key===wordKey(w)));
 if(lessons.length){const b=relationElement('button','Xem phân biệt cách dùng');b.type='button';b.onclick=e=>{e.stopPropagation();$('compareCategory').value='near';document.querySelector('[data-filter="all"]').click();switchMode('compare');const target=$('compareGroups').querySelector(`[data-group="${lessons[0].id}"]`);if(target){target.open=true;target.scrollIntoView({block:'start',behavior:'smooth'});}};box.append(b);}
 const source=relationElement('a','Nguồn quan hệ từ · Hanzii ↗','dictionary-source');source.href=r.url;source.target='_blank';source.rel='noopener noreferrer';box.append(source);return box;
}
function renderCardRelations(w){const root=$('wordRelations');if(!root)return;root.replaceChildren();root.hidden=!w;if(w)root.append(wordRelationDetails(w));}
// Separate history keeps previous vocabulary/SRS records compatible.
const MISTAKE_STORE_KEY='hsk-flashcards-mistakes-v1';
const wordByKey=new Map(words.map(w=>[wordKey(w),w]));
let mistakeRecords=Object.create(null),mistakesVisible=40;
function validSavedQuestion(s) {
 return s&&wordByKey.has(s.key)&&['han','mean','blank','usage','contrast'].includes(s.direction)&&Array.isArray(s.options)&&s.options.length===4&&s.options.every(o=>o&&typeof o.text==='string'&&typeof o.correct==='boolean')&&s.options.filter(o=>o.correct).length===1&&new Set(s.options.map(o=>o.text)).size===4;
}
try {
 const saved=JSON.parse(localStorage.getItem(MISTAKE_STORE_KEY)||'{}');
 if(saved.version===1&&Array.isArray(saved.entries))for(const entry of saved.entries) {
  if(entry&&typeof entry.id==='string'&&Number.isInteger(entry.wrongCount)&&entry.wrongCount>0&&Number.isFinite(entry.lastWrong)&&validSavedQuestion(entry.snapshot))mistakeRecords[entry.id]={...entry,resolved:entry.resolved===true};
 }
}catch(e){/* A corrupt optional history does not erase SRS. */}
function saveMistakes() {
 try{localStorage.setItem(MISTAKE_STORE_KEY,JSON.stringify({version:1,entries:Object.values(mistakeRecords)}));}
 catch(e){$('storageNotice').hidden=false;$('storageNotice').textContent='Không lưu được lịch sử câu sai. Lịch sử mới hiện chỉ được giữ trong phiên này; tiến độ từ vựng được lưu riêng.';}
}
function snapshotQuestion(q) {
 return {key:wordKey(q.w),direction:q.direction,sense:q.sense||'',item:q.item?{cn:q.item.cn,blank:q.item.blank,answer:q.item.answer,vi:q.item.vi,pin:q.item.pin,sense:q.item.sense,explanation:q.item.explanation}:null,prompt:q.prompt||'',customId:q.customId||'',options:q.options.map(o=>({text:o.text,correct:o.correct,key:o.w?wordKey(o.w):wordKey(q.w)}))};
}
function questionHistoryId(q) {return JSON.stringify([wordKey(q.w),q.direction,q.customId||q.item?.cn||'',q.sense||'']);}
function recordQuizMistake(q,chosen) {
 const id=questionHistoryId(q),previous=mistakeRecords[id];
 if(!chosen.correct) {
  mistakeRecords[id]={id,wrongCount:(previous?.wrongCount||0)+1,lastWrong:Date.now(),lastAnswer:Date.now(),resolved:false,chosenText:chosen.text,snapshot:snapshotQuestion(q)};
  saveMistakes();
 }else if(previous){previous.resolved=true;previous.lastAnswer=Date.now();saveMistakes();}
}
function mistakeEntries(includeSolved=$('mistakeScope').value==='all') {
 return Object.values(mistakeRecords).filter(entry=>{const w=wordByKey.get(entry.snapshot.key);return w&&(activeLevel==='all'||String(w.hsk)===activeLevel)&&(includeSolved||!entry.resolved);}).sort((a,b)=>b.wrongCount-a.wrongCount||b.lastWrong-a.lastWrong);
}
function restoreQuestion(s) {
 const w=wordByKey.get(s.key);return {w,direction:s.direction,sense:s.sense,item:s.item,prompt:s.prompt,customId:s.customId,answered:false,options:s.options.map(o=>({text:o.text,correct:o.correct,w:wordByKey.get(o.key)||w}))};
}
function startSavedQuestions(questions,label) {
 if(!questions.length){$('mistakeSummary').textContent='Không có câu phù hợp để ôn trong phạm vi này.';return;}
 quizSession={pool:questions.map(q=>q.w),savedQuestions:questions,candidates:words,levelLabel:label,position:0,score:0,direction:'saved',plan:questions.map(q=>q.direction)};
 switchMode('quiz');renderQuestion();
}
function reviewMistakeEntries(entries,label='Ôn câu đã làm sai',limit) {
 const count=limit??Number($('mistakeCount').value);
 if(!Number.isInteger(count)||count<1||count>100){$('mistakeSummary').textContent='Nhập số câu từ 1 đến 100.';return;}
 startSavedQuestions(entries.slice(0,count).map(entry=>restoreQuestion(entry.snapshot)),label);
}
function textElement(tag,text,className) {const node=document.createElement(tag);node.textContent=text;if(className)node.className=className;return node;}
function renderMistakes() {
 const all=mistakeEntries(true),pending=all.filter(e=>!e.resolved),entries=mistakeEntries();
 $('mistakeSummary').textContent=all.length?`${all.length} câu từng làm sai · ${pending.length} câu chưa ôn đúng · ${all.reduce((sum,e)=>sum+e.wrongCount,0)} lượt sai. Ưu tiên câu sai nhiều lần.`:'Chưa có câu sai được ghi lại trong HSK đang chọn. Làm một bài kiểm tra để bắt đầu lưu lịch sử.';
 $('mistakeStart').disabled=!entries.length;$('mistakeWords').replaceChildren();$('mistakeList').replaceChildren();
 const frequencies=new Map();
 for(const entry of all){const key=entry.snapshot.key,r=frequencies.get(key)||{key,count:0,pending:0};r.count+=entry.wrongCount;r.pending+=entry.resolved?0:1;frequencies.set(key,r);}
 for(const r of [...frequencies.values()].sort((a,b)=>b.count-a.count).slice(0,20)) {
  const w=wordByKey.get(r.key),box=textElement('article','', 'mistake-entry');box.append(textElement('strong',`${w.han} · ${w.pin} · HSK ${w.hsk}`),textElement('p',`Sai ${r.count} lượt · ${r.pending} câu chưa ôn đúng`));
  const button=textElement('button','Ôn từ này');button.onclick=()=>{const related=all.filter(e=>e.snapshot.key===r.key),pending=related.filter(e=>!e.resolved);reviewMistakeEntries(pending.length?pending:related,`Ôn từ hay nhầm: ${w.han}`);};box.append(button);$('mistakeWords').append(box);
 }
 for(const entry of entries.slice(0,mistakesVisible)) {
  const s=entry.snapshot,w=wordByKey.get(s.key),row=textElement('article','', 'mistake-entry');row.append(textElement('strong',`${w.han} · HSK ${w.hsk} · ${quizTypeLabels[s.direction]}`),textElement('p',s.item?.cn||s.prompt||(s.direction==='han'?w.han:s.sense)),textElement('p',`Bạn đã chọn: ${entry.chosenText}`),textElement('p',`Sai ${entry.wrongCount} lượt · ${entry.resolved?'Đã ôn đúng':'Chưa ôn đúng'} · ${new Date(entry.lastWrong).toLocaleString('vi-VN')}`,'hint'));
  const button=textElement('button','Làm lại câu này');button.onclick=()=>reviewMistakeEntries([entry],'Làm lại câu đã nhầm',1);row.append(button);$('mistakeList').append(row);
 }
 $('mistakeMore').hidden=entries.length<=mistakesVisible;
}
function shownCompareGroups() {return confusableGroups.filter(g=>($('compareCategory').value==='all'||(g.category||'near')===$('compareCategory').value)&&(activeLevel==='all'||g.members.some(m=>String(m.level)===activeLevel)));}
function comparisonQuestion(g,q) {
 const w=wordByKey.get(q.key);return {w,direction:'contrast',customId:q.id,prompt:q.prompt,sense:q.answer,answered:false,item:{cn:q.cn,pin:q.pin,vi:q.vi,explanation:q.explanation},options:shuffled([{text:q.answer,correct:true,w},...q.wrong.map(text=>({text,correct:false,w}))])};
}
function startComparison(groups) {
 const questions=shuffled(groups.flatMap(g=>g.questions.filter(q=>activeLevel==='all'||String(wordByKey.get(q.key).hsk)===activeLevel).map(q=>comparisonQuestion(g,q))));
 if(!questions.length){$('compareSummary').textContent='Chưa có bài tập của nhóm này trong HSK đang chọn.';return;}
 startSavedQuestions(questions,`Phân biệt từ: ${groups.map(g=>g.title).join(' / ')}`);
}
function renderComparisons() {
 const groups=shownCompareGroups(),count=groups.flatMap(g=>g.questions).filter(q=>activeLevel==='all'||String(wordByKey.get(q.key).hsk)===activeLevel).length;
 const memberCount=new Set(groups.flatMap(g=>g.members.filter(m=>activeLevel==='all'||String(m.level)===activeLevel).map(m=>m.key))).size;
 $('compareTitle').textContent=$('compareCategory').value==='other'?'Các cặp dễ lẫn khác':$('compareCategory').value==='all'?'Phân biệt cách dùng từ':'Từ gần nghĩa khác cách dùng';
 $('compareSummary').textContent=`${groups.length} nhóm · ${memberCount} từ · ${count} bài tập trong phạm vi HSK đang chọn. Giải thích được đối chiếu Hanzii. Đồng nghĩa / trái nghĩa: đã tra ${wordRelationsData.report.checked.toLocaleString('vi')} / ${words.length.toLocaleString('vi')} mục.`;$('compareStart').disabled=!count;$('compareGroups').replaceChildren();
 for(const g of groups) {
  const details=document.createElement('details');details.className='compare-lesson';details.dataset.group=g.id;details.append(textElement('summary',g.title),textElement('p',g.intro));
  for(const member of g.members){const box=textElement('div','', 'compare-member');box.append(textElement('strong',`${member.han} · ${member.pin} · HSK ${member.level}`),textElement('p',member.note));details.append(box);}
  details.append(textElement('p','Lưu ý: '+g.caution));
  for(const q of g.questions){const example=textElement('div','', 'compare-example');example.append(textElement('p',q.cn,'dictionary-cn'),pinyinLine(q.pin),textElement('p',q.vi));details.append(example);}
  details.append(textElement('p','Ví dụ từ bộ câu đã đối chiếu; câu hỏi và giải thích được biên soạn dựa trên Hanzii.','hint'));
  const links=textElement('div','', 'source-links');for(const m of g.members){const a=textElement('a','Hanzii: '+m.han);a.href=m.url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);}details.append(links);
  const practice=textElement('button','Luyện nhóm này');practice.onclick=()=>startComparison([g]);details.append(practice);$('compareGroups').append(details);
 }
}
$('mistakeStart').onclick=()=>reviewMistakeEntries(mistakeEntries());$('mistakeScope').onchange=()=>{mistakesVisible=40;renderMistakes();};$('mistakeMore').onclick=()=>{mistakesVisible+=40;renderMistakes();};$('compareStart').onclick=()=>startComparison(shownCompareGroups());$('compareCategory').onchange=renderComparisons;
renderMistakes();renderComparisons();

  // Use the existing progress record and timestamps; never replace prior progress.
const MEMORY_PREF_KEY='hsk-memory-preferences-v1';
let memoryPrefs={context:true,newWords:true};
try{const p=JSON.parse(localStorage.getItem(MEMORY_PREF_KEY)||'{}');for(const k of ['context','newWords'])if(typeof p[k]==='boolean')memoryPrefs[k]=p[k];}catch(e){}
function saveMemoryPrefs(){try{localStorage.setItem(MEMORY_PREF_KEY,JSON.stringify(memoryPrefs));}catch(e){storageWarning();}}
function memoryDate(t){return Number.isFinite(t)?new Date(t).toLocaleString('vi-VN'):'Chưa có';}
function memoryExamples(w){return (w.practice?.examples||[]).filter(e=>e.cn&&e.cn.includes(w.han));}
let memoryCurrentExample=null;
const baseRenderMemorySrs=renderSrs;
renderSrs=function(){
 baseRenderMemorySrs();const w=srsSession?.queue[0],root=$('memoryContext');root.replaceChildren();root.hidden=!w||!memoryPrefs.context;$('srsHan').hidden=!!w&&memoryPrefs.context;memoryCurrentExample=null;
 if(!w)return;
 const r=recordOf(w);$('memoryWordDates').textContent=`Lần ôn gần nhất: ${memoryDate(r?.lastReview)} · Hẹn ôn: ${memoryDate(r?.due)}`;
 if(!memoryPrefs.context)return;
 const examples=memoryExamples(w);
 if(!examples.length){$('srsHan').hidden=false;root.append(relationElement('p','Chưa có câu phù hợp để che từ; ôn bằng thẻ từ.'));return;}
 memoryCurrentExample=examples[(r?.contextSeen||0)%examples.length];
 root.append(relationElement('p','Nhớ lại từ phù hợp với câu, rồi bấm Xem đáp án.','hint'));
 root.append(relationElement('p',memoryCurrentExample.cn.split(w.han).join('＿＿＿'),'memory-sentence'));
 const input=document.createElement('input');input.id='memoryRecall';input.placeholder='Tự nhập từ nếu muốn';input.setAttribute('aria-label','Từ cần nhớ trong câu');input.autocomplete='off';root.append(input);
};
const baseMemoryReveal=$('srsReveal').onclick;
$('srsReveal').onclick=function(){baseMemoryReveal();if(!memoryCurrentExample)return;const w=srsSession?.queue[0];if(!w)return;const answer=relationElement('div','','memory-context-answer');answer.append(relationElement('p',memoryCurrentExample.cn,'memory-sentence'),pinyinLine(memoryCurrentExample.pin),relationElement('p',memoryCurrentExample.vi));const input=$('memoryRecall');if(input?.value.trim())answer.append(relationElement('p','Bạn đã nhập: '+input.value.trim()+'. Từ trong câu: '+w.han+'. Tự đánh giá mức nhớ bằng các nút bên dưới.','hint'));$('memoryContext').append(answer);$('srsHan').hidden=false;};
const baseMemoryReview=review;
review=function(w,rating){const old=recordOf(w),first=old?.firstLearned||old?.lastReview||old?.lastMarked||Date.now(),seen=old?.contextSeen||0;baseMemoryReview(w,rating);records[wordKey(w)].firstLearned=first;if(mode==='srs'&&memoryPrefs.context&&memoryCurrentExample)records[wordKey(w)].contextSeen=seen+1;saveRecords();refreshMemoryDashboard();};
const baseMemoryMark=markWord;
markWord=function(w,status){const old=recordOf(w),first=old?.firstLearned||old?.lastReview||old?.lastMarked||Date.now();baseMemoryMark(w,status);records[wordKey(w)].firstLearned=first;saveRecords();refreshMemoryDashboard();};
startSrs=function(){const pool=levelWords(),due=pool.filter(w=>recordOf(w)&&recordOf(w).due<=Date.now()).sort((a,b)=>recordOf(a).due-recordOf(b).due);const fresh=memoryPrefs.newWords?shuffled(pool.filter(w=>!recordOf(w))).slice(0,10):[];srsSession={queue:[...due,...fresh],total:due.length+fresh.length,done:0};$('srsMessage').textContent='';renderSrs();};
function refreshMemoryDashboard(){
 const now=Date.now(),tracked=words.filter(w=>recordOf(w)),due=tracked.filter(w=>recordOf(w).due<=now),future=tracked.filter(w=>recordOf(w).due>now).sort((a,b)=>recordOf(a).due-recordOf(b).due);
 $('memoryReminderText').textContent=due.length?`Có ${due.length} từ đến hạn ôn trong tất cả HSK.`:future.length?`Lần ôn tiếp theo: ${memoryDate(recordOf(future[0]).due)}.`:'Chưa có lịch ôn. Học một từ rồi chọn mức nhớ để tạo lịch.';
 $('memoryDueStart').hidden=!due.length;
 const root=$('memoryCalendar');root.replaceChildren();const pool=levelWords(),rows=pool.filter(w=>recordOf(w)).sort((a,b)=>recordOf(a).due-recordOf(b).due);const midnight=new Date(now);midnight.setHours(0,0,0,0);
 for(let i=0;i<7;i++){const begin=new Date(midnight);begin.setDate(begin.getDate()+i);const end=new Date(begin);end.setDate(end.getDate()+1);const count=rows.filter(w=>{const t=recordOf(w).due;return (i===0?t<end.getTime():t>=begin.getTime()&&t<end.getTime());}).length;root.append(relationElement('p',`${i===0?'Hôm nay (gồm quá hạn)':begin.toLocaleDateString('vi-VN')}: ${count} từ`));}
 const list=$('memoryUpcoming');list.replaceChildren();for(const w of rows.slice(0,20)){const r=recordOf(w);list.append(relationElement('p',`${w.han} · ${w.pin} · HSK ${w.hsk} — ${memoryDate(r.due)}${r.due<=now?' · Đến hạn':''}`));}if(!rows.length)list.append(relationElement('p','Chưa có từ được lên lịch trong HSK đang chọn.'));if(rows.length>20)list.append(relationElement('p',`Đang hiện 20 / ${rows.length} từ đã có lịch, theo hạn ôn gần nhất.`,'hint'));
}
$('memoryContextToggle').checked=memoryPrefs.context;$('memoryNewWords').checked=memoryPrefs.newWords;
$('memoryContextToggle').onchange=e=>{memoryPrefs.context=e.target.checked;saveMemoryPrefs();if(srsSession)renderSrs();};$('memoryNewWords').onchange=e=>{memoryPrefs.newWords=e.target.checked;saveMemoryPrefs();};
$('memoryDueStart').onclick=()=>{document.querySelector('[data-filter="all"]').click();switchMode('srs');const due=words.filter(w=>recordOf(w)&&recordOf(w).due<=Date.now()).sort((a,b)=>recordOf(a).due-recordOf(b).due);srsSession={queue:due,total:due.length,done:0};$('srsMessage').textContent='Chỉ ôn từ đến hạn trong tất cả HSK.';renderSrs();};
$('memoryLearnCurrent').onclick=()=>{const w=currentWords[index];if(!w)return;memoryPrefs.context=true;$('memoryContextToggle').checked=true;saveMemoryPrefs();switchMode('srs');srsSession={queue:[w],total:1,done:0};renderSrs();};
const baseMemoryStats=stats;stats=function(){baseMemoryStats();refreshMemoryDashboard();};
window.addEventListener('focus',()=>{stats();});document.addEventListener('visibilitychange',()=>{if(!document.hidden)stats();});setInterval(()=>{if(!document.hidden)stats();},60000);
refreshMemoryDashboard();
$('srsStart').onclick=startSrs;

