/**
 * Cloudflare Worker `hsk-seo-editorial` (ChatGPT-Only Editorial Gateway):
 * - Exposes ChatGPT Web Plus MCP & REST endpoints to read SEO briefs, submit new drafts,
 *   and revise pending drafts requested by Admin.
 * - Stores drafts & gateway configuration in Cloudflare R2 under `seo-editorial/`.
 * - Exposes Admin-only API endpoints authenticated via Firebase ID Token (`identity()`).
 * - Exposes public read-only `GET /public/approved-queue` for zero-token GitHub Actions publishing.
 */
import { identity } from '../music/worker.mjs';
import {
  buildAdminGatewayConfigResponse,
  generateGatewayKey,
  getPrimaryGatewayKey,
  handleChatgptGatewayRoute,
  matchChatgptRoute,
  readGatewayConfig,
  writeGatewayConfig,
} from './chatgpt-gateway.mjs';

const R2_DRAFTS_KEY = 'seo-editorial/drafts.json';

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

export async function handleSeoEditorialFetch(request, env, ctx, deps = {}) {
  const fetchImpl = deps.fetchImpl || fetch;
  const url = new URL(request.url);

  const chatgptRoute = matchChatgptRoute(url.pathname);
  if (chatgptRoute) {
    return handleChatgptGatewayRoute(request, chatgptRoute, {
      env,
      fetchImpl,
      readDrafts: () => readR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, emptyDrafts()),
      writeDrafts: (nextDraftsData) => writeR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, nextDraftsData),
      fetchPublished: () => fetchPublishedArticles(env, fetchImpl),
    });
  }

  const origin = request.headers.get('Origin') || '';
  if (origin && !isOriginAllowed(origin, env)) {
    return new Response('Origin not allowed', { status: 403 });
  }
  const baseHeaders = corsHeaders(origin, env);
  const json = (body, status = 200) => Response.json(body, { status, headers: baseHeaders });

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: baseHeaders });
  }

  if (url.pathname === '/health' && request.method === 'GET') {
    const gwCfg = await readGatewayConfig(env.SEO_BUCKET, env);
    const primaryKey = getPrimaryGatewayKey(env, gwCfg);
    return json({
      ok: true,
      service: 'hsk-seo-editorial',
      mode: 'chatgpt-only',
      hasR2: Boolean(env.SEO_BUCKET),
      chatgptGateway: {
        enabled: gwCfg.enabled !== false,
        keyConfigured: Boolean(primaryKey.key),
        hourlyLimit: gwCfg.hourlyLimit,
        protocols: ['mcp-streamable-http', 'rest-openapi-3.1'],
      },
    });
  }

  if (url.pathname === '/public/approved-queue' && request.method === 'GET') {
    const draftsData = await readR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, emptyDrafts());
    const drafts = Array.isArray(draftsData?.drafts) ? draftsData.drafts : [];
    const items = drafts
      .filter(
        (d) =>
          d &&
          d.status === 'approved' &&
          d.article &&
          typeof d.article === 'object' &&
          String(d.article.title || '').trim() &&
          Array.isArray(d.article.sections) &&
          d.article.sections.length >= 1
      )
      .map((d) => ({
        id: d.id,
        approvedAt: d.approvedAt || d.updatedAt || '',
        publishedSlug: d.publishedSlug || d.article.slug || '',
        article: d.article,
      }));
    return Response.json(
      {
        ok: true,
        count: items.length,
        updatedAt: draftsData?.updatedAt || '',
        items,
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    );
  }

  try {
    await requireAdmin(request, env, fetchImpl);

    if (url.pathname === '/api/drafts' && request.method === 'GET') {
      const draftsData = await readR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, emptyDrafts());
      return json({
        ok: true,
        mode: 'chatgpt-only',
        draftsData,
        trendsSnapshot: emptySnapshot(),
        lastRun: null,
      });
    }

    if (url.pathname === '/api/scan-trends' && request.method === 'POST') {
      return json(
        { error: 'Đã tắt các AI tự viết bài nội bộ. Chỉ tiếp nhận bài qua Cổng ChatGPT.' },
        410
      );
    }

    if (url.pathname === '/api/rewrite' && request.method === 'POST') {
      const payload = await request.json().catch(() => ({}));
      const draftId = String(payload?.draftId || '').trim();
      if (!draftId) return json({ error: 'Thiếu draftId.' }, 400);

      const comment = String(payload?.comment || '').trim();
      if (!comment) {
        return json({ error: 'Hãy nhập góp ý cần sửa để gửi cho ChatGPT.' }, 400);
      }

      const draftsData = await readR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, emptyDrafts());
      const drafts = Array.isArray(draftsData.drafts) ? draftsData.drafts : [];
      const draft = drafts.find((d) => d && d.id === draftId);
      if (!draft) return json({ error: `Không tìm thấy bản nháp "${draftId}".` }, 404);
      if (draft.status === 'approved') {
        return json({ error: 'Bài nháp này đã được duyệt, không thể yêu cầu sửa.' }, 409);
      }

      const nowIso = new Date().toISOString();
      const numericRating = payload?.rating ? Math.max(1, Math.min(5, Math.round(Number(payload.rating)))) : draft.rating || null;
      draft.status = 'pending_review';
      draft.rating = numericRating;
      draft.updatedAt = nowIso;
      draft.revisionRequest = {
        comment,
        rating: numericRating,
        requestedAt: nowIso,
      };
      draft.reviewHistory = Array.isArray(draft.reviewHistory) ? draft.reviewHistory : [];
      draft.reviewHistory.push({
        action: 'revision_requested_for_chatgpt',
        rating: numericRating,
        comment,
        at: nowIso,
      });
      draftsData.updatedAt = nowIso;
      await writeR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, draftsData);
      return json({ ok: true, mode: 'chatgpt-revision-request', draft, draftsData });
    }

    if (url.pathname === '/api/reject' && request.method === 'POST') {
      const payload = await request.json().catch(() => ({}));
      const draftId = String(payload?.draftId || '').trim();
      if (!draftId) return json({ error: 'Thiếu draftId.' }, 400);

      const draftsData = await readR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, emptyDrafts());
      const drafts = Array.isArray(draftsData.drafts) ? draftsData.drafts : [];
      const draft = drafts.find((d) => d && d.id === draftId);
      if (!draft) return json({ error: `Không tìm thấy bản nháp "${draftId}".` }, 404);

      const nowIso = new Date().toISOString();
      const numericRating = payload?.rating ? Math.max(1, Math.min(5, Math.round(Number(payload.rating)))) : draft.rating || null;
      draft.status = 'rejected';
      draft.revisionRequest = null;
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
      const draft = drafts.find((d) => d && d.id === draftId);
      if (!draft) return json({ error: `Không tìm thấy bản nháp "${draftId}".` }, 404);
      if (!draft.article) return json({ error: 'Bản nháp thiếu nội dung article.' }, 400);

      const nowIso = new Date().toISOString();
      const today = nowIso.slice(0, 10);
      const numericRating = payload?.rating ? Math.max(1, Math.min(5, Math.round(Number(payload.rating)))) : draft.rating || null;

      draft.article.publishedAt = draft.article.publishedAt || today;
      draft.article.updatedAt = today;
      draft.status = 'approved';
      draft.publishState = 'queued';
      draft.revisionRequest = null;
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
      return json({
        ok: true,
        draft,
        article: draft.article,
        draftsData,
        autoPublishMode: 'zero-token-queue',
      });
    }

    if (url.pathname === '/api/chatgpt-gateway/config' && request.method === 'GET') {
      const [storedConfig, draftsData] = await Promise.all([
        readGatewayConfig(env.SEO_BUCKET, env),
        readR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, emptyDrafts()),
      ]);
      return json(
        buildAdminGatewayConfigResponse({
          baseUrl: url.origin,
          env,
          storedConfig,
          drafts: draftsData.drafts || [],
        })
      );
    }

    if (url.pathname === '/api/chatgpt-gateway/rotate' && request.method === 'POST') {
      const [storedConfig, draftsData] = await Promise.all([
        readGatewayConfig(env.SEO_BUCKET, env),
        readR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, emptyDrafts()),
      ]);
      const nowIso = new Date().toISOString();
      const nextConfig = {
        ...storedConfig,
        enabled: true,
        runAiReview: false,
        apiKey: generateGatewayKey(),
        rotatedAt: nowIso,
        updatedAt: nowIso,
      };
      await writeGatewayConfig(env.SEO_BUCKET, nextConfig);
      return json(
        buildAdminGatewayConfigResponse({
          baseUrl: url.origin,
          env,
          storedConfig: nextConfig,
          drafts: draftsData.drafts || [],
        })
      );
    }

    if (url.pathname === '/api/chatgpt-gateway/settings' && request.method === 'POST') {
      const payload = await request.json().catch(() => ({}));
      const [storedConfig, draftsData] = await Promise.all([
        readGatewayConfig(env.SEO_BUCKET, env),
        readR2Json(env.SEO_BUCKET, R2_DRAFTS_KEY, emptyDrafts()),
      ]);
      const nowIso = new Date().toISOString();
      const hourlyNum = Number(payload?.hourlyLimit);
      const nextConfig = {
        ...storedConfig,
        enabled: typeof payload?.enabled === 'boolean' ? payload.enabled : storedConfig.enabled,
        runAiReview: false,
        hourlyLimit: Number.isFinite(hourlyNum) && hourlyNum >= 1 ? Math.min(6, Math.round(hourlyNum)) : storedConfig.hourlyLimit,
        updatedAt: nowIso,
      };
      await writeGatewayConfig(env.SEO_BUCKET, nextConfig);
      return json(
        buildAdminGatewayConfigResponse({
          baseUrl: url.origin,
          env,
          storedConfig: nextConfig,
          drafts: draftsData.drafts || [],
        })
      );
    }

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    const status = err?.status || 500;
    return json({ error: err?.message || 'Lỗi xử lý Worker biên tập SEO.' }, status);
  }
}

export default {
  fetch: handleSeoEditorialFetch,
};
