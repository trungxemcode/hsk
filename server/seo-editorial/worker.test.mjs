import assert from 'node:assert/strict';
import test from 'node:test';
import {
  callWriterJson,
  collectTrendTopicsWorker,
  extractCfAiText,
  extractJsonObject,
  measureRewriteChange,
  normalizeArticle,
  rewriteDraftRecord,
  runAuditRound,
} from './pipeline-core.mjs';
import {
  WRITER_STANDARD_ID,
  WRITER_SYSTEM_PROMPT,
  buildStandardRevisionWriterPrompt,
  buildStandardTrendWriterPrompt,
  selectWriterStyle,
} from './writer-standard.mjs';
import {
  AUDIT_PROTOCOL_ID,
  AUDITOR_SYSTEM_PROMPT,
  buildAuditorPrompt,
  computeAuditScoreAndVerdict,
  sanitizeAuditFeedbackForWriter,
  selectRoundChallenges,
} from './audit-protocol.mjs';
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
      const sys = String(input?.messages?.[0]?.content || '');
      if (sys.includes(AUDIT_PROTOCOL_ID) || prompt.includes('ĐỀ BÀI CẦN KHÓA ĐỘC LẬP')) {
        const isRound1 = prompt.includes('Vòng 1/2');
        return {
          response: JSON.stringify({
            lockedIntent: 'Phân biệt cách dùng xin lỗi tiếng Trung',
            targetAudience: 'Người học HSK 1-3 tại Việt Nam',
            scores: {
              A: { score: 13, evidence: 'Trả lời đúng trọng tâm.' },
              B: { score: isRound1 ? 8 : 15, evidence: isRound1 ? 'Thiếu biến điệu thanh 3.' : 'Đã chuẩn xác.' },
              C: { score: 12, evidence: 'Giải thích đủ.' },
              D: { score: 10, evidence: 'Có bảng so sánh.' },
              E: { score: 9, evidence: 'Ví dụ minh họa rõ.' },
              F: { score: 9, evidence: 'Metadata chuẩn.' },
              G: { score: 7, evidence: 'Bố cục mạch lạc.' },
              H: { score: 6, evidence: 'Đúng văn phong chuẩn mực.' },
              I: { score: 5, evidence: 'Dễ áp dụng.' },
              J: { score: 4, evidence: 'Không bịa đặt.' },
            },
            hardFails: [],
            seriousUnintentionalError: false,
            wrongSearchIntent: false,
            unverifiedCriticalClaims: [],
            challengeResults: [
              { id: isRound1 ? '5.1' : '5.2', group: 'Độ sâu ngữ nghĩa', result: 'Pass', finding: 'Nội dung bám sát tiếng Trung.' },
            ],
            errors: isRound1
              ? [
                  {
                    code: 'ERR-01',
                    severity: 'Major',
                    location: 'muc-1',
                    excerpt: 'duìbuqǐ',
                    reason: 'Cần bổ sung ghi chú biến điệu thanh 3 khi đi cạnh thanh nhẹ.',
                    evidence: 'Mục 6 kiểm tra Pinyin',
                    fix: 'Thêm lưu ý đọc tự nhiên và ví dụ giao tiếp.',
                    affectedCategories: ['B'],
                  },
                ]
              : [],
            strengths: ['Đủ ví dụ Hán - Pinyin - Việt'],
            summary: isRound1 ? 'Cần bổ sung chi tiết ngữ âm ở muc-1.' : 'Đạt chuẩn xuất bản sau khi chỉnh sửa.',
          }),
        };
      }
      return {
        choices: [
          {
            message: {
              content: `<think>Suy nghĩ nháp</think>\n\`\`\`json\n${JSON.stringify({
                writerBrief: {
                  searchIntent: 'Phân biệt và sử dụng mẫu câu xin lỗi tiếng Trung',
                  targetAudience: 'Người học HSK 1–3 tại Việt Nam',
                  styleId: 'educational-how-to',
                  primaryKeyword: 'xin lỗi trong tiếng trung',
                },
                ...makeMockArticleJson(),
              })}\n\`\`\``,
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
  assert.equal(created.aiReviews.writerStandard, WRITER_STANDARD_ID);
  assert.equal(created.aiReviews.protocol, AUDIT_PROTOCOL_ID);
  assert.equal(created.aiReviews.autoPolished, true);
  assert.equal(created.aiReviews.reviewers.length, 2);
  assert.equal(created.aiReviews.reviewers[0].auditVerdict, 'REVISION_REQUIRED');
  assert.equal(created.aiReviews.reviewers[1].auditVerdict, 'APPROVED');
  assert.equal(created.aiReviews.averageScore, 90);
  assert.ok(created.writerBrief?.styleId);

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

test('Role separation: Writer prompts never contain Auditor rules/challenges and Auditor prompts never contain Writer standard', () => {
  const style = selectWriterStyle({ topic: 'Phân biệt 对不起 và 不好意思', query: 'xin lỗi trong tiếng trung', category: 'ngu-phap' });
  assert.equal(style.id, 'informative-expert');

  const trendPrompt = buildStandardTrendWriterPrompt({
    topic: 'Phân biệt 对不起 và 不好意思',
    slug: 'phan-biet-duibuqi-buhaoyisi',
    category: 'ngu-phap',
    hskTag: 'HSK 1–3',
    trendQuery: 'xin lỗi trong tiếng trung',
    trendSource: 'google-trends',
    style,
    existingSlugs: [],
    today: '2026-11-26',
  });
  const revPrompt = buildStandardRevisionWriterPrompt({
    draft: { version: 1, trendQuery: 'xin lỗi trong tiếng trung', article: makeMockArticleJson() },
    sanitizedFeedback: 'Điểm từng hạng mục: A: 13/14 · B: 10/16\n- [Major] Vị trí: muc-1 | Lỗi: Thiếu lưu ý biến điệu.',
    adminComment: '',
    today: '2026-11-26',
  });

  for (const writerText of [WRITER_SYSTEM_PROMPT, trendPrompt, revPrompt]) {
    assert.ok(!/SEO-AUDITOR-01|PROVISIONAL_PASS|Ngân hàng kiểm tra|Phép thử thay thế chủ đề|HF-01|85\/100/i.test(writerText));
  }

  const auditorPrompt = buildAuditorPrompt({
    round: 1,
    article: makeMockArticleJson(),
    writerBrief: { styleId: 'informative-expert' },
    trendQuery: 'xin lỗi trong tiếng trung',
    category: 'ngu-phap',
  });
  assert.ok(!/SEO-WRITER-01/i.test(AUDITOR_SYSTEM_PROMPT));
  assert.ok(!/SEO-WRITER-01/i.test(auditorPrompt));

  const r1Challenges = selectRoundChallenges(1, { category: 'ky-thi', query: 'lịch thi hsk 2027' }).map((c) => c.id);
  const r2Challenges = selectRoundChallenges(2, { category: 'ky-thi', query: 'lịch thi hsk 2027' }).map((c) => c.id);
  assert.ok(r1Challenges.length >= 3 && r2Challenges.length >= 3);
  assert.equal(r1Challenges.some((id) => r2Challenges.includes(id)), false);
});

test('Audit scoring enforces Round 1 cap, 60% category floor, Hard Fail REJECTED, caps 59/69, and firewall stripping', () => {
  const fullScores = {
    A: { score: 14, evidence: 'Tốt' },
    B: { score: 16, evidence: 'Tốt' },
    C: { score: 14, evidence: 'Tốt' },
    D: { score: 12, evidence: 'Tốt' },
    E: { score: 10, evidence: 'Tốt' },
    F: { score: 10, evidence: 'Tốt' },
    G: { score: 8, evidence: 'Tốt' },
    H: { score: 7, evidence: 'Tốt' },
    I: { score: 5, evidence: 'Tốt' },
    J: { score: 4, evidence: 'Tốt' },
  };

  // Round 1 NEVER returns APPROVED even with 100/100
  const r1 = computeAuditScoreAndVerdict({ scores: fullScores, hardFails: [], challengeResults: [{ id: '5.1', group: 'Độ sâu', result: 'Pass', finding: 'Phép thử thay thế chủ đề OK' }] }, { round: 1 });
  assert.equal(r1.score, 100);
  assert.equal(r1.auditVerdict, 'PROVISIONAL_PASS');

  // Round 2 returns APPROVED when >= 85 and all categories >= 60%
  const r2 = computeAuditScoreAndVerdict({ scores: fullScores, hardFails: [] }, { round: 2 });
  assert.equal(r2.auditVerdict, 'APPROVED');

  // Round 2 with total = 98 but J = 2/4 (< 60%) -> REVISION_REQUIRED
  const floorFail = computeAuditScoreAndVerdict({
    scores: { ...fullScores, J: { score: 2, evidence: 'Thiếu nhất quán' } },
    hardFails: [],
  }, { round: 2 });
  assert.equal(floorFail.score, 98);
  assert.deepEqual(floorFail.below60Categories, ['J']);
  assert.equal(floorFail.auditVerdict, 'REVISION_REQUIRED');

  // Hard Fail overrides score -> REJECTED
  const hfFail = computeAuditScoreAndVerdict({
    scores: fullScores,
    hardFails: [{ code: 'HF-02', location: 'muc-2', reason: 'Tự tạo số liệu.' }],
  }, { round: 2 });
  assert.equal(hfFail.auditVerdict, 'REJECTED');

  // Score caps 59 & 69
  assert.equal(computeAuditScoreAndVerdict({ scores: fullScores, seriousUnintentionalError: true }, { round: 2 }).score, 59);
  assert.equal(computeAuditScoreAndVerdict({ scores: fullScores, wrongSearchIntent: true }, { round: 2 }).score, 69);

  // Firewall strips challengeResults and protocol rules before passing to Writer
  const sanitized = sanitizeAuditFeedbackForWriter({
    ...r1,
    status: 'completed',
    errors: [{ code: 'ERR-01', severity: 'Major', location: 'muc-1', excerpt: 'x', reason: 'Thiếu ngoại lệ', fix: 'Thêm ngoại lệ' }],
  });
  assert.match(sanitized, /Thiếu ngoại lệ/);
  assert.ok(!/5\.1|Phép thử thay thế chủ đề|PROVISIONAL_PASS|SEO-AUDITOR-01|HF-01/.test(sanitized));
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
            article: {
              ...makeMockArticleJson('Cách nói xin lỗi trong tiếng Trung tự nhiên'),
              sections: [{
                id: 'doi-chieu-tinh-huong',
                heading: 'Chọn cách xin lỗi theo tình huống',
                paragraphs: ['Tùy mức độ lỗi mà bạn chọn cụm từ tự nhiên nhất.'],
              }],
              summary: 'Dùng «  đã  » và «mới». Pinyin (jiù) giữ nguyên.',
              faqs: undefined,
            },
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
  assert.equal(sc.aiReviews.averageScore, 90);
  assert.equal(sc.aiReviews.status, 'completed');
  assert.equal(ai.calls.length, 2);
  assert.ok(sc.aiReviews.reviewers.every((review) => !Object.hasOwn(review, 'challengeResults')));
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
  const submittedDraft = adminDraftsJson.draftsData.drafts[0];
  assert.equal(submittedDraft.article.title, 'Cách nói xin lỗi trong tiếng Trung tự nhiên');
  assert.equal(submittedDraft.article.summary, 'Dùng “đã” và “mới”. Pinyin (jiù) giữ nguyên.');
  assert.equal(submittedDraft.article.sections[0].paragraphs[0], makeMockArticleJson().sections[0].paragraphs[0]);
  assert.equal(submittedDraft.aiReviews.pipeline[0], 'chatgpt');
  assert.equal(submittedDraft.aiReviews.protocol, AUDIT_PROTOCOL_ID);
  assert.equal(submittedDraft.aiReviews.writerStandard, null);
  assert.equal(submittedDraft.aiReviews.round1Verdict, 'REVISION_REQUIRED');
  assert.equal(submittedDraft.aiReviews.finalVerdict, 'APPROVED');
  assert.equal(submittedDraft.aiReviews.autoPolished, false);

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

test('Public GET /public/approved-queue exposes ONLY approved articles without auth and strips internal fields', async () => {
  const r2 = createMemoryR2();
  const sampleArt = makeMockArticleJson('Bài SEO đã duyệt xuất bản tự động');
  await r2.put(
    'seo-editorial/drafts.json',
    JSON.stringify({
      schema: 1,
      updatedAt: '2026-11-26T14:50:00.000Z',
      drafts: [
        {
          id: 'draft-approved-1',
          status: 'approved',
          approvedAt: '2026-11-26T14:50:00.000Z',
          publishedSlug: 'bai-seo-da-duyet',
          rating: 5,
          trendQuery: 'xin lỗi tiếng trung',
          writerBrief: { styleId: 'educational-how-to' },
          aiReviews: { averageScore: 92, reviewers: [{ challengeResults: [{ id: '5.1' }] }] },
          reviewHistory: [{ action: 'approved', comment: 'Internal note' }],
          article: { ...sampleArt, slug: 'bai-seo-da-duyet' },
        },
        {
          id: 'draft-pending-2',
          status: 'pending_review',
          article: { ...sampleArt, slug: 'bai-cho-duyet' },
        },
        {
          id: 'draft-rejected-3',
          status: 'rejected',
          article: { ...sampleArt, slug: 'bai-bi-tu-choi' },
        },
      ],
    })
  );

  const env = { SEO_BUCKET: r2 };
  const res = await handleSeoEditorialFetch(new Request('https://seo.workers.dev/public/approved-queue'), env, {});
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.count, 1);
  assert.equal(body.items.length, 1);
  assert.equal(body.items[0].id, 'draft-approved-1');
  assert.equal(body.items[0].article.slug, 'bai-seo-da-duyet');
  assert.equal(body.items[0].aiReviews, undefined);
  assert.equal(body.items[0].reviewHistory, undefined);
  assert.equal(body.items[0].writerBrief, undefined);
  assert.equal(body.items[0].rating, undefined);
});

test('OpenRouter-first pipeline runs Writer + Round 1 + Round 2 with zero Cloudflare Neurons when OPENROUTER_API_KEY is set', async () => {
  const r2 = createMemoryR2();
  const ai = createMockAi();
  const openrouterCalls = [];
  const openrouterReasoningFlags = [];
  let simulated400Done = false;
  const fetchImpl = async (url, init) => {
    const u = String(url);
    if (u.includes('openrouter.ai')) {
      const body = JSON.parse(init.body);
      if (!simulated400Done) {
        simulated400Done = true;
        openrouterReasoningFlags.push(body.reasoning);
        return new Response('reasoning unsupported', { status: 400 });
      }
      openrouterCalls.push(body.model);
      openrouterReasoningFlags.push(body.reasoning);
      const sys = String(body.messages?.[0]?.content || '');
      if (sys.includes(AUDIT_PROTOCOL_ID)) {
        return Response.json({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  lockedIntent: 'Xin lỗi trong tiếng Trung',
                  targetAudience: 'Người tự học HSK',
                  scores: {
                    A: { score: 13, evidence: 'Trực diện' },
                    B: { score: 15, evidence: 'Chuẩn' },
                    C: { score: 13, evidence: 'Đủ sâu' },
                    D: { score: 11, evidence: 'Có giá trị' },
                    E: { score: 9, evidence: 'Logic tốt' },
                    F: { score: 9, evidence: 'SEO chuẩn' },
                    G: { score: 7, evidence: 'Mạch lạc' },
                    H: { score: 7, evidence: 'Đúng văn phong' },
                    I: { score: 5, evidence: 'Ứng dụng cao' },
                    J: { score: 4, evidence: 'Minh bạch' },
                  },
                  hardFails: [],
                  challengeResults: [{ id: '5.1', group: 'Độ sâu', result: 'Pass', finding: 'Đạt' }],
                  errors: [],
                  strengths: ['Ví dụ rõ ràng'],
                  summary: 'Đạt chuẩn xuất bản.',
                }),
              },
            },
          ],
        });
      }
      return Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                writerBrief: { styleId: 'educational-how-to', primaryKeyword: 'xin lỗi tiếng trung' },
                ...makeMockArticleJson(),
              }),
            },
          },
        ],
      });
    }
    return createMockFetch()(url, init);
  };

  const env = {
    AI: ai,
    SEO_BUCKET: r2,
    OPENROUTER_API_KEY: 'sk-or-test-000000',
    OPENROUTER_WRITER_MODEL: 'google/gemma-4-26b-a4b-it:free',
    OPENROUTER_REVIEW_MODEL_1: 'nvidia/nemotron-3.5-lightning:free',
    OPENROUTER_REVIEW_MODEL_2: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    FIREBASE_API_KEY: 'test-fb-key',
    ALLOWED_ORIGINS: 'https://hskfreelearningai.pages.dev',
  };

  const res = await handleSeoEditorialFetch(
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
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(ai.calls.length, 0, 'Must consume ZERO Cloudflare Workers AI neurons when OpenRouter succeeds');
  assert.deepEqual(openrouterCalls, [
    'google/gemma-4-26b-a4b-it:free',
    'nvidia/nemotron-3.5-lightning:free',
    'nvidia/nemotron-3-ultra-550b-a55b:free',
  ]);
  assert.deepEqual(openrouterReasoningFlags, [
    { enabled: false },
    undefined,
    { enabled: false },
    { enabled: false },
  ]);
  assert.equal(body.createdDrafts[0].aiReviews.provider, 'openrouter');
  assert.equal(body.createdDrafts[0].aiReviews.finalVerdict, 'APPROVED');
});

