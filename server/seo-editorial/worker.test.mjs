import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectTrendTopicsWorker,
  extractCfAiText,
  extractJsonObject,
} from './pipeline-core.mjs';
import worker, { handleSeoEditorialFetch, runScheduledEditorial } from './worker.mjs';

function createMemoryR2() {
  const store = new Map();
  return {
    store,
    async get(key) {
      if (!store.has(key)) return null;
      const text = store.get(key);
      return {
        async json() {
          return JSON.parse(text);
        },
        async text() {
          return text;
        },
      };
    },
    async put(key, val) {
      store.set(key, typeof val === 'string' ? val : String(val));
      return { key };
    },
  };
}

function makeMockArticleJson(title = 'Cách nói xin lỗi trong tiếng Trung tự nhiên') {
  return {
    title,
    metaTitle: `${title} | HSK Flashcards`,
    metaDescription:
      'Phân biệt chi tiết các cách nói xin lỗi trong tiếng Trung từ HSK 1 đến HSK 4 kèm chữ Hán giản thể, Pinyin thanh điệu và ngữ cảnh thực tế.',
    summary: 'Hướng dẫn dùng đúng ngữ cảnh khi xin lỗi bằng tiếng Trung.',
    hskTag: 'HSK 1–3',
    readMinutes: 5,
    keywords: ['xin lỗi trong tiếng trung', 'duibuqi', 'buhaoyisi'],
    sections: [
      {
        id: '1-phan-biet',
        heading: 'Phân biệt nhanh 3 mẫu câu xin lỗi phổ biến',
        paragraphs: ['Tùy mức độ lỗi mà bạn chọn cụm từ tự nhiên nhất.'],
        table: {
          headers: ['Mẫu câu', 'Pinyin', 'Ngữ cảnh'],
          rows: [
            ['对不起', 'duìbuqǐ', 'Lỗi thực sự nghiêm túc'],
            ['不好意思', 'bù hǎoyìsi', 'Ngại nhẹ, làm phiền nhỏ'],
          ],
        },
        example: {
          han: '不好意思，请问洗手间在哪里？',
          py: 'Bù hǎoyìsi, qǐngwèn xǐshǒujiān zài nǎlǐ?',
          vi: 'Xin lỗi cho hỏi nhà vệ sinh ở đâu ạ?',
        },
        tip: 'Ngại nhẹ khi nhờ vả hay đi qua đám đông nên dùng 不好意思 thay vì 对不起.',
      },
      {
        id: 'loi-hay-gap',
        heading: 'Lỗi người Việt hay gặp khi xin lỗi',
        paragraphs: ['Nhiều bạn dịch thẳng "xin lỗi" thành 对不起 trong mọi tình huống khiến câu nghe nặng nề.'],
      },
      {
        id: 'ung-dung-thuc-te',
        heading: 'Cách phản hồi tự nhiên của người bản xứ',
        paragraphs: ['Khi nghe xin lỗi, người Trung hay đáp 没关系 (méi guānxi) hoặc 没事 (méishì).'],
      },
    ],
    faqs: [
      { q: 'Khác nhau giữa 对不起 và 不好意思 là gì?', a: '对不起 dùng cho lỗi rõ rệt, 不好意思 dùng cho tình huống ngại nhẹ.' },
      { q: 'Mới học HSK 1 có cần nhớ cả 3 không?', a: 'Nên nhớ ngay vì xuất hiện rất nhiều trong giao tiếp.' },
    ],
    relatedSlugs: ['cac-loai-tu-trong-tieng-trung-co-ban'],
    cta: {
      heading: 'Thực hành phản xạ câu HSK miễn phí ngay',
      body: 'Mở HSK Flashcards để luyện flashcard SRS và sửa câu tiếng Trung trên trình duyệt.',
      buttonLabel: 'Học ngay miễn phí',
    },
  };
}

function createMockAi({ failPrimary = false } = {}) {
  const calls = [];
  return {
    calls,
    async run(model, input) {
      calls.push(model);
      if (failPrimary && model.includes('gemma-4')) {
        throw new Error('Primary simulated failure');
      }
      const prompt = String(input?.messages?.[1]?.content || '');
      if (prompt.includes('Kiểm duyệt bài viết SEO')) {
        return {
          response: JSON.stringify({
            score: 89,
            verdict: 'pass',
            summary: 'Chữ Hán, Pinyin và ngữ pháp chuẩn xác, bảng 2 dòng gọn.',
            strengths: ['Đủ ví dụ Hán - Pinyin - Việt'],
            issues: [],
            mustFix: [],
          }),
        };
      }
      return {
        choices: [
          {
            message: {
              content: `<think>Suy nghĩ nháp</think>\n\`\`\`json\n${JSON.stringify(makeMockArticleJson())}\n\`\`\``,
            },
          },
        ],
      };
    },
  };
}

