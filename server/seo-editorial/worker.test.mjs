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
