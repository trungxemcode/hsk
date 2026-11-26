/**
 * ChatGPT Web Plus / MCP / REST SEO Ingest Gateway for `hsk-seo-editorial`.
 *
 * Hard security boundary:
 * - ChatGPT gateway credentials can ONLY read topic briefs, submit drafts into
 *   `status: "pending_review"`, and inspect draft review status/feedback.
 * - ChatGPT can NEVER approve, reject, rewrite, or trigger GitHub publishing.
 *   Only Admin authenticated via Firebase ID Token in `studio-duyet-bai-7f9k2x.html`
 *   can approve and push to GitHub.
 */
import {
  CATEGORIES,
  buildExistingCorpus,
  collectTrendTopicsWorker,
  evaluateDraftQuality,
  inferCategoryAndTag,
  isDuplicateTopic,
  isQueryAllowed,
  normalizeArticle,
  runReviewerCouncil,
  slugifyVi,
} from './pipeline-core.mjs';

export const R2_CHATGPT_GATEWAY_KEY = 'seo-editorial/chatgpt-gateway.json';

const MAX_BODY_BYTES = 120 * 1024;
const ONE_HOUR_MS = 60 * 60 * 1000;
const SUPPORTED_MCP_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

export function defaultGatewayConfig(env = {}) {
  const envHourly = Number(env.CHATGPT_MAX_PER_HOUR);
  return {
    schema: 1,
    enabled: true,
    apiKey: '',
    hourlyLimit: Number.isFinite(envHourly) && envHourly >= 1 ? Math.min(6, Math.round(envHourly)) : 2,
    runAiReview: true,
    updatedAt: '',
    rotatedAt: '',
    lastSubmission: null,
  };
}

export function timingSafeEqualStr(a, b) {
  const s1 = String(a || '');
  const s2 = String(b || '');
  if (!s1 || !s2) return false;
  const encoder = new TextEncoder();
  const b1 = encoder.encode(s1);
  const b2 = encoder.encode(s2);
  const len = Math.max(b1.length, b2.length);
  let diff = b1.length ^ b2.length;
  for (let i = 0; i < len; i++) {
    diff |= (b1[i] ?? 0) ^ (b2[i] ?? 0);
  }
  return diff === 0;
}

export function generateGatewayKey() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return `hsk_cgpt_${hex}`;
}

export function maskSecretKey(key) {
  const s = String(key || '').trim();
  if (!s) return '';
  if (s.length <= 14) return `${s.slice(0, 4)}••••`;
  return `${s.slice(0, 12)}••••••••${s.slice(-4)}`;
}

export async function readGatewayConfig(bucket, env = {}) {
  const base = defaultGatewayConfig(env);
  if (!bucket) return base;
  try {
    const obj = await bucket.get(R2_CHATGPT_GATEWAY_KEY);
    if (!obj) return base;
    const stored = await obj.json();
    const hourly = Number(stored?.hourlyLimit);
    return {
      ...base,
      enabled: stored?.enabled !== false,
      apiKey: typeof stored?.apiKey === 'string' ? stored.apiKey.trim() : '',
      hourlyLimit: Number.isFinite(hourly) && hourly >= 1 ? Math.min(6, Math.round(hourly)) : base.hourlyLimit,
      runAiReview: stored?.runAiReview !== false,
      updatedAt: String(stored?.updatedAt || ''),
      rotatedAt: String(stored?.rotatedAt || ''),
      lastSubmission: stored?.lastSubmission && typeof stored.lastSubmission === 'object' ? stored.lastSubmission : null,
    };
  } catch (_) {
    return base;
  }
}

export async function writeGatewayConfig(bucket, config) {
  if (!bucket) throw new Error('SEO_BUCKET R2 binding missing');
  await bucket.put(R2_CHATGPT_GATEWAY_KEY, JSON.stringify(config, null, 2) + '\n', {
    httpMetadata: { contentType: 'application/json; charset=utf-8' },
  });
}

export function getActiveGatewayKeys(env = {}, storedConfig = {}) {
  const keys = [];
  const envKey = String(env.CHATGPT_SEO_INGEST_KEY || '').trim();
  const r2Key = String(storedConfig?.apiKey || '').trim();
  if (r2Key) keys.push({ key: r2Key, source: 'r2' });
  if (envKey && !keys.some((k) => k.key === envKey)) keys.push({ key: envKey, source: 'env' });
  return keys;
}

export function getPrimaryGatewayKey(env = {}, storedConfig = {}) {
  const keys = getActiveGatewayKeys(env, storedConfig);
  return keys[0] || { key: '', source: 'none' };
}

export function extractSuppliedGatewayKey(request, pathKey = '') {
  if (pathKey) return String(pathKey).trim();
  const headerKey = String(request.headers.get('X-ChatGPT-Ingest-Key') || '').trim();
  if (headerKey) return headerKey;
  const auth = String(request.headers.get('Authorization') || '').trim();
  if (/^Bearer\s+/i.test(auth)) {
    return auth.replace(/^Bearer\s+/i, '').trim();
  }
  return '';
}

