/**
 * Web-Standard ESM Core for Cloudflare Worker `hsk-seo-editorial`.
 * Enforces strict role separation between:
 * - Writer AI (`SEO-WRITER-01` via `./writer-standard.mjs`)
 * - Independent Two-Round Auditor AI (`SEO-AUDITOR-01` via `./audit-protocol.mjs`)
 */
import {
  WRITER_STANDARD_ID,
  WRITER_SYSTEM_PROMPT,
  buildStandardRevisionWriterPrompt,
  buildStandardTrendWriterPrompt,
  selectWriterStyle,
} from './writer-standard.mjs';
import {
  AUDIT_PROTOCOL_ID,
  AUDITOR_SYSTEM_PROMPT,
  buildAuditorPrompt,
  computeAuditScoreAndVerdict,
  sanitizeAuditFeedbackForWriter,
} from './audit-protocol.mjs';

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

export function buildTrendDraftPrompt(opts) {
  return buildStandardTrendWriterPrompt(opts);
}

export function buildRewriteDraftPrompt(opts) {
  return buildStandardRevisionWriterPrompt({
    ...opts,
    adminComment: opts?.adminComment ?? opts?.comment ?? '',
  });
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
  let timerId = null;
  const timeoutMs = 35000;
  let result;
  try {
    result = await Promise.race([
      aiBinding.run(model, payload),
      new Promise((_, reject) => {
        timerId = setTimeout(() => reject(new Error(`Workers AI (${model}) timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timerId) clearTimeout(timerId);
  }
  const text = extractCfAiText(result);
  if (!text) {
    throw new Error(`Workers AI (${model}) returned empty response`);
  }
  return extractJsonObject(text);
}

async function runOpenRouterJson({
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  fetchImpl = fetch,
  maxTokens = 4000,
  temperature = 0.55,
}) {
  const sendRequest = async (includeReasoning) => {
    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    };
    if (includeReasoning) {
      body.reasoning = { enabled: false };
    }
    return fetchImpl(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://hskfreelearningai.pages.dev/',
        'X-Title': 'HSK Flashcards Cloudflare Editorial',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(22000),
    });
  };

  let res = await sendRequest(true);
  if (res.status === 400) {
    // Some OpenRouter free models reject `reasoning`; retry once without it.
    res = await sendRequest(false);
  }
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

async function runXkiroJson({ apiKey, model, systemPrompt, userPrompt, fetchImpl = fetch, maxTokens = 1400 }) {
  const res = await fetchImpl(XKIRO_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(35000),
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
  const systemPrompt = WRITER_SYSTEM_PROMPT;
  let lastError;

  // Priority 1 (0 Cloudflare Neurons): OpenRouter Free models when OPENROUTER_API_KEY is configured.
  const orKey = String(env.OPENROUTER_API_KEY || '').trim();
  if (orKey) {
    const orModels = Array.from(
      new Set([
        env.OPENROUTER_WRITER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
        'nvidia/nemotron-3.5-lightning:free',
        'nvidia/nemotron-3.5-super-vl:free',
        'google/gemma-4-26b-a4b-it:free',
        'baidu/ernie-5.5-flash-preview:free',
      ].filter(Boolean))
    );
    for (const model of orModels) {
      try {
        const data = await runOpenRouterJson({
          apiKey: orKey,
          model,
          systemPrompt,
          userPrompt: prompt,
          fetchImpl,
          maxTokens: 4000,
          temperature: 0.55,
        });
        return { data, provider: 'openrouter', model };
      } catch (err) {
        lastError = err;
      }
    }
  }

  // Priority 2 (fallback only): Cloudflare Workers AI.
  const cfModels = Array.from(
    new Set([
      env.CF_WRITER_MODEL || '@cf/google/gemma-4-26b-a4b-it',
      env.CF_WRITER_FALLBACK_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      '@cf/qwen/qwen3.8-27b',
    ].filter(Boolean))
  );

  for (const model of cfModels) {
    try {
      const data = await runCfAiJson({
        aiBinding: env.AI,
        model,
        systemPrompt,
        userPrompt: prompt,
        maxTokens: 4000,
        temperature: 0.55,
      });
      return { data, provider: 'cloudflare-ai', model };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All AI writer providers failed');
}

export async function runAuditRound({
  round = 1,
  article,
  writerBrief = null,
  trendQuery = '',
  category = '',
  env = {},
  fetchImpl = fetch,
}) {
  const effectiveRound = Number(round) === 2 ? 2 : 1;
  const xkiroKey = String(env.XKIRO_API_KEY || env.SECONDARY_AI_API_KEY || '').trim();
  const orKey = String(env.OPENROUTER_API_KEY || '').trim();
  const cfReviewer1 = env.CF_REVIEWER_1_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
  const cfReviewer2 = env.CF_REVIEWER_2_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

  const spec =
    effectiveRound === 1
      ? {
          id: 'command-a-plus',
          label: xkiroKey ? 'Command A+ (Vòng 1)' : orKey ? 'OpenRouter (Vòng 1)' : 'Llama 3.3 70B (Vòng 1)',
          role: 'Kiểm duyệt sơ bộ · Search Intent & Ngôn ngữ HSK',
          xkiroModels: xkiroKey ? [env.XKIRO_REVIEW_MODEL_1 || 'cohere/command-a-plus'] : [],
          orModels: orKey
            ? Array.from(
                new Set([
                  env.OPENROUTER_REVIEW_MODEL_1 || 'nvidia/nemotron-3.5-lightning:free',
                  'nvidia/nemotron-3.5-lightning:free',
                  'nvidia/nemotron-3.5-super-vl:free',
                  'google/gemma-4-26b-a4b-it:free',
                  'baidu/ernie-5.5-flash-preview:free',
                ].filter(Boolean))
              )
            : [],
          cfModels: [cfReviewer1, '@cf/aisingapore/gemma-sea-lion-v4-27b-it'],
        }
      : {
          id: 'mistral-large-3',
          label: xkiroKey ? 'Mistral / DeepSeek (Vòng 2)' : orKey ? 'OpenRouter Độc lập (Vòng 2)' : 'Llama 3.3 70B Độc lập (Vòng 2)',
          role: 'Kiểm duyệt độc lập · Thang điểm 100 & Phê duyệt',
          xkiroModels: xkiroKey
            ? [env.XKIRO_REVIEW_MODEL_2 || 'mistralai/mistral-large-2512', env.XKIRO_REVIEW_MODEL_2_FALLBACK || 'deepseek/deepseek-v4.1-flash']
            : [],
          orModels: orKey
            ? Array.from(
                new Set([
                  env.OPENROUTER_REVIEW_MODEL_2 || 'nvidia/nemotron-3.5-lightning:free',
                  'nvidia/nemotron-3.5-lightning:free',
                  'nvidia/nemotron-3.5-super-vl:free',
                  'google/gemma-4-26b-a4b-it:free',
                  'baidu/ernie-5.5-flash-preview:free',
                ].filter(Boolean))
              )
            : [],
          cfModels: [cfReviewer2, '@cf/aisingapore/gemma-sea-lion-v4-27b-it'],
        };

  const userPrompt = buildAuditorPrompt({
    round: effectiveRound,
    reviewerLabel: spec.label,
    reviewerRole: spec.role,
    article,
    writerBrief,
    trendQuery,
    category: category || article?.category || 'meo-hoc',
  });

  let rawReport = null;
  let providerUsed = '';
  let modelUsed = spec.orModels[0] || spec.cfModels[0];
  let lastErr = null;

  // Priority 1: xKiro (0 CF Neurons)
  for (const m of spec.xkiroModels) {
    try {
      rawReport = await runXkiroJson({
        apiKey: xkiroKey,
        model: m,
        systemPrompt: AUDITOR_SYSTEM_PROMPT,
        userPrompt,
        fetchImpl,
        maxTokens: 1400,
      });
      providerUsed = 'xkiro';
      modelUsed = m;
      break;
    } catch (err) {
      lastErr = err;
    }
  }

  // Priority 2: OpenRouter Free (0 CF Neurons)
  if (!rawReport) {
    for (const m of spec.orModels) {
      try {
        rawReport = await runOpenRouterJson({
          apiKey: orKey,
          model: m,
          systemPrompt: AUDITOR_SYSTEM_PROMPT,
          userPrompt,
          fetchImpl,
          maxTokens: 2400,
          temperature: 0.2,
        });
        providerUsed = 'openrouter';
        modelUsed = m;
        break;
      } catch (err) {
        lastErr = err;
      }
    }
  }

  // Priority 3: Cloudflare Workers AI fallback
  if (!rawReport) {
    for (const m of spec.cfModels) {
      try {
        rawReport = await runCfAiJson({
          aiBinding: env.AI,
          model: m,
          systemPrompt: AUDITOR_SYSTEM_PROMPT,
          userPrompt,
          maxTokens: 1100,
          temperature: 0.2,
        });
        providerUsed = 'cf-ai';
        modelUsed = m;
        break;
      } catch (err) {
        lastErr = err;
      }
    }
  }

  const finalLabel =
    providerUsed === 'xkiro'
      ? (effectiveRound === 1 ? 'Command A+ (Vòng 1)' : 'Mistral / DeepSeek (Vòng 2)')
      : providerUsed === 'openrouter'
        ? (effectiveRound === 1 ? 'OpenRouter (Vòng 1)' : 'OpenRouter Độc lập (Vòng 2)')
        : providerUsed === 'cf-ai'
          ? (effectiveRound === 1 ? 'Llama 3.3 70B (Vòng 1)' : 'Llama 3.3 70B Độc lập (Vòng 2)')
          : spec.label;

  if (!rawReport) {
    return {
      id: spec.id,
      round: effectiveRound,
      protocol: AUDIT_PROTOCOL_ID,
      label: finalLabel,
      model: modelUsed,
      role: spec.role,
      status: 'error',
      score: null,
      rawTotal: null,
      band: 'Error',
      auditVerdict: 'ERROR',
      verdict: 'error',
      categoryBreakdown: null,
      below60Categories: [],
      hardFails: [],
      appliedCaps: [],
      unverifiedCriticalClaims: [],
      challengeResults: [],
      errors: [],
      strengths: [],
      issues: [],
      mustFix: [],
      summary: `Chưa gọi được lớp kiểm duyệt Vòng ${effectiveRound}: ${lastErr?.message || 'unknown error'}`,
      reviewedAt: new Date().toISOString(),
    };
  }

  const computed = computeAuditScoreAndVerdict(rawReport, { round: effectiveRound });
  return {
    id: spec.id,
    label: finalLabel,
    model: `${providerUsed}:${modelUsed}`,
    role: spec.role,
    status: 'completed',
    ...computed,
    reviewedAt: new Date().toISOString(),
  };
}

export async function runTwoRoundEditorialPipeline({
  initialArticle,
  writerBrief = null,
  authorSource = 'writer-seo-01',
  trendQuery = '',
  category = 'meo-hoc',
  hskTag = 'HSK 1–6',
  styleId = '',
  today,
  existingSlugs = [],
  env = {},
  fetchImpl = fetch,
}) {
  let currentArticle = initialArticle;
  let currentBrief = writerBrief;
  const xkiroKey = String(env.XKIRO_API_KEY || env.SECONDARY_AI_API_KEY || '').trim();

  // Vòng 1 — Kiểm duyệt sơ bộ (SEO-AUDITOR-01; tối đa PROVISIONAL_PASS)
  const tR1 = Date.now();
  const round1 = await runAuditRound({
    round: 1,
    article: currentArticle,
    writerBrief: currentBrief,
    trendQuery,
    category,
    env,
    fetchImpl,
  });
  const round1Ms = Date.now() - tR1;

  // Vòng sửa của Người viết (SEO-WRITER-01) chỉ nhận phản hồi đã lọc qua tường lửa
  let autoPolished = false;
  let polishSummary = '';
  let revisionMs = 0;
  const hasTerminalReject = (round1.hardFails || []).some((hf) => hf.code === 'HF-01' || hf.code === 'HF-02');
  const usesInternalWriter = authorSource === 'writer-seo-01';
  const shouldRevise =
    usesInternalWriter &&
    round1.status === 'completed' &&
    !hasTerminalReject &&
    (round1.auditVerdict === 'REVISION_REQUIRED' ||
      (Array.isArray(round1.mustFix) && round1.mustFix.length > 0));

  if (shouldRevise) {
    const sanitizedFeedback = sanitizeAuditFeedbackForWriter(round1);
    if (sanitizedFeedback) {
      const tRev = Date.now();
      try {
        const revisionPrompt = buildStandardRevisionWriterPrompt({
          draft: {
            version: 1,
            trendQuery,
            category: currentArticle.category,
            editorialVoice: styleId || currentArticle.editorialVoice || '',
            writerBrief: currentBrief,
            article: currentArticle,
          },
          sanitizedFeedback,
          adminComment: '',
          rating: null,
          existingSlugs,
          today,
        });
        const revised = await callWriterJson({ prompt: revisionPrompt, env, fetchImpl });
        currentArticle = normalizeArticle(revised.data, {
          slug: currentArticle.slug,
          topic: currentArticle.title,
          category: currentArticle.category || category,
          hskTag: currentArticle.hskTag || hskTag,
          today,
          existingSlugs,
          editorialVoice: styleId || currentArticle.editorialVoice || '',
        });
        if (revised.data?.writerBrief && typeof revised.data.writerBrief === 'object') {
          currentBrief = revised.data.writerBrief;
        }
        autoPolished = true;
        polishSummary = String(
          revised.data?.revisionSummary || `Đã chỉnh sửa theo ${round1.errors?.length || round1.mustFix?.length || 0} lỗi Vòng 1.`
        ).trim();
      } catch (err) {
        polishSummary = `Chưa tự chỉnh sửa được sau Vòng 1 (${err.message}); giữ bản gốc để Vòng 2 đánh giá.`;
      } finally {
        revisionMs = Date.now() - tRev;
      }
    }
  }

  // Vòng 2 — Kiểm duyệt độc lập lại từ đầu với bộ thử thách khác
  const tR2 = Date.now();
  const round2 = await runAuditRound({
    round: 2,
    article: currentArticle,
    writerBrief: currentBrief,
    trendQuery,
    category,
    env,
    fetchImpl,
  });
  const round2Ms = Date.now() - tR2;

  const reviewers = [round1, round2];
  const completedCount = reviewers.filter((r) => r.status === 'completed').length;
  const finalScore = typeof round2.score === 'number' ? round2.score : round1.score;
  const finalVerdict = round2.status === 'completed' ? round2.auditVerdict : round1.auditVerdict;

  const usedProviders = Array.from(
    new Set(
      reviewers
        .filter((r) => r.status === 'completed' && typeof r.model === 'string' && r.model.includes(':'))
        .map((r) => r.model.split(':')[0])
    )
  );
  const overallProvider = usedProviders.length === 1
    ? (usedProviders[0] === 'cf-ai' ? 'cloudflare-ai' : usedProviders[0])
    : usedProviders.length > 1
      ? usedProviders.map((p) => (p === 'cf-ai' ? 'cf' : p)).join('+')
      : (xkiroKey ? 'xkiro' : String(env.OPENROUTER_API_KEY || '').trim() ? 'openrouter' : 'cloudflare-ai');

  const aiReviews = {
    protocol: AUDIT_PROTOCOL_ID,
    writerStandard: usesInternalWriter ? WRITER_STANDARD_ID : null,
    status: completedCount === 2 ? 'completed' : completedCount === 1 ? 'partial' : 'error',
    provider: overallProvider,
    pipeline: [authorSource, 'audit-round-1', 'audit-round-2', 'admin'],
    round1Verdict: round1.auditVerdict,
    finalVerdict,
    averageScore: finalScore,
    needsAutoPolish: shouldRevise,
    autoPolished,
    polishSummary,
    stageTimings: { round1Ms, revisionMs, round2Ms },
    combinedFeedback: [round1, round2]
      .filter((r) => r.status === 'completed')
      .map((r) => `${r.label} (${r.auditVerdict} · ${r.score}/100):\n${sanitizeAuditFeedbackForWriter(r)}`)
      .join('\n\n'),
    reviewedAt: new Date().toISOString(),
    reviewers,
  };

  return { article: currentArticle, writerBrief: currentBrief, aiReviews };
}

export async function generateDraftForTopic({
  picked,
  existingSlugs = [],
  today,
  env = {},
  fetchImpl = fetch,
}) {
  const style = selectWriterStyle({
    topic: picked.topic,
    query: picked.query,
    category: picked.category,
  });
  const prompt = buildStandardTrendWriterPrompt({
    topic: picked.topic,
    slug: picked.slug,
    category: picked.category,
    hskTag: picked.hskTag,
    trendQuery: picked.query,
    trendSource: picked.source,
    trendSpike: picked.spike,
    style,
    existingSlugs,
    today,
  });

  const written = await callWriterJson({ prompt, env, fetchImpl });
  const initialBrief = written.data?.writerBrief && typeof written.data.writerBrief === 'object'
    ? written.data.writerBrief
    : { styleId: style.id, styleReason: style.reason, primaryKeyword: picked.query };
  const initialArticle = normalizeArticle(written.data, {
    slug: picked.slug,
    topic: picked.topic,
    category: picked.category,
    hskTag: picked.hskTag,
    today,
    existingSlugs,
    editorialVoice: style.id,
  });

  const { article, writerBrief, aiReviews } = await runTwoRoundEditorialPipeline({
    initialArticle,
    writerBrief: initialBrief,
    trendQuery: picked.query,
    category: picked.category,
    hskTag: picked.hskTag,
    styleId: style.id,
    today,
    existingSlugs,
    env,
    fetchImpl,
  });

  const nowIso = new Date().toISOString();
  const stamp = nowIso.replace(/[-:TZ.]/g, '').slice(0, 14);
  const draftId = `draft-${stamp}-${article.slug.slice(0, 36)}`;
  const reviewHistory = [
    {
      action: 'generated',
      rating: null,
      comment: `Sinh trên Cloudflare (${written.model} · ${WRITER_STANDARD_ID} [${style.id}]) từ ${picked.source}${picked.spike ? ` (${picked.spike})` : ''}`,
      at: nowIso,
    },
  ];
  if (aiReviews.status !== 'skipped') {
    reviewHistory.push({
      action: 'ai_reviewed',
      rating: null,
      comment: aiReviews.reviewers.map((r) => `${r.label}: ${r.auditVerdict} (${r.score ?? 'err'})`).join(' · '),
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
    editorialVoice: style.id,
    writerBrief,
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
  const prevFeedback = draft?.aiReviews?.reviewers?.length
    ? draft.aiReviews.reviewers.map((r) => sanitizeAuditFeedbackForWriter(r)).filter(Boolean).join('\n\n')
    : '';
  const prompt = buildStandardRevisionWriterPrompt({
    draft,
    sanitizedFeedback: prevFeedback,
    adminComment: comment,
    rating,
    existingSlugs,
    today,
  });
  const rewritten = await callWriterJson({ prompt, env, fetchImpl });
  const initialBrief = rewritten.data?.writerBrief && typeof rewritten.data.writerBrief === 'object'
    ? rewritten.data.writerBrief
    : (draft.writerBrief || { styleId: draft.editorialVoice || 'educational-how-to' });
  const initialArticle = normalizeArticle(rewritten.data, {
    slug: draft.article?.slug || slugifyVi(draft.trendQuery),
    topic: draft.article?.title || draft.trendQuery,
    category: draft.category || draft.article?.category || 'meo-hoc',
    hskTag: draft.hskTag || draft.article?.hskTag || 'HSK 1–6',
    today,
    existingSlugs,
    editorialVoice: draft.editorialVoice || initialBrief.styleId || '',
  });

  const { article: updatedArticle, writerBrief, aiReviews } = await runTwoRoundEditorialPipeline({
    initialArticle,
    writerBrief: initialBrief,
    trendQuery: draft.trendQuery || initialArticle.title,
    category: draft.category || initialArticle.category || 'meo-hoc',
    hskTag: draft.hskTag || initialArticle.hskTag || 'HSK 1–6',
    styleId: draft.editorialVoice || initialBrief.styleId || '',
    today,
    existingSlugs,
    env,
    fetchImpl,
  });

  const nowIso = new Date().toISOString();
  const numericRating = rating ? Math.max(1, Math.min(5, Math.round(Number(rating)))) : draft.rating || null;
  draft.article = updatedArticle;
  draft.writerBrief = writerBrief;
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
