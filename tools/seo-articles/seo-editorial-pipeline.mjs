#!/usr/bin/env node
/**
 * Google Trends -> AI Draft Generator -> Human Review -> Auto-Publisher Pipeline.
 *
 * Actions:
 *   node tools/seo-articles/seo-editorial-pipeline.mjs --scan-trends --count 2
 *   node tools/seo-articles/seo-editorial-pipeline.mjs --rewrite --draft-id <id> --comment "..." [--rating 3]
 *   node tools/seo-articles/seo-editorial-pipeline.mjs --approve --draft-id <id> [--rating 5] [--comment "..."]
 *   node tools/seo-articles/seo-editorial-pipeline.mjs --reject  --draft-id <id> [--comment "..."] [--rating 2]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES, buildAllSeoArticles, validateArticle } from './build-seo-articles.mjs';
import { collectTrendTopics } from './fetch-google-trends.mjs';
import {
  callAiJson,
  loadLocalEnv,
  normalizeGeneratedArticle,
  parseArgs,
  pickEditorialVoice,
  resolveAiConfig,
  slugifyVi,
} from './generate-ai-article.mjs';
import { runDualXkiroReview } from './xkiro-reviewers.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const ARTICLES_PATH = path.join(ROOT, 'content/seo-articles/articles.json');
const QUEUE_PATH = path.join(ROOT, 'content/seo-articles/topic-queue.json');
const DRAFTS_PATH = path.join(ROOT, 'content/seo-articles/drafts.json');
const SNAPSHOT_PATH = path.join(ROOT, 'content/seo-articles/trends-snapshot.json');

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
  const hasOversizedTable = sections.some(
    (s) => s?.table && Array.isArray(s.table.rows) && s.table.rows.length > 6
  );
  if (hasValidTable && !hasOversizedTable) {
    checks.push('Có bảng so sánh/tổng hợp gọn <= 6 dòng.');
    score += 15;
  } else if (hasOversizedTable) {
    warnings.push('Có bảng vượt quá 6 dòng — nên tách gọn <= 6 dòng mỗi bảng.');
    score += 8;
  } else {
    warnings.push('Nên bổ sung ít nhất 1 bảng đối chiếu hoặc tổng hợp 3–6 dòng.');
  }

  const hasExample = sections.some(
    (s) => s?.example?.han && s?.example?.py && s?.example?.vi
  );
  if (hasExample) {
    checks.push('Có ví dụ đầy đủ Chữ Hán + Pinyin + Nghĩa tiếng Việt.');
    score += 15;
  } else {
    warnings.push('Thiếu khối ví dụ 3 lớp (Chữ Hán + Pinyin có dấu + Nghĩa tiếng Việt).');
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

  return {
    score: Math.min(100, score),
    checks,
    warnings,
  };
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
  const voiceBlock = voice
    ? `\nPHONG CÁCH VIẾT: ${voice.label}\n${voice.instructions}\n`
    : '';
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
1. Viết cho người Việt học tiếng Trung thực tế và luyện thi HSK 1–6: giải thích bản chất ngắn gọn, chỉ rõ lỗi người Việt hay mắc và cách dùng chuẩn bản xứ.
2. Mỗi ví dụ tiếng Trung PHẢI kèm đủ Chữ Hán giản thể + Pinyin có dấu thanh điệu chuẩn (ā á ǎ à, ē é ě è...) + nghĩa tiếng Việt tự nhiên.
3. Có 3–4 mục (<sections>), ít nhất 1 bảng tổng hợp/so sánh gồm 3–6 dòng (TUYỆT ĐỐI KHÔNG vượt quá 6 dòng mỗi bảng), ít nhất 1 khối "example" chuẩn 3 trường (han, py, vi), ít nhất 1 hộp "tip" và 2–3 câu hỏi "faqs".
4. Tuyệt đối không sao chép văn bản từ bất kỳ trang web nào khác.
5. Trong CTA cuối bài nhắc tự nhiên rằng HSK Flashcards hoàn toàn miễn phí trên trình duyệt (Gia sư AI, Sửa câu AI, Từ dễ nhầm, Luyện đề HSK 1–6). KHÔNG bao giờ nhắc "hạn mức", "hạn ngạch", "xác minh email", "yêu cầu đăng nhập".
6. Nếu có danh sách bullets đánh số bước, ghi rõ "1. Tiêu đề: nội dung...". Không dùng HTML tag trong chuỗi JSON.
7. Chỉ chọn relatedSlugs từ các slug hiện có sau nếu phù hợp: ${existingSlugs.slice(0, 12).join(', ')}.

TRẢ VỀ DUY NHẤT MỘT JSON OBJECT HỢP LỆ THEO ĐÚNG CẤU TRÚC:
{
  "title": "...",
  "metaTitle": "... | HSK Flashcards",
  "metaDescription": "...",
  "summary": "...",
  "hskTag": "${hskTag || 'HSK 1–6'}",
  "readMinutes": 7,
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

  return `Bạn là biên tập viên tiếng Trung HSK đang chỉnh sửa lại một bài viết SEO theo phản hồi trực tiếp của Chủ sở hữu trang web.

NHẬN XÉT MỚI NHẤT CỦA NGƯỜI DUYỆT (${rating ? `Đánh giá ${rating}/5 sao` : 'Yêu cầu viết lại'}):
"""
${comment || 'Hãy nâng cấp toàn diện độ sâu, tính tự nhiên, ví dụ Hán – Pinyin – Việt và độ chính xác ngữ pháp cho bài viết.'}
"""
${prevFeedback ? `\nLỊCH SỬ GÓP Ý TRƯỚC ĐÓ:\n${prevFeedback}\n` : ''}
BẢN NHÁP HIỆN TẠI CẦN SỬA (version ${draft.version || 1}, chủ đề: "${draft.trendQuery || draft.article?.title}"):
${JSON.stringify(draft.article, null, 2)}

YÊU CẦU KHI VIẾT LẠI:
1. Giải quyết TRIỆT ĐỂ mọi điểm người duyệt vừa góp ý trong phần nhận xét ở trên.
2. Giữ định dạng JSON bài viết đầy đủ, chính xác Chữ Hán giản thể + Pinyin có thanh điệu chuẩn + nghĩa tiếng Việt tự nhiên.
3. Giữ mỗi bảng tối đa 6 dòng, có ít nhất 1 khối "example" chuẩn (han, py, vi), 1 "tip", và 2–3 "faqs".
4. Ngày cập nhật: "${today}". KHÔNG nhắc các từ cấm: "hạn mức", "hạn ngạch", "xác minh email", "yêu cầu đăng nhập".
5. Có thể chọn relatedSlugs từ: ${existingSlugs.slice(0, 12).join(', ')}.

TRẢ VỀ DUY NHẤT JSON OBJECT GỒM:
{
  "revisionSummary": "Tóm tắt 1-2 câu những gì đã chỉnh sửa theo góp ý của người duyệt",
  "title": "...",
  "metaTitle": "...",
  "metaDescription": "...",
  "summary": "...",
  "hskTag": "...",
  "readMinutes": 7,
  "keywords": ["..."],
  "sections": [...],
  "faqs": [...],
  "relatedSlugs": [...],
  "cta": { "heading": "...", "body": "...", "buttonLabel": "..." }
}`;
}

export function resolveUniqueArticleSlug(desiredSlug, existingArticles = []) {
  const base = slugifyVi(desiredSlug) || `bai-viet-hsk-${Date.now()}`;
  const taken = new Set(existingArticles.map((a) => a.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export function buildAutoPolishPrompt({ article, trendQuery, reviewBundle, existingSlugs = [], today }) {
  return `Bạn là Gemma 4 (biên tập viên chính). Hai chuyên gia xKiro (Command A+ kiểm tra tiếng Trung/Pinyin/ngữ pháp và Mistral Large 3 kiểm tra SEO/độ tự nhiên tiếng Việt) vừa rà soát bài viết và chỉ ra những điểm cần hoàn thiện.

NHẬN XÉT CỦA HỘI ĐỒNG KIỂM DUYỆT xKIRO:
${reviewBundle?.combinedFeedback || 'Hãy rà soát lại Pinyin, ví dụ Hán–Việt, độ sâu ngữ pháp và tính tự nhiên tiếng Việt.'}

BẢN THẢO HIỆN TẠI (từ khóa xu hướng: "${trendQuery || article?.title}"):
${JSON.stringify(article, null, 2)}

YÊU CẦU TỰ HOÀN THIỆN:
1. Sửa TRIỆT ĐỂ mọi lỗi được nêu trong mục [Bắt buộc sửa] và xử lý các góp ý còn lại của Command A+ & Mistral Large 3.
2. Đảm bảo chữ Hán giản thể, dấu thanh điệu Pinyin (ā á ǎ à...), nghĩa tiếng Việt chính xác 100%, mỗi bảng <= 6 dòng, đủ ví dụ 3 lớp, tip và 2–3 FAQs.
3. Ngày cập nhật: "${today}". KHÔNG dùng từ cấm ("hạn mức", "hạn ngạch", "xác minh email", "yêu cầu đăng nhập").
4. Có thể chọn relatedSlugs từ: ${existingSlugs.slice(0, 12).join(', ')}.

TRẢ VỀ DUY NHẤT JSON OBJECT HỢP LỆ (giữ đầy đủ cấu trúc bài viết + thêm "polishSummary": "Tóm tắt ngắn điểm đã sửa theo xKiro").`;
}

export async function runXkiroReviewAndPolish({
  article,
  trendQuery,
  category,
  hskTag,
  editorialVoice,
  today,
  existingSlugs = [],
  aiConfig,
  args = {},
  env = process.env,
  fetchImpl = fetch,
}) {
  let finalArticle = article;
  const reviewBundle = await runDualXkiroReview({
    article: finalArticle,
    trendQuery,
    env,
    args,
    fetchImpl,
  });

  const canPolish = Boolean(
    reviewBundle.needsAutoPolish &&
    !args['no-auto-polish'] &&
    aiConfig
  );

  if (canPolish) {
    try {
      console.log(`xKiro council flagged revisions (avg=${reviewBundle.averageScore}/100); Gemma 4 auto-polishing...`);
      const polishPrompt = buildAutoPolishPrompt({
        article: finalArticle,
        trendQuery,
        reviewBundle,
        existingSlugs,
        today,
      });
      const polishedRaw = await callAiJson(polishPrompt, aiConfig);
      finalArticle = normalizeGeneratedArticle(polishedRaw, {
        slug: finalArticle.slug,
        category: category || finalArticle.category || 'meo-hoc',
        hskTag: hskTag || finalArticle.hskTag || 'HSK 1–6',
        today,
        existingSlugs,
        editorialVoice: editorialVoice || finalArticle.editorialVoice || '',
        fallbackSources: [],
      });
      reviewBundle.autoPolished = true;
      reviewBundle.polishSummary = String(
        polishedRaw?.polishSummary || 'Gemma 4 đã tự chỉnh sửa theo góp ý của Command A+ và Mistral Large 3.'
      ).trim();
    } catch (err) {
      reviewBundle.polishSummary = `Chưa tự chỉnh sửa được (${err.message}); giữ bản đã qua 2 lớp rà soát xKiro.`;
    }
  }

  return { article: finalArticle, aiReviews: reviewBundle };
}

export function approveDraftIntoArticles({ draftsData, articlesData, draftId, rating = null, comment = '', today }) {
  const drafts = Array.isArray(draftsData?.drafts) ? draftsData.drafts : [];
  const draft = drafts.find((d) => d.id === draftId);
  if (!draft) throw new Error(`Không tìm thấy bản nháp "${draftId}"`);
  if (!draft.article) throw new Error(`Bản nháp "${draftId}" thiếu nội dung article`);

  const articles = Array.isArray(articlesData?.articles) ? articlesData.articles : [];
  const finalSlug = resolveUniqueArticleSlug(draft.article.slug || draft.trendQuery, articles);
  const effectiveToday = today || new Date().toISOString().slice(0, 10);

  const publishedArticle = {
    ...draft.article,
    slug: finalSlug,
    category: CATEGORIES[draft.article.category] ? draft.article.category : draft.category || 'meo-hoc',
    categoryLabel: CATEGORIES[draft.article.category] || CATEGORIES[draft.category] || 'Mẹo học HSK',
    publishedAt: draft.article.publishedAt || effectiveToday,
    updatedAt: effectiveToday,
  };
  validateArticle(publishedArticle);

  const nextArticles = [publishedArticle, ...articles.filter((a) => a.slug !== finalSlug)];
  articlesData.articles = nextArticles;

  const nowIso = new Date().toISOString();
  const numericRating = rating ? Math.max(1, Math.min(5, Math.round(Number(rating)))) : draft.rating || null;
  draft.status = 'approved';
  draft.approvedAt = nowIso;
  draft.updatedAt = nowIso;
  draft.publishedSlug = finalSlug;
  draft.rating = numericRating;
  draft.reviewHistory = Array.isArray(draft.reviewHistory) ? draft.reviewHistory : [];
  draft.reviewHistory.push({
    action: 'approved',
    rating: numericRating,
    comment: String(comment || '').trim() || 'Đã duyệt & xuất bản tự động',
    at: nowIso,
  });

  draftsData.updatedAt = nowIso;
  return { draft, publishedArticle };
}

export function rejectDraftRecord({ draftsData, draftId, comment = '', rating = null }) {
  const drafts = Array.isArray(draftsData?.drafts) ? draftsData.drafts : [];
  const draft = drafts.find((d) => d.id === draftId);
  if (!draft) throw new Error(`Không tìm thấy bản nháp "${draftId}"`);

  const nowIso = new Date().toISOString();
  const numericRating = rating ? Math.max(1, Math.min(5, Math.round(Number(rating)))) : draft.rating || null;
  draft.status = 'rejected';
  draft.updatedAt = nowIso;
  draft.rating = numericRating;
  draft.reviewHistory = Array.isArray(draft.reviewHistory) ? draft.reviewHistory : [];
  draft.reviewHistory.push({
    action: 'rejected',
    rating: numericRating,
    comment: String(comment || '').trim() || 'Từ chối xuất bản bài nháp này',
    at: nowIso,
  });
  draftsData.updatedAt = nowIso;
  return draft;
}

function readJsonSafe(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

async function main() {
  loadLocalEnv(ROOT);
  const args = parseArgs(process.argv.slice(2));
  const today = new Date().toISOString().slice(0, 10);

  const articlesData = readJsonSafe(ARTICLES_PATH, { schema: 1, articles: [] });
  const queueData = readJsonSafe(QUEUE_PATH, { schema: 1, topics: [] });
  const draftsData = readJsonSafe(DRAFTS_PATH, { schema: 1, updatedAt: new Date().toISOString(), drafts: [] });
  const articles = Array.isArray(articlesData.articles) ? articlesData.articles : [];
  const queueTopics = Array.isArray(queueData.topics) ? queueData.topics : [];
  const drafts = Array.isArray(draftsData.drafts) ? draftsData.drafts : [];

  if (args.approve) {
    const draftId = String(args['draft-id'] || '').trim();
    if (!draftId) throw new Error('Thiếu --draft-id khi chạy --approve');
    const rating = args.rating ? Number(args.rating) : null;
    const comment = typeof args.comment === 'string' ? args.comment : '';
    const { publishedArticle } = approveDraftIntoArticles({
      draftsData,
      articlesData,
      draftId,
      rating,
      comment,
      today,
    });
    fs.writeFileSync(ARTICLES_PATH, JSON.stringify(articlesData, null, 2) + '\n', 'utf8');
    fs.writeFileSync(DRAFTS_PATH, JSON.stringify(draftsData, null, 2) + '\n', 'utf8');
    const built = buildAllSeoArticles();
    console.log(`APPROVED "${draftId}" -> published "${publishedArticle.slug}" (${built.count} SEO articles, ${built.urls} URLs).`);
    return;
  }

  if (args.reject) {
    const draftId = String(args['draft-id'] || '').trim();
    if (!draftId) throw new Error('Thiếu --draft-id khi chạy --reject');
    const rating = args.rating ? Number(args.rating) : null;
    const comment = typeof args.comment === 'string' ? args.comment : '';
    rejectDraftRecord({ draftsData, draftId, comment, rating });
    fs.writeFileSync(DRAFTS_PATH, JSON.stringify(draftsData, null, 2) + '\n', 'utf8');
    console.log(`REJECTED "${draftId}".`);
    return;
  }

  if (args.rewrite) {
    const draftId = String(args['draft-id'] || '').trim();
    if (!draftId) throw new Error('Thiếu --draft-id khi chạy --rewrite');
    const draft = drafts.find((d) => d.id === draftId);
    if (!draft) throw new Error(`Không tìm thấy bản nháp "${draftId}"`);

    const aiConfig = resolveAiConfig(process.env, args);
    const comment = typeof args.comment === 'string' ? args.comment.trim() : '';
    const rating = args.rating ? Math.max(1, Math.min(5, Math.round(Number(args.rating)))) : draft.rating || null;
    const existingSlugs = articles.map((a) => a.slug);

    const prompt = buildRewriteDraftPrompt({ draft, comment, rating, existingSlugs, today });
    console.log(`Rewriting draft "${draftId}" (v${(draft.version || 1) + 1}) via ${aiConfig.provider} / ${aiConfig.model}...`);
    const raw = await callAiJson(prompt, aiConfig);
    const updatedArticleDraft = normalizeGeneratedArticle(raw, {
      slug: draft.article?.slug || slugifyVi(draft.trendQuery),
      category: draft.category || draft.article?.category || 'meo-hoc',
      hskTag: draft.hskTag || draft.article?.hskTag || 'HSK 1–6',
      today,
      existingSlugs,
      editorialVoice: draft.editorialVoice || '',
      fallbackSources: [],
    });

    const reviewed = await runXkiroReviewAndPolish({
      article: updatedArticleDraft,
      trendQuery: draft.trendQuery || updatedArticleDraft.title,
      category: draft.category || updatedArticleDraft.category || 'meo-hoc',
      hskTag: draft.hskTag || updatedArticleDraft.hskTag || 'HSK 1–6',
      editorialVoice: draft.editorialVoice || '',
      today,
      existingSlugs,
      aiConfig,
      args,
    });
    const updatedArticle = reviewed.article;

    const nowIso = new Date().toISOString();
    draft.article = updatedArticle;
    draft.version = (draft.version || 1) + 1;
    draft.status = 'pending_review';
    draft.updatedAt = nowIso;
    draft.rating = rating;
    draft.aiReviews = reviewed.aiReviews;
    draft.quality = evaluateDraftQuality(updatedArticle);
    draft.reviewHistory = Array.isArray(draft.reviewHistory) ? draft.reviewHistory : [];
    draft.reviewHistory.push({
      action: 'rewrite_requested',
      rating,
      comment: comment || 'Yêu cầu viết lại',
      revisionSummary: String(raw?.revisionSummary || 'Đã viết lại toàn bộ bài theo góp ý').trim(),
      at: nowIso,
    });
    if (reviewed.aiReviews?.status && reviewed.aiReviews.status !== 'skipped') {
      draft.reviewHistory.push({
        action: 'ai_reviewed',
        rating: null,
        comment: `xKiro (${reviewed.aiReviews.reviewers.map((r) => `${r.label}: ${r.score ?? 'err'}`).join(' · ')})`,
        revisionSummary: reviewed.aiReviews.autoPolished ? reviewed.aiReviews.polishSummary : '',
        at: new Date().toISOString(),
      });
    }
    draftsData.updatedAt = nowIso;

    fs.writeFileSync(DRAFTS_PATH, JSON.stringify(draftsData, null, 2) + '\n', 'utf8');
    console.log(`REWRITTEN "${draftId}" -> v${draft.version} (SEO score: ${draft.quality.score}/100, xKiro avg: ${reviewed.aiReviews?.averageScore ?? 'skipped'}).`);
    return;
  }

  // Default / --scan-trends mode
  const count = Math.max(1, Math.min(4, Number(args.count) || 2));
  const maxPending = Math.max(2, Number(args['max-pending']) || 24);
  const pendingCount = drafts.filter((d) => d.status === 'pending_review').length;

  let csvText = '';
  if (typeof args['csv-base64'] === 'string' && args['csv-base64'].trim()) {
    csvText = Buffer.from(args['csv-base64'].trim(), 'base64').toString('utf8');
  } else if (typeof args['csv-file'] === 'string' && args['csv-file'].trim() && fs.existsSync(args['csv-file'].trim())) {
    csvText = fs.readFileSync(args['csv-file'].trim(), 'utf8');
  }
  const customQueries = typeof args.queries === 'string' ? args.queries : '';

  const collected = await collectTrendTopics({
    publishedArticles: articles,
    drafts,
    queueTopics,
    count: pendingCount >= maxPending ? 0 : count,
    customQueries,
    csvText,
  });

  const snapshotPayload = {
    schema: 1,
    fetchedAt: collected.fetchedAt,
    geo: 'VN',
    sources: collected.sources,
    rawCount: collected.rawCount,
    topics: collected.topics.map((t) => ({
      query: t.query,
      slug: t.slug,
      category: t.category,
      hskTag: t.hskTag,
      spike: t.spike,
      source: t.source,
      score: t.score,
    })),
  };
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshotPayload, null, 2) + '\n', 'utf8');

  if (pendingCount >= maxPending) {
    console.log(`Pending queue has ${pendingCount}/${maxPending} drafts waiting for review; skipped new AI draft generation.`);
    return;
  }

  if (!collected.topics.length) {
    console.log('No unique new trend topics found after deduplication.');
    return;
  }

  const aiConfig = resolveAiConfig(process.env, args);
  const existingSlugs = articles.map((a) => a.slug);
  const createdIds = [];

  for (const picked of collected.topics) {
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

    console.log(`Generating trend draft "${picked.query}" [${picked.source}] via ${aiConfig.provider} / ${aiConfig.model}...`);
    const raw = await callAiJson(prompt, aiConfig);
    const initialArticle = normalizeGeneratedArticle(raw, {
      slug: picked.slug,
      category: picked.category,
      hskTag: picked.hskTag,
      today,
      existingSlugs,
      editorialVoice: voice.id,
      fallbackSources: [],
    });

    const reviewed = await runXkiroReviewAndPolish({
      article: initialArticle,
      trendQuery: picked.query,
      category: picked.category,
      hskTag: picked.hskTag,
      editorialVoice: voice.id,
      today,
      existingSlugs,
      aiConfig,
      args,
    });
    const article = reviewed.article;

    const nowIso = new Date().toISOString();
    const stamp = nowIso.replace(/[-:TZ.]/g, '').slice(0, 14);
    const draftId = `draft-${stamp}-${article.slug.slice(0, 36)}`;
    const reviewHistory = [
      {
        action: 'generated',
        rating: null,
        comment: `Sinh tự động bởi Gemma 4 từ ${picked.source}${picked.spike ? ` (${picked.spike})` : ''}`,
        at: nowIso,
      },
    ];
    if (reviewed.aiReviews?.status && reviewed.aiReviews.status !== 'skipped') {
      reviewHistory.push({
        action: 'ai_reviewed',
        rating: null,
        comment: `xKiro (${reviewed.aiReviews.reviewers.map((r) => `${r.label}: ${r.score ?? 'err'}`).join(' · ')})`,
        revisionSummary: reviewed.aiReviews.autoPolished ? reviewed.aiReviews.polishSummary : '',
        at: new Date().toISOString(),
      });
    }

    const draft = {
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
      aiReviews: reviewed.aiReviews,
      quality: evaluateDraftQuality(article),
      rating: null,
      reviewHistory,
      article,
      publishedSlug: '',
      approvedAt: '',
    };

    drafts.unshift(draft);
    createdIds.push(draftId);
  }

  draftsData.drafts = drafts;
  draftsData.updatedAt = new Date().toISOString();
  fs.writeFileSync(DRAFTS_PATH, JSON.stringify(draftsData, null, 2) + '\n', 'utf8');
  console.log(`Generated ${createdIds.length} new draft(s): ${createdIds.join(', ')}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
