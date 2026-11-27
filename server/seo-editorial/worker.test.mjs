import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectTrendTopicsWorker,
  normalizeArticle,
} from './pipeline-core.mjs';
import { handleSeoEditorialFetch } from './worker.mjs';

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
        id: 'phan-biet-nhanh',
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

test('normalizeArticle stringifies object bullets and paragraphs without [object Object]', () => {
  const raw = {
    ...makeMockArticleJson('Kiểm tra định dạng bullets'),
    sections: [
      {
        id: 'sec-1',
        heading: 'Mẫu câu xin việc',
        paragraphs: [
          'Đoạn mở đầu bình thường.',
          { heading: 'Kinh nghiệm làm việc', text: 'Nêu số năm làm việc và thành tích ngắn gọn.' },
        ],
        bullets: [
          { han: '我有三年工作经验。', py: 'Wǒ yǒu sān nián gōngzuò jīngyàn.', vi: 'Tôi có 3 năm kinh nghiệm làm việc.' },
          { label: 'Mục tiêu', detail: 'Mong muốn gắn bó lâu dài với công ty.' },
        ],
      },
    ],
  };

  const normalized = normalizeArticle(raw, { today: '2026-11-27', existingSlugs: [] });
  const serialized = JSON.stringify(normalized);
  assert.equal(serialized.includes('[object Object]'), false);
  assert.ok(normalized.sections[0].bullets[0].includes('我有三年工作经验。'));
  assert.ok(normalized.sections[0].bullets[1].includes('Mục tiêu: Mong muốn gắn bó lâu dài'));
  assert.ok(normalized.sections[0].paragraphs[1].includes('Kinh nghiệm làm việc: Nêu số năm làm việc'));
});

test('Cloudflare worker exposes ChatGPT-only health, disables /api/scan-trends, and enforces auth/approve/reject', async () => {
  const r2 = createMemoryR2();
  const fetchImpl = createMockFetch();
  const env = {
    SEO_BUCKET: r2,
    FIREBASE_API_KEY: 'test-fb-key',
    ALLOWED_ORIGINS: 'https://hskfreelearningai.pages.dev',
    CHATGPT_SEO_INGEST_KEY: 'hsk_cgpt_health_test_key',
  };

  const healthRes = await handleSeoEditorialFetch(new Request('https://seo.workers.dev/health'), env, {}, { fetchImpl });
  assert.equal(healthRes.status, 200);
  const health = await healthRes.json();
  assert.equal(health.ok, true);
  assert.equal(health.service, 'hsk-seo-editorial');
  assert.equal(health.mode, 'chatgpt-only');
  assert.equal(health.hasR2, true);
  assert.ok(health.chatgptGateway.protocols.includes('mcp-streamable-http'));
  assert.equal(health.chatgptGateway.keyConfigured, true);

  const deniedRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/drafts', { headers: { Origin: 'https://evil.example' } }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(deniedRes.status, 403);

  const scanRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/scan-trends', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fake-admin-id-token',
        'Content-Type': 'application/json',
        Origin: 'https://hskfreelearningai.pages.dev',
      },
      body: JSON.stringify({ count: 1 }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(scanRes.status, 410);

  // Put a ChatGPT-submitted draft into R2 and verify Admin approve + public queue
  await r2.put(
    'seo-editorial/drafts.json',
    JSON.stringify({
      schema: 1,
      updatedAt: '2026-11-27T08:00:00.000Z',
      drafts: [
        {
          id: 'draft-cgpt-1',
          status: 'pending_review',
          version: 1,
          authorSource: 'chatgpt',
          authorModel: 'ChatGPT Plus',
          article: { ...makeMockArticleJson('Xin lỗi trong tiếng Trung'), slug: 'xin-loi-trong-tieng-trung' },
        },
        {
          id: 'draft-cgpt-2',
          status: 'pending_review',
          version: 1,
          authorSource: 'chatgpt',
          authorModel: 'ChatGPT Plus',
          article: { ...makeMockArticleJson('Bài sẽ từ chối'), slug: 'bai-se-tu-choi' },
        },
      ],
    })
  );

  const approveRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/approve', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fake-admin-id-token',
        'Content-Type': 'application/json',
        Origin: 'https://hskfreelearningai.pages.dev',
      },
      body: JSON.stringify({ draftId: 'draft-cgpt-1', rating: 5, comment: 'Bài chất lượng, duyệt đăng.' }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(approveRes.status, 200);
  const approvedBody = await approveRes.json();
  assert.equal(approvedBody.autoPublishMode, 'zero-token-queue');
  assert.equal(approvedBody.draft.status, 'approved');
  assert.equal(approvedBody.draft.publishState, 'queued');

  const rejectRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/reject', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fake-admin-id-token',
        'Content-Type': 'application/json',
        Origin: 'https://hskfreelearningai.pages.dev',
      },
      body: JSON.stringify({ draftId: 'draft-cgpt-2', rating: 2, comment: 'Chưa phù hợp' }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(rejectRes.status, 200);
  const rejectBody = await rejectRes.json();
  assert.equal(rejectBody.draft.status, 'rejected');

  const queueRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/public/approved-queue'),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(queueRes.status, 200);
  const queueBody = await queueRes.json();
  assert.equal(queueBody.count, 1);
  assert.equal(queueBody.items[0].id, 'draft-cgpt-1');
  assert.equal(queueBody.items[0].reviewHistory, undefined);
});