test('configured authoring and review fall back to Workers AI when external providers fail', async () => {
  const ai = createMockAi();
  const providerCalls = [];
  const env = {
    AI: ai,
    OPENROUTER_API_KEY: 'test-openrouter-key',
    XKIRO_API_KEY: 'test-xkiro-key',
    CF_WRITER_MODEL: '@cf/google/gemma-4-26b-a4b-it',
    CF_REVIEWER_1_MODEL: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  };
  const fetchImpl = async (url) => {
    assert.equal(ai.calls.length, 0, 'External providers are tried before Workers AI');
    providerCalls.push(new URL(url).hostname);
    return new Response('Temporarily unavailable', { status: 503 });
  };

  const written = await callWriterJson({ prompt: 'Viết bài HSK', env, fetchImpl });
  assert.equal(written.provider, 'cloudflare-ai');
  assert.equal(written.model, env.CF_WRITER_MODEL);
  assert.ok(providerCalls.length > 0);
  assert.ok(providerCalls.every((host) => host === 'openrouter.ai'));
  assert.deepEqual(ai.calls, [env.CF_WRITER_MODEL]);

  providerCalls.length = 0;
  ai.calls.length = 0;
  const audit = await runAuditRound({ article: written.data, env, fetchImpl });
  assert.equal(providerCalls[0], 'api.xkiro.com');
  assert.ok(providerCalls.slice(1).includes('openrouter.ai'));
  assert.equal(audit.model, `cf-ai:${env.CF_REVIEWER_1_MODEL}`);
  assert.equal(audit.status, 'completed');
  assert.deepEqual(ai.calls, [env.CF_REVIEWER_1_MODEL]);
});