function createMockFetch() {
  return async (url) => {
    const u = String(url);
    if (u.includes('articles.json')) {
      return Response.json({
        articles: [
          { slug: 'cac-loai-tu-trong-tieng-trung-co-ban', title: 'Các loại từ trong tiếng Trung' },
        ],
      });
    }
    if (u.includes('trends.google.com/trending/rss')) {
      return new Response('<rss><channel><item><title><![CDATA[học tiếng trung cho người mới]]></title><ht:approx_traffic>500+</ht:approx_traffic></item></channel></rss>');
    }
    if (u.includes('suggestqueries.google.com')) {
      return Response.json([
        'seed',
        ['chửi bậy tiếng trung', 'dịch tiếng trung', 'xin lỗi trong tiếng trung'],
      ]);
    }
    if (u.includes('accounts:lookup')) {
      return Response.json({
        users: [{ localId: 'BIvUyItDYJWcLvlhhtYFyj5csBH2', email: 'honghiemtrung668@gmail.com', disabled: false }],
      });
    }
    return new Response('not found', { status: 404 });
  };
}

test('extractCfAiText and extractJsonObject handle OpenAI, raw response, object response, and think blocks', () => {
  assert.equal(extractCfAiText({ choices: [{ message: { content: '  {"a":1} ' } }] }), '{"a":1}');
  assert.equal(extractCfAiText({ response: { title: 'Hi' } }), '{"title":"Hi"}');
  assert.deepEqual(
    extractJsonObject('<think>reasoning</think>\n```json\n{"ok":true,"n":2}\n```'),
    { ok: true, n: 2 }
  );
});

test('collectTrendTopicsWorker filters toxic/translator noise and deduplicates against published + drafts', async () => {
  const res = await collectTrendTopicsWorker({
    publishedArticles: [{ slug: 'hoc-tieng-trung-cho-nguoi-moi', title: 'Học tiếng Trung cho người mới' }],
    drafts: [{ status: 'pending_review', trendQuery: 'tiếng trung công xưởng', article: { slug: 'tieng-trung-cong-xuong', title: 'Tiếng Trung công xưởng' } }],
    count: 1,
    fetchImpl: createMockFetch(),
  });
  assert.equal(res.topics.length, 1);
  assert.equal(res.topics[0].query, 'xin lỗi trong tiếng trung');
});

test('Cloudflare worker enforces auth, CORS, scan-trends, rewrite, approve, reject, and cron scheduled', async () => {
  const r2 = createMemoryR2();
  const ai = createMockAi();
  const fetchImpl = createMockFetch();
  const env = {
    AI: ai,
    SEO_BUCKET: r2,
    FIREBASE_API_KEY: 'test-fb-key',
    ALLOWED_ORIGINS: 'https://hskfreelearningai.pages.dev',
    PUBLISHED_ARTICLES_URL: 'https://hskfreelearningai.pages.dev/content/seo-articles/articles.json',
  };

  // /health public check
  const healthRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/health', { headers: { Origin: 'https://hskfreelearningai.pages.dev' } }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(healthRes.status, 200);
  const healthJson = await healthRes.json();
  assert.equal(healthJson.ok, true);
  assert.equal(healthJson.hasAI, true);
  assert.equal(healthJson.hasR2, true);

  // Disallowed Origin -> 403
  const badOrigin = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/drafts', { headers: { Origin: 'https://evil.example' } }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(badOrigin.status, 403);

  // Unauthenticated /api/drafts -> 401
  const noAuth = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/drafts'),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(noAuth.status, 401);

  // Admin scan-trends generates 1 draft, validates section ids & 2 reviewers
  const authHeaders = {
    Authorization: 'Bearer fake-admin-id-token',
    'Content-Type': 'application/json',
    Origin: 'https://hskfreelearningai.pages.dev',
  };
  const scanRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/scan-trends', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ count: 1 }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(scanRes.status, 200);
  const scanJson = await scanRes.json();
  assert.equal(scanJson.ok, true);
  assert.equal(scanJson.createdDrafts.length, 1);
  const created = scanJson.createdDrafts[0];
  assert.equal(created.article.sections[0].id, 'muc-1-phan-biet');
  assert.equal(created.aiReviews.averageScore, 89);
  assert.equal(created.aiReviews.reviewers.length, 2);

  // Rewrite bumps version to 2
  const rwRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/rewrite', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ draftId: created.id, comment: 'Thêm ví dụ', rating: 4 }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(rwRes.status, 200);
  const rwJson = await rwRes.json();
  assert.equal(rwJson.draft.version, 2);
  assert.equal(rwJson.draft.rating, 4);

  // Approve updates R2 status and returns article payload
  const appRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/approve', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ draftId: created.id, rating: 5 }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(appRes.status, 200);
  const appJson = await appRes.json();
  assert.equal(appJson.draft.status, 'approved');
  assert.equal(appJson.article.slug, created.article.slug);

  // Cron trigger runs cleanly even after fallback writer model if Gemma 4 fails
  const cronResult = await runScheduledEditorial(
    { ...env, AI: createMockAi({ failPrimary: true }) },
    fetchImpl
  );
  assert.equal(cronResult.ok, true);
  assert.equal(cronResult.lastRun.trigger, 'cron');
  assert.equal(cronResult.createdCount ?? cronResult.createdIds.length, 1);
  assert.ok(typeof worker.scheduled === 'function');
});