test('ChatGPT Gateway MCP/REST works with zero internal AI, supports revision requests and update_seo_draft', async () => {
  const r2 = createMemoryR2();
  const externalCalls = [];
  const baseFetch = createMockFetch();
  const fetchImpl = async (url, init) => {
    externalCalls.push(String(url));
    return baseFetch(url, init);
  };
  const env = {
    SEO_BUCKET: r2,
    FIREBASE_API_KEY: 'test-fb-key',
    CHATGPT_SEO_INGEST_KEY: 'hsk_cgpt_static_secret_key_001',
    ALLOWED_ORIGINS: 'https://hskfreelearningai.pages.dev',
    CHATGPT_MAX_PER_HOUR: '2',
  };

  // Unauthorized without gateway key
  const unauthRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/chatgpt/brief'),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(unauthRes.status, 401);

  // Admin rotates key and inspects config
  const rotateRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/chatgpt-gateway/rotate', {
      method: 'POST',
      headers: { Authorization: 'Bearer fake-admin-id-token', Origin: 'https://hskfreelearningai.pages.dev' },
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(rotateRes.status, 200);
  const rotatedCfg = await rotateRes.json();
  assert.equal(rotatedCfg.mode, 'chatgpt-only');
  assert.equal(rotatedCfg.runAiReview, false);
  const secretMcpUrl = rotatedCfg.endpoints.mcpSecretUrl;

  // MCP initialize + tools/list must include update_seo_draft
  const listToolsRes = await handleSeoEditorialFetch(
    new Request(secretMcpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(listToolsRes.status, 200);
  const toolNames = (await listToolsRes.json()).result.tools.map((t) => t.name);
  assert.deepEqual(toolNames, ['get_seo_brief', 'submit_seo_draft', 'update_seo_draft', 'list_chatgpt_drafts']);

  // ChatGPT submits 1 draft via MCP submit_seo_draft -> pending_review, zero internal AI
  const submitRes = await handleSeoEditorialFetch(
    new Request(secretMcpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'submit_seo_draft',
          arguments: {
            trendQuery: 'xin lỗi trong tiếng trung',
            authorModel: 'ChatGPT Plus',
            article: makeMockArticleJson('Phân biệt xin lỗi trong tiếng Trung chuẩn bản xứ'),
          },
        },
      }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(submitRes.status, 200);
  const submitData = (await submitRes.json()).result.structuredContent;
  assert.equal(submitData.ok, true);
  assert.equal(submitData.status, 'pending_review');
  assert.equal(submitData.requiresAdminApproval, true);
  assert.equal(submitData.pushedToGithub, false);
  assert.equal(submitData.aiReviews.status, 'skipped');
  assert.ok(externalCalls.every((u) => !u.includes('openrouter.ai') && !u.includes('xkiro.com')));

  const draftId = submitData.draftId;

  // Admin sends revision feedback via POST /api/rewrite -> saved as revisionRequest (zero AI)
  const adminRevRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/rewrite', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fake-admin-id-token',
        'Content-Type': 'application/json',
        Origin: 'https://hskfreelearningai.pages.dev',
      },
      body: JSON.stringify({
        draftId,
        comment: 'Bổ sung thêm mục kết luận so sánh nhanh ở cuối bài.',
        rating: 3,
      }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(adminRevRes.status, 200);
  const adminRevBody = await adminRevRes.json();
  assert.equal(adminRevBody.mode, 'chatgpt-revision-request');
  assert.equal(adminRevBody.draft.revisionRequest.comment, 'Bổ sung thêm mục kết luận so sánh nhanh ở cuối bài.');

  // Next get_seo_brief exposes pendingRevisionRequests so ChatGPT sees what to fix
  const briefRes = await handleSeoEditorialFetch(
    new Request(secretMcpUrl, {
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
  const briefData = (await briefRes.json()).result.structuredContent;
  assert.equal(briefData.pendingRevisionRequests.length, 1);
  assert.equal(briefData.pendingRevisionRequests[0].draftId, draftId);
  assert.equal(briefData.aiReviewEnabled, false);

  // ChatGPT revises draft via MCP update_seo_draft -> bumps v2, clears revisionRequest, stays pending_review
  const updatedArticle = makeMockArticleJson('Phân biệt xin lỗi trong tiếng Trung (Đã bổ sung kết luận)');
  updatedArticle.sections.push({
    id: 'ket-luan-so-sanh',
    heading: 'Kết luận nhanh: Dùng 对不起 hay 不好意思 khi nào?',
    paragraphs: ['Lỗi nặng hoặc trang trọng dùng 对不起; ngại nhẹ nơi công cộng dùng 不好意思.'],
  });
  const updateRes = await handleSeoEditorialFetch(
    new Request(secretMcpUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'update_seo_draft',
          arguments: {
            draftId,
            revisionSummary: 'Đã thêm mục kết luận so sánh rõ ràng theo góp ý Admin.',
            article: updatedArticle,
          },
        },
      }),
    }),
    env,
    {},
    { fetchImpl }
  );
  const updateData = (await updateRes.json()).result.structuredContent;
  assert.equal(updateData.ok, true);
  assert.equal(updateData.version, 2);
  assert.equal(updateData.status, 'pending_review');

  // Duplicate slug submission via REST fails with 409; hourly cap blocks >2 submissions
  const dupRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/chatgpt/drafts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rotatedCfg.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trendQuery: 'xin lỗi trong tiếng trung',
        article: makeMockArticleJson('Phân biệt xin lỗi trong tiếng Trung chuẩn bản xứ'),
      }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(dupRes.status, 409);

  // Submit 2nd distinct draft via REST PUT fails on nonexistent, POST succeeds, 3rd hits hourly 429
  const post2 = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/chatgpt/drafts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rotatedCfg.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trendQuery: 'lịch thi hsk 2027 tại hà nội',
        article: makeMockArticleJson('Lịch thi HSK 2027 tại Hà Nội mới nhất'),
      }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(post2.status, 201);

  const post3 = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/chatgpt/drafts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rotatedCfg.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trendQuery: 'cách học bộ thủ tiếng trung nhanh',
        article: makeMockArticleJson('Cách học bộ thủ tiếng Trung nhớ lâu'),
      }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(post3.status, 429);

  // Approve draft-1, then updating it via REST PUT /api/chatgpt/drafts fails 409
  await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/approve', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fake-admin-id-token',
        'Content-Type': 'application/json',
        Origin: 'https://hskfreelearningai.pages.dev',
      },
      body: JSON.stringify({ draftId }),
    }),
    env,
    {},
    { fetchImpl }
  );
  const putApproved = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/chatgpt/drafts', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${rotatedCfg.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ draftId, article: updatedArticle }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(putApproved.status, 409);
});