export function verifyChatgptGatewayAuth(request, env, storedConfig, pathKey = '') {
  if (storedConfig && storedConfig.enabled === false) {
    throw Object.assign(new Error('Cổng ChatGPT SEO đang tạm tắt bởi Admin trong Phòng Duyệt Bài.'), { status: 503 });
  }
  const activeKeys = getActiveGatewayKeys(env, storedConfig);
  if (!activeKeys.length) {
    throw Object.assign(
      new Error('Cổng ChatGPT chưa được khởi tạo khóa kết nối. Admin hãy mở Phòng Duyệt Bài → Cổng ChatGPT để tạo khóa.'),
      { status: 503 }
    );
  }
  const supplied = extractSuppliedGatewayKey(request, pathKey);
  if (!supplied) {
    throw Object.assign(
      new Error('Thiếu khóa xác thực ChatGPT Gateway (Authorization: Bearer <key>, X-ChatGPT-Ingest-Key, hoặc đường dẫn /api/chatgpt/k/<key>/mcp).'),
      { status: 401 }
    );
  }
  const matched = activeKeys.find((entry) => timingSafeEqualStr(supplied, entry.key));
  if (!matched) {
    throw Object.assign(new Error('Khóa xác thực ChatGPT Gateway không hợp lệ hoặc đã được Admin đổi mới.'), { status: 401 });
  }
  return matched;
}

export function isChatgptDraft(draft) {
  if (!draft || typeof draft !== 'object') return false;
  if (draft.authorSource === 'chatgpt') return true;
  const src = String(draft.trendSource || '').toLowerCase();
  return src.startsWith('chatgpt');
}

export function countRecentChatgptSubmissions(drafts = [], nowMs = Date.now()) {
  const cutoff = nowMs - ONE_HOUR_MS;
  const recent = [];
  for (const d of drafts) {
    if (!isChatgptDraft(d)) continue;
    const ts = Date.parse(d.createdAt || '');
    if (Number.isFinite(ts) && ts >= cutoff) {
      recent.push({ id: d.id, createdAt: d.createdAt, ts });
    }
  }
  recent.sort((a, b) => a.ts - b.ts);
  const retryAfterMinutes = recent.length
    ? Math.max(1, Math.ceil((recent[0].ts + ONE_HOUR_MS - nowMs) / 60000))
    : 0;
  return { count: recent.length, recent, retryAfterMinutes };
}

export function buildGatewayCorsHeaders(origin = '') {
  const headers = new Headers({
    Vary: 'Origin',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version, X-ChatGPT-Ingest-Key',
    'Access-Control-Expose-Headers': 'Mcp-Session-Id',
  });
  headers.set('Access-Control-Allow-Origin', origin || '*');
  return headers;
}

export function buildAdminGatewayConfigResponse({ baseUrl, env, storedConfig, drafts = [] }) {
  const primary = getPrimaryGatewayKey(env, storedConfig);
  const effectiveBase = String(baseUrl || 'https://hsk-seo-editorial.trung-hsk668.workers.dev').replace(/\/+$/, '');
  const maxPending = Math.max(2, Number(env.MAX_PENDING_DRAFTS) || 24);
  const pendingCount = drafts.filter((d) => d.status === 'pending_review').length;
  const chatgptDrafts = drafts.filter(isChatgptDraft);
  const hourly = countRecentChatgptSubmissions(drafts);

  return {
    ok: true,
    enabled: storedConfig.enabled !== false,
    keyConfigured: Boolean(primary.key),
    keySource: primary.source,
    maskedKey: maskSecretKey(primary.key),
    apiKey: primary.key,
    hourlyLimit: storedConfig.hourlyLimit,
    recentHourlyCount: hourly.count,
    retryAfterMinutes: hourly.count >= storedConfig.hourlyLimit ? hourly.retryAfterMinutes : 0,
    runAiReview: storedConfig.runAiReview !== false,
    maxPending,
    pendingCount,
    totalChatgptDrafts: chatgptDrafts.length,
    pendingChatgptDrafts: chatgptDrafts.filter((d) => d.status === 'pending_review').length,
    updatedAt: storedConfig.updatedAt || '',
    rotatedAt: storedConfig.rotatedAt || '',
    lastSubmission: storedConfig.lastSubmission || null,
    endpoints: {
      mcpSecretUrl: primary.key ? `${effectiveBase}/api/chatgpt/k/${primary.key}/mcp` : '',
      mcpBearerUrl: `${effectiveBase}/mcp`,
      openapiUrl: `${effectiveBase}/api/chatgpt/openapi.json`,
      restBriefUrl: `${effectiveBase}/api/chatgpt/brief`,
      restDraftsUrl: `${effectiveBase}/api/chatgpt/drafts`,
      restSecretDraftsUrl: primary.key ? `${effectiveBase}/api/chatgpt/k/${primary.key}/drafts` : '',
    },
  };
}

