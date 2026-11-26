/**
 * Cloudflare Worker `hsk-seo-editorial`:
 * - Runs scheduled Google Trends VN + Suggest scan every 2 hours (minute 35).
 * - Stores drafts & trends snapshot in R2 under isolated `seo-editorial/` prefix.
 * - Exposes Admin-only API endpoints authenticated via Firebase ID Token (`identity()`).
 */
import { identity } from '../music/worker.mjs';
import {
  collectTrendTopicsWorker,
  generateDraftForTopic,
  rewriteDraftRecord,
} from './pipeline-core.mjs';

const R2_DRAFTS_KEY = 'seo-editorial/drafts.json';
const R2_SNAPSHOT_KEY = 'seo-editorial/trends-snapshot.json';
const R2_LASTRUN_KEY = 'seo-editorial/last-run.json';

function emptyDrafts() {
  return { schema: 1, updatedAt: '', drafts: [] };
}

function emptySnapshot() {
  return { schema: 1, fetchedAt: '', sources: [], rawCount: 0, topics: [] };
}

function isOriginAllowed(origin, env) {
  if (!origin) return false;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;
  const allowed = String(
    env.ALLOWED_ORIGINS || 'https://hskfreelearningai.pages.dev,https://trungxemcode.github.io'
  )
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  return allowed.includes(origin);
}

function corsHeaders(origin, env) {
  const headers = new Headers({
    Vary: 'Origin',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-SEO-Test-Key',
  });
  if (origin && isOriginAllowed(origin, env)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  return headers;
}

async function readR2Json(bucket, key, fallback) {
  if (!bucket) return fallback;
  try {
    const obj = await bucket.get(key);
    if (!obj) return fallback;
    return await obj.json();
  } catch (_) {
    return fallback;
  }
}

async function writeR2Json(bucket, key, value) {
  if (!bucket) throw new Error('SEO_BUCKET R2 binding missing');
  await bucket.put(key, JSON.stringify(value, null, 2) + '\n', {
    httpMetadata: { contentType: 'application/json; charset=utf-8' },
  });
}

async function fetchPublishedArticles(env, fetchImpl = fetch) {
  const url = String(
    env.PUBLISHED_ARTICLES_URL || 'https://hskfreelearningai.pages.dev/content/seo-articles/articles.json'
  ).trim();
  if (!url) return [];
  try {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.articles) ? data.articles : [];
  } catch (_) {
    return [];
  }
}

async function requireAdmin(request, env, fetchImpl = fetch) {
  const configuredTestKey = String(env.SEO_TEST_KEY || '').trim();
  const suppliedTestKey = String(request.headers.get('X-SEO-Test-Key') || '').trim();
  if (configuredTestKey && suppliedTestKey && suppliedTestKey === configuredTestKey) {
    return { uid: 'test-runner', admin: true };
  }
  const actor = await identity(request, env, fetchImpl);
  if (!actor.admin) {
    throw Object.assign(new Error('Chỉ tài khoản Admin mới được phép truy cập phòng biên tập SEO.'), { status: 403 });
  }
  return actor;
}

