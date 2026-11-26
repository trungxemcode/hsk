#!/usr/bin/env node
/**
 * Google Trends (VN) + Google Suggest Topic Collector & 3-Layer Deduplicator
 * for HSK Flashcards SEO Editorial Pipeline.
 */
import { slugifyVi } from './generate-ai-article.mjs';

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

const STOP_TOKENS = new Set([
  'trong',
  'va',
  'cua',
  'cho',
  'nhung',
  'cac',
  'la',
  'gi',
  'nhu',
  'the',
  'nao',
  'voi',
  'hay',
  'khi',
  'tai',
  've',
  'tu',
  'moi',
  'nhat',
]);

const RELEVANT_RSS_RE = /(?:hsk|tiếng\s*trung|trung\s*quốc|chinesetest|pinyin|chữ\s*hán|hán\s*ngữ|du\s*học\s*trung)/i;

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
      if (cols.length >= 1) {
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
          items.push({
            query: maybeQuery,
            spike: maybeSpike || '',
            source: 'google-trends-csv',
          });
        }
        continue;
      }
    }

    for (const part of line.split(/[;|]/)) {
      const query = part.trim().replace(/^[-*\d.)\s]+/, '');
      const norm = normalizeTextForMatch(query);
      if (query.length >= 3 && norm && !seen.has(norm)) {
        seen.add(norm);
        items.push({
          query,
          spike: '',
          source: 'google-trends-csv',
        });
      }
    }
  }
  return items;
}

export async function fetchGoogleTrendsExplore(seeds = ['học tiếng trung', 'thi hsk'], fetchFn = fetch) {
  const results = [];
  const seen = new Set();

  if (process.env.SERPAPI_API_KEY) {
    for (const q of seeds.slice(0, 2)) {
      try {
        const url = new URL('https://serpapi.com/search.json');
        url.searchParams.set('engine', 'google_trends');
        url.searchParams.set('q', q);
        url.searchParams.set('geo', 'VN');
        url.searchParams.set('hl', 'vi');
        url.searchParams.set('data_type', 'RELATED_QUERIES');
        url.searchParams.set('api_key', process.env.SERPAPI_API_KEY);
        const res = await fetchFn(url.toString(), { signal: AbortSignal.timeout(10000) });
        if (res.ok) {
          const json = await res.json();
          const blocks = [
            ...(json?.related_queries?.rising || []),
            ...(json?.related_queries?.top || []),
          ];
          for (const row of blocks) {
            const query = String(row?.query || '').trim();
            const norm = normalizeTextForMatch(query);
            if (!norm || seen.has(norm)) continue;
            seen.add(norm);
            results.push({
              query,
              spike: String(row?.formattedValue || row?.extracted_value || ''),
              source: 'google-trends',
            });
          }
        }
      } catch (_) {}
    }
    if (results.length > 0) return results;
  }

  for (const keyword of seeds.slice(0, 2)) {
    try {
      const exploreUrl = new URL('https://trends.google.com/trends/api/explore');
      exploreUrl.searchParams.set('hl', 'vi');
      exploreUrl.searchParams.set('tz', '-420');
      exploreUrl.searchParams.set(
        'req',
        JSON.stringify({
          comparisonItem: [{ keyword, geo: 'VN', time: 'now 7-d' }],
          category: 0,
          property: '',
        })
      );
      const exploreRes = await fetchFn(exploreUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
          'Accept-Language': 'vi-VN,vi;q=0.9',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!exploreRes.ok) continue;
      const cookieHeader = exploreRes.headers?.get?.('set-cookie') || '';
      const rawExplore = await exploreRes.text();
      const exploreJson = JSON.parse(rawExplore.replace(/^\)\]\}',?\n?/, ''));
      const widget = (exploreJson?.widgets || []).find((w) => w.id === 'RELATED_QUERIES');
      if (!widget?.token || !widget?.request) continue;

      const relUrl = new URL('https://trends.google.com/trends/api/widgetdata/relatedsearches');
      relUrl.searchParams.set('hl', 'vi');
      relUrl.searchParams.set('tz', '-420');
      relUrl.searchParams.set('req', JSON.stringify(widget.request));
      relUrl.searchParams.set('token', widget.token);
      const relRes = await fetchFn(relUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!relRes.ok) continue;
      const relJson = JSON.parse((await relRes.text()).replace(/^\)\]\}',?\n?/, ''));
      for (const list of relJson?.default?.rankedList || []) {
        for (const kw of list?.rankedKeyword || []) {
          const query = String(kw?.query || '').trim();
          const norm = normalizeTextForMatch(query);
          if (!norm || seen.has(norm)) continue;
          seen.add(norm);
          results.push({
            query,
            spike: String(kw?.formattedValue || ''),
            source: 'google-trends',
          });
        }
      }
    } catch (_) {}
  }

  return results;
}