export async function buildChatgptBrief({
  env,
  storedConfig,
  drafts = [],
  publishedArticles = [],
  count = 5,
  customQueries = '',
  fetchImpl = fetch,
}) {
  const safeCount = Math.max(1, Math.min(8, Number(count) || 5));
  const maxPending = Math.max(2, Number(env.MAX_PENDING_DRAFTS) || 24);
  const pendingCount = drafts.filter((d) => d.status === 'pending_review').length;
  const hourly = countRecentChatgptSubmissions(drafts);

  const collected = await collectTrendTopicsWorker({
    publishedArticles,
    drafts,
    count: safeCount,
    customQueries,
    fetchImpl,
  });

  const existingPublished = publishedArticles.slice(0, 60).map((a) => ({
    slug: a.slug,
    title: a.title,
    category: a.category,
  }));

  const existingDrafts = drafts.slice(0, 40).map((d) => ({
    id: d.id,
    status: d.status,
    slug: d.article?.slug || '',
    title: d.article?.title || d.trendQuery || '',
    trendQuery: d.trendQuery || '',
  }));

  return {
    ok: true,
    fetchedAt: collected.fetchedAt,
    today: new Date().toISOString().slice(0, 10),
    approvalPolicy: {
      canPublishDirectly: false,
      forcedStatus: 'pending_review',
      note: 'Mọi bài ChatGPT nộp đều vào trạng thái pending_review trên Cloudflare R2 và PHẢI đợi Admin bấm Duyệt tại Phòng Duyệt Bài trước khi push lên GitHub.',
    },
    quota: {
      hourlyUsed: hourly.count,
      hourlyLimit: storedConfig.hourlyLimit,
      canSubmitNow: pendingCount < maxPending && hourly.count < storedConfig.hourlyLimit,
      retryAfterMinutes: hourly.count >= storedConfig.hourlyLimit ? hourly.retryAfterMinutes : 0,
      pendingCount,
      maxPending,
    },
    aiReviewEnabled: storedConfig.runAiReview !== false,
    suggestedTopics: collected.topics.map((t) => ({
      query: t.query,
      topic: t.topic,
      slug: t.slug,
      category: t.category,
      categoryLabel: CATEGORIES[t.category] || 'Mẹo học HSK',
      hskTag: t.hskTag,
      spike: t.spike || '',
      source: t.source || 'google-trends',
      score: t.score,
    })),
    validCategories: CATEGORIES,
    availableRelatedSlugs: publishedArticles.slice(0, 20).map((a) => a.slug).filter(Boolean),
    doNotDuplicate: {
      publishedCount: publishedArticles.length,
      publishedSample: existingPublished,
      recentDrafts: existingDrafts,
    },
    editorialRules: [
      'Viết 100% nội dung gốc bằng tiếng Việt tự nhiên cho người Việt học tiếng Trung HSK 1–6 (không dịch máy, không mở bài rập khuôn).',
      'metaTitle dài 35–75 ký tự, kết thúc bằng " | HSK Flashcards". metaDescription dài 110–170 ký tự.',
      'Có 3–4 sections với id bắt đầu bằng chữ cái thường (vd: "phan-biet-nhanh", "loi-nguoi-viet", "ung-dung").',
      'Có ít nhất 1 bảng (table) gồm 3–6 dòng (KHÔNG quá 6 dòng), ít nhất 1 khối example đủ { han, py, vi } chuẩn dấu thanh điệu Pinyin, ít nhất 1 tip và 2–3 faqs.',
      'TUYỆT ĐỐI không dùng các cụm từ cấm: "hạn mức", "hạn ngạch", "xác minh email", "yêu cầu đăng nhập".',
      'Chọn 2–3 relatedSlugs nằm trong danh sách availableRelatedSlugs.',
    ],
  };
}

function unwrapIncomingArticle(payload) {
  if (!payload || typeof payload !== 'object') {
    throw Object.assign(new Error('Body JSON không hợp lệ.'), { status: 400 });
  }
  const rawArticle = payload.article && typeof payload.article === 'object' ? payload.article : payload;
  if (!String(rawArticle?.title || '').trim()) {
    throw Object.assign(new Error('Thiếu tiêu đề bài viết (article.title).'), { status: 400 });
  }
  if (!Array.isArray(rawArticle?.sections) || rawArticle.sections.length < 2) {
    throw Object.assign(new Error('Bài viết cần ít nhất 2 mục nội dung (article.sections, khuyên dùng 3–4 mục).'), { status: 400 });
  }
  return rawArticle;
}

