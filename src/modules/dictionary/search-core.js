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
 'ăn|ăn uống|dùng bữa','cơm|bữa cơm|bữa ăn|cơm nước|cơm canh','gạo|lúa gạo|hạt gạo','ngon|ngon miệng|ngon lành','uống|uống nước','ngủ|ngủ nghỉ|giấc ngủ',
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

// Hanzii-style commonality prior + local search-frequency ranking engine.
// Combines static everyday usage demand (HSK tier, verified examples, corpus
// richness, archaic/variant demotion) with bounded personal search-click history.
const SEARCH_FREQ_KEY = 'hsk-search-frequency-v1';
const SEARCH_FREQ_MAX_WORDS = 400;
const SEARCH_FREQ_MAX_QUERIES = 250;
const SEARCH_FREQ_MAX_PER_QUERY = 16;
const ARCHAIC_GLOSS_RE = /^(?:(?:old\s+)?variant\s+of\b|archaic\b|surname\s+|abbr\.\s+(?:for|of)\b|see\s+also\b|used\s+in\b|japanese\s+variant\b|erhua\s+variant\b|taiwan\s+pr\.|\(literary\)|\(archaic\)|\(old\)|\(dialect\)|cl:)/i;
const HSK_COMMONALITY_BONUS = { 1: 54, 2: 48, 3: 42, 4: 34, 5: 26, 6: 18 };
const SINGLE_PINYIN_SYL_RE = /^(?:(?:[bpmfdtnlgkhjqxrzcswy]|zh|ch|sh)?(?:a|o|e|ai|ei|ao|ou|an|en|ang|eng|ong|i|ia|ie|iao|iu|ian|in|iang|ing|iong|u|ua|uo|uai|ui|uan|un|uang|ueng|v|ve|van|vn)|er)$/;