test('concurrent /api/rewrite preserves /api/approve made while AI rewrite is in-flight', async () => {
  const r2 = createMemoryR2();
  const initialDrafts = {
    schema: 1,
    updatedAt: '2026-11-27T07:00:00.000Z',
    drafts: [
      {
        id: 'draft-a',
        version: 1,
        status: 'pending_review',
        trendQuery: 'xin lỗi tiếng trung',
        article: { ...makeMockArticleJson('Bài A bản v1'), slug: 'bai-a' },
      },
      {
        id: 'draft-b',
        version: 1,
        status: 'pending_review',
        trendQuery: 'cảm ơn tiếng trung',
        article: { ...makeMockArticleJson('Bài B chờ duyệt'), slug: 'bai-b' },
      },
    ],
  };
  await r2.put('seo-editorial/drafts.json', JSON.stringify(initialDrafts));

  let releaseRewriteWriter;
  const writerStarted = new Promise((resolve) => {
    let released = false;
    releaseRewriteWriter = () => {
      if (!released) {
        released = true;
        resolve();
      }
    };
  });
  let notifyWriterCalled;
  const writerCalledPromise = new Promise((resolve) => {
    notifyWriterCalled = resolve;
  });

  const baseFetch = createMockFetch();
  const fetchImpl = async (url, init) => {
    const u = String(url);
    if (u.includes('openrouter.ai')) {
      const body = JSON.parse(init.body);
      const sys = String(body.messages?.[0]?.content || '');
      if (!sys.includes(AUDIT_PROTOCOL_ID)) {
        notifyWriterCalled();
        await writerStarted;
        return Response.json({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  writerBrief: { styleId: 'educational-how-to', primaryKeyword: 'xin lỗi tiếng trung' },
                  ...makeMockArticleJson('Bài A đã viết lại v2'),
                  revisionSummary: 'Đã mở rộng ví dụ và kết luận rõ ràng.',
                }),
              },
            },
          ],
        });
      }
      return Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                lockedIntent: 'Xin lỗi trong tiếng Trung',
                targetAudience: 'Người tự học HSK',
                scores: {
                  A: { score: 13, evidence: 'Tốt' },
                  B: { score: 15, evidence: 'Chuẩn' },
                  C: { score: 13, evidence: 'Đủ sâu' },
                  D: { score: 11, evidence: 'Có giá trị' },
                  E: { score: 9, evidence: 'Logic' },
                  F: { score: 9, evidence: 'SEO' },
                  G: { score: 7, evidence: 'Mạch lạc' },
                  H: { score: 7, evidence: 'Tự nhiên' },
                  I: { score: 5, evidence: 'Ứng dụng' },
                  J: { score: 4, evidence: 'Minh bạch' },
                },
                hardFails: [],
                challengeResults: [],
                errors: [],
                strengths: ['Rõ ràng'],
                summary: 'Đạt chuẩn.',
              }),
            },
          },
        ],
      });
    }
    return baseFetch(url, init);
  };

  const env = {
    AI: createMockAi(),
    SEO_BUCKET: r2,
    OPENROUTER_API_KEY: 'sk-or-test-concurrent',
    FIREBASE_API_KEY: 'test-fb-key',
    ALLOWED_ORIGINS: 'https://hskfreelearningai.pages.dev',
  };

  // Start background rewrite for draft-a
  const rewritePromise = handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/rewrite', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fake-admin-id-token',
        'Content-Type': 'application/json',
        Origin: 'https://hskfreelearningai.pages.dev',
      },
      body: JSON.stringify({ draftId: 'draft-a', comment: 'Bổ sung ví dụ', rating: 4 }),
    }),
    env,
    {},
    { fetchImpl }
  );

  // Wait until draft-a rewrite is mid-flight at OpenRouter, then approve draft-b concurrently
  await writerCalledPromise;
  const approveRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/approve', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fake-admin-id-token',
        'Content-Type': 'application/json',
        Origin: 'https://hskfreelearningai.pages.dev',
      },
      body: JSON.stringify({ draftId: 'draft-b', comment: 'OK xuất bản', rating: 5 }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(approveRes.status, 200);

  // Let draft-a's AI rewrite finish and persist
  releaseRewriteWriter();
  const rewriteRes = await rewritePromise;
  assert.equal(rewriteRes.status, 200);
  const rewriteBody = await rewriteRes.json();

  assert.equal(rewriteBody.draft.id, 'draft-a');
  assert.equal(rewriteBody.draft.version, 2);

  const stored = JSON.parse((await r2.get('seo-editorial/drafts.json')) ? await (await r2.get('seo-editorial/drafts.json')).text() : '{}');
  const storedA = stored.drafts.find((d) => d.id === 'draft-a');
  const storedB = stored.drafts.find((d) => d.id === 'draft-b');
  assert.equal(storedA?.version, 2, 'Draft A must be updated to v2');
  assert.equal(storedA?.article?.title, 'Bài A đã viết lại v2');
  assert.equal(storedB?.status, 'approved', 'Draft B approval must NOT be clobbered by concurrent rewrite');
  assert.equal(storedB?.publishState, 'queued');

  // Calling /api/rewrite on an already approved draft returns 409
  const conflictRes = await handleSeoEditorialFetch(
    new Request('https://seo.workers.dev/api/rewrite', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer fake-admin-id-token',
        'Content-Type': 'application/json',
        Origin: 'https://hskfreelearningai.pages.dev',
      },
      body: JSON.stringify({ draftId: 'draft-b', comment: 'Thử viết lại bài đã duyệt' }),
    }),
    env,
    {},
    { fetchImpl }
  );
  assert.equal(conflictRes.status, 409);
});