export async function submitChatgptDraft({
  payload,
  env,
  storedConfig,
  draftsData,
  publishedArticles = [],
  writeDrafts,
  writeConfig,
  fetchImpl = fetch,
}) {
  const drafts = Array.isArray(draftsData?.drafts) ? draftsData.drafts : [];
  const maxPending = Math.max(2, Number(env.MAX_PENDING_DRAFTS) || 24);
  const pendingCount = drafts.filter((d) => d.status === 'pending_review').length;

  if (pendingCount >= maxPending) {
    throw Object.assign(
      new Error(`Hàng đợi Chờ duyệt đã đầy (${pendingCount}/${maxPending}). Vui lòng đợi Admin duyệt bớt bài trong Phòng Duyệt Bài.`),
      { status: 429, code: 'pending_queue_full', pendingCount, maxPending }
    );
  }

  const hourly = countRecentChatgptSubmissions(drafts);
  if (hourly.count >= storedConfig.hourlyLimit) {
    throw Object.assign(
      new Error(`Đã đạt giới hạn ${storedConfig.hourlyLimit} bài ChatGPT/giờ (${hourly.count}/${storedConfig.hourlyLimit}). Hãy thử lại sau khoảng ${hourly.retryAfterMinutes} phút.`),
      { status: 429, code: 'hourly_limit_reached', retryAfterMinutes: hourly.retryAfterMinutes }
    );
  }

  const rawArticle = unwrapIncomingArticle(payload);
  const trendQuery = String(payload?.trendQuery || rawArticle?.trendQuery || rawArticle.title || '').trim();
  if (!isQueryAllowed(trendQuery) || !isQueryAllowed(rawArticle.title)) {
    throw Object.assign(
      new Error('Chủ đề không phù hợp bộ lọc nội dung học thuật HSK (tránh nội dung nhạy cảm hoặc tra từ điển đơn thuần).'),
      { status: 400, code: 'topic_blocked' }
    );
  }

  const inferred = inferCategoryAndTag(trendQuery || rawArticle.title);
  const existingSlugs = publishedArticles.map((a) => a.slug).filter(Boolean);
  const today = new Date().toISOString().slice(0, 10);
  const explicitSlug = slugifyVi(rawArticle.slug || rawArticle.suggestedSlug || payload?.slug || rawArticle.title);

  let article;
  try {
    article = normalizeArticle(rawArticle, {
      slug: explicitSlug,
      topic: rawArticle.title,
      category: CATEGORIES[rawArticle.category] ? rawArticle.category : (CATEGORIES[payload?.category] ? payload.category : inferred.category),
      hskTag: rawArticle.hskTag || payload?.hskTag || inferred.hskTag,
      today,
      existingSlugs,
      editorialVoice: String(payload?.editorialVoice || rawArticle.editorialVoice || 'chatgpt-editorial'),
    });
  } catch (err) {
    throw Object.assign(new Error(`Bài viết chưa đạt chuẩn cấu trúc SEO: ${err.message}`), {
      status: 400,
      code: 'validation_failed',
    });
  }

  const corpus = buildExistingCorpus(publishedArticles, drafts);
  const isDupByTitle = isDuplicateTopic(article.title, article.slug, corpus);
  const isDupByQuery = trendQuery && trendQuery !== article.title ? isDuplicateTopic(trendQuery, article.slug, corpus) : false;
  if (isDupByTitle || isDupByQuery) {
    throw Object.assign(
      new Error(`Chủ đề hoặc slug "${article.slug}" đã trùng với bài đã xuất bản hoặc bài nháp có sẵn. Hãy gọi get_seo_brief để chọn chủ đề mới.`),
      { status: 409, code: 'duplicate_topic', slug: article.slug }
    );
  }

  const quality = evaluateDraftQuality(article);
  const shouldRunCouncil = storedConfig.runAiReview !== false;
  let aiReviews = null;

  if (shouldRunCouncil) {
    try {
      aiReviews = await runReviewerCouncil({
        article,
        trendQuery,
        env,
        fetchImpl,
      });
      aiReviews.pipeline = ['chatgpt', aiReviews.reviewers?.[0]?.id || 'command-a-plus', aiReviews.reviewers?.[1]?.id || 'mistral-large-3', 'admin'];
    } catch (err) {
      aiReviews = {
        status: 'error',
        provider: 'cloudflare-ai',
        pipeline: ['chatgpt', 'command-a-plus', 'mistral-large-3', 'admin'],
        averageScore: null,
        needsAutoPolish: false,
        autoPolished: false,
        polishSummary: '',
        combinedFeedback: '',
        reviewedAt: new Date().toISOString(),
        reviewers: [
          {
            id: 'council-error',
            label: 'Hội đồng kiểm duyệt AI',
            model: 'fallback',
            role: 'Kiểm duyệt phụ',
            status: 'error',
            score: null,
            verdict: 'error',
            summary: `Chưa chấm được điểm phụ (${err?.message || 'timeout'}), bài vẫn đã vào hàng đợi Chờ duyệt.`,
            strengths: [],
            issues: [],
            mustFix: [],
            reviewedAt: new Date().toISOString(),
          },
        ],
      };
    }
  } else {
    aiReviews = {
      status: 'skipped',
      provider: 'chatgpt-only',
      pipeline: ['chatgpt', 'admin'],
      averageScore: null,
      needsAutoPolish: false,
      autoPolished: false,
      polishSummary: '',
      combinedFeedback: '',
      reviewedAt: new Date().toISOString(),
      reviewers: [],
    };
  }

  const nowIso = new Date().toISOString();
  const stamp = nowIso.replace(/[-:TZ.]/g, '').slice(0, 14);
  const draftId = `draft-cgpt-${stamp}-${article.slug.slice(0, 32)}`;
  const authorModel = String(payload?.authorModel || 'ChatGPT Plus').trim().slice(0, 64) || 'ChatGPT Plus';
  const authorNote = String(payload?.authorNote || '').trim().slice(0, 300);
  const trendSource = String(payload?.trendSource || 'chatgpt-web').trim().slice(0, 48) || 'chatgpt-web';
  const trendSpike = String(payload?.trendSpike || 'Hẹn giờ mỗi giờ').trim().slice(0, 48);

  const reviewHistory = [
    {
      action: 'submitted_by_chatgpt',
      rating: null,
      comment: `Nộp qua Cổng ChatGPT (${authorModel})${authorNote ? ` — ${authorNote}` : ''}`,
      at: nowIso,
    },
  ];
  if (aiReviews && aiReviews.status !== 'skipped' && Array.isArray(aiReviews.reviewers) && aiReviews.reviewers.length) {
    reviewHistory.push({
      action: 'ai_reviewed',
      rating: null,
      comment: aiReviews.reviewers.map((r) => `${r.label}: ${r.score ?? 'err'}`).join(' · '),
      at: new Date().toISOString(),
    });
  }

  // Hard-locked to pending_review. Never allows direct publish or approval.
  const draft = {
    id: draftId,
    status: 'pending_review',
    version: 1,
    createdAt: nowIso,
    updatedAt: nowIso,
    authorSource: 'chatgpt',
    authorModel,
    trendQuery,
    trendSource,
    trendSpike,
    category: article.category,
    hskTag: article.hskTag,
    editorialVoice: article.editorialVoice || 'chatgpt-editorial',
    aiReviews,
    quality,
    rating: null,
    reviewHistory,
    article,
    publishedSlug: '',
    approvedAt: '',
  };

  drafts.unshift(draft);
  draftsData.drafts = drafts;
  draftsData.updatedAt = nowIso;
  await writeDrafts(draftsData);

  const nextConfig = {
    ...storedConfig,
    updatedAt: nowIso,
    lastSubmission: {
      at: nowIso,
      draftId,
      slug: article.slug,
      title: article.title,
      seoScore: quality.score,
      councilAverage: aiReviews?.averageScore ?? null,
    },
  };
  await writeConfig(nextConfig).catch(() => {});

  return {
    ok: true,
    draftId,
    status: 'pending_review',
    requiresAdminApproval: true,
    pushedToGithub: false,
    message: 'Đã tiếp nhận bài viết từ ChatGPT, chạy kiểm định & lưu vào hàng đợi Chờ duyệt. Bài sẽ chỉ được push lên GitHub khi Admin duyệt trong Phòng Duyệt Bài.',
    slug: article.slug,
    title: article.title,
    category: article.category,
    quality,
    aiReviews: {
      status: aiReviews?.status || 'skipped',
      averageScore: aiReviews?.averageScore ?? null,
      reviewers: (aiReviews?.reviewers || []).map((r) => ({
        label: r.label,
        score: r.score,
        verdict: r.verdict,
        summary: r.summary,
        mustFix: r.mustFix || [],
      })),
    },
    quota: {
      hourlyUsed: hourly.count + 1,
      hourlyLimit: storedConfig.hourlyLimit,
      pendingCount: pendingCount + 1,
      maxPending,
    },
  };
}