function segmentPinyinChunk(chunk) {
  if (!chunk) return [];
  if (SINGLE_PINYIN_SYL_RE.test(chunk)) return [chunk];
  const n = chunk.length, dp = Array(n + 1).fill(null);
  dp[0] = [];
  for (let i = 0; i < n; i++) {
    if (!dp[i]) continue;
    for (let len = Math.min(6, n - i); len >= 1; len--) {
      const part = chunk.slice(i, i + len);
      if (SINGLE_PINYIN_SYL_RE.test(part)) {
        const cand = dp[i].concat(part);
        if (!dp[i + len] || cand.length < dp[i + len].length) dp[i + len] = cand;
      }
    }
  }
  return dp[n] || [chunk];
}
function splitPinyinSyllables(pin) {
  const foldFn = (typeof window !== 'undefined' && window.HSKOpenDictionaryCore?.fold)
    ? window.HSKOpenDictionaryCore.fold
    : s => stripVietnameseTone(s).replace(/[^a-z]/g, '');
  const parts = String(pin || '').trim().split(/[\s,/·'’-]+/).filter(Boolean);
  const out = [];
  for (const part of parts) {
    const folded = foldFn(part);
    if (!folded) continue;
    for (const syl of segmentPinyinChunk(folded)) out.push(syl);
  }
  return out;
}

function searchQueryKey(q) {
  const raw = String(q || '').trim();
  if (!raw) return '';
  const norm = typeof fold === 'function' ? fold(raw) : raw.toLowerCase().replace(/\s+/g, ' ').trim();
  return norm.slice(0, 40);
}
function searchWordKey(w) {
  if (!w || !w.han) return '';
  const pin = String(w.pin || w.pinDisplay || '');
  const reading = (typeof window !== 'undefined' && window.HSKOpenDictionaryCore?.reading)
    ? window.HSKOpenDictionaryCore.reading(pin)
    : stripVietnameseTone(pin).replace(/\s+/g, '');
  return `${String(w.han).trim()}|${reading}`;
}
function emptySearchFrequency() {
  return { version: 1, words: Object.create(null), queries: Object.create(null) };
}
let searchFreqCache = null;
function loadSearchFrequency(storage) {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!storage && searchFreqCache) return searchFreqCache;
  const out = emptySearchFrequency();
  if (!store) return out;
  try {
    const raw = JSON.parse(store.getItem(SEARCH_FREQ_KEY) || '{}');
    if (raw && raw.version === 1) {
      if (raw.words && typeof raw.words === 'object') {
        for (const [k, v] of Object.entries(raw.words)) {
          if (k && v && Number.isFinite(v.count) && v.count > 0 && Number.isFinite(v.lastAt)) {
            out.words[k] = { count: Math.min(999, Math.floor(v.count)), lastAt: v.lastAt };
          }
        }
      }
      if (raw.queries && typeof raw.queries === 'object') {
        for (const [qk, map] of Object.entries(raw.queries)) {
          if (!qk || !map || typeof map !== 'object') continue;
          const bucket = Object.create(null);
          for (const [wk, v] of Object.entries(map)) {
            if (wk && v && Number.isFinite(v.count) && v.count > 0 && Number.isFinite(v.lastAt)) {
              bucket[wk] = { count: Math.min(999, Math.floor(v.count)), lastAt: v.lastAt };
            }
          }
          if (Object.keys(bucket).length) out.queries[qk] = bucket;
        }
      }
    }
  } catch (_) {}
  if (!storage) searchFreqCache = out;
  return out;
}
function saveSearchFrequency(data, storage) {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  const wordKeys = Object.keys(data.words).sort((a, b) => (data.words[b].lastAt || 0) - (data.words[a].lastAt || 0));
  for (const old of wordKeys.slice(SEARCH_FREQ_MAX_WORDS)) delete data.words[old];
  const qKeys = Object.keys(data.queries).sort((a, b) => {
    const maxA = Math.max(0, ...Object.values(data.queries[a]).map(x => x.lastAt || 0));
    const maxB = Math.max(0, ...Object.values(data.queries[b]).map(x => x.lastAt || 0));
    return maxB - maxA;
  });
  for (const old of qKeys.slice(SEARCH_FREQ_MAX_QUERIES)) delete data.queries[old];
  for (const qk of Object.keys(data.queries)) {
    const bucket = data.queries[qk];
    const entries = Object.keys(bucket).sort((a, b) => (bucket[b].count - bucket[a].count) || ((bucket[b].lastAt || 0) - (bucket[a].lastAt || 0)));
    for (const old of entries.slice(SEARCH_FREQ_MAX_PER_QUERY)) delete bucket[old];
  }
  if (!storage) searchFreqCache = data;
  if (!store) return;
  try { store.setItem(SEARCH_FREQ_KEY, JSON.stringify(data)); } catch (_) {}
}
function recordSearchHit(query, word, now = Date.now(), storage) {
  const wKey = searchWordKey(word);
  if (!wKey) return false;
  const data = loadSearchFrequency(storage);
  const prevWord = data.words[wKey];
  data.words[wKey] = { count: Math.min(999, (prevWord?.count || 0) + 1), lastAt: now };
  const qKey = searchQueryKey(query);
  if (qKey) {
    const bucket = data.queries[qKey] || (data.queries[qKey] = Object.create(null));
    const prevQ = bucket[wKey];
    bucket[wKey] = { count: Math.min(999, (prevQ?.count || 0) + 1), lastAt: now };
  }
  saveSearchFrequency(data, storage);
  return true;
}
function searchHitCount(query, word, data) {
  const wKey = searchWordKey(word);
  if (!wKey) return { total: 0, queryCount: 0 };
  const store = data || loadSearchFrequency();
  const qKey = searchQueryKey(query);
  return {
    total: store.words[wKey]?.count || 0,
    queryCount: (qKey && store.queries[qKey]?.[wKey]?.count) || 0
  };
}
function searchFrequencyBoost(query, word, now = Date.now(), data) {
  const wKey = searchWordKey(word);
  if (!wKey) return 0;
  const store = data || loadSearchFrequency();
  const qKey = searchQueryKey(query);
  const wEntry = store.words[wKey];
  const qEntry = qKey ? store.queries[qKey]?.[wKey] : null;
  const decay = lastAt => {
    const ageDays = Math.max(0, (now - (lastAt || now)) / 86400000);
    return 1 / (1 + ageDays / 30);
  };
  let boost = 0;
  if (qEntry && qEntry.count > 0) {
    boost += Math.min(28, Math.round(14 * Math.log2(1 + qEntry.count) * decay(qEntry.lastAt)));
  }
  if (wEntry && wEntry.count > 0) {
    boost += Math.min(12, Math.round(5 * Math.log2(1 + wEntry.count) * decay(wEntry.lastAt)));
  }
  return Math.min(36, boost);
}
function isArchaicOrVariantGloss(rawGloss) {
  const pieces = String(rawGloss || '').split(/[;；\n]/).map(s => s.trim()).filter(Boolean);
  if (!pieces.length) return false;
  if (ARCHAIC_GLOSS_RE.test(pieces[0])) return true;
  return pieces.every(p => ARCHAIC_GLOSS_RE.test(p));
}
function wordCommonalityScore(word, meta = {}) {
  if (!word || !word.han) return 0;
  const level = Number(meta.hsk ?? word.hsk) || 0;
  let score = HSK_COMMONALITY_BONUS[level] || 0;
  const len = Array.from(String(word.han).trim()).length;
  if (len === 2) score += 6;
  else if (len === 1) score += 4;
  else if (len === 3) score += 2;
  const hasExamples = Boolean(meta.hasExamples || (word.practice?.examples?.length >= 2) || (word.examples?.length >= 1));
  if (hasExamples) score += 6;
  const uEntry = typeof usageFactsData !== 'undefined' ? usageFactsData?.words?.[word.han] : null;
  if (!level && uEntry?.variants?.length) {
    score += 6;
    const senseCount = uEntry.variants[0]?.senses?.length || 0;
    const structCount = uEntry.variants[0]?.structures?.length || 0;
    if (senseCount >= 2 && structCount >= 1) score += 4;
    else if (senseCount >= 2 || structCount >= 1) score += 2;
  }
  const pin = String(word.pin || word.pinDisplay || '').trim();
  const isProperNoun = !level && /^[A-Z]/.test(pin);
  if (isProperNoun) score -= 18;
  const rawSource = word.sourceMean || (!word.native && !word.meanVi && word.meanLanguage !== 'vi' ? word.mean : '');
  if (!level && rawSource && isArchaicOrVariantGloss(rawSource)) score -= 22;
  if (!level && meta.hasVi === false) score -= 6;
  return score;
}
function clearSearchFrequencyCache() { searchFreqCache = null; }

const HSKSearchRanking = {
  KEY: SEARCH_FREQ_KEY,
  wordKey: searchWordKey,
  queryKey: searchQueryKey,
  splitPinyinSyllables,
  load: loadSearchFrequency,
  record: recordSearchHit,
  hitCount: searchHitCount,
  boost: searchFrequencyBoost,
  commonality: wordCommonalityScore,
  isArchaicGloss: isArchaicOrVariantGloss,
  clearCache: clearSearchFrequencyCache
};
if (typeof window !== 'undefined') window.HSKSearchRanking = HSKSearchRanking;
if (typeof module !== 'undefined') module.exports = {
  splitSenses, bareSense, expandedTerms, nearSenses,
  HSKSearchRanking, searchWordKey, searchQueryKey, splitPinyinSyllables, loadSearchFrequency,
  recordSearchHit, searchHitCount, searchFrequencyBoost, wordCommonalityScore, isArchaicOrVariantGloss
};