test('buildStandardRevisionWriterPrompt puts adminComment first and preserves role separation', () => {
  const prompt = buildStandardRevisionWriterPrompt({
    draft: {
      version: 1,
      trendQuery: 'giới thiệu bản thân bằng tiếng trung xin việc',
      article: makeMockArticleJson('Giới thiệu bản thân'),
    },
    sanitizedFeedback: 'Cần sửa Pinyin chữ míngzi trong bảng.',
    adminComment: 'Bài viết còn cụt và thiếu thông tin kinh nghiệm, học vấn, điểm mạnh khi xin việc.',
    rating: 2,
    existingSlugs: ['cac-loai-tu-trong-tieng-trung-co-ban'],
    today: '2026-11-27',
  });

  const adminIdx = prompt.indexOf('MỆNH LỆNH BẮT BUỘC TỪ ADMIN');
  const secIdx = prompt.indexOf('LƯU Ý PHỤ TỪ KIỂM ĐỊNH TRƯỚC');
  assert.ok(adminIdx !== -1 && secIdx !== -1 && adminIdx < secIdx, 'adminComment must precede secondary auditor notes');
  assert.ok(prompt.includes('[Admin chấm 2/5 sao]'));
  assert.equal(prompt.includes(AUDIT_PROTOCOL_ID), false, 'Writer prompt must never leak Auditor protocol ID');
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
      {
        id: 'sec-2',
        heading: 'Kết luận',
        paragraphs: ['Tổng kết ngắn gọn.'],
      },
    ],
  };

  const normalized = normalizeArticle(raw, { today: '2026-11-27', existingSlugs: [] });
  const serialized = JSON.stringify(normalized);
  assert.equal(serialized.includes('[object Object]'), false, 'Must never serialize objects as [object Object]');
  assert.ok(normalized.sections[0].bullets[0].includes('我有三年工作经验。'));
  assert.ok(normalized.sections[0].bullets[1].includes('Mục tiêu: Mong muốn gắn bó lâu dài'));
  assert.ok(normalized.sections[0].paragraphs[1].includes('Kinh nghiệm làm việc: Nêu số năm làm việc'));
});

