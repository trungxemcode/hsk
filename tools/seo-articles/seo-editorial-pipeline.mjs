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
import { collectTrendTopics, normalizeTextForMatch } from './fetch-google-trends.mjs';
import {
  callAiJson,
  loadLocalEnv,
  normalizeGeneratedArticle,
  parseArgs,
  pickEditorialVoice,
  resolveAiConfig,
  slugifyVi,
} from './generate-ai-article.mjs';
import { evaluateDraftQuality as evaluateTechnicalQuality } from '../../server/seo-editorial/pipeline-core.mjs';
import { runDualXkiroReview } from './xkiro-reviewers.mjs';
import {
  WRITER_STANDARD_ID,
  buildStandardRevisionWriterPrompt,
  buildStandardTrendWriterPrompt,
  selectWriterStyle,
} from './writer-standard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const ARTICLES_PATH = path.join(ROOT, 'content/seo-articles/articles.json');
const QUEUE_PATH = path.join(ROOT, 'content/seo-articles/topic-queue.json');
const DRAFTS_PATH = path.join(ROOT, 'content/seo-articles/drafts.json');
const SNAPSHOT_PATH = path.join(ROOT, 'content/seo-articles/trends-snapshot.json');

export function evaluateDraftQuality(article) {
  return evaluateTechnicalQuality(article, validateArticle);
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

export function resolveUniqueArticleSlug(desiredSlug, existingArticles = []) {
  const base = slugifyVi(desiredSlug) || `bai-viet-hsk-${Date.now()}`;
  const taken = new Set(existingArticles.map((a) => a.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export function buildAutoPolishPrompt({ article, trendQuery, reviewBundle, existingSlugs = [], today }) {
  return buildStandardRevisionWriterPrompt({
    draft: {
      version: 1,
      trendQuery: trendQuery || article?.title,
      category: article?.category || 'meo-hoc',
      editorialVoice: article?.editorialVoice || '',
      article,
    },
    sanitizedFeedback: reviewBundle?.combinedFeedback || 'Hãy rà soát lại Pinyin, ví dụ Hán–Việt, độ sâu ngữ pháp và tính tự nhiên tiếng Việt.',
    adminComment: '',
    rating: null,
    existingSlugs,
    today,
  });
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

export function syncApprovedQueueIntoArticles({ queueItems = [], articlesData, today }) {
  const articles = Array.isArray(articlesData?.articles) ? articlesData.articles : [];
  const effectiveToday = today || new Date().toISOString().slice(0, 10);
  const existingSlugs = new Set(articles.map((a) => String(a?.slug || '').trim()).filter(Boolean));
  const existingDraftIds = new Set(articles.map((a) => String(a?.sourceDraftId || '').trim()).filter(Boolean));
  const existingTitleNorms = new Set(
    articles.map((a) => normalizeTextForMatch(a?.title || '')).filter(Boolean)
  );

  const added = [];
  // Place the latest approval first regardless of when each draft was created.
  const ordered = [...(Array.isArray(queueItems) ? queueItems : [])]
    .sort((a, b) => String(a?.approvedAt || '').localeCompare(String(b?.approvedAt || '')));

  for (const item of ordered) {
    const draftId = String(item?.id || '').trim();
    const rawArticle = item?.article;
    if (!rawArticle || typeof rawArticle !== 'object' || !String(rawArticle.title || '').trim()) {
      continue;
    }

    const rawSlug = slugifyVi(item?.publishedSlug || rawArticle.slug || rawArticle.title);
    const titleNorm = normalizeTextForMatch(rawArticle.title);
    if (draftId && existingDraftIds.has(draftId)) continue;
    if (rawSlug && existingSlugs.has(rawSlug)) continue;
    if (titleNorm && existingTitleNorms.has(titleNorm)) continue;

    const currentSlugs = articles.map((a) => a.slug);
    const normalized = normalizeGeneratedArticle(rawArticle, {
      slug: rawSlug || slugifyVi(rawArticle.title),
      category: rawArticle.category || 'meo-hoc',
      hskTag: rawArticle.hskTag || 'HSK 1–6',
      today: effectiveToday,
      existingSlugs: currentSlugs,
      editorialVoice: rawArticle.editorialVoice || '',
      fallbackSources: [],
    });
    const finalSlug = resolveUniqueArticleSlug(rawSlug || normalized.slug, articles);
    const publishedArticle = {
      ...normalized,
      slug: finalSlug,
      ...(draftId ? { sourceDraftId: draftId } : {}),
      publishedAt: rawArticle.publishedAt || effectiveToday,
      updatedAt: effectiveToday,
    };
    validateArticle(publishedArticle);

    articles.unshift(publishedArticle);
    existingSlugs.add(finalSlug);
    if (draftId) existingDraftIds.add(draftId);
    if (titleNorm) existingTitleNorms.add(titleNorm);
    added.push(publishedArticle);
  }

  articlesData.articles = articles;
  return { added, totalArticles: articles.length };
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

  if (args['sync-approved-from-url']) {
    const defaultQueueUrl = 'https://hsk-seo-editorial.trung-hsk668.workers.dev/public/approved-queue';
    const queueUrl =
      typeof args['sync-approved-from-url'] === 'string' && /^https?:\/\//i.test(args['sync-approved-from-url'])
        ? args['sync-approved-from-url'].trim()
        : defaultQueueUrl;
    const res = await fetch(queueUrl, {
      headers: { Accept: 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      throw new Error(`Không tải được approved queue (${res.status}): ${queueUrl}`);
    }
    const payload = await res.json();
    if (payload?.ok !== true || !Array.isArray(payload.items) || payload.count !== payload.items.length) {
      throw new Error('Phản hồi hàng đợi SEO không đúng định dạng.');
    }
    const { added } = syncApprovedQueueIntoArticles({
      queueItems: payload.items,
      articlesData,
      today,
    });
    if (!added.length) {
      console.log('No new approved SEO articles to publish.');
      return;
    }
    fs.writeFileSync(ARTICLES_PATH, JSON.stringify(articlesData, null, 2) + '\n', 'utf8');
    const built = buildAllSeoArticles();
    console.log(`SYNCED ${added.length} approved article(s): ${added.map((a) => a.slug).join(', ')} (${built.count} total, ${built.urls} URLs).`);
    return;
  }

  if (args.approve) {
    const draftId = String(args['draft-id'] || '').trim();
    const articleJsonB64 = typeof args['article-json-base64'] === 'string' ? args['article-json-base64'].trim() : '';
    const rating = args.rating ? Number(args.rating) : null;
    const comment = typeof args.comment === 'string' ? args.comment : '';

    if (articleJsonB64) {
      const decodedRaw = JSON.parse(Buffer.from(articleJsonB64, 'base64').toString('utf8'));
      const existingSlugs = articles.map((a) => a.slug);
      const normalized = normalizeGeneratedArticle(decodedRaw, {
        slug: decodedRaw.slug || slugifyVi(decodedRaw.title),
        category: decodedRaw.category || 'meo-hoc',
        hskTag: decodedRaw.hskTag || 'HSK 1–6',
        today,
        existingSlugs,
        editorialVoice: decodedRaw.editorialVoice || '',
        fallbackSources: [],
      });
      const finalSlug = resolveUniqueArticleSlug(decodedRaw.slug || normalized.slug, articles);
      const publishedArticle = {
        ...normalized,
        slug: finalSlug,
        publishedAt: decodedRaw.publishedAt || today,
        updatedAt: today,
      };
      validateArticle(publishedArticle);
      articlesData.articles = [publishedArticle, ...articles.filter((a) => a.slug !== finalSlug)];
      fs.writeFileSync(ARTICLES_PATH, JSON.stringify(articlesData, null, 2) + '\n', 'utf8');
      const built = buildAllSeoArticles();
      console.log(`APPROVED "${draftId || publishedArticle.slug}" (CF bridge) -> published "${publishedArticle.slug}" (${built.count} SEO articles, ${built.urls} URLs).`);
      return;
    }

    if (!draftId) throw new Error('Thiếu --draft-id khi chạy --approve');
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
    const style = selectWriterStyle({ topic: picked.topic, query: picked.query, category: picked.category });
    const prompt = buildTrendDraftPrompt({
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

    console.log(`Generating trend draft "${picked.query}" [${picked.source}] (${WRITER_STANDARD_ID}:${style.id}) via ${aiConfig.provider} / ${aiConfig.model}...`);
    const raw = await callAiJson(prompt, aiConfig);
    const writerBrief = raw?.writerBrief && typeof raw.writerBrief === 'object'
      ? raw.writerBrief
      : { styleId: style.id, styleReason: style.reason, primaryKeyword: picked.query };
    const initialArticle = normalizeGeneratedArticle(raw, {
      slug: picked.slug,
      category: picked.category,
      hskTag: picked.hskTag,
      today,
      existingSlugs,
      editorialVoice: style.id,
      fallbackSources: [],
    });

    const reviewed = await runXkiroReviewAndPolish({
      article: initialArticle,
      trendQuery: picked.query,
      category: picked.category,
      hskTag: picked.hskTag,
      editorialVoice: style.id,
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
        comment: `Sinh tự động bởi Gemma 4 (${WRITER_STANDARD_ID}:${style.id}) từ ${picked.source}${picked.spike ? ` (${picked.spike})` : ''}`,
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
      editorialVoice: style.id,
      writerBrief,
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
