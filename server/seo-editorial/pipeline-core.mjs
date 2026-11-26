/**
 * Web-Standard ESM Core for Cloudflare Worker `hsk-seo-editorial`.
 * Runs Google Trends / Suggest VN collection, 3-layer deduplication,
 * Gemma 4 drafting, 2-tier AI reviewer council (xKiro / Workers AI),
 * auto-polishing, and draft lifecycle state transitions.
 */

export const CATEGORIES = Object.freeze({
  'ky-thi': 'Kỳ thi & Đăng ký',
  'diem-so': 'Điểm số & Tra điểm',
  'meo-hoc': 'Mẹo học HSK',
  'ngu-phap': 'Phân biệt & Ngữ pháp',
});

export const EDITORIAL_VOICES = Object.freeze({
  'cam-nang-than-thien': {
    label: 'Cẩm nang người đi trước chia sẻ gần gũi',
    instructions:
      'Viết gần gũi, tự nhiên như người từng tự học và thi HSK hướng dẫn lại. Đi thẳng vào tình huống thực tế của người Việt học tiếng Trung, câu văn ngắn gọn và dễ áp dụng.',
  },
  'ban-tin-phan-tich': {
    label: 'Bản tin phân tích sắc gọn – trọng tâm',
    instructions:
      'Viết khúc chiết, mạch lạc, chia ý rõ ràng "Bản chất – Cách phân biệt – Lỗi người Việt hay sai", dễ quét nhanh.',
  },
  'hoi-dap-thuc-chien': {
    label: 'Góc giải đáp thực chiến cho người sắp thi HSK',
    instructions:
      'Đi thẳng vào những thắc mắc dễ nhầm nhất khi nói, viết và làm đề HSK; ưu tiên mẹo nhớ nhanh và ví dụ thực tế.',
  },
  'ke-chuyen-truyen-cam-hung': {
    label: 'Góc nhìn thực tế & ứng dụng giao tiếp đời sống',
    instructions:
      'Viết sinh động, gắn kiến thức tiếng Trung với tình huống giao tiếp hằng ngày, đi làm và luyện thi HSK.',
  },
});

export const DEFAULT_TREND_SEEDS = [
  'học tiếng trung',
  'ngữ pháp tiếng trung',
  'phân biệt tiếng trung',
  'giao tiếp tiếng trung',
  'từ vựng tiếng trung',
  'lỗi sai tiếng trung',
  'thi hsk',
  'luyện thi hsk',
  'tiếng trung công xưởng',
  'lộ trình học tiếng trung',
  'bảng chữ cái tiếng trung',
  'giới thiệu bản thân tiếng trung',
];

const EVERGREEN_FALLBACK_TOPICS = [
  { query: 'cách nói xin lỗi trong tiếng trung', spike: 'Xu hướng học HSK', source: 'evergreen-seed' },
  { query: 'câu chữ le trong tiếng trung', spike: 'Ngữ pháp HSK', source: 'evergreen-seed' },
  { query: 'giới thiệu bản thân bằng tiếng trung xin việc', spike: 'Giao tiếp HSK', source: 'evergreen-seed' },
  { query: 'lộ trình tự học hsk 1 đến hsk 4', spike: 'Luyện thi HSK', source: 'evergreen-seed' },
  { query: 'cách dùng lượng từ trong tiếng trung', spike: 'Ngữ pháp HSK', source: 'evergreen-seed' },
  { query: 'phân biệt jiu và cai trong tiếng trung', spike: 'Ngữ pháp HSK', source: 'evergreen-seed' },
];

const BLOCKED_TOXIC_RE = /(?:chửi\s*bậy|chửi\s*thề|nói\s*bậy|tục\s*tĩu|\b18\+|\bsex\b|khiêu\s*dâm|cờ\s*bạc|cá\s*độ|bậy\s*bạ)/i;

const BLOCKED_PURE_TRANSLATE_RES = [
  /^dịch(\s+sang)?\s+tiếng\s+trung(\s+sang\s+tiếng\s+việt)?$/i,
  /^tiếng\s+trung\s+dịch(\s+sang\s+tiếng\s+việt)?$/i,
  /^dịch\s+(?:trung\s+việt|việt\s+trung)$/i,
  /^tiếng\s+(?:trung|việt)\s+(?:dịch\s+)?sang\s+tiếng\s+(?:việt|trung)$/i,
  /^google\s*dịch/i,
  /^dịch\s+video/i,
  /^tiếng\s+trung(?:\s+quốc)?$/i,
  /^trung\s+quốc$/i,
];

const FORBIDDEN_MARKETING_TERMS = [
  /hạn mức/i,
  /hạn ngạch/i,
  /xác minh email/i,
  /yêu cầu đăng nhập/i,
];

const STOP_TOKENS = new Set([
  'trong', 'va', 'cua', 'cho', 'nhung', 'cac', 'la', 'gi', 'nhu', 'the',
  'nao', 'voi', 'hay', 'khi', 'tai', 've', 'tu', 'moi', 'nhat',
]);

const RELEVANT_RSS_RE = /(?:hsk|tiếng\s*trung|trung\s*quốc|chinesetest|pinyin|chữ\s*hán|hán\s*ngữ|du\s*học\s*trung)/i;

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const XKIRO_API_URL = 'https://api.xkiro.com/v1/chat/completions';

export function slugifyVi(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

export function pickEditorialVoice(seedKey = '', requestedVoice = '') {
  const voiceKeys = Object.keys(EDITORIAL_VOICES);
  if (requestedVoice && EDITORIAL_VOICES[requestedVoice]) {
    return { id: requestedVoice, ...EDITORIAL_VOICES[requestedVoice] };
  }
  const seed = String(seedKey || Date.now());
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const chosenId = voiceKeys[hash % voiceKeys.length];
  return { id: chosenId, ...EDITORIAL_VOICES[chosenId] };
}

export function normalizeTextForMatch(input) {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeForSimilarity(input) {
  const tokens = normalizeTextForMatch(input)
    .split(' ')
    .filter((t) => t.length >= 2 && !STOP_TOKENS.has(t));
  return new Set(tokens);
}

export function jaccardSimilarity(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let inter = 0;
  for (const t of setA) {
    if (setB.has(t)) inter++;
  }
  const union = setA.size + setB.size - inter;
  return union ? inter / union : 0;
}

export function extractCfAiText(result) {
  if (result == null) return '';
  if (typeof result === 'string') return result.trim();
  const choiceContent = result?.choices?.[0]?.message?.content;
  if (typeof choiceContent === 'string' && choiceContent.trim()) {
    return choiceContent.trim();
  }
  if (Array.isArray(choiceContent)) {
    const joined = choiceContent.map((p) => (typeof p === 'string' ? p : p?.text || '')).join('').trim();
    if (joined) return joined;
  }
  const resp = result?.response;
  if (typeof resp === 'string' && resp.trim()) {
    return resp.trim();
  }
  if (resp && typeof resp === 'object') {
    return JSON.stringify(resp);
  }
  if (typeof result?.title === 'string' || typeof result?.score === 'number') {
    return JSON.stringify(result);
  }
  return '';
}

export function extractJsonObject(text) {
  let cleaned = String(text || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim();
  const fenceMatch = /```(?:json)?\s*([\s\S]*?)```/i.exec(cleaned);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const start = cleaned.indexOf('{');
    if (start === -1) {
      throw new Error('Model response did not contain a JSON object.');
    }
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }
      if (ch === '"') {
        inString = true;
      } else if (ch === '{') {
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0) {
          return JSON.parse(cleaned.slice(start, i + 1));
        }
      }
    }
    throw new Error('Could not parse balanced JSON object from model response.');
  }
}