export function listChatgptDrafts({ drafts = [], onlyChatgpt = true, status = 'all', limit = 15 } = {}) {
  const maxItems = Math.max(1, Math.min(30, Number(limit) || 15));
  const filtered = drafts.filter((d) => {
    if (onlyChatgpt && !isChatgptDraft(d)) return false;
    if (status && status !== 'all' && d.status !== status) return false;
    return true;
  });

  return {
    ok: true,
    totalMatched: filtered.length,
    counts: {
      pending_review: drafts.filter((d) => d.status === 'pending_review').length,
      approved: drafts.filter((d) => d.status === 'approved').length,
      rejected: drafts.filter((d) => d.status === 'rejected').length,
    },
    drafts: filtered.slice(0, maxItems).map((d) => ({
      id: d.id,
      status: d.status,
      authorSource: isChatgptDraft(d) ? 'chatgpt' : 'cloudflare-cron',
      version: d.version || 1,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      slug: d.article?.slug || '',
      title: d.article?.title || d.trendQuery || '',
      trendQuery: d.trendQuery || '',
      category: d.category || d.article?.category || '',
      seoScore: d.quality?.score ?? null,
      councilAverage: d.aiReviews?.averageScore ?? null,
      rating: d.rating || null,
      publishedSlug: d.publishedSlug || '',
      latestNote: Array.isArray(d.reviewHistory) && d.reviewHistory.length
        ? d.reviewHistory[d.reviewHistory.length - 1]?.comment || ''
        : '',
    })),
  };
}

