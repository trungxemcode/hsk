#!/usr/bin/env node
/**
 * AI SEO Article Generator & Multi-Voice News Rewriter for HSK Flashcards.
 *
 * Defaults to OpenRouter (`google/gemma-4-31b-it:free`) when OPENROUTER_API_KEY
 * is set (in env or gitignored `.env.local`), with optional Gemini fallback.
 *
 * Usage:
 *   OPENROUTER_API_KEY=... node tools/seo-articles/generate-ai-article.mjs --auto-news-scan
 *   OPENROUTER_API_KEY=... node tools/seo-articles/generate-ai-article.mjs --force-latest-news --voice hoi-dap-thuc-chien
 *   OPENROUTER_API_KEY=... node tools/seo-articles/generate-ai-article.mjs \
 *     --topic "Lộ trình ôn HSK 4 cấp tốc 60 ngày" --category meo-hoc
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
  extractNewsId,
  formatChineseTestGroundingSummary,
  markNewsSeen,
  scanChineseTestNews,
  syncChineseTestOfficial,
} from './sync-chinesetest-official.mjs';

export const DEFAULT_OPENROUTER_MODEL = 'google/gemma-4-31b-it:free';
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const ARTICLES_PATH = path.join(ROOT, 'content/seo-articles/articles.json');
const QUEUE_PATH = path.join(ROOT, 'content/seo-articles/topic-queue.json');

export function loadLocalEnv(rootDir = ROOT) {
  for (const name of ['.env.local', '.env']) {
    const filePath = path.join(rootDir, name);
    if (!fs.existsSync(filePath)) continue;
    const raw = fs.readFileSync(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
        (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

export const EDITORIAL_VOICES = {
  'cam-nang-than-thien': {
    label: 'Cẩm nang người đi trước chia sẻ gần gũi',
    instructions:
      'Viết gần gũi, tự nhiên như một người từng tự học và đi thi HSK đang giải thích lại thông tin mới cho người học tại Việt Nam. Mở bài đi thẳng vào tình huống thực tế của thí sinh, câu văn ngắn gọn, đời thường, chỉ rõ tin mới này tác động thế nào đến kế hoạch ôn tập.',
  },
  'ban-tin-phan-tich': {
    label: 'Bản tin phân tích sắc gọn – trọng tâm',
    instructions:
      'Viết theo văn phong biên tập viên giáo dục sắc sảo: 2 câu đầu chốt ngay điểm quan trọng nhất, các mục sau bóc tách mạch lạc theo hướng "Điểm thay đổi cốt lõi – Ai chịu ảnh hưởng – Việc cần chuẩn bị ngay", ngôn từ khúc chiết và dễ quét nhanh.',
  },
  'hoi-dap-thuc-chien': {
    label: 'Góc giải đáp thực chiến cho thí sinh sắp thi',
    instructions:
      'Viết theo nhịp giải đáp trúng những câu hỏi lo lắng nhất của thí sinh khi đọc tin mới (Ai cần để ý mốc mới? Giấy tờ hay lịch ôn có đổi không? Chỗ nào dễ hiểu nhầm?). Giọng văn dứt khoát, thực tế, ưu tiên hướng dẫn từng bước.',
  },
  'ke-chuyen-truyen-cam-hung': {
    label: 'Góc nhìn xu hướng & truyền động lực học HSK',
    instructions:
      'Viết cuốn hút, tích cực, đặt thông tin kỳ thi mới vào bức tranh rộng hơn về du học, học bổng và cơ hội nghề nghiệp tiếng Trung, giúp người đọc vừa nắm chắc dữ kiện chính thống vừa giữ hứng thú tự học mỗi ngày.',
  },
};

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

export function inferCategoryFromNews(newsDetail) {
  const combined = `${newsDetail?.title || ''} ${newsDetail?.bodyText || ''}`;
  const isScoreFocused =
    /(?:query[- ]score|\bscore\b|result\s*releas|transcript|certificate|成绩|查分|分数线)/i.test(combined) &&
    !/(?:test\s*calendar|test\s*dates|考试日期|考试日历)/i.test(newsDetail?.title || '');
  return isScoreFocused ? 'diem-so' : 'ky-thi';
}

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

export function buildNewsRewritePrompt({
  newsDetail,
  voice,
  slug,
  category,
  chineseTestSummary,
  today,
  existingSlugs,
}) {
  const catLabel = CATEGORIES[category] || CATEGORIES['ky-thi'];
  const tablePreview =
    Array.isArray(newsDetail?.tables) && newsDetail.tables.length
      ? '\nBẢNG SỐ LIỆU TRONG BẢN TIN GỐC:\n' +
        newsDetail.tables
          .slice(0, 3)
          .map((t, idx) => {
            const head = t.heading ? `Bảng ${idx + 1} (${t.heading}):\n` : `Bảng ${idx + 1}:\n`;
            return head + (t.rows || []).slice(0, 15).map((r) => '  | ' + r.join(' | ')).join('\n');
          })
          .join('\n')
      : '';

  return `Bạn là biên tập viên SEO giàu kinh nghiệm cho trang web học tiếng Trung miễn phí HSK Flashcards (https://hskfreelearningai.pages.dev/).

NHIỆM VỤ: Từ BẢN TIN GỐC MỚI ĐĂNG trên ChineseTest dưới đây, hãy VIẾT LẠI HOÀN TOÀN thành 01 bài báo / bài viết SEO tiếng Việt mang văn phong hoàn toàn mới, tự nhiên như người Việt tìm kiếm trên Google, không sao chép cấu trúc hay dịch từng câu khô cứng của bản gốc.

VĂN PHONG BẮT BUỘC LẦN NÀY — [${voice.label}]:
${voice.instructions}

BẢN TIN GỐC MỚI TRÊN CHINESETEST (NGUỒN SỰ THẬT DUY NHẤT):
- Link gốc: ${newsDetail.url}
- Ngày đăng gốc: ${newsDetail.publishedTime || today}
- Tiêu đề gốc: ${newsDetail.title}
- Nội dung chi tiết:
"""
${newsDetail.bodyText}
"""${tablePreview}

${chineseTestSummary ? `DỮ LIỆU ĐỐI CHIẾU THÊM TỪ CHINESETEST (${LEGACY_SOURCE_URL} -> ${CHINESETEST_ORIGIN}):\n"""\n${chineseTestSummary.slice(0, 2200)}\n"""` : ''}

THÔNG TIN XUẤT BẢN:
- Slug dự kiến (hãy tự đề xuất "suggestedSlug" tiếng Việt không dấu súc tích hơn nếu phù hợp SEO): ${slug}
- Chuyên mục: ${category} (${catLabel})
- Ngày cập nhật: ${today}
- Danh sách slug hiện có để chọn 2–3 bài liên quan trong relatedSlugs: ${existingSlugs.join(', ')}

NGUYÊN TẮC VÀNG (VI PHẠM SẼ BỊ TỪ CHỐI):
1. CHỈ DÙNG dữ kiện, ngày tháng, con số, địa điểm và quy định có thật trong bản tin gốc / dữ liệu ChineseTest phía trên; TUYỆT ĐỐI KHÔNG tự bịa ngày thi, lệ phí hoặc sự kiện không có trong nguồn.
2. ĐỔI MỚI VĂN PHONG 100%: Đặt lại tiêu đề H1 hấp dẫn chuẩn tìm kiếm tiếng Việt, sắp xếp lại bố cục 3–4 mục (H2) theo đúng văn phong [${voice.label}], thêm góc nhìn thực tế cho thí sinh tại Việt Nam.
3. TUYỆT ĐỐI KHÔNG nhắc đến hạn chế ("hạn mức", "hạn ngạch", "xác minh email", "yêu cầu đăng nhập") và KHÔNG dùng biểu tượng emoji. Nhắc tự nhiên tới việc ôn luyện miễn phí (đề HSK 1–6, flashcard SRS, Gia sư AI giải thích tiếng Việt) trong phần kết và CTA.
4. Luôn đưa link gốc ${newsDetail.url} vào mảng sources[].

CHỈ TRẢ VỀ ĐÚNG 01 OBJECT JSON HỢP LỆ (không markdown, không giải thích ngoài JSON):
{
  "suggestedSlug": "slug-tieng-viet-khong-dau-chuan-seo",
  "category": "${category}",
  "categoryLabel": "${catLabel}",
  "hskTag": "Tin mới ChineseTest",
  "publishedAt": "${today}",
  "updatedAt": "${today}",
  "readMinutes": 5,
  "featured": false,
  "title": "Tiêu đề H1 mới hoàn toàn theo văn phong đã chọn",
  "metaTitle": "Tiêu đề SEO <= 68 ký tự | HSK Flashcards",
  "metaDescription": "Mô tả SEO 130–160 ký tự khớp ý định tìm kiếm Google của người học Việt",
  "summary": "Tóm tắt 2 câu đi thẳng vào thông tin mới và lợi ích cho thí sinh.",
  "keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3", "từ khóa 4"],
  "sources": [{ "label": "Thông báo gốc trên ChineseTest", "url": "${newsDetail.url}" }],
  "sections": [
    {
      "id": "muc-1",
      "heading": "Tiêu đề mục H2 viết theo văn phong mới",
      "paragraphs": ["Đoạn 1", "Đoạn 2"],
      "bullets": ["Ý chính 1", "Ý chính 2"],
      "table": { "headers": ["Mục", "Thông tin chính thức"], "rows": [["Ngày áp dụng", "..."]] },
      "tip": "Mẹo thực tế ngắn gọn"
    }
  ],
  "faqs": [
    { "q": "Câu hỏi người Việt hay tìm về tin tức này?", "a": "Câu trả lời rõ ràng, chính xác." }
  ],
  "relatedSlugs": ["slug-bai-co-san-1", "slug-bai-co-san-2"],
  "cta": {
    "heading": "Lời kêu gọi luyện thi HSK miễn phí liên quan bản tin",
    "body": "1 câu về Gia sư AI tiếng Việt và kho đề HSK 1–6 miễn phí.",
    "buttonLabel": "Vào học HSK miễn phí ngay"
  }
}`;
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
  voice,
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

  const voiceBlock = voice
    ? `\nVĂN PHONG BÀI VIẾT [${voice.label}]: ${voice.instructions}\n`
    : '';

  return `Bạn là biên tập viên SEO chuyên về tiếng Trung HSK cho ứng dụng học miễn phí HSK Flashcards (https://hskfreelearningai.pages.dev/).

Hãy viết 01 bài viết SEO tiếng Việt chất lượng cao, tự nhiên như người Việt nghĩ gì tìm nấy trên Google, dễ đọc, có giá trị thực tế cho người tự học HSK.
${voiceBlock}
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
2. KHÔNG nhắc đến các điểm hạn chế như "hạn mức", "hạn ngạch", "xác minh email", "yêu cầu đăng nhập" và KHÔNG dùng emoji. Nhấn mạnh tính năng miễn phí (Gia sư AI giải đáp tiếng Việt, sửa câu AI, luyện đề HSK 1–6, flashcard SRS, tập viết chữ Hán).
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
  let finalSlug = defaults.slug;
  if (defaults.allowSuggestedSlug) {
    const candidate = slugifyVi(raw.suggestedSlug || raw.title || '');
    if (candidate.length >= 10) {
      finalSlug = defaults.existingSlugs.includes(candidate)
        ? `${candidate.slice(0, 62)}-${String(defaults.sourceNewsId || Date.now()).slice(-4)}`
        : candidate;
    }
  }

  const article = {
    slug: finalSlug,
    category: defaults.category,
    categoryLabel: CATEGORIES[defaults.category],
    hskTag: String(raw.hskTag || defaults.hskTag || 'HSK 1–6').trim(),
    publishedAt: defaults.today,
    updatedAt: defaults.today,
    readMinutes: Math.max(3, Math.min(12, Number(raw.readMinutes) || 5)),
    featured: false,
    ...(defaults.sourceNewsId ? { sourceNewsId: String(defaults.sourceNewsId) } : {}),
    ...(defaults.editorialVoice ? { editorialVoice: String(defaults.editorialVoice) } : {}),
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
    article.sources.unshift({ label: 'Thông báo chính thức gốc trên ChineseTest', url: defaults.sourceUrl });
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

export function resolveAiConfig(env = process.env, args = {}) {
  const providerArg = String(args.provider || env.SEO_AI_PROVIDER || 'auto').trim().toLowerCase();
  const explicitModel = typeof args.model === 'string' ? args.model.trim() : '';
  const openrouterKey = String(env.OPENROUTER_API_KEY || '').trim();
  const geminiKey = String(env.GEMINI_API_KEY || '').trim();
  const openrouterModel = explicitModel || String(env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL).trim() || DEFAULT_OPENROUTER_MODEL;
  const geminiModel = explicitModel || String(env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim() || DEFAULT_GEMINI_MODEL;

  if (providerArg === 'gemini') {
    if (!geminiKey) {
      throw new Error('SEO_AI_PROVIDER=gemini was requested, but GEMINI_API_KEY is missing.');
    }
    return { provider: 'gemini', apiKey: geminiKey, model: geminiModel, fallback: null };
  }

  if (providerArg === 'openrouter') {
    if (!openrouterKey) {
      throw new Error('SEO_AI_PROVIDER=openrouter was requested, but OPENROUTER_API_KEY is missing.');
    }
    return { provider: 'openrouter', apiKey: openrouterKey, model: openrouterModel, fallback: null };
  }

  if (openrouterKey) {
    return {
      provider: 'openrouter',
      apiKey: openrouterKey,
      model: openrouterModel,
      fallback: geminiKey ? { provider: 'gemini', apiKey: geminiKey, model: geminiModel } : null,
    };
  }

  if (geminiKey) {
    return { provider: 'gemini', apiKey: geminiKey, model: geminiModel, fallback: null };
  }

  throw new Error(
    'Missing OPENROUTER_API_KEY (or GEMINI_API_KEY). Set OPENROUTER_API_KEY in .env.local or environment variables.'
  );
}

export async function callOpenRouterJson(prompt, apiKey, model = DEFAULT_OPENROUTER_MODEL, fetchImpl = fetch) {
  let useResponseFormat = true;
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const payloadBody = {
        model,
        messages: [
          {
            role: 'system',
            content:
              'Bạn là biên tập viên SEO tiếng Việt cho HSK Flashcards. Chỉ trả về duy nhất 01 object JSON hợp lệ, không kèm giải thích hay markdown.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.65,
      };
      if (useResponseFormat) {
        payloadBody.response_format = { type: 'json_object' };
      }

      const response = await fetchImpl(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://hskfreelearningai.pages.dev/',
          'X-Title': 'HSK Flashcards SEO News Rewriter',
        },
        body: JSON.stringify(payloadBody),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        lastError = new Error(`OpenRouter API (${model}) HTTP ${response.status}: ${errText.slice(0, 300)}`);
        if (response.status === 400 && useResponseFormat) {
          useResponseFormat = false;
          continue;
        }
        if ((response.status === 429 || response.status >= 500) && attempt < 3) {
          await new Promise((r) => setTimeout(r, 2500 * attempt));
          continue;
        }
        break;
      }

      const payload = await response.json();
      const rawContent = payload?.choices?.[0]?.message?.content;
      const text = Array.isArray(rawContent)
        ? rawContent.map((p) => (typeof p === 'string' ? p : p?.text || '')).join('').trim()
        : String(rawContent || '').trim();
      if (!text) {
        throw new Error(`OpenRouter API (${model}) returned empty content`);
      }
      return extractJsonObject(text);
    } catch (err) {
      lastError = err;
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
  }

  throw lastError || new Error('OpenRouter API request failed');
}

async function callGeminiJson(prompt, apiKey, model) {
  const modelsToTry = Array.from(new Set([model, DEFAULT_GEMINI_MODEL, 'gemini-2.0-flash'].filter(Boolean)));
  let lastError;

  for (const candidate of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidate)}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.65,
              responseMimeType: 'application/json',
            },
          }),
        });
        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          lastError = new Error(`Gemini API (${candidate}) HTTP ${response.status}: ${errText.slice(0, 300)}`);
          if ((response.status === 429 || response.status >= 500) && attempt < 2) {
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          break;
        }
        const payload = await response.json();
        const text = payload?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
        if (!text) throw new Error(`Gemini API (${candidate}) returned empty content`);
        return extractJsonObject(text);
      } catch (err) {
        lastError = err;
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }
  throw lastError || new Error('Gemini API request failed');
}

export async function callAiJson(prompt, aiConfig) {
  if (aiConfig.provider === 'openrouter') {
    try {
      return await callOpenRouterJson(prompt, aiConfig.apiKey, aiConfig.model);
    } catch (err) {
      if (aiConfig.fallback?.provider === 'gemini') {
        console.warn(`Warning: OpenRouter failed (${err.message}); falling back to Gemini (${aiConfig.fallback.model})...`);
        return await callGeminiJson(prompt, aiConfig.fallback.apiKey, aiConfig.fallback.model);
      }
      throw err;
    }
  }
  return await callGeminiJson(prompt, aiConfig.apiKey, aiConfig.model);
}

async function main() {
  loadLocalEnv(ROOT);
  const args = parseArgs(process.argv.slice(2));
  const data = JSON.parse(fs.readFileSync(ARTICLES_PATH, 'utf8'));
  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
  const articles = Array.isArray(data.articles) ? data.articles : [];
  const queueTopics = Array.isArray(queue.topics) ? queue.topics : [];
  const today = new Date().toISOString().slice(0, 10);
  const requestedVoice = typeof args.voice === 'string' && args.voice !== 'auto' ? args.voice : '';

  if (args['list-queue']) {
    const existing = new Set(articles.map((a) => a.slug));
    const pending = queueTopics.filter((t) => !existing.has(t.slug));
    console.log(`Pending queue topics (${pending.length}/${queueTopics.length}):`);
    for (const t of pending) console.log(`- [${t.category}] ${t.slug}: ${t.topic}`);
    return;
  }

  let snapshot = loadChineseTestSnapshot();
  const isNewsScanMode = Boolean(args['auto-news-scan'] || args['force-latest-news'] || args['force-news-id']);

  if (isNewsScanMode) {
    const maxNews = Math.max(1, Math.min(3, Number(args['max-news']) || 1));
    const scan = await scanChineseTestNews({
      fetchDetailLimit: maxNews,
      forceLatest: Boolean(args['force-latest-news']),
      forceNewsId: typeof args['force-news-id'] === 'string' ? args['force-news-id'] : '',
      existingArticles: articles,
    });
    console.log(
      `ChineseTest 2h news scan: discovered ${scan.discovered.length} items, ${scan.unseen.length} unseen, fetched ${scan.fetchedDetails.length} details.`
    );

    if (scan.fetchedDetails.length > 0) {
      const aiConfig = resolveAiConfig(process.env, args);

      const needsFullSnapshotSync = scan.fetchedDetails.some((d) =>
        /calendar|test\s*date|test\s*center|hsk\s*3\.0|announcement|日历|考试日期/i.test(`${d.title} ${d.bodyText}`)
      );
      if (needsFullSnapshotSync || args['sync-chinesetest']) {
        try {
          snapshot = await syncChineseTestOfficial();
        } catch (err) {
          console.warn(`Warning: Full ChineseTest snapshot refresh failed (${err.message || err}); using cached snapshot.`);
        }
      }
      const chineseTestSummary = snapshot ? formatChineseTestGroundingSummary(snapshot) : '';

      const publishedSummaries = [];
      for (const newsDetail of scan.fetchedDetails) {
        const category = inferCategoryFromNews(newsDetail);
        const voice = pickEditorialVoice(newsDetail.id, requestedVoice);
        const existingSlugs = articles.map((a) => a.slug);
        const fallbackSlug = slugifyVi(newsDetail.title) || `tin-tuc-hsk-chinesetest-${newsDetail.id}`;
        const prompt = buildNewsRewritePrompt({
          newsDetail,
          voice,
          slug: fallbackSlug,
          category,
          chineseTestSummary,
          today,
          existingSlugs,
        });

        console.log(`Rewriting ChineseTest #${newsDetail.id} in voice "${voice.id}" via ${aiConfig.provider} / ${aiConfig.model}...`);
        const raw = await callAiJson(prompt, aiConfig);
        const article = normalizeGeneratedArticle(raw, {
          slug: fallbackSlug,
          allowSuggestedSlug: true,
          category,
          hskTag: 'Tin mới ChineseTest',
          today,
          existingSlugs,
          sourceUrl: newsDetail.url,
          sourceNewsId: newsDetail.id,
          editorialVoice: voice.id,
          fallbackSources: defaultChineseTestSources(snapshot, category),
        });

        articles.unshift(article);
        markNewsSeen({
          id: newsDetail.id,
          url: newsDetail.url,
          title: newsDetail.title,
          articleSlug: article.slug,
        });
        publishedSummaries.push(`${article.slug} (${voice.id})`);
      }

      data.articles = articles;
      fs.writeFileSync(ARTICLES_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
      const built = buildAllSeoArticles();
      console.log(`Auto-published ${publishedSummaries.join(', ')}; rebuilt ${built.count} SEO articles (${built.urls} URLs).`);
      return;
    }

    if (!args['fallback-queue']) {
      console.log(`Không phát hiện tin tức mới trên chinesetest.cn (đã quét ${scan.discovered.length} tin).`);
      return;
    }
  }

  let chineseTestChanged = false;
  if (args['sync-chinesetest']) {
    const prevSnapshot = snapshot;
    try {
      snapshot = await syncChineseTestOfficial();
      chineseTestChanged = Boolean(prevSnapshot?.digest && snapshot?.digest && prevSnapshot.digest !== snapshot.digest);
      console.log(`ChineseTest snapshot synced (digest=${snapshot.digest}, changed=${chineseTestChanged}).`);
    } catch (err) {
      console.warn(`Warning: Live ChineseTest sync failed (${err.message || err}); falling back to cached snapshot.`);
    }
  }

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

  const aiConfig = resolveAiConfig(process.env, args);
  const existingSlugs = articles.map((a) => a.slug);
  const sourceUrl = typeof args['source-url'] === 'string' ? args['source-url'].trim() : '';
  const sourceNotes = typeof args['source-notes'] === 'string' ? args['source-notes'].trim() : '';

  const useChineseTest = Boolean(args['use-chinesetest']) || selected.category === 'ky-thi' || selected.category === 'diem-so';
  const chineseTestSummary = useChineseTest && snapshot ? formatChineseTestGroundingSummary(snapshot) : '';
  const fallbackSources = useChineseTest && snapshot ? defaultChineseTestSources(snapshot, selected.category) : [];
  const voice = pickEditorialVoice(selected.slug, requestedVoice);

  const prompt = buildArticlePrompt({
    topic: selected.topic,
    slug: selected.slug,
    category: selected.category,
    hskTag: selected.hskTag,
    keywords: selected.keywords,
    sourceUrl,
    sourceNotes,
    chineseTestSummary,
    voice,
    today,
    existingSlugs,
  });

  console.log(`Generating SEO article "${selected.slug}" [${selected.category}] (${voice.id}) via ${aiConfig.provider} / ${aiConfig.model}...`);
  const raw = await callAiJson(prompt, aiConfig);
  const sourceNewsId = extractNewsId(sourceUrl) || '';
  const article = normalizeGeneratedArticle(raw, {
    slug: selected.slug,
    category: selected.category,
    hskTag: selected.hskTag,
    today,
    existingSlugs,
    sourceUrl,
    sourceNewsId,
    editorialVoice: voice.id,
    fallbackSources,
  });

  articles.unshift(article);
  if (sourceNewsId) {
    markNewsSeen({ id: sourceNewsId, url: sourceUrl, title: article.title, articleSlug: article.slug });
  }
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