function splitCsvRow(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

export function parseGoogleTrendsCsv(rawText) {
  const clean = String(rawText || '').replace(/^\uFEFF/, '').trim();
  if (!clean) return [];
  const items = [];
  const seen = new Set();

  for (const rawLine of clean.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^(?:category|danh mục|all categories|tất cả danh mục|top|rising|tìm kiếm hàng đầu|tìm kiếm tăng vọt|query|cụm từ tìm kiếm|ngày|tuần|region|khu vực)/i.test(line)) {
      continue;
    }
    if (line.includes(',')) {
      const cols = splitCsvRow(line);
      const maybeQuery = (cols[0] || '').trim();
      const maybeSpike = (cols[1] || '').trim();
      if (
        !maybeQuery ||
        /^(?:cụm từ tìm kiếm|query|top|rising|tiêu chí|search term)$/i.test(maybeQuery) ||
        /^(?:thay đổi|change|value|lượng tìm kiếm)$/i.test(maybeSpike)
      ) {
        continue;
      }
      const norm = normalizeTextForMatch(maybeQuery);
      if (norm && !seen.has(norm)) {
        seen.add(norm);
        items.push({ query: maybeQuery, spike: maybeSpike || '', source: 'google-trends-csv' });
      }
      continue;
    }
    for (const part of line.split(/[;|]/)) {
      const query = part.trim().replace(/^[-*\d.)\s]+/, '');
      const norm = normalizeTextForMatch(query);
      if (query.length >= 3 && norm && !seen.has(norm)) {
        seen.add(norm);
        items.push({ query, spike: '', source: 'google-trends-csv' });
      }
    }
  }
  return items;
}

export function isQueryAllowed(query) {
  const q = String(query || '').trim();
  if (q.length < 4 || q.length > 110) return false;
  if (BLOCKED_TOXIC_RE.test(q)) return false;
  for (const re of BLOCKED_PURE_TRANSLATE_RES) {
    if (re.test(q)) return false;
  }
  return true;
}

export function inferCategoryAndTag(query) {
  const q = normalizeTextForMatch(query);
  if (/(diem thi|tra diem|bang diem|chung chi|bao lau co diem|diem dau)/.test(q)) {
    return { category: 'diem-so', hskTag: 'Điểm số HSK' };
  }
  if (/(lich thi|dang ky|hsk 3 0|hskk|dia diem thi|le phi)/.test(q)) {
    return { category: 'ky-thi', hskTag: 'Kỳ thi HSK' };
  }
  if (/(phan biet|ngu phap|loi sai|cau chu|tro tu|luong tu|phu dinh|so sanh|loai tu|tu loai)/.test(q)) {
    return { category: 'ngu-phap', hskTag: 'Ngữ pháp HSK' };
  }
  return { category: 'meo-hoc', hskTag: 'Tiếng Trung thực tế' };
}

export function buildEducationalTopicTitle(query) {
  const raw = String(query || '').trim();
  const norm = normalizeTextForMatch(raw);
  if (/(phan biet|ngu phap|loi sai|lo trinh)/.test(norm)) {
    return `${raw.charAt(0).toUpperCase()}${raw.slice(1)}: Hướng dẫn chi tiết dễ nhớ, ví dụ Hán – Pinyin – Việt và lỗi cần tránh`;
  }
  return `Hướng dẫn chi tiết "${raw}": Cách dùng chuẩn người bản xứ, ví dụ Pinyin – tiếng Việt và lỗi hay gặp`;
}

function scoreTrendCandidate(item) {
  let score = 10;
  if (item.source === 'google-trends-csv') score += 40;
  else if (item.source === 'google-trends' || item.source === 'google-trends-rss') score += 32;
  else if (item.source === 'google-suggest') score += 18;
  else if (item.source === 'manual-query') score += 50;

  const spike = String(item.spike || '');
  if (/đột biến|breakout/i.test(spike)) {
    score += 45;
  } else {
    const pct = /\+?(\d[\d.,]*)\s*%/.exec(spike);
    if (pct) {
      const val = Number(pct[1].replace(/[.,]/g, ''));
      if (Number.isFinite(val)) score += Math.min(40, Math.round(Math.log10(Math.max(10, val)) * 12));
    }
  }

  const norm = normalizeTextForMatch(item.query);
  if (/(phan biet|ngu phap|loi sai|lo trinh|giao tiep|xin loi|gioi thieu|cong xuong|tu vung|hsk|pinyin|chu han|bang chu cai)/.test(norm)) {
    score += 22;
  }
  return score;
}

function buildExistingCorpus(publishedArticles = [], drafts = []) {
  const norms = new Set();
  const slugs = new Set();
  const tokenSets = [];

  const registerRecord = (rec) => {
    const slug = String(rec?.slug || '').trim();
    if (slug) slugs.add(slug);
    for (const field of [rec?.title, rec?.topic, rec?.trendQuery, ...(Array.isArray(rec?.keywords) ? rec.keywords : [])]) {
      const norm = normalizeTextForMatch(field);
      if (norm) norms.add(norm);
      const tset = tokenizeForSimilarity(field);
      if (tset.size >= 2) tokenSets.push(tset);
    }
    if (slug) {
      const slugSet = tokenizeForSimilarity(slug.replace(/-/g, ' '));
      if (slugSet.size >= 2) tokenSets.push(slugSet);
    }
  };

  for (const a of publishedArticles) registerRecord(a);
  for (const d of drafts) {
    registerRecord(d);
    if (d?.article) registerRecord(d.article);
  }
  return { norms, slugs, tokenSets };
}

