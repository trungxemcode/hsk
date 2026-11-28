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
 'xin ăn|ăn xin|ăn mày|hành khất|khất thực',
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
const HSK_COMMONALITY_BONUS = { 1: 44, 2: 38, 3: 32, 4: 24, 5: 18, 6: 12 };
const SINGLE_PINYIN_SYL_RE = /^(?:(?:[bpmfdtnlgkhjqxrzcswy]|zh|ch|sh)?(?:a|o|e|ai|ei|ao|ou|an|en|ang|eng|ong|i|ia|ie|iao|iu|ian|in|iang|ing|iong|u|ua|uo|uai|ui|uan|un|uang|ueng|v|ve|van|vn)|er)$/;
let corpusFreqMapCache = null;

function getCorpusFrequencyMap() {
  if (corpusFreqMapCache) return corpusFreqMapCache;
  if (typeof wordFrequency === 'undefined' || !Array.isArray(wordFrequency?.tiers)) return null;
  const map = new Map();
  wordFrequency.tiers.forEach((line, idx) => {
    if (!line) return;
    const tier = idx + 1;
    for (const w of line.split(' ')) {
      if (w) map.set(w, tier);
    }
  });
  corpusFreqMapCache = map;
  return map;
}
function corpusFrequencyScore(han) {
  const key = String(han || '').trim();
  if (!key) return 0;
  const map = getCorpusFrequencyMap();
  return map ? (map.get(key) || 0) : 0;
}

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
  let score = HSK_COMMONALITY_BONUS[level] || (word.everydayBonus || 0);
  // Prioritize single-character headwords over longer compound words when matching a root query.
  const len = Array.from(String(word.han).trim()).length;
  if (len === 1) score += 14;
  else if (len === 2) score += 6;
  else if (len === 3) score += 2;
  // Real Mandarin corpus frequency (0..30 -> 0..42), giving everyday non-HSK words (心, 饭, 微信, 外卖) natural prominence.
  const corpusTier = corpusFrequencyScore(word.han);
  if (corpusTier > 0) score += Math.round(corpusTier * 1.4);
  const hasExamples = Boolean(meta.hasExamples || (word.practice?.examples?.length >= 2) || (word.examples?.length >= 1));
  if (hasExamples) score += 4;
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
function clearSearchFrequencyCache() { searchFreqCache = null; corpusFreqMapCache = null; }