export async function fetchGoogleTrendsRssVn(fetchFn = fetch) {
  const results = [];
  try {
    const res = await fetchFn('https://trends.google.com/trending/rss?geo=VN', {
      headers: { 'Accept-Language': 'vi-VN,vi;q=0.9' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return results;
    const xml = await res.text();
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/gi);
    for (const m of itemMatches) {
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

export async function fetchGoogleSuggestVn(seeds = DEFAULT_TREND_SEEDS, fetchFn = fetch) {
  const results = [];
  const seen = new Set();
  for (const seed of seeds) {
    try {
      const url = new URL('https://suggestqueries.google.com/complete/search');
      url.searchParams.set('client', 'firefox');
      url.searchParams.set('hl', 'vi');
      url.searchParams.set('gl', 'vn');
      url.searchParams.set('q', seed);
      const res = await fetchFn(url.toString(), { signal: AbortSignal.timeout(7000) });
      if (!res.ok) continue;
      const payload = await res.json();
      const suggestions = Array.isArray(payload?.[1]) ? payload[1] : [];
      for (const s of suggestions) {
        const query = String(s || '').trim();
        const norm = normalizeTextForMatch(query);
        if (!norm || seen.has(norm)) continue;
        seen.add(norm);
        results.push({
          query,
          spike: '',
          source: 'google-suggest',
        });
      }
    } catch (_) {}
  }
  return results;
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
      if (jaccardSimilarity(qTokens, existingSet) >= 0.62) {
        return true;
      }
    }
  }
  return false;
}

export function filterAndRankTrendTopics(
  rawItems = [],
  { publishedArticles = [], drafts = [], queueTopics = [], count = 2 } = {}
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

  if (selected.length < count && Array.isArray(queueTopics)) {
    for (const qItem of queueTopics) {
      if (selected.length >= count) break;
      const qSlug = String(qItem?.slug || '').trim();
      const qTopic = String(qItem?.topic || '').trim();
      if (!qTopic) continue;
      if (isDuplicateTopic(qTopic, qSlug, corpus)) continue;
      const item = {
        query: qTopic,
        slug: qSlug || slugifyVi(qTopic),
        topic: qTopic,
        category: qItem.category || 'meo-hoc',
        hskTag: qItem.hskTag || 'HSK 1–6',
        spike: 'Queue gợi ý',
        source: 'topic-queue',
        score: 5,
        keywords: Array.isArray(qItem.keywords) ? qItem.keywords : [qTopic],
      };
      corpus.norms.add(normalizeTextForMatch(item.query));
      corpus.slugs.add(item.slug);
      corpus.tokenSets.push(tokenizeForSimilarity(item.query));
      selected.push(item);
    }
  }

  return selected;
}

export async function collectTrendTopics({
  publishedArticles = [],
  drafts = [],
  queueTopics = [],
  count = 2,
  customQueries = '',
  csvText = '',
  hourSeed = new Date().getUTCHours(),
  fetchFn = fetch,
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

  // Rotate seeds based on hourSeed so 2h runs scan fresh search clusters
  const start = (hourSeed * 3) % DEFAULT_TREND_SEEDS.length;
  const rotatedSeeds = [];
  for (let i = 0; i < 6; i++) {
    rotatedSeeds.push(DEFAULT_TREND_SEEDS[(start + i) % DEFAULT_TREND_SEEDS.length]);
  }

  const [exploreItems, rssItems, suggestItems] = await Promise.all([
    fetchGoogleTrendsExplore(rotatedSeeds.slice(0, 2), fetchFn),
    fetchGoogleTrendsRssVn(fetchFn),
    fetchGoogleSuggestVn(rotatedSeeds, fetchFn),
  ]);

  if (exploreItems.length) {
    rawItems.push(...exploreItems);
    usedSources.push(`google-trends(${exploreItems.length})`);
  }
  if (rssItems.length) {
    rawItems.push(...rssItems);
    usedSources.push(`google-trends-rss(${rssItems.length})`);
  }
  if (suggestItems.length) {
    rawItems.push(...suggestItems);
    usedSources.push(`google-suggest(${suggestItems.length})`);
  }

  const picked = filterAndRankTrendTopics(rawItems, {
    publishedArticles,
    drafts,
    queueTopics,
    count,
  });

  return {
    fetchedAt: new Date().toISOString(),
    sources: usedSources,
    rawCount: rawItems.length,
    topics: picked,
  };
}