function isDuplicateTopic(query, explicitSlug, corpus) {
  const norm = normalizeTextForMatch(query);
  const slug = explicitSlug || slugifyVi(query);
  if (!norm || !slug) return true;
  if (corpus.norms.has(norm) || corpus.slugs.has(slug)) return true;

  const qTokens = tokenizeForSimilarity(query);
  if (qTokens.size >= 2) {
    for (const existingSet of corpus.tokenSets) {
      if (jaccardSimilarity(qTokens, existingSet) >= 0.65) {
        return true;
      }
    }
  }
  return false;
}

export function filterAndRankTrendTopics(
  rawItems = [],
  { publishedArticles = [], drafts = [], count = 1 } = {}
) {
  const corpus = buildExistingCorpus(publishedArticles, drafts);
  const ranked = [];
  const batchSeenNorm = new Set();

  for (const item of rawItems) {
    const query = String(item?.query || '').trim();
    if (!isQueryAllowed(query)) continue;
    const norm = normalizeTextForMatch(query);
    if (batchSeenNorm.has(norm)) continue;
    batchSeenNorm.add(norm);

    const slug = slugifyVi(query);
    if (isDuplicateTopic(query, slug, corpus)) continue;

    const { category, hskTag } = inferCategoryAndTag(query);
    ranked.push({
      query,
      slug,
      topic: buildEducationalTopicTitle(query),
      category,
      hskTag,
      spike: String(item?.spike || '').trim(),
      source: item?.source || 'google-trends',
      score: scoreTrendCandidate(item),
      keywords: [query, `${query} HSK`, 'tự học tiếng Trung'],
    });
  }

  ranked.sort((a, b) => b.score - a.score);

  const selected = [];
  for (const cand of ranked) {
    if (selected.length >= count) break;
    if (isDuplicateTopic(cand.query, cand.slug, corpus)) continue;
    corpus.norms.add(normalizeTextForMatch(cand.query));
    corpus.slugs.add(cand.slug);
    corpus.tokenSets.push(tokenizeForSimilarity(cand.query));
    selected.push(cand);
  }

  if (selected.length < count) {
    for (const seed of EVERGREEN_FALLBACK_TOPICS) {
      if (selected.length >= count) break;
      const slug = slugifyVi(seed.query);
      if (isDuplicateTopic(seed.query, slug, corpus)) continue;
      const { category, hskTag } = inferCategoryAndTag(seed.query);
      corpus.norms.add(normalizeTextForMatch(seed.query));
      corpus.slugs.add(slug);
      corpus.tokenSets.push(tokenizeForSimilarity(seed.query));
      selected.push({
        query: seed.query,
        slug,
        topic: buildEducationalTopicTitle(seed.query),
        category,
        hskTag,
        spike: seed.spike,
        source: seed.source,
        score: 5,
        keywords: [seed.query, `${seed.query} HSK`, 'tự học tiếng Trung'],
      });
    }
  }

  return selected;
}