const EVERYDAY_EXTRA_WORDS = [
  { han: '你好', pin: 'nǐ hǎo', hv: 'Nhĩ hảo', mean: 'xin chào; chào; chào bạn', posSenses: [{ pos: 'Thán từ · Giao tiếp', mean: 'xin chào; chào; chào bạn' }], examples: [{ cn: '我想跟他说一句“你好”。', pin: 'Wǒ xiǎng gēn tā shuō yī jù “nǐ hǎo”.', vi: 'Tôi muốn nói với anh ấy một câu “Xin chào”.' }, { cn: '你好，请问去地铁站怎么走？', pin: 'Nǐ hǎo, qǐngwèn qù dìtiězhàn zěnme zǒu?', vi: 'Xin chào, cho hỏi đi ga tàu điện ngầm thế nào ạ?' }] },
  { han: '您好', pin: 'nín hǎo', hv: 'Nẫm hảo', mean: 'xin chào (lịch sự, kính trọng); chào ngài; chào ông/bà', posSenses: [{ pos: 'Thán từ · Kính ngữ', mean: 'xin chào (lịch sự, kính trọng); chào ngài; chào anh/chị' }], examples: [{ cn: '老师您好，请问这道题怎么做？', pin: 'Lǎoshī nín hǎo, qǐngwèn zhè dào tí zěnme zuò?', vi: 'Em chào thầy/cô ạ, cho em hỏi câu này làm thế nào ạ?' }] },
  { han: '欢迎光临', pin: 'huānyíng guānglín', hv: 'Hoan nghênh quang lâm', mean: 'xin chào quý khách; hoan nghênh quý khách', posSenses: [{ pos: 'Cụm giao tiếp', mean: 'xin chào quý khách; hoan nghênh quý khách đến cửa hàng' }], examples: [{ cn: '欢迎光临，请问几位？', pin: 'Huānyíng guānglín, qǐngwèn jǐ wèi?', vi: 'Xin chào quý khách, xin hỏi đoàn mình đi mấy người ạ?' }] },
  { han: '哈喽', pin: 'hālóu', hv: 'Ha lâu', mean: 'xin chào; alo; hello (khẩu ngữ)', posSenses: [{ pos: 'Thán từ', mean: 'xin chào; alo; hello (khẩu ngữ thân mật)' }], examples: [{ cn: '哈喽，大家晚上好！', pin: 'Hālóu, dàjiā wǎnshang hǎo!', vi: 'Xin chào, chúc mọi người buổi tối vui vẻ!' }] },
  { han: '哈啰', pin: 'hāluō', hv: 'Ha la', mean: 'xin chào; hello (khẩu ngữ)', posSenses: [{ pos: 'Thán từ', mean: 'xin chào; hello (khẩu ngữ)' }], examples: [{ cn: '哈啰，好久不见！', pin: 'Hāluō, hǎojiǔ bújiàn!', vi: 'Xin chào, lâu rồi không gặp!' }] },
  { han: '大家好', pin: 'dàjiā hǎo', hv: 'Đại gia hảo', mean: 'chào mọi người; xin chào mọi người', posSenses: [{ pos: 'Cụm giao tiếp', mean: 'chào mọi người; xin chào tất cả mọi người' }], examples: [{ cn: '大家好，很高兴认识你们。', pin: 'Dàjiā hǎo, hěn gāoxìng rènshi nǐmen.', vi: 'Chào mọi người, rất vui được làm quen với các bạn.' }] },
  { han: '早上好', pin: 'zǎoshang hǎo', hv: 'Tảo thượng hảo', mean: 'chào buổi sáng', posSenses: [{ pos: 'Cụm giao tiếp', mean: 'chào buổi sáng' }], examples: [{ cn: '早上好，今天天气真不错！', pin: 'Zǎoshang hǎo, jīntiān tiānqì zhēn búcuò!', vi: 'Chào buổi sáng, thời tiết hôm nay đẹp thật!' }] },
  { han: '早安', pin: 'zǎo\'ān', hv: 'Tảo an', mean: 'chào buổi sáng; chúc buổi sáng tốt lành', posSenses: [{ pos: 'Cụm giao tiếp', mean: 'chào buổi sáng; chúc buổi sáng tốt lành' }], examples: [{ cn: '早安，祝你今天心情愉快。', pin: 'Zǎo\'ān, zhù nǐ jīntiān xīnqíng yúkuài.', vi: 'Chào buổi sáng, chúc bạn hôm nay tâm trạng vui vẻ.' }] },
  { han: '下午好', pin: 'xiàwǔ hǎo', hv: 'Hạ ngọ hảo', mean: 'chào buổi chiều', posSenses: [{ pos: 'Cụm giao tiếp', mean: 'chào buổi chiều' }], examples: [{ cn: '各位同事下午好，我们开始开会吧。', pin: 'Gèwèi tóngshì xiàwǔ hǎo, wǒmen kāishǐ kāihuì ba.', vi: 'Chào buổi chiều các đồng nghiệp, chúng ta bắt đầu họp nhé.' }] },
  { han: '晚上好', pin: 'wǎnshang hǎo', hv: 'Vãn thượng hảo', mean: 'chào buổi tối', posSenses: [{ pos: 'Cụm giao tiếp', mean: 'chào buổi tối' }], examples: [{ cn: '观众朋友们，大家晚上好！', pin: 'Guānzhòng péngyoumen, dàjiā wǎnshang hǎo!', vi: 'Xin chào buổi tối quý vị khán giả!' }] },
  { han: '晚安', pin: 'wǎn\'ān', hv: 'Vãn an', mean: 'chúc ngủ ngon', posSenses: [{ pos: 'Cụm giao tiếp', mean: 'chúc ngủ ngon' }], examples: [{ cn: '时间不早了，早点休息吧，晚安！', pin: 'Shíjiān bù zǎo le, zǎodiǎn xiūxi ba, wǎn\'ān!', vi: 'Muộn rồi, nghỉ ngơi sớm đi nhé, chúc ngủ ngon!' }] },
  { han: '好久不见', pin: 'hǎojiǔ bújiàn', hv: 'Hảo cửu bất kiến', mean: 'lâu rồi không gặp', posSenses: [{ pos: 'Cụm giao tiếp', mean: 'lâu rồi không gặp; đã lâu không gặp' }], examples: [{ cn: '好久不见，你最近怎么样？', pin: 'Hǎojiǔ bújiàn, nǐ zuìjìn zěnmeyàng?', vi: 'Lâu rồi không gặp, dạo này bạn thế nào?' }] },
  { han: '不好意思', pin: 'bù hǎoyìsi', hv: 'Bất hảo ý tứ', mean: 'ngại quá; xin lỗi (lịch sự); cho hỏi nhờ', posSenses: [{ pos: 'Cụm giao tiếp', mean: 'xin lỗi (lịch sự khi làm phiền); ngại quá; xấu hổ' }], examples: [{ cn: '不好意思，让您久等了。', pin: 'Bù hǎoyìsi, ràng nín jiǔděng le.', vi: 'Ngại quá, để ngài phải đợi lâu rồi.' }] },
  { han: '没问题', pin: 'méi wèntí', hv: 'Mạt vấn đề', mean: 'không vấn đề gì; được thôi', posSenses: [{ pos: 'Cụm giao tiếp', mean: 'không vấn đề gì; hoàn toàn được' }], examples: [{ cn: '这件事交给我吧，没问题！', pin: 'Zhè jiàn shì jiāogěi wǒ ba, méi wèntí!', vi: 'Chuyện này cứ giao cho tôi, không vấn đề gì!' }] },
  { han: '慢走', pin: 'mànzǒu', hv: 'Mạn tẩu', mean: 'đi cẩn thận; thượng lộ bình an (tiễn khách)', posSenses: [{ pos: 'Cụm giao tiếp', mean: 'đi thong thả; đi cẩn thận nhé (lời tiễn khách)' }], examples: [{ cn: '谢谢光临，您慢走！', pin: 'Xièxie guānglín, nín mànzǒu!', vi: 'Cảm ơn quý khách đã ghé thăm, quý khách đi cẩn thận ạ!' }] },
  { han: '请问', pin: 'qǐngwèn', hv: 'Thỉnh vấn', mean: 'xin hỏi; cho tôi hỏi', posSenses: [{ pos: 'Động từ · Lịch sự', mean: 'xin hỏi; cho tôi hỏi' }], examples: [{ cn: '请问洗手间在哪里？', pin: 'Qǐngwèn xǐshǒujiān zài nǎlǐ?', vi: 'Xin hỏi nhà vệ sinh ở đâu ạ?' }] },
  { han: '加油', pin: 'jiāyóu', hv: 'Gia du', mean: 'cố lên; tiếp thêm sức mạnh; đổ xăng', posSenses: [{ pos: 'Động từ · Thán từ', mean: 'cố lên (cổ vũ); đổ xăng' }], examples: [{ cn: '明天就要考试了，加油！', pin: 'Míngtiān jiù yào kǎoshì le, jiāyóu!', vi: 'Ngày mai thi rồi, cố lên nhé!' }] },
  { han: '我爱你', pin: 'wǒ ài nǐ', hv: 'Ngã ái nhĩ', mean: 'anh yêu em; em yêu anh; tôi yêu bạn', posSenses: [{ pos: 'Cụm giao tiếp', mean: 'anh yêu em; em yêu anh; tôi yêu bạn; con yêu bố/mẹ' }], examples: [{ cn: '妈妈，我爱你！', pin: 'Māma, wǒ ài nǐ!', vi: 'Mẹ ơi, con yêu mẹ!' }] },
  { han: '生日快乐', pin: 'shēngrì kuàilè', hv: 'Sinh nhật khoái lạc', mean: 'chúc mừng sinh nhật', posSenses: [{ pos: 'Cụm giao tiếp', mean: 'chúc mừng sinh nhật; sinh nhật vui vẻ' }], examples: [{ cn: '祝你生日快乐，心想事成！', pin: 'Zhù nǐ shēngrì kuàilè, xīnxiǎng shìchéng!', vi: 'Chúc bạn sinh nhật vui vẻ, cầu được ước thấy!' }] },
  { han: '新年快乐', pin: 'xīnnián kuàilè', hv: 'Tân niên khoái lạc', mean: 'chúc mừng năm mới', posSenses: [{ pos: 'Cụm giao tiếp', mean: 'chúc mừng năm mới; năm mới vui vẻ' }], examples: [{ cn: '大家新年快乐，万事如意！', pin: 'Dàjiā xīnnián kuàilè, wànshì rúyì!', vi: 'Chúc mọi người năm mới vui vẻ, vạn sự như ý!' }] },
  { han: '恭喜发财', pin: 'gōngxǐ fācái', hv: 'Cung hỷ phát tài', mean: 'chúc mừng phát tài', posSenses: [{ pos: 'Thành ngữ · Chúc Tết', mean: 'chúc mừng phát tài; cung hỷ phát tài' }], examples: [{ cn: '祝老板新的一年恭喜发财！', pin: 'Zhù lǎobǎn xīn de yī nián gōngxǐ fācái!', vi: 'Chúc ông chủ năm mới phát tài phát lộc!' }] },
  { han: '早饭', pin: 'zǎofàn', hv: 'Tảo phạn', mean: 'bữa sáng; cơm sáng; ăn sáng', posSenses: [{ pos: 'Danh từ', mean: 'bữa sáng; cơm sáng; đồ ăn sáng' }], examples: [{ cn: '你今天吃早饭了吗？', pin: 'Nǐ jīntiān chī zǎofàn le ma?', vi: 'Hôm nay bạn đã ăn sáng chưa?' }] },
  { han: '早餐', pin: 'zǎocān', hv: 'Tảo xan', mean: 'bữa sáng; điểm tâm sáng; ăn sáng', posSenses: [{ pos: 'Danh từ', mean: 'bữa sáng; bữa điểm tâm sáng' }], examples: [{ cn: '酒店提供免费早餐。', pin: 'Jiǔdiàn tígōng miǎnfèi zǎocān.', vi: 'Khách sạn có phục vụ bữa sáng miễn phí.' }] },
  { han: '吃早饭', pin: 'chī zǎofàn', hv: 'Ngật tảo phạn', mean: 'ăn sáng; ăn bữa sáng', posSenses: [{ pos: 'Động từ ly hợp', mean: 'ăn sáng; ăn bữa sáng' }], examples: [{ cn: '我每天七点半吃早饭。', pin: 'Wǒ měitiān qī diǎn bàn chī zǎofàn.', vi: 'Mỗi ngày tôi ăn sáng lúc 7 giờ rưỡi.' }] },
  { han: '午饭', pin: 'wǔfàn', hv: 'Ngọ phạn', mean: 'bữa trưa; cơm trưa; ăn trưa', posSenses: [{ pos: 'Danh từ', mean: 'bữa trưa; cơm trưa' }], examples: [{ cn: '中午我们一起去吃午饭吧。', pin: 'Zhōngwǔ wǒmen yīqǐ qù chī wǔfàn ba.', vi: 'Buổi trưa chúng mình cùng đi ăn trưa nhé.' }] },
  { han: '午餐', pin: 'wǔcān', hv: 'Ngọ xan', mean: 'bữa trưa; cơm trưa; ăn trưa', posSenses: [{ pos: 'Danh từ', mean: 'bữa trưa; bữa ăn trưa' }], examples: [{ cn: '今天的午餐非常丰盛。', pin: 'Jīntiān de wǔcān fēicháng fēngshèng.', vi: 'Bữa trưa hôm nay rất thịnh soạn.' }] },
  { han: '吃午饭', pin: 'chī wǔfàn', hv: 'Ngật ngọ phạn', mean: 'ăn trưa; ăn cơm trưa; ăn bữa trưa', posSenses: [{ pos: 'Động từ ly hợp', mean: 'ăn trưa; ăn cơm trưa' }], examples: [{ cn: '现在十二点了，该去吃午饭了。', pin: 'Xiànzài shí\'èr diǎn le, gāi qù chī wǔfàn le.', vi: 'Bây giờ 12 giờ rồi, đến lúc đi ăn trưa rồi.' }] },
  { han: '晚饭', pin: 'wǎnfàn', hv: 'Vãn phạn', mean: 'bữa tối; cơm tối; ăn tối', posSenses: [{ pos: 'Danh từ', mean: 'bữa tối; cơm tối' }], examples: [{ cn: '晚饭你想吃什么？', pin: 'Wǎnfàn nǐ xiǎng chī shénme?', vi: 'Bữa tối bạn muốn ăn gì?' }] },
  { han: '晚餐', pin: 'wǎncān', hv: 'Vãn xan', mean: 'bữa tối; bữa ăn tối; ăn tối', posSenses: [{ pos: 'Danh từ', mean: 'bữa tối; tiệc tối' }], examples: [{ cn: '他们准备了一顿浪漫的烛光晚餐。', pin: 'Tāmen zhǔnbèi le yī dùn làngmàn de zhúguāng wǎncān.', vi: 'Họ đã chuẩn bị một bữa tối dưới ánh nến lãng mạn.' }] },
  { han: '吃晚饭', pin: 'chī wǎnfàn', hv: 'Ngật vãn phạn', mean: 'ăn tối; ăn cơm tối; ăn bữa tối', posSenses: [{ pos: 'Động từ ly hợp', mean: 'ăn tối; ăn cơm tối' }], examples: [{ cn: '全家人围坐在一起吃晚饭。', pin: 'Quán jiārén wéizuò zài yīqǐ chī wǎnfàn.', vi: 'Cả gia đình quây quần bên nhau ăn cơm tối.' }] },
  { han: '喝水', pin: 'hēshuǐ', hv: 'Hát thủy', mean: 'uống nước', posSenses: [{ pos: 'Động từ ly hợp', mean: 'uống nước' }], examples: [{ cn: '天气热，要多喝水。', pin: 'Tiānqì rè, yào duō hēshuǐ.', vi: 'Trời nóng, phải uống nhiều nước vào.' }] },
  { han: '做饭', pin: 'zuòfàn', hv: 'Tác phạn', mean: 'nấu ăn; nấu cơm; làm cơm', posSenses: [{ pos: 'Động từ ly hợp', mean: 'nấu ăn; nấu cơm' }], examples: [{ cn: '周末我喜欢在家里自己做饭。', pin: 'Zhōumò wǒ xǐhuan zài jiālǐ zìjǐ zuòfàn.', vi: 'Cuối tuần tôi thích tự nấu ăn ở nhà.' }] },
  { han: '点菜', pin: 'diǎncài', hv: 'Điểm thái', mean: 'gọi món; đặt món ăn', posSenses: [{ pos: 'Động từ ly hợp', mean: 'gọi món (ở nhà hàng)' }], examples: [{ cn: '服务员，我们想点菜。', pin: 'Fúwùyuán, wǒmen xiǎng diǎncài.', vi: 'Phục vụ ơi, chúng tôi muốn gọi món.' }] },
  { han: '买单', pin: 'mǎidān', hv: 'Mãi đơn', mean: 'thanh toán; tính tiền (nhà hàng)', posSenses: [{ pos: 'Động từ', mean: 'tính tiền; thanh toán hóa đơn' }], examples: [{ cn: '服务员，买单！', pin: 'Fúwùyuán, mǎidān!', vi: 'Phục vụ ơi, tính tiền!' }] },
  { han: '奶茶', pin: 'nǎichá', hv: 'Nãi trà', mean: 'trà sữa', posSenses: [{ pos: 'Danh từ', mean: 'trà sữa' }], examples: [{ cn: '我想点一杯少糖少冰的珍珠奶茶。', pin: 'Wǒ xiǎng diǎn yī bēi shǎo táng shǎo bīng de zhēnzhū nǎichá.', vi: 'Tôi muốn gọi một ly trà sữa trân châu ít đường ít đá.' }] },
  { han: '外卖', pin: 'wàimài', hv: 'Ngoại mại', mean: 'đồ ăn giao tận nơi; gọi đồ ăn ngoài; giao đồ ăn', posSenses: [{ pos: 'Danh từ', mean: 'đồ ăn đặt mang về / giao tận nơi; dịch vụ giao đồ ăn' }], examples: [{ cn: '今天不想做饭，我们点外卖吧。', pin: 'Jīntiān bù xiǎng zuòfàn, wǒmen diǎn wàimài ba.', vi: 'Hôm nay không muốn nấu cơm, chúng mình đặt đồ ăn ngoài đi.' }] },
  { han: '上学', pin: 'shàngxué', hv: 'Thượng học', mean: 'đi học; đến trường', posSenses: [{ pos: 'Động từ ly hợp', mean: 'đi học; đến trường' }], examples: [{ cn: '弟弟每天骑自行车去上学。', pin: 'Dìdi měitiān qí zìxíngchē qù shàngxué.', vi: 'Em trai mỗi ngày đạp xe đi học.' }] },
  { han: '放学', pin: 'fàngxué', hv: 'Phóng học', mean: 'tan học; tan trường', posSenses: [{ pos: 'Động từ ly hợp', mean: 'tan học; tan trường' }], examples: [{ cn: '孩子们下午四点半放学。', pin: 'Háizimen xiàwǔ sì diǎn bàn fàngxué.', vi: 'Bọn trẻ tan học lúc 4 giờ rưỡi chiều.' }] },
  { han: '回家', pin: 'huíjiā', hv: 'Hồi gia', mean: 'về nhà', posSenses: [{ pos: 'Động từ ly hợp', mean: 'về nhà; trở về nhà' }], examples: [{ cn: '太晚了，我该回家了。', pin: 'Tài wǎn le, wǒ gāi huíjiā le.', vi: 'Muộn quá rồi, tôi phải về nhà thôi.' }] },
  { han: '看书', pin: 'kànshū', hv: 'Khán thư', mean: 'đọc sách; xem sách', posSenses: [{ pos: 'Động từ ly hợp', mean: 'đọc sách; xem sách' }], examples: [{ cn: '她喜欢在安静的图书馆里看书。', pin: 'Tā xǐhuan zài ānjìng de túshūguǎn lǐ kànshū.', vi: 'Cô ấy thích đọc sách trong thư viện yên tĩnh.' }] },
  { han: '打电话', pin: 'dǎ diànhuà', hv: 'Đả điện thoại', mean: 'gọi điện thoại', posSenses: [{ pos: 'Cụm động từ', mean: 'gọi điện thoại' }], examples: [{ cn: '到了机场记得给我打电话。', pin: 'Dào le jīchǎng jìde gěi wǒ dǎ diànhuà.', vi: 'Đến sân bay nhớ gọi điện cho tôi nhé.' }] },
  { han: '微信', pin: 'Wēixìn', hv: 'Vi tín', mean: 'WeChat; tin nhắn WeChat', posSenses: [{ pos: 'Danh từ riêng', mean: 'ứng dụng WeChat; tài khoản/tin nhắn WeChat' }], examples: [{ cn: '我们可以加个微信吗？', pin: 'Wǒmen kěyǐ jiā gè Wēixìn ma?', vi: 'Chúng mình kết bạn WeChat được không?' }] },
  { han: '朋友圈', pin: 'péngyouquān', hv: 'Bằng hữu khuyên', mean: 'vòng bạn bè; bảng tin mạng xã hội (WeChat)', posSenses: [{ pos: 'Danh từ', mean: 'vòng bạn bè (Khoảnh khắc trên WeChat); nhóm bạn bè' }], examples: [{ cn: '她把旅行照片发到了朋友圈。', pin: 'Tā bǎ lǚxíng zhàopiàn fā dào le péngyouquān.', vi: 'Cô ấy đã đăng ảnh du lịch lên vòng bạn bè.' }] },
  { han: '支付宝', pin: 'Zhīfùbǎo', hv: 'Chi phó bảo', mean: 'Alipay; ví điện tử Alipay', posSenses: [{ pos: 'Danh từ riêng', mean: 'Alipay (ví điện tử phổ biến tại Trung Quốc)' }], examples: [{ cn: '请问可以用支付宝付款吗？', pin: 'Qǐngwèn kěyǐ yòng Zhīfùbǎo fùkuǎn ma?', vi: 'Cho hỏi có thể thanh toán bằng Alipay không ạ?' }] },
  { han: '扫码', pin: 'sǎomǎ', hv: 'Tảo mã', mean: 'quét mã; quét mã QR', posSenses: [{ pos: 'Động từ ly hợp', mean: 'quét mã QR (để thanh toán, gọi món)' }], examples: [{ cn: '您可以直接用手机扫码点餐。', pin: 'Nín kěyǐ zhíjiē yòng shǒujī sǎomǎ diǎncān.', vi: 'Quý khách có thể dùng điện thoại quét mã gọi món trực tiếp.' }] },
  { han: '二维码', pin: 'èrwéimǎ', hv: 'Nhị duy mã', mean: 'mã QR', posSenses: [{ pos: 'Danh từ', mean: 'mã QR; mã vạch hai chiều' }], examples: [{ cn: '请出示您的付款二维码。', pin: 'Qǐng chūshì nín de fùkuǎn èrwéimǎ.', vi: 'Vui lòng xuất trình mã QR thanh toán của bạn.' }] },
  { han: '快递', pin: 'kuàidì', hv: 'Khoái đệ', mean: 'giao hàng nhanh; chuyển phát nhanh; bưu phẩm', posSenses: [{ pos: 'Danh từ · Động từ', mean: 'chuyển phát nhanh; giao hàng; kiện hàng chuyển phát' }], examples: [{ cn: '你的快递已经放到门口了。', pin: 'Nǐ de kuàidì yǐjīng fàng dào ménkǒu le.', vi: 'Kiện hàng chuyển phát nhanh của bạn đã để trước cửa rồi.' }] },
  { han: '送货', pin: 'sònghuò', hv: 'Tống hóa', mean: 'giao hàng; đưa hàng', posSenses: [{ pos: 'Động từ ly hợp', mean: 'giao hàng; vận chuyển hàng đến nơi' }], examples: [{ cn: '这家商店提供免费送货上门服务。', pin: 'Zhè jiā shāngdiàn tígōng miǎnfèi sònghuò shàngmén fúwù.', vi: 'Cửa hàng này có dịch vụ giao hàng tận nhà miễn phí.' }] },
  { han: '网购', pin: 'wǎnggòu', hv: 'Vãng cấu', mean: 'mua sắm trực tuyến; mua hàng online', posSenses: [{ pos: 'Động từ · Danh từ', mean: 'mua sắm trực tuyến; mua hàng trên mạng' }], examples: [{ cn: '现在越来越多年轻人习惯网购。', pin: 'Xiànzài yuèláiyuè duō niánqīngrén xíguàn wǎnggòu.', vi: 'Hiện nay ngày càng nhiều người trẻ quen mua hàng online.' }] },
  { han: '下单', pin: 'xiàdān', hv: 'Hạ đơn', mean: 'đặt hàng; lên đơn', posSenses: [{ pos: 'Động từ ly hợp', mean: 'đặt hàng; chốt đơn mua hàng' }], examples: [{ cn: '现在下单今天下午就能发货。', pin: 'Xiànzài xiàdān jīntiān xiàwǔ jiù néng fāhuò.', vi: 'Đặt hàng bây giờ thì chiều nay có thể gửi hàng ngay.' }] },
  { han: '包邮', pin: 'bāoyóu', hv: 'Bao bưu', mean: 'miễn phí vận chuyển; bao ship; freeship', posSenses: [{ pos: 'Động từ', mean: 'miễn phí vận chuyển; bao phí gửi hàng' }], examples: [{ cn: '买满九十九元全国包邮。', pin: 'Mǎi mǎn jiǔshíjiǔ yuán quánguó bāoyóu.', vi: 'Mua đủ 99 tệ được miễn phí vận chuyển toàn quốc.' }] },
  { han: '高铁', pin: 'gāotiě', hv: 'Cao thiết', mean: 'tàu cao tốc; đường sắt cao tốc', posSenses: [{ pos: 'Danh từ', mean: 'tàu cao tốc; đường sắt cao tốc' }], examples: [{ cn: '坐高铁从北京到上海只要四个多小时。', pin: 'Zuò gāotiě cóng Běijīng dào Shànghǎi zhǐ yào sì gè duō xiǎoshí.', vi: 'Đi tàu cao tốc từ Bắc Kinh đến Thượng Hải chỉ mất hơn 4 tiếng.' }] },
  { han: '打车', pin: 'dǎchē', hv: 'Đả xa', mean: 'bắt xe; gọi taxi; đặt xe công nghệ', posSenses: [{ pos: 'Động từ ly hợp', mean: 'bắt taxi; gọi xe' }], examples: [{ cn: '下雨了，我们打车回去吧。', pin: 'Xiàyǔ le, wǒmen dǎchē huíqù ba.', vi: 'Trời mưa rồi, chúng mình bắt xe về đi.' }] },
  { han: '充电宝', pin: 'chōngdiànbǎo', hv: 'Xung điện bảo', mean: 'sạc dự phòng; pin dự phòng', posSenses: [{ pos: 'Danh từ', mean: 'pin sạc dự phòng' }], examples: [{ cn: '手机快没电了，你有充电宝吗？', pin: 'Shǒujī kuài méi diàn le, nǐ yǒu chōngdiànbǎo ma?', vi: 'Điện thoại sắp hết pin rồi, bạn có sạc dự phòng không?' }] },
  { han: '人工智能', pin: 'réngōng zhīnéng', hv: 'Nhân công trí năng', mean: 'trí tuệ nhân tạo; AI', posSenses: [{ pos: 'Danh từ', mean: 'trí tuệ nhân tạo (AI)' }], examples: [{ cn: '人工智能正在改变我们的工作和学习方式。', pin: 'Réngōng zhīnéng zhèngzài gǎibiàn wǒmen de gōngzuò hé xuéxí fāngshì.', vi: 'Trí tuệ nhân tạo đang thay đổi cách chúng ta làm việc và học tập.' }] },
  { han: '网红', pin: 'wǎnghóng', hv: 'Vãng hồng', mean: 'người nổi tiếng trên mạng; địa điểm hot trên mạng', posSenses: [{ pos: 'Danh từ', mean: 'người/địa điểm nổi tiếng trên mạng xã hội' }], examples: [{ cn: '这家网红奶茶店每天都排长队。', pin: 'Zhè jiā wǎnghóng nǎichádiàn měitiān dōu pái chángduì.', vi: 'Quán trà sữa nổi tiếng trên mạng này ngày nào cũng xếp hàng dài.' }] },
  { han: '短视频', pin: 'duǎnshìpín', hv: 'Đoản thị tần', mean: 'video ngắn', posSenses: [{ pos: 'Danh từ', mean: 'video ngắn (trên nền tảng mạng xã hội)' }], examples: [{ cn: '很多人喜欢在睡前刷短视频。', pin: 'Hěn duō rén xǐhuan zài shuìqián shuā duǎnshìpín.', vi: 'Rất nhiều người thích lướt xem video ngắn trước khi ngủ.' }] },
  { han: '账号', pin: 'zhànghào', hv: 'Trướng hiệu', mean: 'tài khoản; tên tài khoản', posSenses: [{ pos: 'Danh từ', mean: 'tài khoản (mạng xã hội, ngân hàng, ứng dụng)' }], examples: [{ cn: '请输入您的登录账号和密码。', pin: 'Qǐng shūrù nín de dēnglù zhànghào hé mìmǎ.', vi: 'Vui lòng nhập tài khoản đăng nhập và mật khẩu của bạn.' }] }
];

const HSKSearchRanking = {
  KEY: SEARCH_FREQ_KEY,
  everydayWords: EVERYDAY_EXTRA_WORDS,
  wordKey: searchWordKey,
  queryKey: searchQueryKey,
  splitPinyinSyllables,
  corpusFrequency: corpusFrequencyScore,
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
  HSKSearchRanking, searchWordKey, searchQueryKey, splitPinyinSyllables, corpusFrequencyScore, loadSearchFrequency,
  recordSearchHit, searchHitCount, searchFrequencyBoost, wordCommonalityScore, isArchaicOrVariantGloss
};