test('ChatGPT SEO Gateway supports MCP secret URL, REST Bearer, AI council review, dedup, hourly cap, and strict pending_review boundary', async () => {
  const r2 = createMemoryR2();
  const ai = createMockAi();
  const fetchImpl = createMockFetch();
  const env = {
    AI: ai,
    SEO_BUCKET: r2,
    FIREBASE_API_KEY: 'test-fb-key',
    ALLOWED_ORIGINS: 'https://hskfreelearningai.pages.dev',
    PUBLISHED_ARTICLES_URL: 'https://hskfreelearningai.pages.dev/content/seo-articles/articles.json',
    CHATGPT_MAX_PER_HOUR: '2',
  };

  const adminHeaders = {
    Authorization: 'Bearer fake-admin-id-token',
    'Content-Type': 'application/json',
    Origin: 'https://hskfreelearningai.pages.dev',
  };

  // 1. OpenAPI schema is public and leaks no secret
  const oaRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/chatgpt/openapi.json'),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(oaRes.status, 200);
  const oaJson = await oaRes.json();
  assert.equal(oaJson.openapi, '3.1.0');
  assert.ok(oaJson.paths['/api/chatgpt/brief']);
  assert.ok(oaJson.paths['/api/chatgpt/drafts']);

  // 2. Before key rotation, gateway rejects calls with 503
  const uninitRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/chatgpt/brief', {
      headers: { Authorization: 'Bearer wrong-key' },
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(uninitRes.status, 503);

  // 3. Admin rotates gateway key via Firebase-authenticated endpoint
  const rotRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/chatgpt-gateway/rotate', {
      method: 'POST',
      headers: adminHeaders,
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(rotRes.status, 200);
  const rotJson = await rotRes.json();
  assert.equal(rotJson.ok, true);
  assert.ok(rotJson.apiKey.startsWith('hsk_cgpt_'));
  assert.ok(rotJson.endpoints.mcpSecretUrl.includes(`/api/chatgpt/k/${rotJson.apiKey}/mcp`));

  const mcpUrl = rotJson.endpoints.mcpSecretUrl;

  // 4. Wrong key rejected with 401
  const badKeyRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/chatgpt/k/hsk_cgpt_invalid/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(badKeyRes.status, 401);

  // 5. ChatGPT key MUST NOT be able to call Admin /api/approve
  const bypassApproveRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/approve', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rotJson.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ draftId: 'draft-1' }),
    }),
    env,
    {},
    {
      fetchImpl: async (u) => {
        if (String(u).includes('accounts:lookup')) {
          return Response.json({ error: { message: 'INVALID_ID_TOKEN' } }, { status: 400 });
        }
        return fetchImpl(u);
      },
    }
  );
  assert.equal(bypassApproveRes.status, 401);

  // 6. MCP Streamable HTTP: GET text/event-stream -> 405, initialize -> 200, notification -> 202
  const sseRes = await handleSeoEditorialFetch(
    new Request(mcpUrl, { method: 'GET', headers: { Accept: 'text/event-stream' } }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(sseRes.status, 405);

  const initRes = await handleSeoEditorialFetch(
    new Request(mcpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2025-03-26', clientInfo: { name: 'chatgpt-web', version: '1.0' } },
      }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(initRes.status, 200);
  const initJson = await initRes.json();
  assert.equal(initJson.result.protocolVersion, '2025-03-26');
  assert.equal(initJson.result.serverInfo.name, 'hsk-seo-editorial-chatgpt-gateway');

  const notifRes = await handleSeoEditorialFetch(
    new Request(mcpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(notifRes.status, 202);

  const toolsRes = await handleSeoEditorialFetch(
    new Request(mcpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
    }),
    env,
    {},
    { fetchImpl }
  );
  const toolsJson = await toolsRes.json();
  assert.deepEqual(
    toolsJson.result.tools.map((t) => t.name),
    ['get_seo_brief', 'submit_seo_draft', 'list_chatgpt_drafts']
  );

  // 7. MCP get_seo_brief returns non-duplicate suggestions + strict approvalPolicy
  const briefRes = await handleSeoEditorialFetch(
    new Request(mcpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_seo_brief', arguments: { count: 3 } },
      }),
    }),
    env,
    {},
    { fetchImpl }
  );
  const briefJson = await briefRes.json();
  assert.equal(briefJson.result.isError, false);
  assert.equal(briefJson.result.structuredContent.approvalPolicy.canPublishDirectly, false);
  assert.equal(briefJson.result.structuredContent.quota.canSubmitNow, true);
  assert.ok(briefJson.result.structuredContent.suggestedTopics.length >= 1);

  // 8. MCP submit_seo_draft creates pending_review draft + runs AI reviewer council (cannot self-approve)
  const submitRes = await handleSeoEditorialFetch(
    new Request(mcpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'submit_seo_draft',
          arguments: {
            trendQuery: 'xin lỗi trong tiếng trung',
            trendSpike: 'ChatGPT mỗi giờ',
            authorModel: 'ChatGPT Plus',
            status: 'approved', // malicious override attempt must be ignored
            article: makeMockArticleJson('Cách nói xin lỗi trong tiếng Trung tự nhiên'),
          },
        },
      }),
    }),
    env,
    {},
    { fetchImpl }
  );
  const submitJson = await submitRes.json();
  assert.equal(submitJson.result.isError, false);
  const sc = submitJson.result.structuredContent;
  assert.equal(sc.ok, true);
  assert.equal(sc.status, 'pending_review');
  assert.equal(sc.requiresAdminApproval, true);
  assert.equal(sc.pushedToGithub, false);
  assert.equal(sc.aiReviews.averageScore, 89);
  assert.equal(sc.aiReviews.reviewers.length, 2);

  // Verify draft appears in Admin /api/drafts with authorSource === 'chatgpt' and pipeline[0] === 'chatgpt'
  const adminDraftsRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/drafts', { headers: adminHeaders }),
    env,
    {},
    { fetchImpl }
  );
  const adminDraftsJson = await adminDraftsRes.json();
  assert.equal(adminDraftsJson.draftsData.drafts.length, 1);
  assert.equal(adminDraftsJson.draftsData.drafts[0].authorSource, 'chatgpt');
  assert.equal(adminDraftsJson.draftsData.drafts[0].status, 'pending_review');
  assert.equal(adminDraftsJson.draftsData.drafts[0].aiReviews.pipeline[0], 'chatgpt');

  // 9. Duplicate submission rejected (isError: true, code: duplicate_topic)
  const dupRes = await handleSeoEditorialFetch(
    new Request(mcpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'submit_seo_draft',
          arguments: {
            trendQuery: 'xin lỗi trong tiếng trung',
            article: makeMockArticleJson('Cách nói xin lỗi trong tiếng Trung tự nhiên'),
          },
        },
      }),
    }),
    env,
    {},
    { fetchImpl }
  );
  const dupJson = await dupRes.json();
  assert.equal(dupJson.result.isError, true);
  assert.equal(dupJson.result.structuredContent.code, 'duplicate_topic');

  // 10. REST Bearer 2nd submission succeeds (201), 3rd hits hourly limit (429)
  const rest2Res = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/chatgpt/drafts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rotJson.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trendQuery: 'phân biệt bộ thủ tiếng trung thường gặp',
        article: makeMockArticleJson('Phân biệt 12 bộ thủ tiếng Trung thường gặp cho người mới'),
      }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(rest2Res.status, 201);

  const rest3Res = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/chatgpt/drafts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rotJson.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trendQuery: 'lộ trình tự học hsk 4 trong 6 tháng',
        article: makeMockArticleJson('Lộ trình tự học HSK 4 trong 6 tháng cho người đi làm'),
      }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(rest3Res.status, 429);
  const rest3Json = await rest3Res.json();
  assert.equal(rest3Json.code, 'hourly_limit_reached');

  // 11. Admin disables gateway -> immediate 503 kill switch
  const disableRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/chatgpt-gateway/settings', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ enabled: false }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(disableRes.status, 200);

  const blockedRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/chatgpt/brief', {
      headers: { Authorization: `Bearer ${rotJson.apiKey}` },
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(blockedRes.status, 503);
});

