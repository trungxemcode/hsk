#!/usr/bin/env node
/**
 * AI SEO Article Generator for HSK Flashcards (Gemini API + ChineseTest Official Grounding).
 *
 * Usage:
 *   GEMINI_API_KEY=... node tools/seo-articles/generate-ai-article.mjs
 *   GEMINI_API_KEY=... node tools/seo-articles/generate-ai-article.mjs --sync-chinesetest --auto-exam-update
 *   GEMINI_API_KEY=... node tools/seo-articles/generate-ai-article.mjs \
 *     --topic "Cập nhật lịch thi HSK và lịch trả điểm năm 2027" \
 *     --category ky-thi
 *   node tools/seo-articles/generate-ai-article.mjs --list-queue
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES, buildAllSeoArticles, validateArticle } from './build-seo-articles.mjs';
import {
  CHINESETEST_ORIGIN,
  LEGACY_SOURCE_URL,
  SNAPSHOT_PATH,
  formatChineseTestGroundingSummary,
  syncChineseTestOfficial,
} from './sync-chinesetest-official.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const ARTICLES_PATH = path.join(ROOT, 'content/seo-articles/articles.json');
const QUEUE_PATH = path.join(ROOT, 'content/seo-articles/topic-queue.json');

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

export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

export function pickNextQueueTopic(articles, queueTopics) {
  const existing = new Set(articles.map((a) => a.slug));
  return queueTopics.find((t) => !existing.has(t.slug)) || null;
}

export function loadChineseTestSnapshot(snapshotPath = SNAPSHOT_PATH) {
  if (!fs.existsSync(snapshotPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  } catch (_) {
    return null;
  }
}

export function defaultChineseTestSources(snapshot, category) {
  if (!snapshot || (category !== 'ky-thi' && category !== 'diem-so')) return [];
  const list = [];
  const add = (label, url) => {
    if (url && /^https?:\/\//i.test(url) && !list.some((x) => x.url === url)) {
      list.push({ label, url });
    }
  };
  if (category === 'diem-so') {
    add('Cổng tra cứu điểm thi HSK chính thức (ChineseTest)', snapshot.resolvedUrls?.scoreInquiry || `${CHINESETEST_ORIGIN}/query-score`);
  }
  for (const [year, cal] of Object.entries(snapshot.calendars || {})) {
    if (cal?.url) add(`Lịch thi & lịch trả kết quả HSK năm ${year} (ChineseTest)`, cal.url);
  }
  add('Danh sách điểm thi HSK chính thức tại Việt Nam (ChineseTest)', snapshot.resolvedUrls?.testCenters || `${CHINESETEST_ORIGIN}/test-centers`);
  if (snapshot.pinnedAnnouncement?.url) {
    add(`Thông báo kỳ thi HSK mới nhất: ${snapshot.pinnedAnnouncement.title || 'ChineseTest'}`, snapshot.pinnedAnnouncement.url);
  }
  add('Cấu trúc bài thi & Quy chế dự thi HSK (ChineseTest)', snapshot.resolvedUrls?.examStructure || `${CHINESETEST_ORIGIN}/HSK`);
  return list.slice(0, 4);
}

export function buildArticlePrompt({
  topic,
  slug,
  category,
  hskTag,
  keywords,
  sourceUrl,
  sourceNotes,
  chineseTestSummary,
  today,
  existingSlugs,
}) {
  const catLabel = CATEGORIES[category] || CATEGORIES['meo-hoc'];
  const combinedBlocks = [];
  if (chineseTestSummary) {
    combinedBlocks.push(
      `DỮ LIỆU ĐỒNG BỘ CHÍNH THỨC TỪ HỆ THỐNG CHINESETEST (${LEGACY_SOURCE_URL} -> ${CHINESETEST_ORIGIN}):\n"""\n${chineseTestSummary}\n"""`
    );
  }
  if (sourceNotes) {
    combinedBlocks.push(
      `GHI CHÚ NGUỒN BỔ SUNG TỪ CHỦ WEB (${sourceUrl || 'Thông báo điểm thi'}):\n"""\n${sourceNotes}\n"""`
    );
  }

  const groundingRule = combinedBlocks.length
    ? `NGUỒN DỮ LIỆU CHÍNH THỨC BẮT BUỘC BÁM SÁT (CHỈ ĐƯỢC DÙNG NGÀY THI, HẠN ĐĂNG KÝ, LỊCH TRẢ KẾT QUẢ, ĐỊA ĐIỂM THI VÀ THÔNG BÁO CÓ TRONG DỮ LIỆU DƯỚI ĐÂY; TUYỆT ĐỐI KHÔNG BỊA THÊM LỆ PHÍ HOẶC NGÀY THI NGOÀI DANH SÁCH):\n${combinedBlocks.join('\n\n')}`
    : `KHÔNG có thông báo lịch thi/lệ phí cụ thể đi kèm: TUYỆT ĐỐI KHÔNG tự bịa ngày thi cụ thể, hạn chót đăng ký cụ thể hay số tiền lệ phí cụ thể. Nếu nhắc đến kỳ thi/tra điểm, chỉ nêu quy trình chuẩn và khuyên đối chiếu trực tiếp tại ${CHINESETEST_ORIGIN}.`;

  return `Bạn là biên tập viên SEO chuyên về tiếng Trung HSK cho ứng dụng học miễn phí HSK Flashcards (https://hskfreelearningai.pages.dev/).

Hãy viết 01 bài viết SEO tiếng Việt chất lượng cao, tự nhiên như người Việt nghĩ gì tìm nấy trên Google, dễ đọc, có giá trị thực tế cho người tự học HSK.

THÔNG TIN ĐẦU BÀI:
- Chủ đề: ${topic}
- Slug cố định: ${slug}
- Chuyên mục: ${category} (${catLabel})
- Nhãn trọng tâm: ${hskTag || 'HSK 1–6'}
- Từ khóa gợi ý: ${(keywords || []).join(', ') || 'học HSK miễn phí, luyện thi HSK, gia sư AI tiếng Trung'}
- Ngày cập nhật: ${today}
- Danh sách slug bài viết hiện có để chọn 2–3 bài liên quan trong relatedSlugs: ${existingSlugs.join(', ')}

QUY TẮC BẮT BUỘC:
1. ${groundingRule}
2. KHÔNG nhắc đến các điểm hạn chế như "hạn mức", "hạn ngạch", "xác minh email", "yêu cầu đăng nhập". Nhấn mạnh tính năng miễn phí (Gia sư AI giải đáp tiếng Việt, sửa câu AI, luyện đề HSK 1–6, flashcard SRS, tập viết chữ Hán).
3. Viết rõ ràng, súc tích, không nhồi từ khóa phản cảm. Có 3 đến 4 mục (sections) rõ ràng; ít nhất 1 bảng dữ liệu/so sánh (table) hoặc ví dụ tiếng Trung chuẩn (chữ Hán giản thể + pinyin có dấu thanh + dịch tiếng Việt); và 2–3 câu hỏi FAQ tự nhiên chuẩn Google Search.
4. Trích dẫn đúng các URL chính thức của ChineseTest (${CHINESETEST_ORIGIN}/...) hoặc sourceUrl (${sourceUrl || 'nếu có'}) vào mảng sources[] khi bài thuộc chuyên mục ky-thi hoặc diem-so.

CHỈ TRẢ VỀ ĐÚNG 01 OBJECT JSON HỢP LỆ (không markdown, không giải thích ngoài JSON) theo cấu trúc:
{
  "slug": "${slug}",
  "category": "${category}",
  "categoryLabel": "${catLabel}",
  "hskTag": "${hskTag || 'HSK 1–6'}",
  "publishedAt": "${today}",
  "updatedAt": "${today}",
  "readMinutes": 5,
  "featured": false,
  "title": "Tiêu đề H1 hấp dẫn, tự nhiên",
  "metaTitle": "Tiêu đề SEO <= 68 ký tự | HSK Flashcards",
  "metaDescription": "Mô tả SEO 130–160 ký tự khớp tìm kiếm Google tiếng Việt",
  "summary": "Tóm tắt 2 câu ngắn gọn, đi thẳng vào lợi ích người đọc",
  "keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3", "từ khóa 4"],
  "sources": [],
  "sections": [
    {
      "id": "muc-1-slug",
      "heading": "Tiêu đề mục H2",
      "paragraphs": ["Đoạn văn 1", "Đoạn văn 2"],
      "bullets": ["Ý chính 1", "Ý chính 2"],
      "table": {
        "headers": ["Cột 1", "Cột 2", "Cột 3"],
        "rows": [["Giá trị 1", "Giá trị 2", "Giá trị 3"]]
      },
      "example": {
        "han": "Câu tiếng Trung giản thể",
        "py": "Pinyin có dấu thanh điệu",
        "vi": "Nghĩa tiếng Việt và giải thích ngắn"
      },
      "tip": "Mẹo thực tế ngắn gọn"
    }
  ],
  "faqs": [
    { "q": "Câu hỏi tự nhiên người học hay gõ lên Google?", "a": "Câu trả lời rõ ràng, trực tiếp." }
  ],
  "relatedSlugs": ["slug-bai-co-san-1", "slug-bai-co-san-2"],
  "cta": {
    "heading": "Lời kêu gọi vào học HSK miễn phí liên quan chủ đề bài viết",
    "body": "1 câu mô tả ngắn về Gia sư AI và luyện đề HSK 1–6 miễn phí.",
    "buttonLabel": "Vào học HSK miễn phí ngay"
  }
}
(Các trường bullets, table, example, tip trong mỗi section là tùy chọn — chỉ dùng ở mục nào thật sự phù hợp.)`;
}

export function normalizeGeneratedArticle(raw, defaults) {
  const article = {
    slug: defaults.slug,
    category: defaults.category,
    categoryLabel: CATEGORIES[defaults.category],
    hskTag: String(raw.hskTag || defaults.hskTag || 'HSK 1–6').trim(),
    publishedAt: defaults.today,
    updatedAt: defaults.today,
    readMinutes: Math.max(3, Math.min(12, Number(raw.readMinutes) || 5)),
    featured: false,
    title: String(raw.title || '').trim(),
    metaTitle: String(raw.metaTitle || '').trim(),
    metaDescription: String(raw.metaDescription || '').trim(),
    summary: String(raw.summary || '').trim(),
    keywords: Array.isArray(raw.keywords) ? raw.keywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 8) : [],
    sources: Array.isArray(raw.sources)
      ? raw.sources
          .filter((s) => s && typeof s.url === 'string' && /^https?:\/\//i.test(s.url) && typeof s.label === 'string' && s.label.trim())
          .map((s) => ({ label: s.label.trim(), url: s.url.trim() }))
      : [],
    sections: Array.isArray(raw.sections)
      ? raw.sections
          .map((s, idx) => {
            const clean = {
              id: slugifyVi(s.id || s.heading || `muc-${idx + 1}`) || `muc-${idx + 1}`,
              heading: String(s.heading || '').trim(),
            };
            if (Array.isArray(s.paragraphs) && s.paragraphs.length) {
              clean.paragraphs = s.paragraphs.map((p) => String(p).trim()).filter(Boolean);
            }
            if (Array.isArray(s.bullets) && s.bullets.length) {
              clean.bullets = s.bullets.map((b) => String(b).trim()).filter(Boolean);
            }
            if (s.table && Array.isArray(s.table.headers) && s.table.headers.length && Array.isArray(s.table.rows) && s.table.rows.length) {
              clean.table = {
                headers: s.table.headers.map((h) => String(h).trim()),
                rows: s.table.rows.map((r) => (Array.isArray(r) ? r.map((c) => String(c).trim()) : [])).filter((r) => r.length),
              };
            }
            if (s.example && s.example.han && String(s.example.han).trim()) {
              clean.example = {
                han: String(s.example.han).trim(),
                py: String(s.example.py || '').trim(),
                vi: String(s.example.vi || '').trim(),
              };
            }
            if (s.tip && String(s.tip).trim()) {
              clean.tip = String(s.tip).trim();
            }
            return clean;
          })
          .filter((s) => s.heading)
      : [],
    faqs: Array.isArray(raw.faqs)
      ? raw.faqs
          .filter((f) => f && f.q && f.a)
          .map((f) => ({ q: String(f.q).trim(), a: String(f.a).trim() }))
          .slice(0, 5)
      : [],
    relatedSlugs: Array.isArray(raw.relatedSlugs)
      ? raw.relatedSlugs.filter((s) => defaults.existingSlugs.includes(s)).slice(0, 3)
      : defaults.existingSlugs.slice(0, 3),
    cta:
      raw.cta && raw.cta.heading && raw.cta.buttonLabel
        ? {
            heading: String(raw.cta.heading).trim(),
            body: String(raw.cta.body || '').trim(),
            buttonLabel: String(raw.cta.buttonLabel).trim(),
          }
        : {
            heading: 'Luyện thi HSK 1–6 và hỏi Gia sư AI miễn phí ngay hôm nay',
            body: 'Mở trực tiếp HSK Flashcards trên trình duyệt để luyện đề, ôn flashcard SRS và sửa câu tiếng Trung miễn phí.',
            buttonLabel: 'Mở HSK Flashcards miễn phí',
          },
  };

  if (defaults.sourceUrl && /^https?:\/\//i.test(defaults.sourceUrl) && !article.sources.some((s) => s.url === defaults.sourceUrl)) {
    article.sources.unshift({ label: 'Nguồn thông báo chính thức đối chiếu', url: defaults.sourceUrl });
  }
  for (const fallbackSource of defaults.fallbackSources || []) {
    if (!article.sources.some((s) => s.url === fallbackSource.url)) {
      article.sources.push(fallbackSource);
    }
  }
  article.sources = article.sources.slice(0, 5);
  if (!article.relatedSlugs.length) {
    article.relatedSlugs = defaults.existingSlugs.slice(0, 3);
  }
  validateArticle(article);
  return article;
}

async function callGeminiJson(prompt, apiKey, model) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    }),
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API HTTP ${response.status}: ${errText.slice(0, 300)}`);
  }
  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
  if (!text) throw new Error('Gemini API returned empty content');
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const data = JSON.parse(fs.readFileSync(ARTICLES_PATH, 'utf8'));
  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
  const articles = Array.isArray(data.articles) ? data.articles : [];
  const queueTopics = Array.isArray(queue.topics) ? queue.topics : [];

  if (args['list-queue']) {
    const existing = new Set(articles.map((a) => a.slug));
    const pending = queueTopics.filter((t) => !existing.has(t.slug));
    console.log(`Pending queue topics (${pending.length}/${queueTopics.length}):`);
    for (const t of pending) console.log(`- [${t.category}] ${t.slug}: ${t.topic}`);
    return;
  }

  const prevSnapshot = loadChineseTestSnapshot();
  let snapshot = prevSnapshot;
  let chineseTestChanged = false;

  if (args['sync-chinesetest']) {
    try {
      snapshot = await syncChineseTestOfficial();
      chineseTestChanged = Boolean(prevSnapshot?.digest && snapshot?.digest && prevSnapshot.digest !== snapshot.digest);
      console.log(`ChineseTest snapshot synced (digest=${snapshot.digest}, changed=${chineseTestChanged}).`);
    } catch (err) {
      console.warn(`Warning: Live ChineseTest sync failed (${err.message || err}); falling back to cached snapshot.`);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  let selected;

  if (args.topic && typeof args.topic === 'string' && args.topic.trim()) {
    const cat = args.category && CATEGORIES[args.category] ? args.category : 'meo-hoc';
    const slug = slugifyVi(args.slug || args.topic);
    selected = {
      slug,
      category: cat,
      hskTag: typeof args['hsk-tag'] === 'string' ? args['hsk-tag'] : 'HSK 1–6',
      topic: args.topic.trim(),
      keywords: typeof args.keywords === 'string' ? args.keywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
    };
  } else if (args['auto-exam-update'] && chineseTestChanged && snapshot) {
    const updateSlug = `cap-nhat-thong-tin-ky-thi-hsk-chinesetest-${today.replace(/-/g, '')}`;
    if (!articles.some((a) => a.slug === updateSlug)) {
      selected = {
        slug: updateSlug,
        category: 'ky-thi',
        hskTag: 'Bản tin ChineseTest',
        topic: `Bản tin cập nhật lịch thi HSK, điểm thi Việt Nam và thông báo mới trên ChineseTest (${today})`,
        keywords: ['lịch thi HSK mới nhất', 'thông báo thi HSK chinesetest', 'điểm thi HSK tại Việt Nam'],
      };
    }
  }

  if (!selected) {
    selected = pickNextQueueTopic(articles, queueTopics);
    if (!selected) {
      console.log('All topics in content/seo-articles/topic-queue.json are already published.');
      return;
    }
  }

  if (articles.some((a) => a.slug === selected.slug)) {
    throw new Error(`Article slug "${selected.slug}" already exists in articles.json`);
  }

  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable. Set GEMINI_API_KEY to generate a new AI SEO article.');
  }
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const existingSlugs = articles.map((a) => a.slug);
  const sourceUrl = typeof args['source-url'] === 'string' ? args['source-url'].trim() : '';
  const sourceNotes = typeof args['source-notes'] === 'string' ? args['source-notes'].trim() : '';

  const useChineseTest =
    Boolean(args['use-chinesetest']) || selected.category === 'ky-thi' || selected.category === 'diem-so';
  const chineseTestSummary = useChineseTest && snapshot ? formatChineseTestGroundingSummary(snapshot) : '';
  const fallbackSources = useChineseTest && snapshot ? defaultChineseTestSources(snapshot, selected.category) : [];

  const prompt = buildArticlePrompt({
    topic: selected.topic,
    slug: selected.slug,
    category: selected.category,
    hskTag: selected.hskTag,
    keywords: selected.keywords,
    sourceUrl,
    sourceNotes,
    chineseTestSummary,
    today,
    existingSlugs,
  });

  console.log(`Generating SEO article "${selected.slug}" [${selected.category}] via ${model}...`);
  const raw = await callGeminiJson(prompt, apiKey, model);
  const article = normalizeGeneratedArticle(raw, {
    slug: selected.slug,
    category: selected.category,
    hskTag: selected.hskTag,
    today,
    existingSlugs,
    sourceUrl,
    fallbackSources,
  });

  articles.unshift(article);
  data.articles = articles;
  fs.writeFileSync(ARTICLES_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  const built = buildAllSeoArticles();
  console.log(`Added "${article.slug}" and rebuilt ${built.count} SEO articles (${built.urls} URLs in sitemap.xml).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
