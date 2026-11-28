/**
 * Web-Standard ESM Core for Cloudflare Worker `hsk-seo-editorial` (ChatGPT-only Gateway).
 * Contains deterministic Google Trends topic discovery, duplicate detection,
 * Vietnamese SEO validation, and technical quality scoring.
 */

export const CATEGORIES = Object.freeze({
  'ky-thi': 'Kỳ thi & Đăng ký',
  'diem-so': 'Điểm số & Tra điểm',
  'meo-hoc': 'Mẹo học HSK',
  'ngu-phap': 'Phân biệt & Ngữ pháp',
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
const LOCAL_CENTER_NOISE_RE = /(?:cần\s*thơ|sóc\s*trăng|cà\s*mau|bạc\s*liêu|kiên\s*giang|an\s*giang|tiền\s*giang|long\s*an|bến\s*tre|trà\s*vinh|vĩnh\s*long|hậu\s*giang|đồng\s*tháp|bình\s*dương|đồng\s*nai|vũng\s*tàu|khánh\s*hòa|nha\s*trang|đà\s*lạt|huế|đà\s*nẵng|hải\s*phòng|bắc\s*ninh|bắc\s*giang|nghệ\s*an|thanh\s*hóa|thái\s*nguyên|tphcm|tp\s*hcm|sài\s*gòn|quận\s*\d+|gò\s*vấp|thủ\s*đức|bình\s*thạnh|tân\s*bình|học\s*phí\s*trung\s*tâm|trung\s*tâm\s*nào\s*tốt|ở\s*đâu\s*tốt)/i;
const OFFICIAL_EXAM_QUERY_RE = /(?:lịch\s*thi|địa\s*điểm\s*thi|đăng\s*ký\s*thi|điểm\s*thi|hsk\s*3\.0)/i;

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
  if (LOCAL_CENTER_NOISE_RE.test(q) && !OFFICIAL_EXAM_QUERY_RE.test(q)) return false;
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
  if (item.source === 'google-trends-csv') score += 45;
  else if (item.source === 'google-trends' || item.source === 'google-trends-rss') score += 34;
  else if (item.source === 'google-news-vn') score += 26;
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

export function buildExistingCorpus(publishedArticles = [], drafts = []) {
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

export function isDuplicateTopic(query, explicitSlug, corpus) {
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

async function fetchGoogleNewsVn(queries, fetchImpl = fetch) {
  const results = [];
  const seen = new Set();
  await Promise.all(
    queries.map(async (q) => {
      try {
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=vi&gl=VN&ceid=VN:vi`;
        const res = await fetchImpl(url, {
          headers: { 'Accept-Language': 'vi-VN,vi;q=0.9' },
          signal: AbortSignal.timeout(7000),
        });
        if (!res.ok) return;
        const xml = await res.text();
        let added = 0;
        for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
          if (added >= 6) break;
          const block = m[1];
          const titleMatch = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/i.exec(block);
          const rawTitle = String(titleMatch?.[1] || titleMatch?.[2] || '')
            .replace(/\s+-\s+[^-]+$/, '')
            .trim();
          if (!rawTitle || !RELEVANT_RSS_RE.test(rawTitle)) continue;
          const norm = normalizeTextForMatch(rawTitle);
          if (!norm || seen.has(norm)) continue;
          seen.add(norm);
          results.push({
            query: rawTitle.slice(0, 100),
            spike: 'Google News VN',
            source: 'google-news-vn',
          });
          added++;
        }
      } catch (_) {}
    })
  );
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

  // Keep subrequests <= 9 (1 Trends RSS + 2 Google News VN + 6 Suggest) within Cloudflare Free limit.
  const start = (hourSeed * 3) % DEFAULT_TREND_SEEDS.length;
  const rotatedSeeds = [];
  for (let i = 0; i < 6; i++) {
    rotatedSeeds.push(DEFAULT_TREND_SEEDS[(start + i) % DEFAULT_TREND_SEEDS.length]);
  }
  const newsQueries = ['thi HSK tiếng Trung', 'học tiếng Trung'];

  const [rssItems, newsItems, suggestItems] = await Promise.all([
    fetchGoogleTrendsRssVn(fetchImpl),
    fetchGoogleNewsVn(newsQueries, fetchImpl),
    fetchGoogleSuggestVn(rotatedSeeds, fetchImpl),
  ]);

  if (rssItems.length) {
    rawItems.push(...rssItems);
    usedSources.push(`google-trends-rss(${rssItems.length})`);
  }
  if (newsItems.length) {
    rawItems.push(...newsItems);
    usedSources.push(`google-news-vn(${newsItems.length})`);
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
  let out = String(text || '').replace(/«[ \t]*([^«»\r\n]+?)[ \t]*»/g, '“$1”');
  for (const re of FORBIDDEN_MARKETING_TERMS) {
    out = out.replace(new RegExp(re.source, 'gi'), 'quyền lợi học tập');
  }
  return out.trim();
}

function stringifyContentItem(item) {
  if (item == null) return '';
  if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
    const text = sanitizeForbiddenText(String(item)).trim();
    return /^\[object\s+object\]$/i.test(text) ? '' : text;
  }
  if (Array.isArray(item)) {
    return item.map((el) => stringifyContentItem(el)).filter(Boolean).join(' — ');
  }
  if (typeof item === 'object') {
    if (typeof item.han === 'string' && item.han.trim()) {
      const han = sanitizeForbiddenText(item.han);
      const py = item.py ? sanitizeForbiddenText(item.py) : '';
      const vi = item.vi ? sanitizeForbiddenText(item.vi) : '';
      return `${han}${py ? ` (${py})` : ''}${vi ? `: ${vi}` : ''}`.trim();
    }
    const head = item.label || item.title || item.heading || item.term || item.name || item.key || '';
    const body = item.text || item.content || item.description || item.detail || item.value || item.meaning || '';
    if (head && body) {
      return `${sanitizeForbiddenText(head)}: ${sanitizeForbiddenText(body)}`.trim();
    }
    return Object.values(item).map((v) => stringifyContentItem(v)).filter(Boolean).join(' — ');
  }
  return '';
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
        clean.paragraphs = s.paragraphs.map((p) => stringifyContentItem(p)).filter(Boolean);
      }
      if (Array.isArray(s?.bullets) && s.bullets.length) {
        clean.bullets = s.bullets.map((b) => stringifyContentItem(b)).filter(Boolean);
      }
      if (s?.table && Array.isArray(s.table.headers) && s.table.headers.length && Array.isArray(s.table.rows) && s.table.rows.length) {
        const headers = s.table.headers.map((h) => stringifyContentItem(h)).filter(Boolean);
        const rows = s.table.rows
          .map((r) => {
            const arr = Array.isArray(r) ? r.map((c) => stringifyContentItem(c)) : [];
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
  if (!Array.isArray(article.sections) || article.sections.length === 0) {
    throw new Error('Article must have at least 1 section');
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

export function evaluateDraftQuality(article, validate = validateArticle) {
  const checks = [];
  const warnings = [];
  let score = 0;

  try {
    validate(article);
    checks.push('Cấu trúc JSON & kiểm tra từ khóa cấm đạt chuẩn.');
    score += 50;
  } catch (err) {
    warnings.push(`Lỗi kiểm định cấu trúc: ${err.message}`);
  }

  const metaTitleLen = String(article?.metaTitle || '').trim().length;
  if (metaTitleLen >= 35 && metaTitleLen <= 75) {
    checks.push(`Độ dài metaTitle chuẩn (${metaTitleLen} ký tự).`);
    score += 25;
  } else {
    warnings.push(`metaTitle (${metaTitleLen} ký tự) nên nằm trong khoảng 35–75 ký tự.`);
    if (metaTitleLen >= 20) score += 12;
  }

  const metaDescLen = String(article?.metaDescription || '').trim().length;
  if (metaDescLen >= 110 && metaDescLen <= 170) {
    checks.push(`Độ dài metaDescription chuẩn SEO (${metaDescLen} ký tự).`);
    score += 25;
  } else {
    warnings.push(`metaDescription (${metaDescLen} ký tự) nên dài 110–170 ký tự.`);
    if (metaDescLen >= 60) score += 12;
  }

  return { score: Math.min(100, score), checks, warnings };
}