async function fetchGoogleTrendsRssVn(fetchImpl = fetch) {
  const results = [];
  try {
    const res = await fetchImpl('https://trends.google.com/trending/rss?geo=VN', {
      headers: { 'Accept-Language': 'vi-VN,vi;q=0.9' },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return results;
    const xml = await res.text();
    for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
      const block = m[1];
      const titleMatch = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/i.exec(block);
      const trafficMatch = /<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/i.exec(block);
      const title = String(titleMatch?.[1] || titleMatch?.[2] || '').trim();
      if (!title || !RELEVANT_RSS_RE.test(title)) continue;
      results.push({
        query: title,
        spike: String(trafficMatch?.[1] || 'Trending VN').trim(),
        source: 'google-trends-rss',
      });
    }
  } catch (_) {}
  return results;
}

async function fetchGoogleSuggestVn(seeds, fetchImpl = fetch) {
  const results = [];
  const seen = new Set();
  await Promise.all(
    seeds.map(async (seed) => {
      try {
        const url = new URL('https://suggestqueries.google.com/complete/search');
        url.searchParams.set('client', 'firefox');
        url.searchParams.set('hl', 'vi');
        url.searchParams.set('gl', 'vn');
        url.searchParams.set('q', seed);
        const res = await fetchImpl(url.toString(), { signal: AbortSignal.timeout(6000) });
        if (!res.ok) return;
        const payload = await res.json();
        const suggestions = Array.isArray(payload?.[1]) ? payload[1] : [];
        for (const s of suggestions) {
          const query = String(s || '').trim();
          const norm = normalizeTextForMatch(query);
          if (!norm || seen.has(norm)) continue;
          seen.add(norm);
          results.push({ query, spike: '', source: 'google-suggest' });
        }
      } catch (_) {}
    })
  );
  return results;
}

export async function collectTrendTopicsWorker({
  publishedArticles = [],
  drafts = [],
  count = 1,
  customQueries = '',
  csvText = '',
  hourSeed = new Date().getUTCHours(),
  fetchImpl = fetch,
} = {}) {
  const rawItems = [];
  const usedSources = [];

  if (csvText) {
    const csvItems = parseGoogleTrendsCsv(csvText);
    rawItems.push(...csvItems);
    if (csvItems.length) usedSources.push(`google-trends-csv(${csvItems.length})`);
  }

  if (customQueries) {
    const manualItems = parseGoogleTrendsCsv(customQueries).map((x) => ({ ...x, source: 'manual-query' }));
    rawItems.push(...manualItems);
    if (manualItems.length) usedSources.push(`manual(${manualItems.length})`);
  }

  // Keep subrequests <= 7 (1 RSS + 6 Suggest) so Cloudflare Free 50-subrequest limit has huge headroom.
  const start = (hourSeed * 3) % DEFAULT_TREND_SEEDS.length;
  const rotatedSeeds = [];
  for (let i = 0; i < 6; i++) {
    rotatedSeeds.push(DEFAULT_TREND_SEEDS[(start + i) % DEFAULT_TREND_SEEDS.length]);
  }

  const [rssItems, suggestItems] = await Promise.all([
    fetchGoogleTrendsRssVn(fetchImpl),
    fetchGoogleSuggestVn(rotatedSeeds, fetchImpl),
  ]);

  if (rssItems.length) {
    rawItems.push(...rssItems);
    usedSources.push(`google-trends-rss(${rssItems.length})`);
  }
  if (suggestItems.length) {
    rawItems.push(...suggestItems);
    usedSources.push(`google-suggest(${suggestItems.length})`);
  }

  const picked = filterAndRankTrendTopics(rawItems, { publishedArticles, drafts, count });

  return {
    fetchedAt: new Date().toISOString(),
    sources: usedSources,
    rawCount: rawItems.length,
    topics: picked,
  };
}

function sanitizeForbiddenText(text) {
  let out = String(text || '');
  for (const re of FORBIDDEN_MARKETING_TERMS) {
    out = out.replace(new RegExp(re.source, 'gi'), 'quyền lợi học tập');
  }
  return out.trim();
}

export function normalizeArticle(raw, defaults = {}) {
  const category = CATEGORIES[raw?.category] ? raw.category : (CATEGORIES[defaults.category] ? defaults.category : 'meo-hoc');
  const existingSlugs = Array.isArray(defaults.existingSlugs) ? defaults.existingSlugs : [];
  const slug = slugifyVi(defaults.slug || raw?.suggestedSlug || raw?.title) || `bai-viet-hsk-${Date.now()}`;
  const today = defaults.today || new Date().toISOString().slice(0, 10);

  const rawSections = Array.isArray(raw?.sections) ? raw.sections : [];
  const sections = rawSections
    .map((s, idx) => {
      let cleanId = slugifyVi(s?.id || s?.heading || `muc-${idx + 1}`) || `muc-${idx + 1}`;
      if (!/^[a-z]/.test(cleanId)) {
        cleanId = `muc-${cleanId}`.slice(0, 72);
      }
      const clean = {
        id: cleanId,
        heading: sanitizeForbiddenText(s?.heading || `Phần ${idx + 1}`),
      };
      if (Array.isArray(s?.paragraphs) && s.paragraphs.length) {
        clean.paragraphs = s.paragraphs.map((p) => sanitizeForbiddenText(p)).filter(Boolean);
      }
      if (Array.isArray(s?.bullets) && s.bullets.length) {
        clean.bullets = s.bullets.map((b) => sanitizeForbiddenText(b)).filter(Boolean);
      }
      if (s?.table && Array.isArray(s.table.headers) && s.table.headers.length && Array.isArray(s.table.rows) && s.table.rows.length) {
        const headers = s.table.headers.map((h) => sanitizeForbiddenText(h)).filter(Boolean);
        const rows = s.table.rows
          .slice(0, 6)
          .map((r) => {
            const arr = Array.isArray(r) ? r.map((c) => sanitizeForbiddenText(c)) : [];
            while (arr.length < headers.length) arr.push('—');
            return arr.slice(0, headers.length);
          })
          .filter((r) => r.length > 0);
        if (headers.length && rows.length) {
          clean.table = { headers, rows };
        }
      }
      if (s?.example && s.example.han && String(s.example.han).trim()) {
        clean.example = {
          han: sanitizeForbiddenText(s.example.han),
          py: sanitizeForbiddenText(s.example.py || ''),
          vi: sanitizeForbiddenText(s.example.vi || ''),
        };
      }
      if (s?.tip && String(s.tip).trim()) {
        clean.tip = sanitizeForbiddenText(s.tip);
      }
      return clean;
    })
    .filter((s) => s.heading);

  const title = sanitizeForbiddenText(raw?.title || defaults.topic || 'Cẩm nang học tiếng Trung HSK');
  const metaTitle = sanitizeForbiddenText(raw?.metaTitle || `${title.slice(0, 52)} | HSK Flashcards`);
  const metaDescription = sanitizeForbiddenText(
    raw?.metaDescription || `${title} — Tổng hợp chi tiết cách dùng chuẩn, ví dụ Hán - Pinyin - Việt và lỗi thường gặp khi luyện thi HSK.`
  );
  const summary = sanitizeForbiddenText(raw?.summary || metaDescription);

  const article = {
    slug,
    category,
    categoryLabel: CATEGORIES[category],
    hskTag: sanitizeForbiddenText(raw?.hskTag || defaults.hskTag || 'HSK 1–6'),
    publishedAt: today,
    updatedAt: today,
    readMinutes: Math.max(3, Math.min(12, Number(raw?.readMinutes) || 6)),
    featured: false,
    ...(defaults.editorialVoice ? { editorialVoice: String(defaults.editorialVoice) } : {}),
    title,
    metaTitle,
    metaDescription,
    summary,
    keywords: Array.isArray(raw?.keywords) && raw.keywords.length
      ? raw.keywords.map((k) => sanitizeForbiddenText(k)).filter(Boolean).slice(0, 8)
      : [title, 'HSK Flashcards'],
    sources: Array.isArray(raw?.sources)
      ? raw.sources
          .filter((s) => s && typeof s.url === 'string' && /^https?:\/\//i.test(s.url) && s.label)
          .map((s) => ({ label: sanitizeForbiddenText(s.label), url: s.url.trim() }))
          .slice(0, 4)
      : [],
    sections,
    faqs: Array.isArray(raw?.faqs)
      ? raw.faqs
          .filter((f) => f && f.q && f.a)
          .map((f) => ({ q: sanitizeForbiddenText(f.q), a: sanitizeForbiddenText(f.a) }))
          .slice(0, 5)
      : [],
    relatedSlugs: Array.isArray(raw?.relatedSlugs)
      ? raw.relatedSlugs.filter((s) => existingSlugs.includes(s)).slice(0, 3)
      : existingSlugs.slice(0, 3),
    cta:
      raw?.cta && raw.cta.heading && raw.cta.buttonLabel
        ? {
            heading: sanitizeForbiddenText(raw.cta.heading),
            body: sanitizeForbiddenText(raw.cta.body || ''),
            buttonLabel: sanitizeForbiddenText(raw.cta.buttonLabel),
          }
        : {
            heading: 'Luyện thi HSK 1–6 và hỏi Gia sư AI miễn phí ngay hôm nay',
            body: 'Mở trực tiếp HSK Flashcards trên trình duyệt để ôn flashcard SRS, sửa câu tiếng Trung và luyện đề HSK miễn phí.',
            buttonLabel: 'Mở HSK Flashcards miễn phí',
          },
  };

  if (!article.relatedSlugs.length && existingSlugs.length) {
    article.relatedSlugs = existingSlugs.slice(0, 3);
  }
  validateArticle(article);
  return article;
}

export function validateArticle(article) {
  if (!article || typeof article !== 'object') throw new Error('Article must be an object');
  if (!/^[a-z0-9-]+$/.test(String(article.slug || ''))) throw new Error(`Invalid article slug "${article.slug}"`);
  if (!CATEGORIES[article.category]) throw new Error(`Invalid category "${article.category}"`);
  for (const field of ['title', 'metaTitle', 'metaDescription', 'summary', 'publishedAt']) {
    if (!String(article[field] || '').trim()) throw new Error(`Missing "${field}"`);
  }
  if (!Array.isArray(article.sections) || article.sections.length < 2) {
    throw new Error('Article must have at least 2 sections');
  }
  for (const sec of article.sections) {
    if (!/^[a-z][a-z0-9-]*$/.test(String(sec.id || ''))) {
      throw new Error(`Invalid section id "${sec.id}"`);
    }
  }
  const serialized = JSON.stringify(article);
  for (const re of FORBIDDEN_MARKETING_TERMS) {
    if (re.test(serialized)) throw new Error(`Article contains forbidden wording matching ${re}`);
  }
}

export function evaluateDraftQuality(article) {
  const checks = [];
  const warnings = [];
  let score = 0;

  try {
    validateArticle(article);
    checks.push('Cấu trúc JSON & kiểm tra từ khóa cấm đạt chuẩn.');
    score += 20;
  } catch (err) {
    warnings.push(`Lỗi kiểm định cấu trúc: ${err.message}`);
  }

  const metaTitleLen = String(article?.metaTitle || '').trim().length;
  if (metaTitleLen >= 35 && metaTitleLen <= 75) {
    checks.push(`Độ dài metaTitle chuẩn (${metaTitleLen} ký tự).`);
    score += 10;
  } else {
    warnings.push(`metaTitle (${metaTitleLen} ký tự) nên nằm trong khoảng 35–75 ký tự.`);
    if (metaTitleLen >= 20) score += 5;
  }

  const metaDescLen = String(article?.metaDescription || '').trim().length;
  if (metaDescLen >= 110 && metaDescLen <= 170) {
    checks.push(`Độ dài metaDescription chuẩn SEO (${metaDescLen} ký tự).`);
    score += 10;
  } else {
    warnings.push(`metaDescription (${metaDescLen} ký tự) nên dài 110–170 ký tự.`);
    if (metaDescLen >= 60) score += 5;
  }

  const sections = Array.isArray(article?.sections) ? article.sections : [];
  if (sections.length >= 3) {
    checks.push(`Đủ chiều sâu nội dung (${sections.length} phần).`);
    score += 15;
  } else {
    warnings.push(`Bài mới có ${sections.length} mục; nên có tối thiểu 3–4 mục rõ ràng.`);
    if (sections.length >= 2) score += 8;
  }

  const hasValidTable = sections.some(
    (s) => s?.table && Array.isArray(s.table.rows) && s.table.rows.length >= 2 && s.table.rows.length <= 6
  );
  if (hasValidTable) {
    checks.push('Có bảng so sánh/tổng hợp gọn <= 6 dòng.');
    score += 15;
  } else {
    warnings.push('Nên bổ sung ít nhất 1 bảng đối chiếu hoặc tổng hợp 3–6 dòng.');
  }

  const hasExample = sections.some((s) => s?.example?.han && s?.example?.py && s?.example?.vi);
  if (hasExample) {
    checks.push('Có ví dụ đầy đủ Chữ Hán + Pinyin + Nghĩa tiếng Việt.');
    score += 15;
  } else {
    warnings.push('Thiếu khối ví dụ 3 lớp (Chữ Hán + Pinyin + Nghĩa tiếng Việt).');
  }

  const hasTip = sections.some((s) => typeof s?.tip === 'string' && s.tip.trim().length > 10);
  if (hasTip) {
    checks.push('Có hộp Mẹo thực tế giúp người học dễ nhớ.');
    score += 5;
  } else {
    warnings.push('Nên thêm ít nhất 1 hộp tip ghi nhớ nhanh.');
  }

  const faqs = Array.isArray(article?.faqs) ? article.faqs : [];
  if (faqs.length >= 2) {
    checks.push(`Có ${faqs.length} câu hỏi FAQ chuẩn Schema.`);
    score += 10;
  } else {
    warnings.push('Nên có ít nhất 2 câu FAQ cuối bài.');
    if (faqs.length === 1) score += 5;
  }

  return { score: Math.min(100, score), checks, warnings };
}

export function buildTrendDraftPrompt({
  topic,
  slug,
  category,
  hskTag,
  trendQuery,
  trendSource,
  trendSpike,
  voice,
  existingSlugs = [],
  today,
}) {
  const voiceBlock = voice ? `\nPHONG CÁCH VIẾT: ${voice.label}\n${voice.instructions}\n` : '';
  return `Bạn là biên tập viên tiếng Trung HSK hàng đầu tại Việt Nam cho ứng dụng học miễn phí HSK Flashcards (https://hskfreelearningai.pages.dev).
Hãy viết MỘT BÀI SEO HOÀN CHỈNH BẰNG TIẾNG VIỆT, NỘI DUNG GỐC 100% dựa trên chủ đề đang được tìm kiếm nhiều tại Việt Nam.

THÔNG TIN CHỦ ĐỀ XU HƯỚNG:
- Truy vấn xu hướng: "${trendQuery || topic}" (Nguồn: ${trendSource || 'google-trends'}${trendSpike ? ` · Mức độ: ${trendSpike}` : ''})
- Chủ đề bài viết: "${topic}"
- Slug dự kiến: "${slug}"
- Chuyên mục: "${category}" (${CATEGORIES[category] || 'Mẹo học HSK'})
- Nhãn HSK gợi ý: "${hskTag || 'HSK 1–6'}"
- Ngày xuất bản: "${today}"
${voiceBlock}
NGUYÊN TẮC CHẤT LƯỢNG BẮT BUỘC:
1. Viết cho người Việt học tiếng Trung thực tế và luyện thi HSK 1–6: giải thích bản chất ngắn gọn, chỉ rõ lỗi người Việt hay mắc và cách sửa chuẩn bản xứ.
2. Mỗi ví dụ tiếng Trung PHẢI kèm đủ Chữ Hán giản thể + Pinyin có dấu thanh điệu chuẩn (ā á ǎ à, ē é ě è...) + nghĩa tiếng Việt tự nhiên.
3. Có 3–4 mục (sections), ít nhất 1 bảng so sánh/tổng hợp gồm 3–6 dòng (tối đa 6 dòng mỗi bảng), ít nhất 1 khối "example" (han, py, vi), ít nhất 1 "tip" và 2–3 "faqs".
4. Tuyệt đối không sao chép văn bản từ trang web khác và không dùng từ "hạn mức", "hạn ngạch", "xác minh email", "yêu cầu đăng nhập".
5. Các id của section phải bắt đầu bằng chữ cái (ví dụ: "muc-1", "muc-2", "muc-3").
6. Chọn 2–3 relatedSlugs phù hợp từ: ${existingSlugs.slice(0, 10).join(', ')}.

TRẢ VỀ DUY NHẤT MỘT JSON OBJECT HỢP LỆ (không markdown bọc ngoài):
{
  "title": "...",
  "metaTitle": "... | HSK Flashcards",
  "metaDescription": "...",
  "summary": "...",
  "hskTag": "${hskTag || 'HSK 1–6'}",
  "readMinutes": 6,
  "keywords": ["...", "...", "..."],
  "sections": [
    {
      "id": "muc-1",
      "heading": "...",
      "paragraphs": ["...", "..."],
      "bullets": ["..."],
      "table": { "headers": ["...", "...", "..."], "rows": [["...", "...", "..."]] },
      "example": { "han": "...", "py": "...", "vi": "..." },
      "tip": "..."
    }
  ],
  "faqs": [{ "q": "...", "a": "..." }],
  "relatedSlugs": [],
  "cta": { "heading": "...", "body": "...", "buttonLabel": "..." }
}`;
}

export function buildRewriteDraftPrompt({ draft, comment, rating, existingSlugs = [], today }) {
  const prevFeedback = (draft.reviewHistory || [])
    .slice(-4)
    .map((h, i) => `- Lần ${i + 1} (${h.at || ''}): ${h.rating ? `${h.rating}/5 sao — ` : ''}${h.comment || '(không ghi chú)'}`)
    .join('\n');

  return `Bạn là biên tập viên tiếng Trung HSK đang chỉnh sửa lại một bài viết SEO theo góp ý trực tiếp của Admin.

NHẬN XÉT MỚI NHẤT CỦA ADMIN (${rating ? `Đánh giá ${rating}/5 sao` : 'Yêu cầu viết lại'}):
"""
${comment || 'Nâng cấp độ sâu, ví dụ Hán – Pinyin – Việt và độ tự nhiên tiếng Việt.'}
"""
${prevFeedback ? `\nLỊCH SỬ GÓP Ý TRƯỚC ĐÓ:\n${prevFeedback}\n` : ''}
BẢN NHÁP HIỆN TẠI (version ${draft.version || 1}, chủ đề: "${draft.trendQuery || draft.article?.title}"):
${JSON.stringify(draft.article)}

YÊU CẦU:
1. Giải quyết triệt để mọi điểm Admin vừa góp ý.
2. Giữ JSON đầy đủ, Chữ Hán giản thể + Pinyin chuẩn thanh điệu + nghĩa tiếng Việt tự nhiên, mỗi bảng <= 6 dòng, đủ example, tip và 2–3 faqs.
3. Ngày cập nhật: "${today}". Không dùng từ cấm. Có thể chọn relatedSlugs từ: ${existingSlugs.slice(0, 10).join(', ')}.

TRẢ VỀ DUY NHẤT JSON OBJECT HỢP LỆ có thêm "revisionSummary".`;
}

async function runCfAiJson({ aiBinding, model, systemPrompt, userPrompt, maxTokens = 4096, temperature = 0.6 }) {
  if (!aiBinding || typeof aiBinding.run !== 'function') {
    throw new Error('Workers AI binding is missing');
  }
  const payload = {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
  };
  // Gemma 4 & Qwen 3.8 on Workers AI can spend the token budget in reasoning_content unless thinking is disabled.
  if (/(?:gemma-4|qwen3\.8)/i.test(String(model || ''))) {
    payload.chat_template_kwargs = { enable_thinking: false };
  }
  const result = await aiBinding.run(model, payload);
  const text = extractCfAiText(result);
  if (!text) {
    throw new Error(`Workers AI (${model}) returned empty response`);
  }
  return extractJsonObject(text);
}

async function runOpenRouterJson({ apiKey, model, systemPrompt, userPrompt, fetchImpl = fetch }) {
  const res = await fetchImpl(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://hskfreelearningai.pages.dev/',
      'X-Title': 'HSK Flashcards Cloudflare Editorial',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 2600,
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenRouter (${model}) HTTP ${res.status}: ${errText.slice(0, 180)}`);
  }
  const payload = await res.json();
  const content = payload?.choices?.[0]?.message?.content;
  const text = Array.isArray(content)
    ? content.map((p) => (typeof p === 'string' ? p : p?.text || '')).join('').trim()
    : String(content || '').trim();
  if (!text) throw new Error(`OpenRouter (${model}) returned empty content`);
  return extractJsonObject(text);
}

async function runXkiroJson({ apiKey, model, systemPrompt, userPrompt, fetchImpl = fetch }) {
  const res = await fetchImpl(XKIRO_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      max_tokens: 900,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`xKiro (${model}) HTTP ${res.status}: ${errText.slice(0, 180)}`);
  }
  const payload = await res.json();
  const text = String(payload?.choices?.[0]?.message?.content || '').trim();
  if (!text) throw new Error(`xKiro (${model}) returned empty content`);
  return extractJsonObject(text);
}

export async function callWriterJson({ prompt, env = {}, fetchImpl = fetch }) {
  const systemPrompt =
    'Bạn là biên tập viên SEO tiếng Việt cho HSK Flashcards. Xuất NGAY 01 JSON object hợp lệ gọn gàng, không suy nghĩ dài, không kèm giải thích hay markdown.';
  const cfModels = Array.from(
    new Set([
      env.CF_WRITER_MODEL || '@cf/google/gemma-4-26b-a4b-it',
      env.CF_WRITER_FALLBACK_MODEL || '@cf/qwen/qwen3.8-27b',
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    ].filter(Boolean))
  );

  let lastError;
  for (const model of cfModels) {
    try {
      const data = await runCfAiJson({
        aiBinding: env.AI,
        model,
        systemPrompt,
        userPrompt: prompt,
        maxTokens: 2400,
        temperature: 0.55,
      });
      return { data, provider: 'cloudflare-ai', model };
    } catch (err) {
      lastError = err;
    }
  }

  const orKey = String(env.OPENROUTER_API_KEY || '').trim();
  if (orKey) {
    const orModels = ['google/gemma-4-31b-it:free', 'baidu/ernie-5.5-flash-preview:free', 'nvidia/nemotron-3-ultra-550b-a55b:free'];
    for (const model of orModels) {
      try {
        const data = await runOpenRouterJson({
          apiKey: orKey,
          model,
          systemPrompt,
          userPrompt: prompt,
          fetchImpl,
        });
        return { data, provider: 'openrouter', model };
      } catch (err) {
        lastError = err;
      }
    }
  }

  throw lastError || new Error('All AI writer providers failed');
}

function normalizeReviewerResult(meta, raw, providerUsed, modelUsed) {
  const numScore = Number(raw?.score);
  const score = Number.isFinite(numScore) ? Math.max(0, Math.min(100, Math.round(numScore))) : 80;
  const mustFix = Array.isArray(raw?.mustFix) ? raw.mustFix.map((x) => String(x || '').trim()).filter(Boolean) : [];
  const issues = Array.isArray(raw?.issues) ? raw.issues.map((x) => String(x || '').trim()).filter(Boolean) : [];
  const strengths = Array.isArray(raw?.strengths) ? raw.strengths.map((x) => String(x || '').trim()).filter(Boolean) : [];
  const rawVerdict = String(raw?.verdict || '').toLowerCase();
  const verdict = rawVerdict === 'revise' || mustFix.length > 0 || score < 82 ? 'revise' : 'pass';

  return {
    id: meta.id,
    label: meta.label,
    model: `${providerUsed}:${modelUsed}`,
    role: meta.role,
    status: 'completed',
    score,
    verdict,
    summary: String(raw?.summary || '').trim() || (verdict === 'pass' ? 'Đạt chuẩn kiểm duyệt.' : 'Cần chỉnh sửa thêm.'),
    strengths,
    issues,
    mustFix,
    reviewedAt: new Date().toISOString(),
  };
}

export async function runReviewerCouncil({ article, trendQuery = '', env = {}, fetchImpl = fetch }) {
  const xkiroKey = String(env.XKIRO_API_KEY || env.SECONDARY_AI_API_KEY || '').trim();
  const cfReviewer1 = env.CF_REVIEWER_1_MODEL || '@cf/qwen/qwen3.8-27b';
  const cfReviewer2 = env.CF_REVIEWER_2_MODEL || '@cf/mistralai/mistral-small-3.1-24b-instruct';

  const specs = [
    {
      id: 'command-a-plus',
      label: xkiroKey ? 'Command A+ / Qwen 3.8' : 'Qwen 3.8 (Workers AI)',
      role: 'Chuyên gia Ngữ pháp & Pinyin HSK',
      focus:
        'Kiểm tra độ chính xác của chữ Hán giản thể, dấu thanh điệu Pinyin (ā á ǎ à...), giải thích ngữ pháp HSK và lỗi dịch máy ở người Việt.',
      xkiroModels: xkiroKey ? [env.XKIRO_REVIEW_MODEL_1 || 'cohere/command-a-plus'] : [],
      cfModels: [cfReviewer1, '@cf/meta/llama-3.3-70b-instruct-fp8-fast'],
    },
    {
      id: 'mistral-large-3',
      label: xkiroKey ? 'Mistral / DeepSeek Review' : 'Mistral Small 3.1 (Workers AI)',
      role: 'Biên tập viên SEO & Độ tự nhiên tiếng Việt',
      focus:
        'Kiểm tra metaTitle 35–75 ký tự, metaDescription 110–170 ký tự, tiếng Việt tự nhiên, mỗi bảng <= 6 dòng, đủ ví dụ 3 lớp và FAQ.',
      xkiroModels: xkiroKey
        ? [env.XKIRO_REVIEW_MODEL_2 || 'mistralai/mistral-large-2512', env.XKIRO_REVIEW_MODEL_2_FALLBACK || 'deepseek/deepseek-v4.1-flash']
        : [],
      cfModels: [cfReviewer2],
    },
  ];

  const results = await Promise.all(
    specs.map(async (spec) => {
      const systemPrompt = `Bạn là "${spec.role}" trong hội đồng kiểm duyệt bài SEO tiếng Trung HSK cho người Việt trước khi gửi tới Admin duyệt cuối.
Chuyên môn trọng tâm: ${spec.focus}
Xuất NGAY 01 JSON object hợp lệ ngắn gọn (không markdown):
{
  "score": 88,
  "verdict": "pass",
  "summary": "Nhận xét tổng quan 1-2 câu bằng tiếng Việt",
  "strengths": ["Điểm mạnh 1"],
  "issues": ["Gợi ý nhỏ nếu có"],
  "mustFix": []
}`;
      const userPrompt = `Kiểm duyệt bài viết SEO tiếng Trung sau (từ khóa: "${trendQuery || article?.title || ''}"):

${JSON.stringify(article)}

Quy tắc chấm điểm:
- score >= 82 và verdict = "pass" nếu chữ Hán/Pinyin/ngữ pháp chuẩn, tiếng Việt tự nhiên, bảng <= 6 dòng, đủ ví dụ & FAQ.
- verdict = "revise" nếu có lỗi sai Pinyin/nghĩa hoặc thiếu ví dụ/bảng.`;

      let reviewed = null;
      let lastErr = null;

      for (const m of spec.xkiroModels) {
        try {
          const raw = await runXkiroJson({ apiKey: xkiroKey, model: m, systemPrompt, userPrompt, fetchImpl });
          reviewed = normalizeReviewerResult(spec, raw, 'xkiro', m);
          break;
        } catch (err) {
          lastErr = err;
        }
      }

      if (!reviewed) {
        for (const m of spec.cfModels) {
          try {
            const raw = await runCfAiJson({
              aiBinding: env.AI,
              model: m,
              systemPrompt,
              userPrompt,
              maxTokens: 750,
              temperature: 0.2,
            });
            reviewed = normalizeReviewerResult(spec, raw, 'cf-ai', m);
            break;
          } catch (err) {
            lastErr = err;
          }
        }
      }

      if (!reviewed) {
        reviewed = {
          id: spec.id,
          label: spec.label,
          model: spec.cfModels[0],
          role: spec.role,
          status: 'error',
          score: null,
          verdict: 'error',
          summary: `Chưa gọi được lớp kiểm duyệt: ${lastErr?.message || 'unknown error'}`,
          strengths: [],
          issues: [],
          mustFix: [],
          reviewedAt: new Date().toISOString(),
        };
      }

      return reviewed;
    })
  );

  const scored = results.filter((r) => typeof r.score === 'number');
  const averageScore = scored.length ? Math.round(scored.reduce((a, b) => a + b.score, 0) / scored.length) : null;
  const needsAutoPolish = results.some(
    (r) => r.status === 'completed' && ((Array.isArray(r.mustFix) && r.mustFix.length > 0) || r.score < 78)
  );
  const combinedFeedback = results
    .filter((r) => r.status === 'completed')
    .map((r) => {
      const items = [...r.mustFix.map((x) => `[Bắt buộc sửa] ${x}`), ...r.issues];
      return `### ${r.label} (${r.model} · ${r.score}/100 · ${r.verdict})\nTóm tắt: ${r.summary}\n${items.map((x) => `- ${x}`).join('\n')}`;
    })
    .join('\n\n');

  return {
    status: scored.length === specs.length ? 'completed' : scored.length > 0 ? 'partial' : 'error',
    provider: xkiroKey ? 'xkiro+cf' : 'cloudflare-ai',
    pipeline: ['gemma-4', specs[0].id, specs[1].id, 'admin'],
    averageScore,
    needsAutoPolish,
    autoPolished: false,
    polishSummary: '',
    combinedFeedback,
    reviewedAt: new Date().toISOString(),
    reviewers: results,
  };
}

export async function generateDraftForTopic({
  picked,
  existingSlugs = [],
  today,
  env = {},
  fetchImpl = fetch,
}) {
  const voice = pickEditorialVoice(picked.slug);
  const prompt = buildTrendDraftPrompt({
    topic: picked.topic,
    slug: picked.slug,
    category: picked.category,
    hskTag: picked.hskTag,
    trendQuery: picked.query,
    trendSource: picked.source,
    trendSpike: picked.spike,
    voice,
    existingSlugs,
    today,
  });

  const written = await callWriterJson({ prompt, env, fetchImpl });
  let article = normalizeArticle(written.data, {
    slug: picked.slug,
    topic: picked.topic,
    category: picked.category,
    hskTag: picked.hskTag,
    today,
    existingSlugs,
    editorialVoice: voice.id,
  });

  const aiReviews = await runReviewerCouncil({ article, trendQuery: picked.query, env, fetchImpl });
  if (aiReviews.needsAutoPolish) {
    try {
      const polishPrompt = `Bạn là biên tập viên chính (Gemma 4). Hội đồng kiểm duyệt vừa rà soát bài viết và nêu điểm cần sửa:
${aiReviews.combinedFeedback}

BẢN THẢO HIỆN TẠI:
${JSON.stringify(article)}

Hãy sửa triệt để mọi mục [Bắt buộc sửa], giữ chữ Hán + Pinyin chuẩn thanh điệu + nghĩa tiếng Việt, mỗi bảng <= 6 dòng, đủ example, tip và 2–3 faqs. Trả về DUY NHẤT JSON object bài viết kèm "polishSummary".`;
      const polished = await callWriterJson({ prompt: polishPrompt, env, fetchImpl });
      article = normalizeArticle(polished.data, {
        slug: article.slug,
        topic: picked.topic,
        category: article.category,
        hskTag: article.hskTag,
        today,
        existingSlugs,
        editorialVoice: voice.id,
      });
      aiReviews.autoPolished = true;
      aiReviews.polishSummary = String(
        polished.data?.polishSummary || 'Gemma 4 đã tự chỉnh sửa theo góp ý của 2 lớp kiểm duyệt.'
      ).trim();
    } catch (err) {
      aiReviews.polishSummary = `Chưa tự chỉnh sửa được (${err.message}); giữ bản đã rà soát.`;
    }
  }

  const nowIso = new Date().toISOString();
  const stamp = nowIso.replace(/[-:TZ.]/g, '').slice(0, 14);
  const draftId = `draft-${stamp}-${article.slug.slice(0, 36)}`;
  const reviewHistory = [
    {
      action: 'generated',
      rating: null,
      comment: `Sinh trên Cloudflare (${written.model}) từ ${picked.source}${picked.spike ? ` (${picked.spike})` : ''}`,
      at: nowIso,
    },
  ];
  if (aiReviews.status !== 'skipped') {
    reviewHistory.push({
      action: 'ai_reviewed',
      rating: null,
      comment: aiReviews.reviewers.map((r) => `${r.label}: ${r.score ?? 'err'}`).join(' · '),
      revisionSummary: aiReviews.autoPolished ? aiReviews.polishSummary : '',
      at: new Date().toISOString(),
    });
  }

  return {
    id: draftId,
    status: 'pending_review',
    version: 1,
    createdAt: nowIso,
    updatedAt: nowIso,
    trendQuery: picked.query,
    trendSource: picked.source,
    trendSpike: picked.spike || '',
    category: article.category,
    hskTag: article.hskTag,
    editorialVoice: voice.id,
    aiReviews,
    quality: evaluateDraftQuality(article),
    rating: null,
    reviewHistory,
    article,
    publishedSlug: '',
    approvedAt: '',
  };
}

export async function rewriteDraftRecord({
  draft,
  comment = '',
  rating = null,
  existingSlugs = [],
  today,
  env = {},
  fetchImpl = fetch,
}) {
  const prompt = buildRewriteDraftPrompt({ draft, comment, rating, existingSlugs, today });
  const rewritten = await callWriterJson({ prompt, env, fetchImpl });
  let updatedArticle = normalizeArticle(rewritten.data, {
    slug: draft.article?.slug || slugifyVi(draft.trendQuery),
    topic: draft.article?.title || draft.trendQuery,
    category: draft.category || draft.article?.category || 'meo-hoc',
    hskTag: draft.hskTag || draft.article?.hskTag || 'HSK 1–6',
    today,
    existingSlugs,
    editorialVoice: draft.editorialVoice || '',
  });

  const aiReviews = await runReviewerCouncil({
    article: updatedArticle,
    trendQuery: draft.trendQuery || updatedArticle.title,
    env,
    fetchImpl,
  });

  if (aiReviews.needsAutoPolish) {
    try {
      const polishPrompt = `Hãy hoàn thiện bản viết lại dựa trên góp ý kiểm duyệt:\n${aiReviews.combinedFeedback}\n\n${JSON.stringify(updatedArticle)}\nTrả về JSON object bài viết kèm "polishSummary".`;
      const polished = await callWriterJson({ prompt: polishPrompt, env, fetchImpl });
      updatedArticle = normalizeArticle(polished.data, {
        slug: updatedArticle.slug,
        topic: updatedArticle.title,
        category: updatedArticle.category,
        hskTag: updatedArticle.hskTag,
        today,
        existingSlugs,
        editorialVoice: draft.editorialVoice || '',
      });
      aiReviews.autoPolished = true;
      aiReviews.polishSummary = String(polished.data?.polishSummary || 'Đã tự hoàn thiện sau kiểm duyệt.').trim();
    } catch (_) {}
  }

  const nowIso = new Date().toISOString();
  const numericRating = rating ? Math.max(1, Math.min(5, Math.round(Number(rating)))) : draft.rating || null;
  draft.article = updatedArticle;
  draft.version = (draft.version || 1) + 1;
  draft.status = 'pending_review';
  draft.updatedAt = nowIso;
  draft.rating = numericRating;
  draft.aiReviews = aiReviews;
  draft.quality = evaluateDraftQuality(updatedArticle);
  draft.reviewHistory = Array.isArray(draft.reviewHistory) ? draft.reviewHistory : [];
  draft.reviewHistory.push({
    action: 'rewrite_requested',
    rating: numericRating,
    comment: String(comment || '').trim() || 'Yêu cầu viết lại',
    revisionSummary: String(rewritten.data?.revisionSummary || `Đã viết lại bởi ${rewritten.model}`).trim(),
    at: nowIso,
  });
  return draft;
}