test('rewriteDraftRecord retries lazy near-identical rewrites and forwards adminComment into auto-polish', async () => {
  const originalArticle = {
    ...makeMockArticleJson('Giới thiệu bản thân bằng tiếng Trung xin việc'),
    slug: 'gioi-thieu-ban-than-xin-viec',
  };
  const draft = {
    id: 'draft-lazy-check',
    version: 1,
    status: 'pending_review',
    trendQuery: 'giới thiệu bản thân bằng tiếng trung xin việc',
    category: 'meo-hoc',
    hskTag: 'HSK 1–3',
    article: originalArticle,
    aiReviews: {
      reviewers: [
        { label: 'Vòng 1', score: 85, auditVerdict: 'PROVISIONAL_PASS', summary: 'Tạm ổn.', mustFix: ['Kiểm tra Pinyin míngzi'] },
      ],
    },
    reviewHistory: [],
  };

  const writerPrompts = [];
  let writerCallCount = 0;

  const fetchImpl = async (url, init) => {
    const u = String(url);
    if (!u.includes('openrouter.ai')) {
      return new Response('ok', { status: 200 });
    }
    const body = JSON.parse(init.body);
    const sys = String(body.messages?.[0]?.content || '');
    const userMsg = String(body.messages?.[1]?.content || '');

    if (sys.includes(AUDIT_PROTOCOL_ID)) {
      const roundNum = writerCallCount >= 2 ? 1 : 0;
      const needsPolish = userMsg.includes('Kiểm tra và đánh giá') && !writerPrompts.some((p) => p.isAutoPolish);
      return Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                lockedIntent: 'Giới thiệu bản thân khi xin việc',
                targetAudience: 'Người học HSK',
                scores: {
                  A: { score: 13, evidence: 'Tốt' },
                  B: { score: 15, evidence: 'Chuẩn' },
                  C: { score: 13, evidence: 'Đủ sâu' },
                  D: { score: 11, evidence: 'Có giá trị' },
                  E: { score: 9, evidence: 'Logic' },
                  F: { score: 9, evidence: 'SEO' },
                  G: { score: 7, evidence: 'Mạch lạc' },
                  H: { score: 7, evidence: 'Tự nhiên' },
                  I: { score: 5, evidence: 'Ứng dụng' },
                  J: { score: 4, evidence: 'Minh bạch' },
                },
                hardFails: [],
                challengeResults: [],
                errors: roundNum === 1 && needsPolish ? [{ code: 'M1', severity: 'Minor', location: 'Mục 2', reason: 'Cần thêm 1 câu ví dụ', fix: 'Thêm ví dụ' }] : [],
                strengths: ['Đầy đủ'],
                summary: 'Đạt chuẩn.',
              }),
            },
          },
        ],
      });
    }

    writerCallCount += 1;
    const isAutoPolish = !userMsg.includes('CẢNH BÁO VIẾT LẠI BẮT BUỘC') && writerCallCount >= 3;
    writerPrompts.push({ call: writerCallCount, isAutoPolish, userMsg, temp: body.temperature, maxTokens: body.max_tokens });

    if (writerCallCount === 1) {
      // Simulate lazy first attempt: returns nearly identical article as original
      return Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                revisionSummary: 'Chỉnh sửa nhẹ câu chữ.',
                writerBrief: { styleId: 'educational-how-to', primaryKeyword: 'giới thiệu bản thân xin việc' },
                ...originalArticle,
              }),
            },
          },
        ],
      });
    }

    // Second (escalated retry) and third (auto-polish) calls return rich 5-section article
    return Response.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              revisionSummary: 'Đã mở rộng 5 mục gồm họ tên, học vấn, kinh nghiệm, điểm mạnh và kết thúc phỏng vấn.',
              writerBrief: { styleId: 'educational-how-to', primaryKeyword: 'giới thiệu bản thân xin việc' },
              title: 'Hướng dẫn giới thiệu bản thân bằng tiếng Trung xin việc đầy đủ 5 phần',
              metaTitle: 'Giới thiệu bản thân bằng tiếng Trung xin việc | HSK Flashcards',
              metaDescription: 'Mẫu câu và cấu trúc giới thiệu bản thân bằng tiếng Trung khi phỏng vấn xin việc từ họ tên, học vấn đến kinh nghiệm và mục tiêu.',
              summary: 'Tổng hợp cấu trúc 5 phần giúp bạn trả lời trọn vẹn câu hỏi giới thiệu bản thân khi đi phỏng vấn tiếng Trung.',
              hskTag: 'HSK 1–3',
              readMinutes: 7,
              keywords: ['giới thiệu bản thân tiếng trung xin việc'],
              sections: [
                { id: 'muc-1', heading: '1. Chào hỏi và nêu họ tên, quê quán', paragraphs: ['Mở đầu phần phỏng vấn bằng lời chào lịch sự, tên đầy đủ và nơi sinh sống để tạo ấn tượng chuyên nghiệp ngay từ đầu.'] },
                { id: 'muc-2', heading: '2. Trình bày học vấn, chuyên ngành và bằng cấp', paragraphs: ['Nêu rõ trường đại học, chuyên ngành tốt nghiệp và chứng chỉ ngoại ngữ HSK đang sở hữu để nhà tuyển dụng đánh giá nền tảng.'] },
                { id: 'muc-3', heading: '3. Kinh nghiệm làm việc và thành tích nổi bật', paragraphs: ['Giới thiệu số năm kinh nghiệm, vị trí từng đảm nhận và kết quả cụ thể bạn đã tạo ra ở công ty trước.'] },
                { id: 'muc-4', heading: '4. Điểm mạnh cá nhân và lý do ứng tuyển', paragraphs: ['Trình bày kỹ năng phù hợp vị trí tuyển dụng và động lực muốn gắn bó lâu dài với doanh nghiệp.'] },
                { id: 'muc-5', heading: '5. Câu kết thúc lịch sự và lỗi cần tránh', paragraphs: ['Cảm ơn nhà tuyển dụng đã lắng nghe và kiểm tra lại thanh điệu Pinyin của các từ khóa quan trọng trước buổi phỏng vấn.'] },
              ],
              faqs: originalArticle.faqs,
              relatedSlugs: [],
              cta: originalArticle.cta,
            }),
          },
        },
      ],
    });
  };

  const env = {
    OPENROUTER_API_KEY: 'sk-or-test-retry',
    OPENROUTER_WRITER_MODEL: 'nvidia/nemotron-3.5-lightning:free',
  };

  const updated = await rewriteDraftRecord({
    draft,
    comment: 'Bài viết cung cấp quá ít thông tin và chưa đủ dài, chỉ mới nói giới thiệu tên.',
    rating: 1,
    existingSlugs: [],
    today: '2026-11-27',
    env,
    fetchImpl,
  });

  assert.ok(writerCallCount >= 2, 'Must detect lazy first attempt and run escalated retry');
  assert.ok(writerPrompts[1].userMsg.includes('CẢNH BÁO VIẾT LẠI BẮT BUỘC'), 'Escalated retry must include retryHint');
  assert.ok(writerPrompts.every((p) => p.userMsg.includes('MỆNH LỆNH BẮT BUỘC TỪ ADMIN')), 'Auto-polish must also receive adminComment');
  assert.equal(updated.version, 2);
  assert.equal(updated.article.sections.length, 5);
  const diff = measureRewriteChange(originalArticle, updated.article, '');
  assert.ok(diff.newChars > diff.oldChars && diff.tokenOverlap < 0.78);
});