export function getMcpToolsDefinition() {
  return [
    {
      name: 'get_seo_brief',
      description:
        'Lấy gợi ý chủ đề SEO tiếng Trung HSK mới từ Google Trends VN, danh sách bài đã đăng/chờ duyệt để tránh trùng lặp, trạng thái hạn mức theo giờ và quy chuẩn bài viết. LUÔN gọi công cụ này trước khi viết bài mới.',
      inputSchema: {
        type: 'object',
        properties: {
          count: {
            type: 'integer',
            minimum: 1,
            maximum: 8,
            default: 5,
            description: 'Số lượng chủ đề xu hướng gợi ý muốn lấy (mặc định 5).',
          },
          customQueries: {
            type: 'string',
            description: 'Từ khóa ưu tiên muốn kiểm tra độ trùng lặp (tùy chọn, phân cách bằng dòng mới).',
          },
        },
        additionalProperties: false,
      },
      annotations: {
        title: 'Lấy Brief SEO & Trends HSK',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    {
      name: 'submit_seo_draft',
      description:
        'Nộp 01 bài viết SEO tiếng Trung HSK hoàn chỉnh vào hàng đợi Chờ duyệt (pending_review) trên Cloudflare R2 và chạy Hội đồng kiểm duyệt AI chấm điểm phụ. Bài KHÔNG tự push lên GitHub — bắt buộc đợi Admin duyệt cuối trong Phòng Duyệt Bài.',
      inputSchema: {
        type: 'object',
        required: ['article'],
        properties: {
          trendQuery: {
            type: 'string',
            description: 'Từ khóa xu hướng chính mà bài viết nhắm tới.',
          },
          trendSpike: {
            type: 'string',
            description: 'Mức tăng trưởng hoặc nhãn đợt chạy (vd: "+180%" hoặc "ChatGPT mỗi giờ").',
          },
          authorModel: {
            type: 'string',
            description: 'Tên phiên bản ChatGPT viết bài (mặc định "ChatGPT Plus").',
          },
          authorNote: {
            type: 'string',
            description: 'Ghi chú ngắn cho Admin về góc tiếp cận hoặc điểm nổi bật của bài.',
          },
          article: {
            type: 'object',
            required: ['title', 'metaTitle', 'metaDescription', 'summary', 'sections', 'faqs'],
            properties: {
              slug: { type: 'string', description: 'URL slug không dấu gạch ngang (tùy chọn, tự sinh từ title nếu bỏ trống).' },
              category: {
                type: 'string',
                enum: ['ky-thi', 'diem-so', 'meo-hoc', 'ngu-phap'],
                description: 'Chuyên mục bài viết.',
              },
              hskTag: { type: 'string', description: 'Nhãn cấp độ, vd: "HSK 1–3", "HSK 4", "HSK 1–6".' },
              title: { type: 'string', description: 'Tiêu đề bài viết tiếng Việt hấp dẫn, chuẩn SEO.' },
              metaTitle: { type: 'string', description: 'Meta Title dài 35–75 ký tự, kết thúc bằng " | HSK Flashcards".' },
              metaDescription: { type: 'string', description: 'Meta Description dài 110–170 ký tự.' },
              summary: { type: 'string', description: 'Đoạn tóm tắt mở đầu 2–3 câu rõ trọng tâm.' },
              readMinutes: { type: 'integer', minimum: 3, maximum: 12, default: 6 },
              keywords: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 8 },
              sections: {
                type: 'array',
                minItems: 3,
                maxItems: 5,
                items: {
                  type: 'object',
                  required: ['id', 'heading', 'paragraphs'],
                  properties: {
                    id: { type: 'string', description: 'Anchor ID chữ thường bắt đầu bằng chữ cái (vd: "muc-1").' },
                    heading: { type: 'string' },
                    paragraphs: { type: 'array', items: { type: 'string' }, minItems: 1 },
                    bullets: { type: 'array', items: { type: 'string' } },
                    table: {
                      type: 'object',
                      properties: {
                        headers: { type: 'array', items: { type: 'string' } },
                        rows: {
                          type: 'array',
                          maxItems: 6,
                          items: { type: 'array', items: { type: 'string' } },
                        },
                      },
                    },
                    example: {
                      type: 'object',
                      properties: {
                        han: { type: 'string', description: 'Chữ Hán giản thể' },
                        py: { type: 'string', description: 'Pinyin có dấu thanh điệu chuẩn' },
                        vi: { type: 'string', description: 'Nghĩa tiếng Việt tự nhiên' },
                      },
                    },
                    tip: { type: 'string', description: 'Mẹo ghi nhớ ngắn gọn cho người Việt.' },
                  },
                },
              },
              faqs: {
                type: 'array',
                minItems: 2,
                maxItems: 5,
                items: {
                  type: 'object',
                  required: ['q', 'a'],
                  properties: {
                    q: { type: 'string' },
                    a: { type: 'string' },
                  },
                },
              },
              relatedSlugs: {
                type: 'array',
                items: { type: 'string' },
                description: '2–3 slug lấy từ availableRelatedSlugs trong get_seo_brief.',
              },
              cta: {
                type: 'object',
                properties: {
                  heading: { type: 'string' },
                  body: { type: 'string' },
                  buttonLabel: { type: 'string' },
                },
              },
              sources: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string' },
                    url: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        additionalProperties: false,
      },
      annotations: {
        title: 'Nộp bài nháp SEO vào Chờ duyệt',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    {
      name: 'list_chatgpt_drafts',
      description:
        'Xem trạng thái các bài nháp SEO (chờ duyệt, đã duyệt xuất bản, từ chối), điểm SEO và nhận xét của Hội đồng AI / Admin. Chỉ đọc, không thể duyệt hoặc push lên GitHub.',
      inputSchema: {
        type: 'object',
        properties: {
          onlyChatgpt: {
            type: 'boolean',
            default: true,
            description: 'true để chỉ xem các bài do ChatGPT nộp; false để xem toàn bộ hàng đợi.',
          },
          status: {
            type: 'string',
            enum: ['all', 'pending_review', 'approved', 'rejected'],
            default: 'all',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 30,
            default: 15,
          },
        },
        additionalProperties: false,
      },
      annotations: {
        title: 'Xem trạng thái bài nháp SEO',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
  ];
}

export function buildChatgptOpenApiSpec(baseUrl = 'https://hsk-seo-editorial.trung-hsk668.workers.dev') {
  const serverUrl = String(baseUrl || 'https://hsk-seo-editorial.trung-hsk668.workers.dev').replace(/\/+$/, '');
  const submitTool = getMcpToolsDefinition().find((t) => t.name === 'submit_seo_draft');
  return {
    openapi: '3.1.0',
    info: {
      title: 'HSK Flashcards — ChatGPT SEO Editorial Gateway',
      version: '1.0.0',
      description:
        'Cổng nộp bài viết SEO tiếng Trung HSK cho ChatGPT. Mọi bài nộp đều chạy Hội đồng kiểm duyệt AI và vào trạng thái pending_review trên Cloudflare R2 — bắt buộc đợi Admin duyệt tại Phòng Duyệt Bài trước khi push lên GitHub.',
    },
    servers: [{ url: serverUrl }],
    security: [{ BearerAuth: [] }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'Khóa Cổng ChatGPT tạo trong Phòng Duyệt Bài SEO (hsk_cgpt_...).',
        },
      },
    },
    paths: {
      '/api/chatgpt/brief': {
        get: {
          operationId: 'getSeoBrief',
          summary: 'Lấy từ khóa Trends VN gợi ý, danh sách bài cũ tránh trùng và quy chuẩn SEO',
          parameters: [
            {
              name: 'count',
              in: 'query',
              schema: { type: 'integer', minimum: 1, maximum: 8, default: 5 },
              description: 'Số chủ đề gợi ý muốn nhận.',
            },
          ],
          responses: {
            200: {
              description: 'Brief chủ đề & quy chuẩn SEO',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
      '/api/chatgpt/drafts': {
        get: {
          operationId: 'listChatgptDrafts',
          summary: 'Xem danh sách & trạng thái duyệt các bài viết ChatGPT đã nộp',
          parameters: [
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string', enum: ['all', 'pending_review', 'approved', 'rejected'], default: 'all' },
            },
            {
              name: 'onlyChatgpt',
              in: 'query',
              schema: { type: 'boolean', default: true },
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', minimum: 1, maximum: 30, default: 15 },
            },
          ],
          responses: {
            200: {
              description: 'Danh sách bài nháp',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
        post: {
          operationId: 'submitSeoDraft',
          summary: 'Nộp 1 bài SEO hoàn chỉnh vào hàng đợi Chờ duyệt (pending_review)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: submitTool.inputSchema,
              },
            },
          },
          responses: {
            201: {
              description: 'Đã tiếp nhận vào hàng đợi Chờ duyệt',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            409: {
              description: 'Trùng chủ đề hoặc slug với bài đã có',
            },
            429: {
              description: 'Hàng đợi đầy hoặc chạm giới hạn bài/giờ',
            },
          },
        },
      },
    },
  };
}

function jsonRpcResult(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function jsonRpcError(id, code, message, data) {
  const err = { code, message };
  if (data !== undefined) err.data = data;
  return { jsonrpc: '2.0', id: id ?? null, error: err };
}

async function handleSingleMcpRpc(rpc, context) {
  if (!rpc || typeof rpc !== 'object' || rpc.jsonrpc !== '2.0' || typeof rpc.method !== 'string') {
    return jsonRpcError(rpc?.id ?? null, -32600, 'Invalid JSON-RPC 2.0 request');
  }

  const hasId = Object.prototype.hasOwnProperty.call(rpc, 'id') && rpc.id !== undefined;
  const method = rpc.method;
  const params = rpc.params && typeof rpc.params === 'object' ? rpc.params : {};

  if (!hasId || method.startsWith('notifications/')) {
    return null; // Notification — no response body (202 Accepted)
  }

  if (method === 'initialize') {
    const requestedVersion = String(params.protocolVersion || '');
    const protocolVersion = SUPPORTED_MCP_VERSIONS.includes(requestedVersion)
      ? requestedVersion
      : SUPPORTED_MCP_VERSIONS[2];
    return jsonRpcResult(rpc.id, {
      protocolVersion,
      capabilities: {
        tools: { listChanged: false },
      },
      serverInfo: {
        name: 'hsk-seo-editorial-chatgpt-gateway',
        version: '1.0.0',
      },
      instructions:
        'Cổng nộp bài SEO tiếng Trung HSK cho HSK Flashcards. Quy trình mỗi giờ: (1) Gọi get_seo_brief để xem hạn mức và chọn 1 chủ đề mới không trùng lặp; (2) Viết bài SEO tiếng Việt đầy đủ chữ Hán + Pinyin chuẩn thanh điệu + bảng <=6 dòng + ví dụ + tip + FAQ; (3) Gọi submit_seo_draft để đưa bài vào hàng đợi Chờ duyệt (pending_review). Cổng này không thể tự duyệt hoặc push lên GitHub.',
    });
  }

  if (method === 'ping') {
    return jsonRpcResult(rpc.id, {});
  }

  if (method === 'tools/list') {
    return jsonRpcResult(rpc.id, { tools: getMcpToolsDefinition() });
  }

  if (method === 'tools/call') {
    const toolName = String(params.name || '').trim();
    const args = params.arguments && typeof params.arguments === 'object' ? params.arguments : {};

    try {
      let data;
      if (toolName === 'get_seo_brief') {
        const [draftsData, publishedArticles] = await Promise.all([
          context.readDrafts(),
          context.fetchPublished(),
        ]);
        data = await buildChatgptBrief({
          env: context.env,
          storedConfig: context.storedConfig,
          drafts: draftsData.drafts || [],
          publishedArticles,
          count: args.count,
          customQueries: typeof args.customQueries === 'string' ? args.customQueries : '',
          fetchImpl: context.fetchImpl,
        });
      } else if (toolName === 'list_chatgpt_drafts') {
        const draftsData = await context.readDrafts();
        data = listChatgptDrafts({
          drafts: draftsData.drafts || [],
          onlyChatgpt: args.onlyChatgpt !== false,
          status: args.status || 'all',
          limit: args.limit,
        });
      } else if (toolName === 'submit_seo_draft') {
        const [draftsData, publishedArticles] = await Promise.all([
          context.readDrafts(),
          context.fetchPublished(),
        ]);
        data = await submitChatgptDraft({
          payload: args,
          env: context.env,
          storedConfig: context.storedConfig,
          draftsData,
          publishedArticles,
          writeDrafts: context.writeDrafts,
          writeConfig: context.writeConfig,
          fetchImpl: context.fetchImpl,
        });
      } else {
        return jsonRpcError(rpc.id, -32601, `Unknown tool: ${toolName}`);
      }

      return jsonRpcResult(rpc.id, {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        structuredContent: data,
        isError: false,
      });
    } catch (err) {
      const errPayload = {
        ok: false,
        error: err?.message || 'Lỗi xử lý tool ChatGPT SEO Gateway.',
        code: err?.code || 'tool_error',
        status: err?.status || 500,
        ...(err?.retryAfterMinutes ? { retryAfterMinutes: err.retryAfterMinutes } : {}),
      };
      return jsonRpcResult(rpc.id, {
        content: [{ type: 'text', text: JSON.stringify(errPayload, null, 2) }],
        structuredContent: errPayload,
        isError: true,
      });
    }
  }

  return jsonRpcError(rpc.id, -32601, `Method not found: ${method}`);
}

export async function readBoundedJsonBody(request) {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    throw Object.assign(new Error(`Payload quá lớn (tối đa ${Math.round(MAX_BODY_BYTES / 1024)} KB).`), { status: 413 });
  }
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch (_) {
    throw Object.assign(new Error('JSON body không hợp lệ.'), { status: 400 });
  }
}

export async function handleChatgptMcpRequest(request, context, headers) {
  if (request.method === 'DELETE') {
    return new Response(null, { status: 204, headers });
  }
  if (request.method === 'GET') {
    const accept = String(request.headers.get('Accept') || '').toLowerCase();
    if (accept.includes('text/event-stream')) {
      const h = new Headers(headers);
      h.set('Allow', 'POST, OPTIONS, DELETE');
      return new Response('Stateless Streamable HTTP MCP server: use POST for JSON-RPC messages.', {
        status: 405,
        headers: h,
      });
    }
    return Response.json(
      {
        ok: true,
        protocol: 'mcp-streamable-http',
        server: 'hsk-seo-editorial-chatgpt-gateway',
        tools: getMcpToolsDefinition().map((t) => t.name),
        approvalPolicy: 'pending_review_only',
      },
      { status: 200, headers }
    );
  }
  if (request.method !== 'POST') {
    const h = new Headers(headers);
    h.set('Allow', 'POST, GET, OPTIONS, DELETE');
    return new Response('Method Not Allowed', { status: 405, headers: h });
  }

  let body;
  try {
    body = await readBoundedJsonBody(request);
  } catch (err) {
    return Response.json(jsonRpcError(null, -32700, err.message || 'Parse error'), {
      status: err.status || 400,
      headers,
    });
  }

  const sessionId = request.headers.get('Mcp-Session-Id') || '';
  const respHeaders = new Headers(headers);
  if (sessionId) respHeaders.set('Mcp-Session-Id', sessionId);

  if (Array.isArray(body)) {
    const responses = [];
    for (const item of body) {
      const res = await handleSingleMcpRpc(item, context);
      if (res) responses.push(res);
    }
    if (!responses.length) {
      return new Response(null, { status: 202, headers: respHeaders });
    }
    return Response.json(responses, { status: 200, headers: respHeaders });
  }

  const single = await handleSingleMcpRpc(body, context);
  if (!single) {
    return new Response(null, { status: 202, headers: respHeaders });
  }
  return Response.json(single, { status: 200, headers: respHeaders });
}

export function matchChatgptRoute(pathname) {
  if (pathname === '/mcp') {
    return { kind: 'mcp', pathKey: '' };
  }
  if (pathname === '/api/chatgpt/openapi.json') {
    return { kind: 'openapi', pathKey: '' };
  }
  if (pathname === '/api/chatgpt/brief') {
    return { kind: 'brief', pathKey: '' };
  }
  if (pathname === '/api/chatgpt/drafts') {
    return { kind: 'drafts', pathKey: '' };
  }
  const secretMatch = /^\/api\/chatgpt\/k\/([^/]+)\/(mcp|brief|drafts)$/.exec(pathname);
  if (secretMatch) {
    return {
      kind: secretMatch[2],
      pathKey: decodeURIComponent(secretMatch[1]),
    };
  }
  return null;
}

export async function handleChatgptGatewayRoute(request, route, context) {
  const origin = request.headers.get('Origin') || '';
  const headers = buildGatewayCorsHeaders(origin);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const url = new URL(request.url);
  if (route.kind === 'openapi' && request.method === 'GET') {
    return Response.json(buildChatgptOpenApiSpec(url.origin), { status: 200, headers });
  }

  const storedConfig = await readGatewayConfig(context.env.SEO_BUCKET, context.env);
  try {
    verifyChatgptGatewayAuth(request, context.env, storedConfig, route.pathKey);
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: err.status || 401, headers });
  }

  const enrichedContext = {
    ...context,
    storedConfig,
    writeConfig: (nextCfg) => writeGatewayConfig(context.env.SEO_BUCKET, nextCfg),
  };

  try {
    if (route.kind === 'mcp') {
      return await handleChatgptMcpRequest(request, enrichedContext, headers);
    }

    if (route.kind === 'brief' && request.method === 'GET') {
      const [draftsData, publishedArticles] = await Promise.all([
        context.readDrafts(),
        context.fetchPublished(),
      ]);
      const brief = await buildChatgptBrief({
        env: context.env,
        storedConfig,
        drafts: draftsData.drafts || [],
        publishedArticles,
        count: url.searchParams.get('count'),
        customQueries: url.searchParams.get('customQueries') || '',
        fetchImpl: context.fetchImpl,
      });
      return Response.json(brief, { status: 200, headers });
    }

    if (route.kind === 'drafts' && request.method === 'GET') {
      const draftsData = await context.readDrafts();
      const onlyParam = url.searchParams.get('onlyChatgpt');
      const result = listChatgptDrafts({
        drafts: draftsData.drafts || [],
        onlyChatgpt: onlyParam === 'false' ? false : true,
        status: url.searchParams.get('status') || 'all',
        limit: url.searchParams.get('limit') || 15,
      });
      return Response.json(result, { status: 200, headers });
    }

    if (route.kind === 'drafts' && request.method === 'POST') {
      const payload = await readBoundedJsonBody(request);
      const [draftsData, publishedArticles] = await Promise.all([
        context.readDrafts(),
        context.fetchPublished(),
      ]);
      const created = await submitChatgptDraft({
        payload,
        env: context.env,
        storedConfig,
        draftsData,
        publishedArticles,
        writeDrafts: context.writeDrafts,
        writeConfig: enrichedContext.writeConfig,
        fetchImpl: context.fetchImpl,
      });
      return Response.json(created, { status: 201, headers });
    }

    return Response.json({ ok: false, error: 'Method or route not allowed on ChatGPT Gateway.' }, { status: 405, headers });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: err?.message || 'Lỗi xử lý yêu cầu ChatGPT Gateway.',
        ...(err?.code ? { code: err.code } : {}),
        ...(err?.retryAfterMinutes ? { retryAfterMinutes: err.retryAfterMinutes } : {}),
      },
      { status: err?.status || 500, headers }
    );
  }
}