export async function runScanTrendsPipeline(
  env,
  { count, maxPending, customQueries = '', csvText = '', trigger = 'manual', fetchImpl = fetch } = {}
) {
  const draftsData = await readR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, emptyDrafts());
  const drafts = Array.isArray(draftsData.drafts) ? draftsData.drafts : [];
  const effectiveMaxPending = Math.max(2, Number(maxPending || env.MAX_PENDING_DRAFTS) || 24);
  const requestedCount = Math.max(1, Math.min(2, Number(count || env.DEFAULT_CRON_COUNT) || 1));
  const pendingCount = drafts.filter((d) => d.status === 'pending_review').length;
  const publishedArticles = await fetchPublishedArticles(env, fetchImpl);

  const collected = await collectTrendTopicsWorker({
    publishedArticles,
    drafts,
    count: pendingCount >= effectiveMaxPending ? 0 : requestedCount,
    customQueries,
    csvText,
    fetchImpl,
  });

  const trendsSnapshot = {
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
  await writeR2Json(env.SEO_BUCKET, R2_SNAPSHOT_KEY, trendsSnapshot);

  const createdDrafts = [];
  const existingSlugs = publishedArticles.map((a) => a.slug).filter(Boolean);
  const today = new Date().toISOString().slice(0, 10);
  const startedMs = Date.now();
  let runError = '';

  await writeR2Json(env.SEO_BUCKET, R2_LASTRUN_KEY, {
    at: new Date().toISOString(),
    trigger,
    status: 'generating',
    pickedTopics: collected.topics.map((t) => t.query),
    createdCount: 0,
    createdIds: [],
    error: '',
  });

  if (pendingCount < effectiveMaxPending && collected.topics.length > 0) {
    for (const picked of collected.topics) {
      try {
        const draft = await generateDraftForTopic({
          picked,
          existingSlugs,
          today,
          env,
          fetchImpl,
        });
        drafts.unshift(draft);
        createdDrafts.push(draft);
      } catch (err) {
        runError = String(err?.message || err);
        break;
      }
    }
    if (createdDrafts.length > 0) {
      draftsData.drafts = drafts;
      draftsData.updatedAt = new Date().toISOString();
      await writeR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, draftsData);
    }
  }

  const lastRun = {
    at: new Date().toISOString(),
    trigger,
    status: runError ? 'error' : 'completed',
    durationMs: Date.now() - startedMs,
    pendingCount: drafts.filter((d) => d.status === 'pending_review').length,
    createdCount: createdDrafts.length,
    createdIds: createdDrafts.map((d) => d.id),
    skippedReason:
      pendingCount >= effectiveMaxPending
        ? `pending_queue_full(${pendingCount}/${effectiveMaxPending})`
        : (!collected.topics.length ? 'no_unique_topics' : ''),
    error: runError,
  };
  await writeR2Json(env.SEO_BUCKET, R2_LASTRUN_KEY, lastRun);

  if (runError && createdDrafts.length === 0) {
    throw Object.assign(new Error(runError), { status: 502 });
  }

  return {
    ok: true,
    createdIds: lastRun.createdIds,
    createdDrafts,
    draftsData,
    trendsSnapshot,
    lastRun,
  };
}

export async function handleSeoEditorialFetch(request, env, ctx, deps = {}) {
  const fetchImpl = deps.fetchImpl || fetch;
  const origin = request.headers.get('Origin') || '';
  if (origin && !isOriginAllowed(origin, env)) {
    return new Response('Origin not allowed', { status: 403 });
  }
  const baseHeaders = corsHeaders(origin, env);
  const json = (body, status = 200) => Response.json(body, { status, headers: baseHeaders });

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: baseHeaders });
  }

  const url = new URL(request.url);
  if (url.pathname === '/health' && request.method === 'GET') {
    return json({
      ok: true,
      service: 'hsk-seo-editorial',
      cron: '35 */2 * * *',
      hasAI: Boolean(env.AI),
      hasR2: Boolean(env.SEO_BUCKET),
      hasXkiro: Boolean(env.XKIRO_API_KEY || env.SECONDARY_AI_API_KEY),
      hasOpenRouter: Boolean(env.OPENROUTER_API_KEY),
      models: {
        writer: env.CF_WRITER_MODEL || '@cf/google/gemma-4-26b-a4b-it',
        writerFallback: env.CF_WRITER_FALLBACK_MODEL || '@cf/qwen/qwen3.8-27b',
        reviewer1: env.CF_REVIEWER_1_MODEL || '@cf/qwen/qwen3.8-27b',
        reviewer2: env.CF_REVIEWER_2_MODEL || '@cf/mistralai/mistral-small-3.1-24b-instruct',
      },
    });
  }

  try {
    await requireAdmin(request, env, fetchImpl);

    if (url.pathname === '/api/drafts' && request.method === 'GET') {
      const [draftsData, trendsSnapshot, lastRun] = await Promise.all([
        readR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, emptyDrafts()),
        readR2Json(env.SEO_BUCKET, R2_SNAPSHOT_KEY, emptySnapshot()),
        readR2Json(env.SEO_BUCKET, R2_LASTRUN_KEY, null),
      ]);
      return json({ ok: true, draftsData, trendsSnapshot, lastRun });
    }

    if (url.pathname === '/api/scan-trends' && request.method === 'POST') {
      const payload = await request.json().catch(() => ({}));
      const result = await runScanTrendsPipeline(env, {
        count: payload?.count,
        maxPending: payload?.maxPending,
        customQueries: typeof payload?.customQueries === 'string' ? payload.customQueries : '',
        csvText: typeof payload?.csvText === 'string' ? payload.csvText : '',
        trigger: 'manual',
        fetchImpl,
      });
      return json(result);
    }

    if (url.pathname === '/api/rewrite' && request.method === 'POST') {
      const payload = await request.json().catch(() => ({}));
      const draftId = String(payload?.draftId || '').trim();
      if (!draftId) return json({ error: 'Thiếu draftId.' }, 400);

      const draftsData = await readR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, emptyDrafts());
      const drafts = Array.isArray(draftsData.drafts) ? draftsData.drafts : [];
      const draft = drafts.find((d) => d.id === draftId);
      if (!draft) return json({ error: `Không tìm thấy bản nháp "${draftId}".` }, 404);

      const publishedArticles = await fetchPublishedArticles(env, fetchImpl);
      const existingSlugs = publishedArticles.map((a) => a.slug).filter(Boolean);
      const today = new Date().toISOString().slice(0, 10);

      await rewriteDraftRecord({
        draft,
        comment: typeof payload?.comment === 'string' ? payload.comment : '',
        rating: payload?.rating || null,
        existingSlugs,
        today,
        env,
        fetchImpl,
      });

      draftsData.updatedAt = new Date().toISOString();
      await writeR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, draftsData);
      return json({ ok: true, draft, draftsData });
    }

    if (url.pathname === '/api/reject' && request.method === 'POST') {
      const payload = await request.json().catch(() => ({}));
      const draftId = String(payload?.draftId || '').trim();
      if (!draftId) return json({ error: 'Thiếu draftId.' }, 400);

      const draftsData = await readR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, emptyDrafts());
      const drafts = Array.isArray(draftsData.drafts) ? draftsData.drafts : [];
      const draft = drafts.find((d) => d.id === draftId);
      if (!draft) return json({ error: `Không tìm thấy bản nháp "${draftId}".` }, 404);

      const nowIso = new Date().toISOString();
      const numericRating = payload?.rating ? Math.max(1, Math.min(5, Math.round(Number(payload.rating)))) : draft.rating || null;
      draft.status = 'rejected';
      draft.updatedAt = nowIso;
      draft.rating = numericRating;
      draft.reviewHistory = Array.isArray(draft.reviewHistory) ? draft.reviewHistory : [];
      draft.reviewHistory.push({
        action: 'rejected',
        rating: numericRating,
        comment: String(payload?.comment || '').trim() || 'Từ chối xuất bản bản nháp này',
        at: nowIso,
      });
      draftsData.updatedAt = nowIso;
      await writeR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, draftsData);
      return json({ ok: true, draft, draftsData });
    }

    if (url.pathname === '/api/approve' && request.method === 'POST') {
      const payload = await request.json().catch(() => ({}));
      const draftId = String(payload?.draftId || '').trim();
      if (!draftId) return json({ error: 'Thiếu draftId.' }, 400);

      const draftsData = await readR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, emptyDrafts());
      const drafts = Array.isArray(draftsData.drafts) ? draftsData.drafts : [];
      const draft = drafts.find((d) => d.id === draftId);
      if (!draft) return json({ error: `Không tìm thấy bản nháp "${draftId}".` }, 404);
      if (!draft.article) return json({ error: 'Bản nháp thiếu nội dung article.' }, 400);

      const nowIso = new Date().toISOString();
      const today = nowIso.slice(0, 10);
      const numericRating = payload?.rating ? Math.max(1, Math.min(5, Math.round(Number(payload.rating)))) : draft.rating || null;

      draft.article.publishedAt = draft.article.publishedAt || today;
      draft.article.updatedAt = today;
      draft.status = 'approved';
      draft.approvedAt = nowIso;
      draft.updatedAt = nowIso;
      draft.publishedSlug = draft.article.slug;
      draft.rating = numericRating;
      draft.reviewHistory = Array.isArray(draft.reviewHistory) ? draft.reviewHistory : [];
      draft.reviewHistory.push({
        action: 'approved',
        rating: numericRating,
        comment: String(payload?.comment || '').trim() || 'Đã duyệt & xuất bản tự động',
        at: nowIso,
      });
      draftsData.updatedAt = nowIso;
      await writeR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, draftsData);
      return json({ ok: true, draft, article: draft.article, draftsData });
    }

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    const status = err?.status || 500;
    return json({ error: err?.message || 'Lỗi xử lý Worker biên tập SEO.' }, status);
  }
}

export async function runScheduledEditorial(env, fetchImpl = fetch) {
  try {
    return await runScanTrendsPipeline(env, {
      count: Number(env.DEFAULT_CRON_COUNT) || 1,
      trigger: 'cron',
      fetchImpl,
    });
  } catch (err) {
    const lastRun = {
      at: new Date().toISOString(),
      trigger: 'cron',
      createdCount: 0,
      createdIds: [],
      error: String(err?.message || err),
    };
    await writeR2Json(env.SEO_BUCKET, R2_LASTRUN_KEY, lastRun).catch(() => {});
    return { ok: false, lastRun };
  }
}

export default {
  fetch: handleSeoEditorialFetch,
  scheduled(controller, env, ctx) {
    ctx.waitUntil(runScheduledEditorial(env));
  },
};
